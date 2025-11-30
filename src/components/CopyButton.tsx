import React, { useState, useCallback } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { cleanValue } from '../utils/parser';

interface CopyButtonProps {
    headers: string[];
    data: Record<string, any>[];
}

export const CopyButton: React.FC<CopyButtonProps> = ({ headers, data }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        // Create TSV content
        const headerRow = headers.join('\t');
        const dataRows = data.map(row => {
            return headers.map(header => {
                const val = row[header];
                return cleanValue(val);
            }).join('\t');
        }).join('\n');

        const tsvContent = `${headerRow}\n${dataRows}`;

        // Create a temporary textarea to copy from (fallback)
        const textArea = document.createElement("textarea");
        textArea.value = tsvContent;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            // Try modern API first
            navigator.clipboard.writeText(tsvContent).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                // Fallback to execCommand
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } catch (err) {
            console.error('Failed to copy', err);
            // Fallback
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }

        document.body.removeChild(textArea);

        // Also try to copy as HTML table for Excel pasting support
        const listener = (e: ClipboardEvent) => {
            e.preventDefault();
            const htmlTable = `
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>${headers.map(h => `<td>${cleanValue(row[h])}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            e.clipboardData?.setData('text/html', htmlTable);
            e.clipboardData?.setData('text/plain', tsvContent);
        };

        document.addEventListener('copy', listener);
        document.execCommand('copy');
        document.removeEventListener('copy', listener);

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
