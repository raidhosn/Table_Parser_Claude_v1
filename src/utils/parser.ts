import { TransformedRow, RequestTypeCode } from './types';
import { cleanRegion, cleanVmType } from './cleaners';
import { REQUEST_TYPE_CODES } from './constants';

// Feature flag for robust header detection
const USE_ROBUST_HEADER_DETECTION = true;

interface HeaderInfo {
    headerIndex: number;
    headers: string[];
}

export const cleanAzureDevOpsHeader = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
        // Remove Azure DevOps specific artifacts like "Title: " prefix
        return line.replace(/^Title:\s*/i, '').trim();
    });
    return cleanedLines.join('\n');
};

export const cleanValue = (val: any): any => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val.trim();
    return val;
};

/**
 * Maps display Request Type strings (EN-US or PT-BR) to internal requestTypeCode.
 * This enables language-agnostic logic by normalizing localized display values
 * to stable internal codes.
 */
export const mapDisplayTypeToCode = (displayType: string): RequestTypeCode => {
    const normalized = displayType.toLowerCase().trim();

    // EN-US mappings
    if (normalized === 'zonal enablement') return REQUEST_TYPE_CODES.ZONAL_ENABLEMENT;
    if (normalized === 'region enablement') return REQUEST_TYPE_CODES.REGIONAL_ENABLEMENT;
    if (normalized === 'region enablement & quota increase') return REQUEST_TYPE_CODES.REGION_ENABLEMENT_QUOTA_INCREASE;
    if (normalized === 'quota increase') return REQUEST_TYPE_CODES.QUOTA_INCREASE;
    if (normalized === 'quota decrease') return REQUEST_TYPE_CODES.QUOTA_DECREASE;
    if (normalized === 'region limit increase') return REQUEST_TYPE_CODES.REGION_LIMIT_INCREASE;
    if (normalized === 'reserved instances') return REQUEST_TYPE_CODES.RESERVED_INSTANCES;

    // PT-BR mappings
    if (normalized === 'habilitação zonal') return REQUEST_TYPE_CODES.ZONAL_ENABLEMENT;
    if (normalized === 'habilitação regional') return REQUEST_TYPE_CODES.REGIONAL_ENABLEMENT;
    if (normalized === 'habilitação regional & aumento de cota') return REQUEST_TYPE_CODES.REGION_ENABLEMENT_QUOTA_INCREASE;
    if (normalized === 'aumento de cota') return REQUEST_TYPE_CODES.QUOTA_INCREASE;
    if (normalized === 'diminuição de cota') return REQUEST_TYPE_CODES.QUOTA_DECREASE;
    if (normalized === 'aumento de limite regional') return REQUEST_TYPE_CODES.REGION_LIMIT_INCREASE;
    if (normalized === 'instâncias reservadas') return REQUEST_TYPE_CODES.RESERVED_INSTANCES;

    return REQUEST_TYPE_CODES.UNKNOWN;
};

export const parseHtmlTable = (htmlString: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return '';

    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.textContent?.trim() || '').join('\t');
    }).join('\n');
};

const detectSeparator = (lines: string[]): string => {
    let maxCommas = 0;
    let maxTabs = 0;
    let maxSemicolons = 0;
    // Scan up to first 20 lines to detect separator
    const scanLimit = Math.min(lines.length, 20);

    for (let i = 0; i < scanLimit; i++) {
        const line = lines[i];
        const commas = (line.match(/,/g) || []).length;
        const tabs = (line.match(/\t/g) || []).length;
        const semicolons = (line.match(/;/g) || []).length;
        maxCommas = Math.max(maxCommas, commas);
        maxTabs = Math.max(maxTabs, tabs);
        maxSemicolons = Math.max(maxSemicolons, semicolons);
    }

    // Prioritize tab over comma, comma over semicolon
    if (maxTabs >= maxCommas && maxTabs >= maxSemicolons && maxTabs > 0) {
        return '\t';
    }
    if (maxCommas >= maxSemicolons && maxCommas > 0) {
        return ',';
    }
    if (maxSemicolons > 0) {
        return ';';
    }

    // Default to tab if no clear separator found (most common for pasted data)
    return '\t';
};

