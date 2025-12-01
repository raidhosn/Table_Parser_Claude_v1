import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Clipboard, Check } from 'lucide-react';
import { cleanValue } from '../utils/parser';

interface CopyButtonProps {
    headers: string[];
    data: Record<string, any>[];
}

/**
 * Generates an HTML table for clipboard export that matches the UI styling.
 * Styled for Word/Outlook compatibility with:
 * - Dark navy header row (#1e2a3a)
 * - Bold uppercase column titles in white
 * - Evenly spaced columns with consistent row height
 * - Clean white rows with subtle horizontal separators
 * - Center-aligned text (horizontal + vertical) for all cells
 * - AutoFit to Contents when pasted into Word
 * Applies inline styles to EVERY cell individually to ensure persistence in Word/Outlook.
 */
const generateStyledHtmlTable = (headers: string[], data: Record<string, any>[]): string => {
    // Table style - auto layout for Word AutoFit to Contents
    const tableStyle = [
        "border-collapse: collapse",
        "table-layout: auto",
        "width: auto",
        "font-family: Calibri, Arial, sans-serif",
        "font-size: 11pt",
        "mso-table-lspace: 0pt",
        "mso-table-rspace: 0pt"
    ].join("; ");

    // Header row style - dark navy background
    const headerRowStyle = "background-color: #1e2a3a";

    // Header cell style - white uppercase bold text, center-aligned with padding
    const headerCellStyle = [
        "background-color: #1e2a3a",
        "color: #ffffff",
        "font-weight: bold",
        "text-transform: uppercase",
        "font-size: 10pt",
        "letter-spacing: 0.5pt",
        "padding: 12pt 15pt",
        "text-align: center",
        "vertical-align: middle",
        "border: none",
        "border-bottom: 1px solid #1e2a3a",
        "white-space: nowrap"
    ].join("; ");

    // Data row style - white background
    const dataRowStyle = "background-color: #ffffff";

    // Data cell style - gray text, center-aligned with subtle bottom border
    const dataCellStyle = [
        "background-color: #ffffff",
        "color: #374151",
        "font-weight: normal",
        "font-size: 11pt",
        "padding: 12pt 15pt",
        "text-align: center",
        "vertical-align: middle",
        "border: none",
        "border-bottom: 1px solid #e8e8e8",
        "white-space: nowrap"
    ].join("; ");

    // Generate header row with styled cells
    const headerCells = headers
        .map(h => `<th style="${headerCellStyle}">${escapeHtml(h.toUpperCase())}</th>`)
        .join('');

    // Generate body rows with styled cells
    const bodyRows = data
        .map(row => {
            const cells = headers
                .map(h => `<td style="${dataCellStyle}">${escapeHtml(cleanValue(row[h]))}</td>`)
                .join('');
            return `<tr style="${dataRowStyle}">${cells}</tr>`;
        })
        .join('');

    return `<table style="${tableStyle}"><thead><tr style="${headerRowStyle}">${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

/**
 * Escapes HTML special characters to prevent XSS and ensure proper rendering.
 * Handles non-string inputs by converting them to strings first.
 */
const escapeHtml = (value: any): string => {
    if (value === undefined || value === null) return '';
    const text = String(value);
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
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup timeout on unmount to prevent state updates on unmounted component
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleCopy = useCallback(async () => {
        const tsvContent = generateTsvContent(headers, data);
        const htmlContent = generateStyledHtmlTable(headers, data);

        const showCopiedFeedback = () => {
            setCopied(true);
            // Clear any existing timeout before setting a new one
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
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
