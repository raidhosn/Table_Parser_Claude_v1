# Quota Data Transformer

A powerful React-based tool designed to parse, categorize, clean, and transform Azure Quota request data. This application streamlines the process of managing quota requests by converting raw inputs (text, CSV, Excel) into structured, easy-to-read tables with advanced export and translation capabilities.

## 🚀 Features

### 1. **Data Parsing & Transformation**
- **Multi-Format Support**: Accepts data via direct paste or file upload (`.csv`, `.tsv`, `.xlsx`, `.xls`, `.txt`).
- **Smart Parsing**: Automatically detects headers and structures from raw text, including Azure DevOps export formats.
- **Categorization**: Groups requests automatically by "Request Type" (e.g., Quota Increase, Region Enablement).

### 2. **Intelligent Display Logic**
- **Dynamic Column Hiding**: Automatically hides irrelevant columns based on the request type:
  - Hides **Zone** for "Quota Increase", "Region Enablement", etc.
  - Hides **Cores** for "Zonal Enablement".
- **Data Cleanup**: Automatically sanitizes data, such as removing "(XIO)" from VM Type values.

### 3. **Global Translation (English <-> Portuguese)**
- **One-Click Translation**: Toggle the entire application between English and Portuguese.
- **Context-Aware**: Translates headers (e.g., "Request Type" -> "TIPO DE SOLICITAÇÃO") and cell values (e.g., "Approved" -> "Aprovado").
- **Persistent State**: Maintains translation preference across different views and actions.

### 4. **Export & Sharing**
- **CSV Export**: Download tables as CSV files. The export respects the currently selected language (English or Portuguese).
- **Smart Copy**: "Copy Table" button generates HTML tables optimized for pasting into email clients (Outlook) or Excel, preserving formatting.

### 5. **Multiple Views**
- **Categorized View**: See requests grouped by their type for logical separation.
- **Unified View**: A single consolidated table of all requests.
- **View by IDs**: A specialized view focusing on Subscription IDs and Original IDs for quick reference.

### 6. **User Experience**
- **Persistent UI**: Sticky headers and action bars ensure tools are always accessible.
- **Consistent Styling**: Uniform table layouts with bold headers, visible borders, and clear typography.
- **Resilient State**: UI elements like the "View by IDs" toggle remain stable during interaction.

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Processing**: [SheetJS (XLSX)](https://sheetjs.com/) for Excel/CSV parsing and export.

## 📦 Installation & Usage

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## 📝 How to Use

1.  **Input Data**: Paste your raw data into the text area or click "Upload Your Data" to select a file.
2.  **Transform**: Click the **Transform Data** button.
3.  **Interact**:
    - Use the **Translate to Portuguese** button to switch languages.
    - Toggle **View by IDs** to see a simplified list.
    - Use **Export** to save data or **Copy Table** to paste it elsewhere.
4.  **Clear**: Use the **Clear** button to reset the input and start over.