const legacyHeaderDetection = (rows: string[][]): HeaderInfo => {
    // Assumes the first row is the header
    if (rows.length === 0) {
        throw new Error("Input data cannot be empty.");
    }

    const headers = rows[0];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
        headerMap[header.toLowerCase()] = index;
    });

    const findColIndex = (possibleNames: string[]): number => {
        for (const name of possibleNames) {
            const lowerName = name.toLowerCase();
            if (headerMap.hasOwnProperty(lowerName)) {
                return headerMap[lowerName];
            }
        }
        return -1;
    };

    const idIndex = findColIndex(["ID", "RDQuota", "id", "rdquota", "QuotaId"]);
    if (idIndex === -1) {
        throw new Error('Missing required header column: "ID" or "RDQuota"');
    }

    return { headerIndex: 0, headers };
};

const robustHeaderDetection = (rows: string[][]): HeaderInfo => {
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Normalize cells for checking: trim and strip surrounding quotes (though our parser already strips quotes, we double check)
        // The parser strips ALL quotes, so we just check the values.

        const hasId = row.some(cell => {
            const val = cell.toLowerCase().trim();
            return val === 'id' || val === 'rdquota' || val === 'quotaid';
        });

        if (hasId) {
            return { headerIndex: i, headers: row };
        }
    }

    throw new Error('Missing required header column: "ID" or "RDQuota"');
};

