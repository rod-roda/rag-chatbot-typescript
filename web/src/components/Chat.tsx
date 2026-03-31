'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { queryDocuments, listDocuments, type QueryResponse } from '@/services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'error';
    content: string;
    citations?: QueryResponse['citations'];
}

export default function Chat({ refreshTrigger }: { refreshTrigger?: number }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState<string[]>([]);
    const [selectedDoc, setSelectedDoc] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const fetchDocuments = useCallback(async () => {
        try {
            const docs = await listDocuments();
            setDocuments(docs);
        } catch {}
    }, []);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments, refreshTrigger]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const question = input.trim();
        if (!question || loading) return;

        setInput('');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: question }]);
        setLoading(true);

        try {
            const data = await queryDocuments(question, selectedDoc || undefined);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.answer,
                citations: data.citations,
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'error',
                content: err instanceof Error ? err.message : 'Erro ao consultar',
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col flex-1 rounded-lg border border-gray-800 bg-gray-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <p className="text-gray-500 text-sm text-center mt-8">
                        Envie um documento e faça uma pergunta
                    </p>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                            msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : msg.role === 'error'
                                    ? 'bg-red-900/50 border border-red-800 text-red-300'
                                    : 'bg-gray-800 text-gray-200'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                                    <p className="text-xs font-semibold text-gray-400">Citações:</p>
                                    {msg.citations.map((citation, j) => (
                                        <div key={j} className="text-xs bg-gray-900 rounded p-2 text-gray-400">
                                            <span className="font-semibold text-gray-300">
                                                [{j + 1}]
                                            </span>{' '}
                                            {citation.content.slice(0, 200)}
                                            {citation.content.length > 200 && '...'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-400">
                            Pensando...
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
                {documents.length > 0 && (
                    <div className="mb-2">
                        <select
                            value={selectedDoc}
                            onChange={e => setSelectedDoc(e.target.value)}
                            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Todos os documentos</option>
                            {documents.map(doc => (
                                <option key={doc} value={doc}>{doc}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Faça uma pergunta sobre o documento..."
                        disabled={loading}
                        className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
}
