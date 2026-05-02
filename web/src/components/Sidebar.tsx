'use client';

import { useState, useRef } from 'react';
import { uploadDocument, deleteChat, type Chat } from '@/services/api';

interface SidebarProps {
    documents: string[];
    selectedContext: string;
    onSelectContext: (doc: string) => void;
    onUploadSuccess: (fileName: string) => void;
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
    chats: Chat[];
    currentChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
    onDeleteChat: (chatId: string) => void;
}

export default function Sidebar({
    documents,
    selectedContext,
    onSelectContext,
    onUploadSuccess,
    open,
    onClose,
    onLogout,
    chats,
    currentChatId,
    onSelectChat,
    onNewChat,
    onDeleteChat,
}: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'docs' | 'chats'>('docs');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus(null);

        try {
            await uploadDocument(file);
            setUploadStatus({ type: 'success', message: `${file.name} uploaded` });
            onUploadSuccess(file.name);
        } catch (err) {
            setUploadStatus({ type: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
        }

        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
    }

    async function handleDeleteChat(e: React.MouseEvent, chatId: string) {
        e.stopPropagation();
        setDeletingId(chatId);
        try {
            await deleteChat(chatId);
            onDeleteChat(chatId);
        } catch {
            // silently fail — chat remains in list
        } finally {
            setDeletingId(null);
        }
    }

    function getFileExtension(name: string) {
        return name.split('.').pop()?.toUpperCase() ?? '';
    }

    function getFileIcon(name: string) {
        const ext = getFileExtension(name);
        return ext === 'PDF' ? '📄' : '📝';
    }

    function formatChatDate(createdAt: string) {
        const date = new Date(createdAt);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }

    return (
        <div className={`
            w-60 min-w-60 bg-white border-r border-gray-200 flex flex-col py-5
            fixed inset-y-0 left-0 z-40 transition-transform duration-200
            ${open ? 'translate-x-0' : '-translate-x-full'}
            md:static md:translate-x-0 md:z-auto
        `}>
            {/* Logo */}
            <div className="px-5 pb-4 border-b border-gray-200 flex items-center justify-between">
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

            {/* Tabs */}
            <div className="flex px-3 pt-3 pb-1 gap-1">
                <button
                    onClick={() => setActiveTab('docs')}
                    className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg cursor-pointer transition-colors
                        ${activeTab === 'docs'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    Docs
                </button>
                <button
                    onClick={() => setActiveTab('chats')}
                    className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg cursor-pointer transition-colors
                        ${activeTab === 'chats'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    Chats
                    {chats.length > 0 && (
                        <span className="ml-1 text-[9px] font-mono bg-gray-100 text-gray-500 px-1 py-0.5 rounded">
                            {chats.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Docs tab */}
            {activeTab === 'docs' && (
                <>
                    {/* Upload zone */}
                    <label
                        className={`mx-3 my-3 border border-dashed border-gray-300 rounded-[10px] p-4 text-center cursor-pointer
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
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-2 pt-1 pb-2">
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
                </>
            )}

            {/* Chats tab */}
            {activeTab === 'chats' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-3 pt-2 pb-2">
                        <button
                            onClick={onNewChat}
                            className="w-full text-[11px] font-medium text-blue-600 border border-blue-200 rounded-lg py-2
                                hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer"
                        >
                            + New Chat
                        </button>
                    </div>

                    <div className="px-3 flex-1 overflow-y-auto">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-2 pb-1">
                            History
                        </div>
                        <div className="mx-2 mb-2 flex items-start gap-1.5 text-[10px] text-gray-400 leading-relaxed">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0 mt-0.5" aria-hidden="true">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                            </svg>
                            History is display-only — it is not sent to the AI as context.
                        </div>

                        {chats.map(chat => {
                            const isActive = currentChatId === chat.id;
                            return (
                                <div
                                    key={chat.id}
                                    onClick={() => onSelectChat(chat.id)}
                                    className={`group flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer transition-colors mb-0.5
                                        ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[12px] font-medium truncate
                                            ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {chat.title}
                                        </div>
                                        <div className="text-[10px] text-gray-400">{formatChatDate(chat.createdAt)}</div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                        disabled={deletingId === chat.id}
                                        aria-label="Delete chat"
                                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center
                                            rounded text-gray-400 hover:text-red-500 transition-all shrink-0 cursor-pointer
                                            disabled:opacity-30"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}

                        {chats.length === 0 && (
                            <div className="text-[11px] text-gray-400 text-center py-6">No chats yet</div>
                        )}
                    </div>
                </div>
            )}

            {/* Logout */}
            <div className="px-3 py-3 mt-2 border-t border-gray-200">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-red-500
                        py-2 px-3 rounded-lg cursor-pointer transition-colors hover:bg-red-50"
                >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    Sign out
                </button>
            </div>
        </div>
    );
}
