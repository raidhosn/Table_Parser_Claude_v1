import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cleanValue } from '../utils/parser';

interface ExcelExportButtonProps {
    headers: string[];
    data: Record<string, any>[];
    filename: string;
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({ headers, data, filename }) => {
    const handleExport = () => {
        // Prepare data for export
        const exportData = data.map(row => {
            const newRow: Record<string, any> = {};
            headers.forEach(h => {
                newRow[h] = cleanValue(row[h]);
            });
            return newRow;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Auto-width columns
        const colWidths = headers.map(key => {
            const maxContentWidth = Math.max(
                key.length,
                ...exportData.map(row => String(row[key] || '').length)
            );
            return { wch: Math.min(maxContentWidth + 2, 50) }; // Cap width at 50 chars
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Quota Data");
        XLSX.writeFile(wb, filename);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
        >
            <Download className="h-4 w-4" />
            Export Excel
        </button>
    );
};
