import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { parseHtmlTable } from '../utils/parser';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataLoaded: (data: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onDataLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setWorkbook(null);
        setSheetNames([]);
        setError(null);
        onClose();
    };

    const processFile = async (file: File) => {
        setIsLoading(true);
        setError(null);

        try {
            if (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    onDataLoaded(text);
                };
                reader.readAsText(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const wb = XLSX.read(data, { type: 'array' });
                    setWorkbook(wb);
                    setSheetNames(wb.SheetNames);
                    if (wb.SheetNames.length === 1) {
                        // Auto-select if only one sheet
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const csv = XLSX.utils.sheet_to_csv(ws);
                        onDataLoaded(csv);
                    }
                    setIsLoading(false);
                };
                reader.readAsArrayBuffer(file);
            } else if (file.name.endsWith('.docx')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        const html = result.value;
                        const tsv = parseHtmlTable(html);
                        if (tsv) {
                            onDataLoaded(tsv);
                        } else {
                            setError("No table found in the Word document.");
                            setIsLoading(false);
                        }
                    } catch (err) {
                        setError("Failed to parse Word document.");
                        setIsLoading(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const html = e.target?.result as string;
                    const tsv = parseHtmlTable(html);
                    if (tsv) {
                        onDataLoaded(tsv);
                    } else {
                        setError("No table found in the HTML file.");
                        setIsLoading(false);
                    }
                };
                reader.readAsText(file);
            } else {
                setError("Unsupported file format. Please upload CSV, Excel, Word, or HTML files.");
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while processing the file.");
            setIsLoading(false);
        }
    };

    const handleSheetSelect = (sheetName: string) => {
        if (!workbook) return;
        const ws = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(ws);
        onDataLoaded(csv);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-bold text-gray-800">Upload Data File</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8">
                    {workbook && sheetNames.length > 1 ? (
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 mb-3">Select a Sheet to Import:</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                                {sheetNames.map(sheet => (
                                    <button
                                        key={sheet}
                                        onClick={() => handleSheetSelect(sheet)}
                                        className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                                    >
                                        <FileSpreadsheet className="h-5 w-5 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium text-gray-700">{sheet}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={triggerFileSelect}
                            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group ${isDragging
                                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".csv,.xlsx,.xls,.txt,.tsv,.docx,.html,.htm"
                            />
                            {isLoading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                                    <p className="text-gray-600 font-medium">Processing file...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                                        <Upload className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-700 mb-2">Click or drag file to upload</p>
                                    <p className="text-sm text-gray-500 text-center max-w-xs">
                                        Supports Excel (.xlsx), CSV, Word tables (.docx), and HTML files
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in slide-in-from-bottom-2">
                            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
