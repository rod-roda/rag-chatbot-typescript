'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';
import AuthForm from '@/components/AuthForm';
import { listDocuments, getToken, removeToken } from '@/services/api';

export default function Home() {
    const [authenticated, setAuthenticated] = useState(false);
    const [documents, setDocuments] = useState<string[]>([]);
    const [selectedContext, setSelectedContext] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        setAuthenticated(!!getToken());
    }, []);

    const handleLogout = useCallback(() => {
        removeToken();
        setAuthenticated(false);
        setDocuments([]);
        setSelectedContext('');
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
            />
            <Chat
                documents={documents}
                selectedContext={selectedContext}
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                loadError={loadError}
            />
        </div>
    );
}
