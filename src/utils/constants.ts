import { TransformedRow, RequestTypeCode } from './types';

export const finalHeaders: (keyof Omit<TransformedRow, 'Original ID'> & string)[] = [
    'Subscription ID',
    'Request Type',
    'VM Type',
    'Region',
    'Zone',
    'Cores',
    'Status'
];

/**
 * Internal request type codes for language-agnostic logic.
 * Use these constants instead of comparing against localized display strings.
 */
export const REQUEST_TYPE_CODES = {
    ZONAL_ENABLEMENT: 'ZONAL_ENABLEMENT',
    REGIONAL_ENABLEMENT: 'REGIONAL_ENABLEMENT',
    QUOTA_INCREASE: 'QUOTA_INCREASE',
    REGION_ENABLEMENT_QUOTA_INCREASE: 'REGION_ENABLEMENT_QUOTA_INCREASE',
    REGION_LIMIT_INCREASE: 'REGION_LIMIT_INCREASE',
    QUOTA_DECREASE: 'QUOTA_DECREASE',
    RESERVED_INSTANCES: 'RESERVED_INSTANCES',
    UNKNOWN: 'UNKNOWN',
} as const satisfies Record<string, RequestTypeCode>;

/**
 * @deprecated Use requestTypeCode field and getVisibleHeaders() instead.
 * Kept for backward compatibility.
 */
export const NO_ZONE_REQUEST_TYPES = [
    "Quota Increase",
    "Region Limit Increase",
    "Region Enablement",
    "Region Enablement & Quota Increase"
];

/**
 * Determines which columns should be visible based on requestTypeCode.
 * - ZONAL_ENABLEMENT: Hide Cores, Show Zone
 * - All other types: Hide Zone, Show Cores
 *
 * @param headers - The full list of column headers
 * @param requestTypeCode - The internal request type code (not localized string)
 * @returns Filtered array of visible headers
 */
export const getVisibleHeaders = (
    headers: string[],
    requestTypeCode: RequestTypeCode | undefined
): string[] => {
    const isZonal = requestTypeCode === REQUEST_TYPE_CODES.ZONAL_ENABLEMENT;

    return headers.filter(col => {
        if (col === 'Cores' && isZonal) return false;
        if (col === 'Zone' && !isZonal) return false;
        return true;
    });
};

/**
 * Check if any row in the dataset is a Zonal Enablement request.
 * Useful for mixed datasets to determine if we need to show Zone column.
 */
export const hasZonalRequests = (data: TransformedRow[]): boolean => {
    return data.some(row => row.requestTypeCode === REQUEST_TYPE_CODES.ZONAL_ENABLEMENT);
};

/**
 * Check if any row in the dataset is a non-Zonal request.
 * Useful for mixed datasets to determine if we need to show Cores column.
 */
export const hasNonZonalRequests = (data: TransformedRow[]): boolean => {
    return data.some(row => row.requestTypeCode !== REQUEST_TYPE_CODES.ZONAL_ENABLEMENT);
};

/**
 * Get visible headers for a mixed dataset containing multiple request types.
 * Shows columns only if they are relevant to at least one row in the dataset.
 *
 * @param headers - The full list of column headers
 * @param data - Array of transformed rows with requestTypeCode
 * @returns Filtered array of visible headers
 */
export const getVisibleHeadersForMixedData = (
    headers: string[],
    data: TransformedRow[]
): string[] => {
    if (data.length === 0) return headers;

    const showZone = hasZonalRequests(data);
    const showCores = hasNonZonalRequests(data);

    return headers.filter(col => {
        if (col === 'Zone' && !showZone) return false;
        if (col === 'Cores' && !showCores) return false;
        return true;
    });
};

export const DICTIONARY: Record<string, string> = {
    // Headers
    'Subscription ID': 'ID da Assinatura',
    'Request Type': 'Tipo de Requisição',
    'VM Type': 'Tipo de VM',
    'Region': 'Região',
    'Zone': 'Zona',
    'Cores': 'Núcleos',
    'Status': 'Status',
    'RDQuota': 'RDQuota',

    // Request Types
    'Zonal Enablement': 'Habilitação Zonal',
    'Region Enablement': 'Habilitação Regional',
    'Region Enablement & Quota Increase': 'Habilitação Regional & Aumento de Cota',
    'Quota Increase': 'Aumento de Cota',
    'Quota Decrease': 'Diminuição de Cota',
    'Region Limit Increase': 'Aumento de Limite Regional',
    'Reserved Instances': 'Instâncias Reservadas',

    // Statuses
    'Approved': 'Aprovado',
    'Fulfilled': 'Atendido',
    'Backlogged': 'Pendente (Backlogged)',
    'Pending Customer Response': 'Aguardando Resposta do Cliente',
    'Pending': 'Pendente',

    // Common Values
    'N/A': 'N/A'
};
