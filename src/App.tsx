import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Clipboard,
  Check,
  Download,
  ChevronDown,
  Upload,
  FileText,
  X,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  FileType,
  Languages,
  Eraser
} from 'lucide-react';

// -- External Library Declarations --
declare const XLSX: any;
declare const mammoth: any;

// -- Types --
export interface TransformedRow {
  'Subscription ID': string;
  'Request Type': string;
  'VM Type': string;
  'Region': string;
  'Zone': string;
  'Cores': string;
  'Status': string;
  'Original ID'?: string;
}

export const finalHeaders: (keyof Omit<TransformedRow, 'Original ID'>)[] = [
    'Subscription ID',
    'Request Type',
    'VM Type',
    'Region',
    'Zone',
    'Cores',
    'Status'
];

// -- Utilities --
const parseHtmlTable = (htmlString: string): string => {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    const table = doc.querySelector('table');
    if (!table) {
        throw new Error("No table found in the HTML content.");
    }

    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.textContent?.trim() ?? '').join('\t');
    }).join('\n');
};

// -- Helper Functions --
const cleanAzureDevOpsHeader = (text: string): string => {
    if (!text) return text;
    const lines = text.split('\n');
    
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const isAzureHeader = firstLine.startsWith("Project: Quota") &&
                              firstLine.includes("Server: https://dev.azure.com/capacityrequest") &&
                              firstLine.includes("Query: [None]") &&
                              firstLine.includes("List type: Flat");
                              
        if (isAzureHeader) {
            return lines.slice(1).join('\n');
        }
    }
    return text;
};

const cleanRegion = (region: string): string => {
    if (!region) return region;
    return region.replace(/\s\([A-Z]+\)/g, '').trim();
};

const cleanVMType = (vmType: string): string => {
    if (!vmType) return vmType;
    return vmType.replace(/\s*\(XIO\)/gi, '').trim();
};

// -- Component: CopyButton --
interface CopyButtonProps {
    headers: string[];
    data: Record<string, any>[];
}

