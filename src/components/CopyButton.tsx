import React, { useState, useCallback } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { cleanValue } from '../utils/parser';

interface CopyButtonProps {
    headers: string[];
    data: Record<string, any>[];
}

/**
 * Generates an HTML table with inline styles for clipboard export.
 * Uses border-collapse, 1px solid borders, 8px padding, and center text alignment.
 */
const generateStyledHtmlTable = (headers: string[], data: Record<string, any>[]): string => {
    // Table style with border-collapse
    const tableStyle = "border-collapse: collapse;";
    // Header cells: 1px solid border, 8px padding, center aligned
    const headerCellStyle = "border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold;";
    // Body cells: 1px solid border, 8px padding, center aligned
    const bodyCellStyle = "border: 1px solid #000000; padding: 8px; text-align: center;";

    // Generate header row
    const headerCells = headers
        .map(h => `<th style="${headerCellStyle}">${escapeHtml(h)}</th>`)
        .join('');

    // Generate body rows
    const bodyRows = data
        .map(row => {
            const cells = headers
                .map(h => `<td style="${bodyCellStyle}">${escapeHtml(cleanValue(row[h]))}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    return `<table style="${tableStyle}"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

/**
 * Escapes HTML special characters to prevent XSS and ensure proper rendering.
 */
const escapeHtml = (text: string): string => {
    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
};

/**
 * Generates TSV (Tab-Separated Values) content from headers and data.
 */
const generateTsvContent = (headers: string[], data: Record<string, any>[]): string => {
    const headerRow = headers.join('\t');
    const dataRows = data
        .map(row => headers.map(h => cleanValue(row[h])).join('\t'))
        .join('\n');
    return `${headerRow}\n${dataRows}`;
};

export const CopyButton: React.FC<CopyButtonProps> = ({ headers, data }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        const tsvContent = generateTsvContent(headers, data);
        const htmlContent = generateStyledHtmlTable(headers, data);

        const showCopiedFeedback = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        // Try the async Clipboard API with both formats
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            try {
                const clipboardItem = new ClipboardItem({
                    'text/plain': new Blob([tsvContent], { type: 'text/plain' }),
                    'text/html': new Blob([htmlContent], { type: 'text/html' })
                });
                await navigator.clipboard.write([clipboardItem]);
                showCopiedFeedback();
                return;
            } catch (err) {
                console.warn('ClipboardItem API failed, trying fallback:', err);
            }
        }

        // Fallback: Use copy event listener to set both formats
        const copyHandler = (e: ClipboardEvent) => {
            e.preventDefault();
            e.clipboardData?.setData('text/html', htmlContent);
            e.clipboardData?.setData('text/plain', tsvContent);
        };

        try {
            document.addEventListener('copy', copyHandler);

            // Create a temporary element to trigger copy
            const textArea = document.createElement('textarea');
            textArea.value = tsvContent;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();

            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            document.removeEventListener('copy', copyHandler);

            if (success) {
                showCopiedFeedback();
                return;
            }
        } catch (err) {
            document.removeEventListener('copy', copyHandler);
            console.warn('execCommand fallback failed:', err);
        }

        // Final fallback: TSV only using clipboard.writeText
        try {
            await navigator.clipboard.writeText(tsvContent);
            showCopiedFeedback();
        } catch (err) {
            console.error('All clipboard methods failed:', err);
        }
    }, [headers, data]);

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${copied
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
            title="Copy to Clipboard (Outlook/Excel compatible)"
        >
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};
