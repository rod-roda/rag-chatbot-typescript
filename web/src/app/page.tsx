'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import Chat from '@/components/Chat';

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <main className="flex flex-col h-screen max-w-3xl mx-auto w-full p-4 gap-4">
            <h1 className="text-xl font-bold text-center">RAG Chatbot</h1>
            <FileUpload onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)} />
            <Chat refreshTrigger={refreshTrigger} />
        </main>
    );
}