const CopyButton: React.FC<CopyButtonProps> = ({ headers, data }) => {
    const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

    const handleCopy = async () => {
        if (copyState !== 'idle' || !data || data.length === 0) return;

        // 1. Plain Text Format (TSV)
        // This serves as the fallback for plain text editors
        const tsvHeader = headers.join('\t');
        const tsvBody = data.map(row => headers.map(h => row[h]).join('\t')).join('\n');
        const tsvString = `${tsvHeader}\n${tsvBody}`;

        // 2. HTML Format - Optimized for MS Word
        // Styles: border-collapse, 1px solid borders, 8px padding, center alignment
        const htmlHeader = `
            <thead>
                <tr>
                    ${headers.map(h => `<th style="border: 1px solid #000000; background-color: #f3f4f6; padding: 8px; font-weight: bold; text-align: center;">${h}</th>`).join('')}
                </tr>
            </thead>`;
            
        const htmlBody = `
            <tbody>
                ${data.map(row => `
                    <tr>
                        ${headers.map(h => `<td style="border: 1px solid #000000; padding: 8px; text-align: center;">${String(row[h] ?? '')}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>`;

        const htmlString = `
            <table style="border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">
                ${htmlHeader}
                ${htmlBody}
            </table>`;

        try {
            // Try standard Async Clipboard API first
            const htmlBlob = new Blob([htmlString], { type: 'text/html' });
            const textBlob = new Blob([tsvString], { type: 'text/plain' });
            
            // Create a single ClipboardItem containing both representations
            const clipboardItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob,
            });
            
            await navigator.clipboard.write([clipboardItem]);
            setCopyState('success');
        } catch (err) {
            console.warn('Async Clipboard API failed (likely due to permission policy). Trying event interception fallback.');
            
            // Fallback: execCommand('copy') with event listener interception
            // This works in many environments where navigator.clipboard is blocked/restricted
            try {
                const listener = (e: ClipboardEvent) => {
                    e.preventDefault();
                    if (e.clipboardData) {
                        e.clipboardData.setData('text/html', htmlString);
                        e.clipboardData.setData('text/plain', tsvString);
                    }
                };

                document.addEventListener('copy', listener);
                
                // We need a valid selection for execCommand to work
                const dummyTextArea = document.createElement('textarea');
                dummyTextArea.style.position = 'fixed';
                dummyTextArea.style.opacity = '0';
                dummyTextArea.value = 'copy trigger';
                document.body.appendChild(dummyTextArea);
                dummyTextArea.select();
                
                const result = document.execCommand('copy');
                
                document.body.removeChild(dummyTextArea);
                document.removeEventListener('copy', listener);

                if (result) {
                    setCopyState('success');
                } else {
                    console.error('execCommand returned false');
                    setCopyState('error');
                }
            } catch (fallbackErr) {
                console.error('All copy methods failed.', fallbackErr);
                setCopyState('error');
            }
        }

        setTimeout(() => setCopyState('idle'), 2500);
    };

    const buttonContent = {
        idle: {
            text: 'Copy Table',
            icon: <Clipboard className="h-4 w-4 mr-2" />,
            className: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        },
        success: {
            text: 'Copied!',
            icon: <Check className="h-4 w-4 mr-2" />,
            className: 'bg-green-100 text-green-700 border-green-300'
        },
        error: {
            text: 'Failed',
            icon: <AlertCircle className="h-4 w-4 mr-2" />,
            className: 'bg-red-100 text-red-700 border-red-300'
        }
    };

    const current = buttonContent[copyState];

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center justify-center px-3 py-1.5 border text-xs font-medium rounded-md transition-all duration-150 shadow-sm ${current.className}`}
            disabled={copyState !== 'idle'}
        >
            {current.icon}
            {current.text}
        </button>
    );
};

// -- Component: ExcelExportButton --
interface ExcelExportButtonProps {
    headers: string[];
    data: Record<string, any>[];
    filename: string;
}

const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({ headers, data, filename }) => {
    const handleExport = () => {
        if (typeof XLSX === 'undefined') {
            alert("Excel export functionality is initializing. Please wait a moment and try again.");
            return;
        }

        const dataForSheet = data.map(row => {
            const newRow: { [key: string]: string } = {};
            headers.forEach(header => {
                newRow[header] = String(row[header] || '');
            });
            return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, filename);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center justify-center px-3 py-1.5 border text-xs font-medium rounded-md transition-all duration-150 bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm"
            disabled={!data || data.length === 0}
            title="Export to Excel"
        >
            <Download className="h-4 w-4 mr-2" />
            Export
        </button>
    );
};

// -- Portuguese Translation Mappings --
const PORTUGUESE_TRANSLATIONS: Record<string, string> = {
    // Headers
    'Subscription ID': 'ID da Assinatura',
    'Request Type': 'Tipo de Solicitação',
    'VM Type': 'Tipo de VM',
    'Region': 'Região',
    'Zone': 'Zona',
    'Cores': 'Núcleos',
    'Status': 'Status',
    'RDQuota': 'RDQuota',
    // Request Types
    'Quota Increase': 'Aumento de Cota',
    'Region Enablement & Quota Increase': 'Habilitação Regional e Aumento de Cota',
    'Region Enablement': 'Habilitação Regional',
    'Region Limit Increase': 'Aumento de Limite de Região',
    'Zonal Enablement': 'Habilitação Zonal',
    'Reserved Instances': 'Instâncias Reservadas',
    // Status values
    'Fulfilled': 'Concluído',
    'Approved': 'Aprovado',
    'Backlogged': 'Em Espera',
    'Pending Customer Response': 'Aguardando Resposta do Cliente',
    'N/A': 'N/A'
};

const translateToPortuguese = (value: string): string => {
    return PORTUGUESE_TRANSLATIONS[value] || value;
};

// -- Component: TranslateButton --
interface TranslateButtonProps {
    isPortuguese: boolean;
    onToggle: () => void;
}

const TranslateButton: React.FC<TranslateButtonProps> = ({ isPortuguese, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`flex items-center justify-center px-3 py-1.5 border text-xs font-medium rounded-md transition-all duration-150 shadow-sm ${
                isPortuguese
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            }`}
            title={isPortuguese ? "Switch to English" : "Translate to Portuguese"}
        >
            <Languages className="h-4 w-4 mr-2" />
            {isPortuguese ? 'Português' : 'Translate to Portuguese'}
        </button>
    );
};

// -- Helper: Transform data for Portuguese display --
const getTranslatedHeaders = (headers: string[]): string[] => {
    return headers.map(h => translateToPortuguese(h));
};

const getTranslatedData = (data: Record<string, any>[], headers: string[]): Record<string, any>[] => {
    const translatedHeaders = getTranslatedHeaders(headers);
    return data.map(row => {
        const newRow: Record<string, string> = {};
        headers.forEach((header, index) => {
            const translatedHeader = translatedHeaders[index];
            const cellValue = String(row[header] ?? '');
            newRow[translatedHeader] = translateToPortuguese(cellValue);
        });
        // Preserve Original ID for key purposes
        if (row['Original ID']) {
            newRow['Original ID'] = row['Original ID'];
        }
        return newRow;
    });
};

// -- Component: DataTable --
interface DataTableProps {
    headers: string[];
    data: Record<string, any>[];
}

const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
    // Calculate column count for grid layout
    const columnCount = headers.length;

    return (
        <div className="overflow-x-auto rounded-lg border-2 border-gray-300 shadow-md max-h-[500px]">
            <table className="w-full bg-white text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-gradient-to-b from-gray-700 to-gray-800 sticky top-0 z-10">
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={header}
                                className={`px-4 py-3.5 text-center font-bold text-white uppercase tracking-wider text-xs border-b-2 border-gray-400 ${
                                    index < columnCount - 1 ? 'border-r border-gray-600' : ''
                                }`}
                                style={{ width: `${100 / columnCount}%` }}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={row['Original ID'] || rowIndex}
                            className={`hover:bg-blue-50 transition-colors ${
                                rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                        >
                            {headers.map((header, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`px-4 py-3 text-gray-700 text-center border-b border-gray-200 ${
                                        colIndex < columnCount - 1 ? 'border-r border-gray-200' : ''
                                    }`}
                                    style={{ width: `${100 / columnCount}%` }}
                                >
                                    <span className="block truncate" title={String(row[header] ?? '')}>
                                        {row[header]}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// -- Component: UnifiedTableSection --
interface UnifiedTableSectionProps {
    title: string;
    headers: string[];
    data: Record<string, any>[];
    filename: string;
}

const UnifiedTableSection: React.FC<UnifiedTableSectionProps> = ({ title, headers, data, filename }) => {
    const [isPortuguese, setIsPortuguese] = useState(false);

    // Get translated or original headers and data based on toggle
    const currentHeaders = isPortuguese ? getTranslatedHeaders(headers) : headers;
    const currentData = isPortuguese ? getTranslatedData(data, headers) : data;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <ExcelExportButton headers={currentHeaders} data={currentData} filename={filename} />
                    <TranslateButton isPortuguese={isPortuguese} onToggle={() => setIsPortuguese(!isPortuguese)} />
                    <CopyButton headers={currentHeaders} data={currentData} />
                </div>
            </div>
            <DataTable headers={currentHeaders} data={currentData} />
        </div>
    );
};

// -- Helper: Request types that should hide the Zone column --
const REQUEST_TYPES_WITHOUT_ZONE = [
    'Quota Increase',
    'Region Enablement & Quota Increase',
    'Region Enablement',
    'Region Limit Increase'
];

// -- Helper: Request types that should hide the Cores column --
const REQUEST_TYPES_WITHOUT_CORES = [
    'Zonal Enablement'
];

// -- Component: CategorySection --
interface CategorySectionProps {
    categoryName: string;
    data: Record<string, any>[];
    headers?: string[];
}

const CategorySection: React.FC<CategorySectionProps> = ({ categoryName, data, headers }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isPortuguese, setIsPortuguese] = useState(false);

    // Determine which columns should be hidden based on category name
    const shouldHideZone = REQUEST_TYPES_WITHOUT_ZONE.includes(categoryName);
    const shouldHideCores = REQUEST_TYPES_WITHOUT_CORES.includes(categoryName);
    const baseHeaders = headers || finalHeaders;
    const displayHeaders = baseHeaders.filter(h => {
        if (h === 'Zone' && shouldHideZone) return false;
        if (h === 'Cores' && shouldHideCores) return false;
        return true;
    });

    // Get translated or original headers and data based on toggle
    const currentHeaders = isPortuguese ? getTranslatedHeaders(displayHeaders) : displayHeaders;
    const currentData = isPortuguese ? getTranslatedData(data, displayHeaders) : data;
    const displayCategoryName = isPortuguese ? translateToPortuguese(categoryName) : categoryName;

    return (
        <div className="mb-6 rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex w-full items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex flex-grow items-center text-left focus:outline-none"
                    aria-expanded={isOpen}
                >
                    <div className={`p-1 rounded-full mr-3 transition-transform duration-200 ${isOpen ? 'bg-blue-100 text-blue-600 rotate-0' : 'bg-gray-200 text-gray-500 -rotate-90'}`}>
                        <ChevronDown className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">
                            {displayCategoryName}
                        </h3>
                        <span className="text-xs font-medium text-gray-500">{data.length} rows found</span>
                    </div>
                </button>
                <div className="flex-shrink-0 flex items-center space-x-2">
                    <ExcelExportButton headers={currentHeaders} data={currentData} filename={`${categoryName.replace(/[\s/]/g, '_')}.xlsx`} />
                    <TranslateButton isPortuguese={isPortuguese} onToggle={() => setIsPortuguese(!isPortuguese)} />
                    <CopyButton headers={currentHeaders} data={currentData} />
                </div>
            </div>
            {isOpen && (
                <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <DataTable headers={currentHeaders} data={currentData} />
                </div>
            )}
        </div>
    );
};

// -- Component: UploadModal --
interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataLoaded: (data: string) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onDataLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sheetNames, setSheetNames] = useState<string[] | null>(null);
    const [workbook, setWorkbook] = useState<any | null>(null);

    const resetState = useCallback(() => {
        setIsDragging(false);
        setError(null);
        setIsLoading(false);
        setSheetNames(null);
        setWorkbook(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFile = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const reader = new FileReader();

            switch (extension) {
                case 'xlsx':
                case 'xls':
                    reader.onload = (e) => {
                        try {
                            const data = e.target?.result;
                            const wb = XLSX.read(data, { type: 'array' });
                            if (wb.SheetNames.length > 1) {
                                setWorkbook(wb);
                                setSheetNames(wb.SheetNames);
                                setIsLoading(false);
                            } else {
                                const sheetName = wb.SheetNames[0];
                                const worksheet = wb.Sheets[sheetName];
                                const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
                                onDataLoaded(tsv);
                            }
                        } catch (err) {
                            setError(`Error parsing Excel file. Ensure the file is not corrupted.`);
                            setIsLoading(false);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                    break;
                
                case 'csv':
                case 'tsv':
                case 'txt':
                    reader.onload = (e) => {
                        try {
                            const text = e.target?.result as string;
                            onDataLoaded(text);
                        } catch (err) {
                            setError(`Error reading text file.`);
                        } finally {
                            setIsLoading(false);
                        }
                    };
                    reader.readAsText(file);
                    break;
                
                case 'html':
                    reader.onload = (e) => {
                        try {
                            const html = e.target?.result as string;
                            const tsv = parseHtmlTable(html);
                            onDataLoaded(tsv);
                        } catch (err) {
                            setError(`Error parsing HTML file.`);
                        } finally {
                            setIsLoading(false);
                        }
                    };
                    reader.readAsText(file);
                    break;
                
                case 'docx':
                    reader.onload = async (e) => {
                        try {
                            const arrayBuffer = e.target?.result as ArrayBuffer;
                            const result = await mammoth.convertToHtml({ arrayBuffer });
                            const tsv = parseHtmlTable(result.value);
                            onDataLoaded(tsv);
                        } catch (err) {
                            setError(`Error parsing DOCX file.`);
                        } finally {
                            setIsLoading(false);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                    break;

                default:
                    setError(`Unsupported file type: .${extension}`);
                    setIsLoading(false);
            }
        } catch (err) {
            setError(`Failed to read file.`);
            setIsLoading(false);
        }
    }, [onDataLoaded]);
    
    const handleSheetSelect = (sheetName: string) => {
        if (!workbook) return;
        setIsLoading(true);
        setError(null);
        try {
            const worksheet = workbook.Sheets[sheetName];
            const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
            onDataLoaded(tsv);
        } catch (err) {
            setError(`Error parsing selected sheet.`);
            setIsLoading(false);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{sheetNames ? 'Select a Sheet' : 'Upload Data'}</h2>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Upload Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex flex-col justify-center items-center h-64">
                         <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                         <p className="text-gray-600 font-medium">Processing file...</p>
                    </div>
                )}

                {!isLoading && !sheetNames && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group ${
                            isDragging 
                                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".csv,.tsv,.txt,.xlsx,.xls,.docx,.html"
                        />
                        <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                            <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-lg text-gray-700 font-medium mb-1">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                            CSV, TSV, Excel, Word, HTML
                        </p>
                    </div>
                )}

                {!isLoading && sheetNames && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Multiple sheets detected. Select one to import:</p>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                            {sheetNames.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => handleSheetSelect(name)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                    <FileSpreadsheet className="h-4 w-4 opacity-50" />
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// -- Component: DataInputCard --
// Simplified version for the main dashboard that triggers the modal or accepts drops
interface DataInputCardProps {
    onDataLoaded: (data: string) => void;
}

const DataInputCard: React.FC<DataInputCardProps> = ({ onDataLoaded }) => {
    // Re-using logic from UploadModal slightly adapted for inline card
    // For simplicity in this consolidated file, we will use the same UploadModal
    // logic but presenting it as a card that triggers the modal when clicked.
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div 
                onClick={() => setIsModalOpen(true)}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
                        <FileText className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Your Data</h2>
                    <p className="text-gray-600 max-w-md">
                        Click here to upload your Excel, CSV, or Azure DevOps export files to begin parsing.
                    </p>
                </div>
            </div>
            <UploadModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onDataLoaded={(data) => {
                    onDataLoaded(data);
                    setIsModalOpen(false);
                }} 
            />
        </>
    );
};


// -- Main Application Component --

const App: React.FC = () => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [rawInput, setRawInput] = useState<string>('');
    const [categorizedData, setCategorizedData] = useState<Record<string, TransformedRow[]> | null>(null);
    const [transformedData, setTransformedData] = useState<TransformedRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [unifiedView, setUnifiedView] = useState<'none' | 'full'>('none');
    
    // Dynamically load external scripts for parsing
    useEffect(() => {
        const loadScript = (src: string) => {
            return new Promise<void>((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.head.appendChild(script);
            });
        };

        Promise.all([
            loadScript('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js'),
            loadScript('https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js')
        ]).then(() => {
            setScriptsLoaded(true);
        }).catch((err) => {
            console.error("Failed to load dependencies", err);
            // We still allow the app to load, buttons will just check for global presence
            setScriptsLoaded(true);
        });
    }, []);

    const handleTransform = useCallback(() => {
        setError(null);
        setCategorizedData(null);
        setTransformedData(null);
        setUnifiedView('none');
        
        const cleanedInput = cleanAzureDevOpsHeader(rawInput);

        if (!cleanedInput.trim()) {
            setError("Input data cannot be empty.");
            return;
        }

        try {
            const lines = cleanedInput.trim().split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setError("Input must contain a header row and at least one data row.");
                return;
            }

            const headerLine = lines[0];
            const dataLines = lines.slice(1);
            
            // Auto-detect separator
            let separator: string | RegExp;
            const tabCount = (headerLine.match(/\t/g) || []).length;
            const commaCount = (headerLine.match(/,/g) || []).length;

            if (tabCount > commaCount && tabCount > 0) {
                separator = '\t';
            } else if (commaCount > 0) {
                separator = ',';
            } else {
                separator = /\s+/;
            }
            
            const headers = headerLine.split(separator).map(h => h.trim().replace(/"/g, ''));
            const headerMap: { [key: string]: number } = {};
            headers.forEach((header, index) => {
                headerMap[header] = index;
            });

            const isAlreadyTransformed = finalHeaders.every(h => headers.includes(h));
            let processedRows: TransformedRow[];

            if (isAlreadyTransformed) {
                // Data is already in the final format
                processedRows = dataLines.map((line, index) => {
                    const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
                    const get = (col: keyof Omit<TransformedRow, 'Original ID'>) => values[headerMap[col]]?.trim() || '';

                    let status = get('Status');
                    if (status === 'Verification Successful') {
                        status = 'Approved';
                    } else if (status === 'Abandoned') {
                        status = 'Backlogged';
                    } else if (status === '-') {
                        status = 'Pending Customer Response';
                    }

                    return {
                        'Subscription ID': get('Subscription ID'),
                        'Request Type': get('Request Type'),
                        'VM Type': cleanVMType(get('VM Type')),
                        'Region': cleanRegion(get('Region')),
                        'Zone': get('Zone'),
                        'Cores': get('Cores'),
                        'Status': status,
                        'Original ID': `pre-transformed-${index}`,
                    };
                });

            } else {
                // Data is in raw format, needs transformation
                const requiredOriginalHeaders = ["UTC Ticket", "Deployment Constraints", "Event ID", "Reason", "Subscription ID", "SKU", "Region"];
                
                // Flexible check for ID column
                if (!headerMap.hasOwnProperty('ID') && !headerMap.hasOwnProperty('RDQuota')) {
                    throw new Error('Missing required header column: "ID" or "RDQuota"');
                }

                // Check other required headers
                const missingHeaders = requiredOriginalHeaders.filter(h => !headerMap.hasOwnProperty(h));
                if (missingHeaders.length > 0) {
                    throw new Error(`Missing required header columns: ${missingHeaders.join(', ')}`);
                }

                processedRows = dataLines.map((line) => {
                    const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
                    
                    const get = (col: string) => values[headerMap[col]]?.trim() || '';

                    const originalRequestType = get("UTC Ticket");
                    let cores = get("Event ID");
                    let zone = get("Deployment Constraints");
                    let status = get("Reason");

                    if (originalRequestType === "AZ Enablement/Whitelisting") {
                        cores = 'N/A';
                    } else if (cores === '-1') {
                        cores = '';
                    }
                    
                    if (!zone) {
                        zone = 'N/A';
                    }

                    let finalRequestType = originalRequestType;
                    switch (originalRequestType) {
                        case 'AZ Enablement/Whitelisting': finalRequestType = 'Zonal Enablement'; break;
                        case 'Region Enablement/Whitelisting': finalRequestType = 'Region Enablement'; break;
                        case 'Whitelisting/Quota Increase': finalRequestType = 'Region Enablement & Quota Increase'; break;
                        case 'Quota Increase': finalRequestType = 'Quota Increase'; break;
                        case 'Region Limit Increase': finalRequestType = 'Region Limit Increase'; break;
                        case 'RI Enablement/Whitelisting': finalRequestType = 'Reserved Instances'; break;
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
                        'Subscription ID': get("Subscription ID"),
                        'Request Type': finalRequestType,
                        'VM Type': cleanVMType(get("SKU")),
                        'Region': cleanRegion(get("Region")),
                        'Zone': zone,
                        'Cores': cores,
                        'Status': status,
                        'Original ID': get("RDQuota") || get("ID"),
                    };
                }).filter(row => {
                    const isZoneNA = row['Zone'] === 'N/A';
                    const isRowEffectivelyEmpty = !row['Subscription ID'] && !row['VM Type'] && !row['Region'] && !row['Request Type'];
                    return !(isZoneNA && isRowEffectivelyEmpty);
                });
            }

            if (processedRows.length === 0) {
                setError("No valid data rows could be processed. Please check your input.");
                return;
            }

            const groups: Record<string, TransformedRow[]> = {};
            for (const row of processedRows) {
                const category = row['Request Type'];
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(row);
            }

            setTransformedData(processedRows);
            setCategorizedData(groups);

        } catch (e) {
            if (e instanceof Error) {
                setError(`Transformation Failed: ${e.message}`);
            } else {
                setError("An unknown error occurred during processing.");
            }
        }
    }, [rawInput]);
    
    const handleClear = () => {
        setRawInput('');
        setCategorizedData(null);
        setTransformedData(null);
        setError(null);
        setUnifiedView('none');
    };

    const handleDataLoaded = (data: string) => {
        setRawInput(data);
        setCategorizedData(null);
        setTransformedData(null);
        setError(null);
        setUnifiedView('none');
    };

    const renderResults = () => {
        if (!categorizedData || !transformedData) {
            return null;
        }
    
        // Default View
        if (unifiedView === 'none') {
            return (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-blue-600">{transformedData.length}</p>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Total Rows</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-purple-600">{Object.keys(categorizedData).length}</p>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Categories</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-emerald-600">{finalHeaders.length}</p>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Columns</p>
                        </div>
                    </div>
    
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                            <FileType className="mr-2 h-6 w-6 text-gray-600" />
                            Categorized Results
                        </h2>
                        {Object.entries(categorizedData)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([category, data]) => (
                                <CategorySection key={category} categoryName={category} data={data} />
                            ))}
                    </div>

                    <UnifiedTableSection
                        title="Unified Table"
                        headers={finalHeaders}
                        data={transformedData}
                        filename="Unified_Table.xlsx"
                    />
                </div>
            );
        }

        // List by RDQuotas View
        if (unifiedView === 'full') {
            const headersWithRdQuota = ['RDQuota', ...finalHeaders];
            const unifiedDataWithRdQuota = transformedData.map(row => ({ ...row, RDQuota: row['Original ID'] }));
    
            return (
                 <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-blue-600">{transformedData.length}</p>
                            <p className="text-sm font-medium text-gray-500">Total Rows</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-purple-600">{Object.keys(categorizedData).length}</p>
                            <p className="text-sm font-medium text-gray-500">Categories</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-emerald-600">{headersWithRdQuota.length}</p>
                            <p className="text-sm font-medium text-gray-500">Columns</p>
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                             <FileType className="mr-2 h-6 w-6 text-gray-600" />
                             RDQuotas Categorized
                        </h2>
                        {Object.entries(categorizedData)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([category, data]) => (
                                <CategorySection
                                    key={category}
                                    categoryName={category}
                                    data={data.map(row => ({ ...row, RDQuota: row['Original ID'] }))}
                                    headers={headersWithRdQuota}
                                />
                            ))}
                    </div>

                    <UnifiedTableSection
                        title="Unified Table (with IDs)"
                        headers={headersWithRdQuota}
                        data={unifiedDataWithRdQuota}
                        filename="Unified_Table_by_RDQuota.xlsx"
                    />
                </div>
            );
        }

        return null;
    };

    if (!scriptsLoaded) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800">Initializing App...</h2>
                    <p className="text-gray-500 mt-2">Loading parsing libraries</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900">
            <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="bg-blue-600 text-white p-1 rounded">QD</span>
                            Quota Data Transformer
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Clean, categorize, and export your quota requests</p>
                    </div>
                    {transformedData && (
                         <button
                            onClick={handleClear}
                            className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="h-4 w-4" /> Start Over
                        </button>
                    )}
                </div>
            </header>
            
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DataInputCard onDataLoaded={handleDataLoaded} />

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
                     <label htmlFor="raw-input" className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                         Raw Data Input
                     </label>
                    <textarea
                        id="raw-input"
                        rows={transformedData ? 4 : 12}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 border-transparent bg-gray-50 focus:bg-white transition-all duration-200 font-mono text-sm text-gray-800 resize-y"
                        placeholder="Paste your TSV, CSV, or raw text data here..."
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                    />
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-xs text-gray-400 italic">
                            {rawInput.length > 0 ? `${rawInput.split('\n').length} lines` : 'Ready for input'}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setRawInput('')}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-sm flex items-center gap-2"
                                title="Clear raw data input"
                                disabled={rawInput.length === 0}
                            >
                                <Eraser className="h-4 w-4" />
                                Clear
                            </button>
                            {transformedData && (
                                <button
                                    onClick={() => setUnifiedView(unifiedView === 'none' ? 'full' : 'none')}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-sm"
                                >
                                    {unifiedView === 'none' ? 'View by IDs' : 'Default View'}
                                </button>
                            )}
                            <button
                                onClick={handleTransform}
                                className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 transition-all shadow-md flex items-center gap-2"
                            >
                                {transformedData ? 'Transform' : 'Transform Data'}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl relative mb-8 animate-in slide-in-from-top-2 flex items-start gap-3">
                         <AlertCircle className="h-6 w-6 mt-0.5 shrink-0" />
                         <div>
                            <strong className="font-bold block mb-1">Processing Error</strong>
                            <span className="block text-sm opacity-90">{error}</span>
                         </div>
                    </div>
                )}
                
                {renderResults()}
            </main>
        </div>
    );
};

export default App;
