import React from 'react';
import { cleanValue } from '../utils/parser';

interface DataTableProps {
    headers: string[];
    data: Record<string, any>[];
}

export const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                            {headers.map((header, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
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
