import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { DataTable } from './DataTable';
import { ExcelExportButton } from './ExcelExportButton';
import { TranslateButton } from './TranslateButton';
import { CopyButton } from './CopyButton';
import { finalHeaders as defaultHeaders, DICTIONARY, REQUEST_TYPE_CODES } from '../utils/constants';
import { cleanValue } from '../utils/parser';

interface CategorySectionProps {
    categoryName: string;
    data: Record<string, any>[];
    headers?: string[];
    isTranslated: boolean;
    onToggleTranslation: () => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
    categoryName,
    data,
    headers = defaultHeaders,
    isTranslated,
    onToggleTranslation
}) => {
    const [isOpen, setIsOpen] = React.useState(true);

    // Compute visible headers based on requestTypeCode (language-agnostic)
    const visibleHeaders = useMemo(() => {
        if (data.length === 0) return headers;
        const firstRow = data[0];
        const isZonal = firstRow.requestTypeCode === REQUEST_TYPE_CODES.ZONAL_ENABLEMENT;

        return headers.filter(h => {
            if (h === 'Cores' && isZonal) return false;
            if (h === 'Zone' && !isZonal) return false;
            return true;
        });
    }, [data, headers]) as string[];

    const displayHeaders = useMemo(() => visibleHeaders.map(h => isTranslated ? (DICTIONARY[h] || h) : h), [visibleHeaders, isTranslated]);

    const displayData = useMemo(() => data.map(row => {
        const newRow: Record<string, any> = { 'Original ID': row['Original ID'] };
        visibleHeaders.forEach(h => {
            const translatedKey = isTranslated ? (DICTIONARY[h] || h) : h;
            let val = (row as any)[h];
            if (isTranslated) {
                val = DICTIONARY[val] || val;
            }
            newRow[translatedKey] = cleanValue(val);
        });
        return newRow;
    }), [data, visibleHeaders, isTranslated]);

    const exportFilename = useMemo(() => {
        const cleanName = categoryName.replace(/\s+/g, '_');
        return isTranslated
            ? `${cleanName}_Dados_Cota_pt-BR.xlsx`
            : `${cleanName}_Quota_Data_en-US.xlsx`;
    }, [categoryName, isTranslated]);

    return (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div
                className="px-6 py-4 flex justify-between items-start cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-start gap-3">
                    <div className={`transform transition-transform duration-300 mt-1 ${isOpen ? '' : '-rotate-90'}`}>
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">
                            {categoryName}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {data.length} rows found
                        </p>
                    </div>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <ExcelExportButton
                        headers={displayHeaders}
                        data={displayData}
                        filename={exportFilename}
                    />
                    <TranslateButton isTranslated={isTranslated} onToggle={onToggleTranslation} />
                    <CopyButton headers={visibleHeaders} data={data} />
                </div>
            </div>
            {isOpen && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <DataTable headers={displayHeaders} data={displayData} />
                </div>
            )}
        </div>
    );
};
