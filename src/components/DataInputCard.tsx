import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { UploadModal } from './UploadModal';

interface DataInputCardProps {
    onDataLoaded: (data: string) => void;
}

export const DataInputCard: React.FC<DataInputCardProps> = ({ onDataLoaded }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
                        <FileText className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Your Data</h2>
                    <p className="text-gray-600 max-w-md">
                        Click here to upload your Excel, CSV, or Azure DevOps export files to begin parsing.
                    </p>
                </div>
            </div>
            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDataLoaded={(data) => {
                    onDataLoaded(data);
                    setIsModalOpen(false);
                }}
            />
        </>
    );
};
