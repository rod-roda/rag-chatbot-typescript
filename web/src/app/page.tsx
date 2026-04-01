'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';
import { listDocuments } from '@/services/api';

export default function Home() {
    const [documents, setDocuments] = useState<string[]>([]);
    const [selectedContext, setSelectedContext] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        listDocuments()
            .then(docs => { if (!cancelled) { setDocuments(docs); setLoadError(false); } })
            .catch(() => { if (!cancelled) setLoadError(true); });
        return () => { cancelled = true; };
    }, [refreshTrigger]);

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
