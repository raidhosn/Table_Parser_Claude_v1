import React, { useState, useCallback } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { cleanValue } from '../utils/parser';

interface CopyButtonProps {
    headers: string[];
    data: Record<string, any>[];
}

export const CopyButton: React.FC<CopyButtonProps> = ({ headers, data }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        // Create TSV content for plain text
        const headerRow = headers.join('\t');
        const dataRows = data.map(row => {
            return headers.map(header => {
                const val = row[header];
                return cleanValue(val);
            }).join('\t');
        }).join('\n');

        const tsvContent = `${headerRow}\n${dataRows}`;

        // Create HTML table for Excel/rich text pasting
        const htmlTable = `<table>
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `<tr>${headers.map(h => `<td>${cleanValue(row[h])}</td>`).join('')}</tr>`).join('')}
            </tbody>
        </table>`;

        try {
            // Try modern Clipboard API with both formats
            if (navigator.clipboard && window.ClipboardItem) {
                const clipboardItem = new ClipboardItem({
                    'text/plain': new Blob([tsvContent], { type: 'text/plain' }),
                    'text/html': new Blob([htmlTable], { type: 'text/html' })
                });
                await navigator.clipboard.write([clipboardItem]);
            } else {
                // Fallback: use execCommand with clipboard event listener
                const listener = (e: ClipboardEvent) => {
                    e.preventDefault();
                    e.clipboardData?.setData('text/html', htmlTable);
                    e.clipboardData?.setData('text/plain', tsvContent);
                };

                document.addEventListener('copy', listener);
                document.execCommand('copy');
                document.removeEventListener('copy', listener);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Final fallback: just copy plain text
            try {
                await navigator.clipboard.writeText(tsvContent);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy also failed:', fallbackErr);
            }
        }
    }, [headers, data]);

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${copied
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
            title="Copy to Clipboard (Excel compatible)"
        >
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};
