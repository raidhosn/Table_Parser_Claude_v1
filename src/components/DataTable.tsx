import React from 'react';
import { cleanValue } from '../utils/parser';

interface DataTableProps {
    headers: string[];
    data: Record<string, any>[];
}

export const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
    const columnCount = headers.length;
    // First column (usually Subscription ID) is wider at 30%, rest distributed equally
    const getColumnWidth = (index: number) => {
        if (columnCount <= 1) return '100%';
        if (index === 0) return '30%';
        return `${70 / (columnCount - 1)}%`;
    };

    return (
        <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full table-fixed border-collapse">
                <thead>
                    <tr className="bg-[#1a2744] border-l-4 border-l-blue-500">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                style={{ width: getColumnWidth(index) }}
                                className="px-4 py-3.5 text-center text-[13px] font-semibold text-white uppercase tracking-wider whitespace-nowrap"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={`bg-white ${rowIndex !== data.length - 1 ? 'border-b border-gray-200' : ''}`}
                        >
                            {headers.map((header, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    style={{ width: getColumnWidth(colIndex) }}
                                    className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700 text-center"
                                >
                                    {cleanValue(row[header])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
