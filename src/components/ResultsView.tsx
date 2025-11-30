import React, { useMemo } from 'react';
import { FileType, FileSpreadsheet } from 'lucide-react';
import { CategorySection } from './CategorySection';
import { DataTable } from './DataTable';
import { ExcelExportButton } from './ExcelExportButton';
import { TranslateButton } from './TranslateButton';
import { CopyButton } from './CopyButton';
import { TransformedRow } from '../utils/types';
import { DICTIONARY } from '../utils/constants';
import { cleanValue } from '../utils/parser';

interface ResultsViewProps {
    transformedData: TransformedRow[];
    categorizedData: Record<string, TransformedRow[]>;
    finalHeaders: string[];
    isTranslated: boolean;
    setIsTranslated: (val: boolean) => void;
}

export const CategorizedResultsView: React.FC<ResultsViewProps> = ({
    transformedData,
    categorizedData,
    finalHeaders,
    isTranslated,
    setIsTranslated
}) => {
    const displayHeaders = useMemo(() => finalHeaders.map(h => isTranslated ? (DICTIONARY[h] || h) : h), [finalHeaders, isTranslated]);

    const displayData = useMemo(() => transformedData.map(row => {
        const newRow: Record<string, any> = { 'Original ID': row['Original ID'] };
        finalHeaders.forEach(h => {
            const translatedKey = isTranslated ? (DICTIONARY[h] || h) : h;
            let val = (row as any)[h];
            if (isTranslated) {
                val = DICTIONARY[val] || val;
            }
            newRow[translatedKey] = cleanValue(val);
        });
        return newRow;
    }), [transformedData, finalHeaders, isTranslated]);

    const exportFilename = useMemo(() => {
        return isTranslated
            ? "Tabela_Unificada_pt-BR.xlsx"
            : "Unified_Table_en-US.xlsx";
    }, [isTranslated]);

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
                        <CategorySection
                            key={category}
                            categoryName={category}
                            data={data}
                            isTranslated={isTranslated}
                            onToggleTranslation={() => setIsTranslated(!isTranslated)}
                        />
                    ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Unified Table</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <ExcelExportButton headers={displayHeaders} data={displayData} filename={exportFilename} />
                        <TranslateButton isTranslated={isTranslated} onToggle={() => setIsTranslated(!isTranslated)} />
                        <CopyButton headers={finalHeaders} data={transformedData} />
                    </div>
                </div>
                <DataTable headers={displayHeaders} data={displayData} />
            </div>
        </div>
    );
};

export const UnifiedResultsView: React.FC<ResultsViewProps> = ({
    transformedData,
    categorizedData,
    finalHeaders,
    isTranslated,
    setIsTranslated
}) => {
    const headersWithRdQuota = useMemo(() => ['RDQuota', ...finalHeaders], [finalHeaders]);
    const unifiedDataWithRdQuota = useMemo(() => transformedData.map(row => ({ ...row, RDQuota: row['Original ID'] })), [transformedData]);

    const displayHeaders = useMemo(() => headersWithRdQuota.map(h => isTranslated ? (DICTIONARY[h] || h) : h), [headersWithRdQuota, isTranslated]);

    const displayData = useMemo(() => unifiedDataWithRdQuota.map(row => {
        const newRow: Record<string, any> = { 'Original ID': row['Original ID'] };
        headersWithRdQuota.forEach(h => {
            const translatedKey = isTranslated ? (DICTIONARY[h] || h) : h;
            let val = (row as any)[h];
            if (isTranslated) {
                val = DICTIONARY[val] || val;
            }
            newRow[translatedKey] = cleanValue(val);
        });
        return newRow;
    }), [unifiedDataWithRdQuota, headersWithRdQuota, isTranslated]);

    const exportFilename = useMemo(() => {
        return isTranslated
            ? "Tabela_Unificada_por_RDQuota_pt-BR.xlsx"
            : "Unified_Table_by_RDQuota_en-US.xlsx";
    }, [isTranslated]);

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
                            isTranslated={isTranslated}
                            onToggleTranslation={() => setIsTranslated(!isTranslated)}
                        />
                    ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Unified Table (with IDs)</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <ExcelExportButton headers={displayHeaders} data={displayData} filename={exportFilename} />
                        <TranslateButton isTranslated={isTranslated} onToggle={() => setIsTranslated(!isTranslated)} />
                        <CopyButton headers={headersWithRdQuota} data={unifiedDataWithRdQuota} />
                    </div>
                </div>
                <DataTable headers={displayHeaders} data={displayData} />
            </div>
        </div>
    );
};