export const transformData = (rawInput: string): { transformed: TransformedRow[], categorized: Record<string, TransformedRow[]> } => {
    const cleanedInput = cleanAzureDevOpsHeader(rawInput);

    if (!cleanedInput.trim()) {
        throw new Error("Input data cannot be empty.");
    }

    const lines = cleanedInput.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
        throw new Error("Input must contain a header row and at least one data row.");
    }

    // Detect separator
    const separator = detectSeparator(lines);

    // Parse all rows first
    const parsedRows = lines.map(line => line.split(separator).map(v => v.trim().replace(/"/g, '')));

    let headerInfo: HeaderInfo;
    if (USE_ROBUST_HEADER_DETECTION) {
        try {
            headerInfo = robustHeaderDetection(parsedRows);
        } catch (err) {
            console.warn("robustHeaderDetection failed, falling back to legacyHeaderDetection", err);
            headerInfo = legacyHeaderDetection(parsedRows);
        }
    } else {
        headerInfo = legacyHeaderDetection(parsedRows);
    }

    const { headerIndex, headers } = headerInfo;
    const dataRows = parsedRows.slice(headerIndex + 1);

    // Rebuild header map based on detected headers
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
        headerMap[header.toLowerCase()] = index;
    });

    const findColIndex = (possibleNames: string[]): number => {
        for (const name of possibleNames) {
            const lowerName = name.toLowerCase();
            if (headerMap.hasOwnProperty(lowerName)) {
                return headerMap[lowerName];
            }
        }
        return -1;
    };

    // Check if data is already transformed (legacy check, might need adjustment if we want to support this still)
    // We'll keep it but apply it to the detected headers
    const criticalFinalHeaders = ['Subscription ID', 'Request Type', 'VM Type', 'Region'];
    const isAlreadyTransformed = criticalFinalHeaders.every(h => findColIndex([h]) !== -1);

    let processedRows: TransformedRow[];

    if (isAlreadyTransformed) {
        processedRows = dataRows.map((values, index) => {
            const getVal = (colName: string) => {
                const idx = findColIndex([colName]);
                return idx !== -1 ? values[idx]?.trim() || '' : '';
            };

            let status = getVal('Status');
            if (status === 'Verification Successful') {
                status = 'Approved';
            } else if (status === 'Abandoned') {
                status = 'Backlogged';
            } else if (status === '-') {
                status = 'Pending Customer Response';
            } else if (status === 'Fulfillment Actions Completed') {
                status = 'Fulfilled';
            }

            // Map display Request Type to internal requestTypeCode
            const requestType = getVal('Request Type') || 'Unknown';
            const requestTypeCode = mapDisplayTypeToCode(requestType);

            // Try to get Original ID from data, fallback to generated ID
            const originalIdIdx = findColIndex(['Original ID', 'ID', 'RDQuota']);
            const originalId = originalIdIdx !== -1 ? values[originalIdIdx]?.trim() || `pre-transformed-${index}` : `pre-transformed-${index}`;

            return {
                'Subscription ID': getVal('Subscription ID'),
                'Request Type': requestType,
                'VM Type': getVal('VM Type'),
                'Region': cleanRegion(getVal('Region')),
                'Zone': getVal('Zone') || 'N/A',
                'Cores': getVal('Cores'),
                'Status': status || 'Pending',
                'Original ID': originalId,
                requestTypeCode,
            };
        }).filter(row => {
            // Filter out rows that are effectively empty
            const hasData = row['Subscription ID'] || row['VM Type'] || row['Region'];
            return hasData;
        });
    } else {
        const idIndex = findColIndex(["ID", "RDQuota", "id", "rdquota", "QuotaId"]);
        // This check is redundant if header detection worked, but good for type safety
        if (idIndex === -1) {
            throw new Error('Missing required header column: "ID" or "RDQuota"');
        }

        const subIdIndex = findColIndex(["Subscription ID", "SubscriptionId", "subscription id"]);
        if (subIdIndex === -1) throw new Error('Missing required header column: "Subscription ID"');

        const regionIndex = findColIndex(["Region", "Location", "region"]);
        if (regionIndex === -1) throw new Error('Missing required header column: "Region"');

        const ticketIndex = findColIndex(["UTC Ticket", "Ticket", "Request Type", "Type"]);
        const constraintsIndex = findColIndex(["Deployment Constraints", "Zone", "Zones"]);
        const eventIdIndex = findColIndex(["Event ID", "Cores", "Core Count"]);
        const reasonIndex = findColIndex(["Reason", "Status", "State"]);
        const skuIndex = findColIndex(["SKU", "VM Type", "VmSize"]);

        processedRows = dataRows.map((values) => {
            const get = (idx: number) => idx !== -1 ? values[idx]?.trim() || '' : '';

            const originalRequestType = get(ticketIndex);
            let cores = get(eventIdIndex);
            let zone = get(constraintsIndex);
            let status = get(reasonIndex);
            const sku = get(skuIndex);
            const subId = get(subIdIndex);
            const region = get(regionIndex);
            const id = get(idIndex);

            if (originalRequestType === "AZ Enablement/Whitelisting") {
                cores = 'N/A';
            } else if (cores === '-1') {
                cores = '';
            }

            if (!zone) {
                zone = 'N/A';
            }

            let finalRequestType = originalRequestType || 'Unknown';
            let requestTypeCode: RequestTypeCode = REQUEST_TYPE_CODES.UNKNOWN;

            switch (originalRequestType) {
                case 'AZ Enablement/Whitelisting':
                    finalRequestType = 'Zonal Enablement';
                    requestTypeCode = REQUEST_TYPE_CODES.ZONAL_ENABLEMENT;
                    break;
                case 'Region Enablement/Whitelisting':
                    finalRequestType = 'Region Enablement';
                    requestTypeCode = REQUEST_TYPE_CODES.REGIONAL_ENABLEMENT;
                    break;
                case 'Whitelisting/Quota Increase':
                    finalRequestType = 'Region Enablement & Quota Increase';
                    requestTypeCode = REQUEST_TYPE_CODES.REGION_ENABLEMENT_QUOTA_INCREASE;
                    break;
                case 'Quota Increase':
                    finalRequestType = 'Quota Increase';
                    requestTypeCode = REQUEST_TYPE_CODES.QUOTA_INCREASE;
                    break;
                case 'Quota Decrease':
                    finalRequestType = 'Quota Decrease';
                    requestTypeCode = REQUEST_TYPE_CODES.QUOTA_DECREASE;
                    break;
                case 'Region Limit Increase':
                    finalRequestType = 'Region Limit Increase';
                    requestTypeCode = REQUEST_TYPE_CODES.REGION_LIMIT_INCREASE;
                    break;
                case 'RI Enablement/Whitelisting':
                    finalRequestType = 'Reserved Instances';
                    requestTypeCode = REQUEST_TYPE_CODES.RESERVED_INSTANCES;
                    break;
            }

            if (status === 'Fulfillment Actions Completed') {
                status = 'Fulfilled';
            } else if (status === 'Verification Successful') {
                status = 'Approved';
            } else if (status === 'Abandoned') {
                status = 'Backlogged';
            } else if (status === '-') {
                status = 'Pending Customer Response';
            }

            return {
                'Subscription ID': subId,
                'Request Type': finalRequestType,
                'VM Type': cleanVmType(sku),
                'Region': cleanRegion(region),
                'Zone': zone,
                'Cores': cores,
                'Status': status,
                'Original ID': id,
                requestTypeCode,
            };
        }).filter(row => {
            const isZoneNA = row['Zone'] === 'N/A';
            const isRowEffectivelyEmpty = !row['Subscription ID'] && !row['VM Type'] && !row['Region'] && !row['Request Type'];
            return !(isZoneNA && isRowEffectivelyEmpty);
        });
    }

    if (processedRows.length === 0) {
        throw new Error("No valid data rows could be processed. Please check your input.");
    }

    const groups: Record<string, TransformedRow[]> = {};
    for (const row of processedRows) {
        const category = row['Request Type'];
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(row);
    }

    return { transformed: processedRows, categorized: groups };
};

