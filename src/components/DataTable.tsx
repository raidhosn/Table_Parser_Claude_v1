import React from 'react';
import { cleanValue } from '../utils/parser';

interface DataTableProps {
    headers: string[];
    data: Record<string, any>[];
}

export const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
    return (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm border border-gray-200">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-[#1e3a5f] border-l-4 border-l-blue-500">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white whitespace-nowrap border border-gray-600"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                            {headers.map((header, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700 border border-gray-200"
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
