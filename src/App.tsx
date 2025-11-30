import React, { useState, useCallback } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { DataInputCard } from './components/DataInputCard';
import { CategorizedResultsView, UnifiedResultsView } from './components/ResultsView';
import { transformData } from './utils/parser';
import { TransformedRow } from './utils/types';
import { finalHeaders } from './utils/constants';

const App: React.FC = () => {
    const [rawInput, setRawInput] = useState<string>('');
    const [categorizedData, setCategorizedData] = useState<Record<string, TransformedRow[]> | null>(null);
    const [transformedData, setTransformedData] = useState<TransformedRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [unifiedView, setUnifiedView] = useState<'none' | 'full'>('none');
    const [isTranslated, setIsTranslated] = useState(false);

    const handleTransform = useCallback(() => {
        setError(null);
        setCategorizedData(null);
        setTransformedData(null);
        setUnifiedView('none');

        try {
            const { transformed, categorized } = transformData(rawInput);
            setTransformedData(transformed);
            setCategorizedData(categorized);
        } catch (e) {
            if (e instanceof Error) {
                setError(`Transformation Failed: ${e.message}`);
            } else {
                setError("An unknown error occurred during processing.");
            }
        }
    }, [rawInput]);

    const handleClear = () => {
        setRawInput('');
        setCategorizedData(null);
        setTransformedData(null);
        setError(null);
        setUnifiedView('none');
    };

    const handleDataLoaded = (data: string) => {
        setRawInput(data);
        setCategorizedData(null);
        setTransformedData(null);
        setError(null);
        setUnifiedView('none');
    };

    const renderResults = () => {
        if (!categorizedData || !transformedData) {
            return null;
        }

        if (unifiedView === 'none') {
            return (
                <CategorizedResultsView
                    transformedData={transformedData}
                    categorizedData={categorizedData}
                    finalHeaders={finalHeaders as string[]}
                    isTranslated={isTranslated}
                    setIsTranslated={setIsTranslated}
                />
            );
        }

        if (unifiedView === 'full') {
            return (
                <UnifiedResultsView
                    transformedData={transformedData}
                    categorizedData={categorizedData}
                    finalHeaders={finalHeaders as string[]}
                    isTranslated={isTranslated}
                    setIsTranslated={setIsTranslated}
                />
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-900">
            <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="bg-blue-600 text-white p-1 rounded">QD</span>
                            Quota Data Transformer
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Clean, categorize, and export your quota requests</p>
                    </div>
                    {transformedData && (
                        <button
                            onClick={handleClear}
                            className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="h-4 w-4" /> Start Over
                        </button>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!transformedData && <DataInputCard onDataLoaded={handleDataLoaded} />}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
                    <label htmlFor="raw-input" className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Raw Data Input
                    </label>
                    <textarea
                        id="raw-input"
                        rows={transformedData ? 4 : 12}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 border-transparent bg-gray-50 focus:bg-white transition-all duration-200 font-mono text-sm text-gray-800 resize-y"
                        placeholder="Paste your TSV, CSV, or raw text data here..."
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                    />
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-xs text-gray-400 italic">
                            {rawInput.length > 0 ? `${rawInput.split('\n').length} lines` : 'Ready for input'}
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex items-center mr-4">
                                <button
                                    onClick={handleClear}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-sm mr-3"
                                >
                                    Clear
                                </button>
                            </div>

                            {transformedData && (
                                <button
                                    onClick={() => setUnifiedView(unifiedView === 'none' ? 'full' : 'none')}
                                    className={`px-5 py-2.5 border border-gray-300 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-sm ${unifiedView === 'full' ? 'bg-gray-100' : 'text-gray-700'}`}
                                >
                                    View by IDs
                                </button>
                            )}
                            <button
                                onClick={handleTransform}
                                className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 transition-all shadow-md flex items-center gap-2"
                            >
                                {transformedData ? 'Transform Data' : 'Transform Data'}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl relative mb-8 animate-in slide-in-from-top-2 flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 mt-0.5 shrink-0" />
                        <div>
                            <strong className="font-bold block mb-1">Processing Error</strong>
                            <span className="block text-sm opacity-90">{error}</span>
                        </div>
                    </div>
                )}

                {renderResults()}
            </main>
        </div>
    );
};

export default App;
