import React from 'react';
import { cleanValue } from '../utils/parser';

interface DataTableProps {
    headers: string[];
    data: Record<string, any>[];
}

export const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
    const columnCount = headers.length;
    // Evenly distribute column widths across all columns
    const getColumnWidth = () => {
        if (columnCount <= 0) return '100%';
        return `${100 / columnCount}%`;
    };

    return (
        <div className="w-full bg-white overflow-hidden" style={{ borderRadius: '8px 8px 0 0' }}>
            <table className="w-full table-fixed border-collapse">
                <thead>
                    <tr className="bg-[#1e2a3a]">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                style={{
                                    width: getColumnWidth(),
                                    borderTopLeftRadius: index === 0 ? '8px' : '0',
                                    borderTopRightRadius: index === columnCount - 1 ? '8px' : '0'
                                }}
                                className="px-5 py-4 text-center align-middle text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap"
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
                            className="bg-white border-b border-gray-200"
                        >
                            {headers.map((header, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    style={{ width: getColumnWidth() }}
                                    className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 text-center align-middle"
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
