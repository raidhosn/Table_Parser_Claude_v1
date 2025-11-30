import React from 'react';
import { Languages } from 'lucide-react';

interface TranslateButtonProps {
    isTranslated: boolean;
    onToggle: () => void;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({ isTranslated, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${isTranslated
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
            title={isTranslated ? "Switch to English" : "Traduzir para Português"}
        >
            <Languages className={`h-4 w-4 ${isTranslated ? 'text-indigo-600' : 'text-gray-500'}`} />
            {isTranslated ? 'PT-BR' : 'EN-US'}
        </button>
    );
};
