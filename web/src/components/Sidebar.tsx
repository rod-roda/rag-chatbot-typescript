'use client';

import { useState, useRef } from 'react';
import { uploadDocument } from '@/services/api';

interface SidebarProps {
    documents: string[];
    selectedContext: string;
    onSelectContext: (doc: string) => void;
    onUploadSuccess: () => void;
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({
    documents,
    selectedContext,
    onSelectContext,
    onUploadSuccess,
    open,
    onClose,
}: SidebarProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus(null);

        try {
            await uploadDocument(file);
            setUploadStatus({ type: 'success', message: `${file.name} uploaded` });
            onUploadSuccess();
        } catch (err) {
            setUploadStatus({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
        }

        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
    }

    function getFileExtension(name: string) {
        return name.split('.').pop()?.toUpperCase() ?? '';
    }

    function getFileIcon(name: string) {
        const ext = getFileExtension(name);
        return ext === 'PDF' ? '📄' : '📝';
    }

    return (
        <div className={`
            w-60 min-w-60 bg-white border-r border-gray-200 flex flex-col py-5
            fixed inset-y-0 left-0 z-40 transition-transform duration-200
            ${open ? 'translate-x-0' : '-translate-x-full'}
            md:static md:translate-x-0 md:z-auto
        `}>
            {/* Logo */}
            <div className="px-5 pb-5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-800 tracking-[0.06em] uppercase">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 align-middle" />
                    RAG Studio
                </span>
                <button
                    onClick={onClose}
                    aria-label="Close sidebar"
                    className="md:hidden w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    ✕
                </button>
            </div>

            {/* Upload zone */}
            <label
                className={`mx-3 my-4 border border-dashed border-gray-300 rounded-[10px] p-4 text-center cursor-pointer
                    transition-all bg-gray-50 hover:border-blue-400 hover:bg-blue-50 group
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <div className="text-xl text-gray-400 mb-1.5 group-hover:text-blue-500 transition-colors">⬆</div>
                <div className="text-[12px] text-gray-600 font-medium">
                    {uploading ? 'Uploading...' : 'Upload document'}
                </div>
                <div className="text-[11px] text-gray-400 leading-relaxed">PDF or TXT · max 10mb</div>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                />
            </label>

            {uploadStatus && (
                <div className={`mx-4 mb-2 text-[11px] ${uploadStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {uploadStatus.message}
                </div>
            )}

            {/* Documents list */}
            <div className="px-3 flex-1 overflow-y-auto">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-2 pt-3 pb-2">
                    Documents
                </div>

                {documents.map(doc => {
                    const isActive = selectedContext === doc;
                    return (
                        <div
                            key={doc}
                            onClick={() => onSelectContext(isActive ? '' : doc)}
                            className={`flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer transition-colors mb-0.5
                                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[13px] shrink-0
                                ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                {getFileIcon(doc)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12px] text-gray-700 font-medium truncate">{doc}</div>
                            </div>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0
                                ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                {getFileExtension(doc)}
                            </span>
                        </div>
                    );
                })}

                {documents.length === 0 && (
                    <div className="text-[11px] text-gray-400 text-center py-6">No documents yet</div>
                )}
            </div>

            {/* Context selector */}
            <div className="px-3 pt-3 border-t border-gray-200">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1.5">Context</div>
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => onSelectContext('')}
                        className={`text-[11px] px-2 py-0.5 rounded-full cursor-pointer border transition-all
                            ${selectedContext === ''
                                ? 'bg-blue-100 border-blue-400 text-blue-600'
                                : 'bg-transparent border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                            }`}
                    >
                        All docs
                    </button>
                    {documents.map(doc => (
                        <button
                            key={doc}
                            onClick={() => onSelectContext(doc)}
                            className={`text-[11px] px-2 py-0.5 rounded-full cursor-pointer border transition-all
                                ${selectedContext === doc
                                    ? 'bg-blue-100 border-blue-400 text-blue-600'
                                    : 'bg-transparent border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                                }`}
                        >
                            {doc.replace(/\.[^.]+$/, '')}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
