'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';
import AuthForm from '@/components/AuthForm';
import { listDocuments, listChats, getToken, removeToken, type Chat as ChatRecord } from '@/services/api';

export default function Home() {
    const [authenticated, setAuthenticated] = useState(() => !!getToken());
    const [documents, setDocuments] = useState<string[]>([]);
    const [selectedContext, setSelectedContext] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [chats, setChats] = useState<ChatRecord[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    const handleLogout = useCallback(() => {
        removeToken();
        setAuthenticated(false);
        setDocuments([]);
        setSelectedContext('');
        setChats([]);
        setCurrentChatId(null);
    }, []);

    useEffect(() => {
        function onForceLogout() {
            handleLogout();
        }
        window.addEventListener('auth:logout', onForceLogout);
        return () => window.removeEventListener('auth:logout', onForceLogout);
    }, [handleLogout]);

    useEffect(() => {
        if (!authenticated) return;
        let cancelled = false;
        listDocuments()
            .then(docs => { if (!cancelled) { setDocuments(docs); setLoadError(false); } })
            .catch(() => { if (!cancelled) setLoadError(true); });
        return () => { cancelled = true; };
    }, [refreshTrigger, authenticated]);

    useEffect(() => {
        if (!authenticated) return;
        let cancelled = false;
        listChats()
            .then(data => { if (!cancelled) setChats(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [authenticated]);

    const handleSelectChat = useCallback((chatId: string) => {
        setCurrentChatId(chatId);
        setSidebarOpen(false);
    }, []);

    const handleNewChat = useCallback(() => {
        setCurrentChatId(null);
        setSidebarOpen(false);
    }, []);

    const handleChatCreated = useCallback((id: string, title: string, createdAt: string) => {
        setChats(prev => [{ id, title, createdAt }, ...prev]);
        setCurrentChatId(id);
    }, []);

    if (!authenticated) {
        return <AuthForm onAuth={() => setAuthenticated(true)} />;
    }

    return (
        <div className="flex h-screen relative">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <Sidebar
                documents={documents}
                selectedContext={selectedContext}
                onSelectContext={(doc) => { setSelectedContext(doc); setSidebarOpen(false); }}
                onUploadSuccess={(fileName) => {
                    setSelectedContext(fileName);
                    setRefreshTrigger(prev => prev + 1);
                }}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                onDeleteChat={(id) => {
                    setChats(prev => prev.filter(c => c.id !== id));
                    if (currentChatId === id) setCurrentChatId(null);
                }}
            />
            <Chat
                documents={documents}
                selectedContext={selectedContext}
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                loadError={loadError}
                currentChatId={currentChatId}
                onChatCreated={handleChatCreated}
            />
        </div>
    );
}
