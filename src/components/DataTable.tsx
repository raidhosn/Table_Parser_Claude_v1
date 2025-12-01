import React from 'react';
import { cleanValue } from '../utils/parser';

interface DataTableProps {
    headers: string[];
    data: Record<string, any>[];
}

export const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
    const columnCount = headers.length;
    const columnWidth = `${100 / columnCount}%`;

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed">
                <thead>
                    <tr className="bg-[#1e2a4a] rounded-t-lg">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                style={{ width: columnWidth }}
                                className={`px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap ${
                                    index === 0 ? 'rounded-tl-lg' : ''
                                } ${index === headers.length - 1 ? 'rounded-tr-lg' : ''}`}
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
                            className={rowIndex !== data.length - 1 ? 'border-b border-gray-200' : ''}
                        >
                            {headers.map((header, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    style={{ width: columnWidth }}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
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
