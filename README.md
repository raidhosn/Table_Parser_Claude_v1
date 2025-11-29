# Quota Data Transformer

A React-based web application for parsing, transforming, and exporting Azure quota request data. Built with Vite, TypeScript, and Tailwind CSS.

## Features

- **Multiple Input Formats**: Supports Excel (.xlsx, .xls), CSV, TSV, Word (.docx), HTML, and plain text
- **Automatic Data Transformation**: Converts raw Azure DevOps quota data into a clean, standardized format
- **Smart Column Mapping**: Automatically maps source columns to standardized output fields
- **Categorized Views**: Groups data by Request Type for easy navigation
- **Portuguese Translation**: Toggle between English and Portuguese for table headers and values
- **Export Options**:
  - Copy to clipboard (preserves formatting for Word/Excel paste)
  - Export to Excel (.xlsx)
- **Conditional Column Display**: Automatically hides irrelevant columns based on request type
- **Data Cleanup**: Removes redundant suffixes from Region and VM Type values

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Upload Data**: Click "Upload Your Data" to import files, or paste raw data directly into the text area
2. **Transform**: Click "Transform Data" to process the input
3. **View Results**: Browse categorized tables or use "View by IDs" for an alternate view
4. **Export**: Use "Export" for Excel download, "Copy Table" for clipboard, or "Translate to Portuguese" to toggle language

## Supported Input Columns

### Raw Format (Azure DevOps Export)
| Source Column | Maps To |
|---------------|---------|
| Subscription ID | Subscription ID |
| UTC Ticket | Request Type |
| SKU | VM Type |
| Region | Region |
| Deployment Constraints | Zone |
| Event ID | Cores |
| Reason | Status |
| RDQuota / ID | Original ID |

### Pre-Transformed Format
The app also accepts data already in the output format with headers: Subscription ID, Request Type, VM Type, Region, Zone, Cores, Status.

## Request Type Mappings

| Original Value | Transformed Value |
|----------------|-------------------|
| AZ Enablement/Whitelisting | Zonal Enablement |
| Region Enablement/Whitelisting | Region Enablement |
| Whitelisting/Quota Increase | Region Enablement & Quota Increase |
| Quota Increase | Quota Increase |
| Region Limit Increase | Region Limit Increase |
| RI Enablement/Whitelisting | Reserved Instances |

## Status Mappings

| Original Value | Transformed Value |
|----------------|-------------------|
| Fulfillment Actions Completed | Fulfilled |
| Verification Successful | Approved |
| Abandoned | Backlogged |
| - | Pending Customer Response |

## Conditional Column Visibility

- **Zone column hidden** for: Quota Increase, Region Enablement & Quota Increase, Region Enablement, Region Limit Increase
- **Cores column hidden** for: Zonal Enablement

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **SheetJS (XLSX)** - Excel file parsing and export
- **Mammoth.js** - Word document parsing
- **Lucide React** - Icons

## License

Private - Internal use only.
