'use client';

import { useState, useRef, useEffect } from 'react';
import {
    queryDocuments,
    fetchModels,
    createChat,
    getChatMessages,
    saveMessages,
    type QueryResponse,
    type ModelOption,
} from '@/services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'error';
    content: string;
    citations?: QueryResponse['citations'];
    timestamp: string;
}

interface ChatProps {
    documents: string[];
    selectedContext: string;
    onToggleSidebar: () => void;
    loadError?: boolean;
    currentChatId: string | null;
    onChatCreated: (chatId: string, title: string, createdAt: string) => void;
}

const tips = [
    { icon: '🎯', text: 'Be specific — mention names, dates, or terms from your documents' },
    { icon: '📎', text: 'Select a document in the sidebar to narrow the search context' },
    { icon: '💡', text: 'Ask about concepts, definitions, or data that appear in your files' },
];

export default function Chat({ documents, selectedContext, onToggleSidebar, loadError, currentChatId, onChatCreated }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // Prevents reloading messages when we just created a new chat during handleSend
    const justCreatedRef = useRef(false);

    useEffect(() => {
        fetchModels()
            .then(data => {
                setModels(data);
                if (data.length > 0) setSelectedModel(data[0].id);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (justCreatedRef.current) {
            justCreatedRef.current = false;
            return;
        }
        setMessages([]);
        if (currentChatId === null) return;

        let cancelled = false;
        getChatMessages(currentChatId)
            .then(data => {
                if (cancelled) return;
                setMessages(data.map(m => ({
                    id: m.id,
                    role: m.role as Message['role'],
                    content: m.content,
                    citations: m.citations,
                    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                })));
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [currentChatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    function getTimestamp() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function handleCopy(id: string, content: string) {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(prev => prev === id ? null : prev), 2000);
        }).catch(() => {});
    }

    function autoGrow(el: HTMLTextAreaElement) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }

    async function handleSend() {
        const question = input.trim();
        if (!question || loading) return;

        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: question,
            timestamp: getTimestamp(),
        };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        let activeChatId = currentChatId;

        try {
            if (activeChatId === null) {
                const chat = await createChat(question.slice(0, 60));
                justCreatedRef.current = true;
                onChatCreated(chat.id, chat.title, chat.createdAt);
                activeChatId = chat.id;
            }

            const data = await queryDocuments(question, selectedContext || undefined, selectedModel || undefined);

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.answer,
                citations: data.citations,
                timestamp: getTimestamp(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            try {
                await saveMessages(activeChatId, [
                    { role: 'user', content: question },
                    { role: 'assistant', content: data.answer, citations: data.citations },
                ]);
            } catch {
                // persistence failure — message visible but won't survive reload
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'error',
                content: err instanceof Error ? err.message : 'Failed to query',
                timestamp: getTimestamp(),
            }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const contextLabel = selectedContext || 'All documents';

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                        className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer
                            border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                        </svg>
                    </button>
                    <div className="min-w-0">
                        <div className="text-sm text-gray-800 font-medium truncate">Chat with your documents</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} loaded · {contextLabel} as context
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {models.length > 0 && (
                        <select
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                            aria-label="Select AI model"
                            className="text-[11px] text-gray-600 border border-gray-200 rounded-lg px-2 py-1 bg-white
                                cursor-pointer hover:border-gray-300 focus:outline-none focus:border-blue-400 transition-colors"
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.displayName}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${loadError ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="hidden sm:inline">{loadError ? 'Connection error' : 'Ready'}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 flex flex-col gap-4 messages-scroll">
                {messages.length === 0 && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-lg mb-1">
                            💬
                        </div>
                        <div className="text-sm text-gray-500 font-medium">Ask anything about your documents</div>
                        <div className="text-xs text-gray-400 text-center">
                            {documents.length > 0
                                ? 'Your files are indexed and ready. Here are some tips:'
                                : 'Upload a document to get started. Here are some tips:'}
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3 w-full max-w-80">
                            {tips.map((tip, i) => (
                                <div
                                    key={i}
                                    className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-500
                                        flex items-center gap-2.5"
                                >
                                    <span className="text-base shrink-0">{tip.icon}</span>
                                    {tip.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-medium
                            ${msg.role === 'user' ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-blue-100 text-blue-600'}`}>
                            {msg.role === 'user' ? 'You' : 'AI'}
                        </div>
                        <div className="max-w-[85%] sm:max-w-[75%]">
                            <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-blue-50 border border-blue-200 rounded-tr-sm text-blue-800'
                                    : msg.role === 'error'
                                        ? 'bg-red-50 border border-red-200 text-red-600'
                                        : 'bg-white border border-gray-200 rounded-tl-sm text-gray-700'
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {msg.citations && msg.citations.length > 0 && (
                                <div className="flex flex-col gap-1.5 mt-2">
                                    {msg.citations.map((citation, j) => (
                                        <div
                                            key={j}
                                            className={`text-[11px] px-3 py-2 rounded-lg bg-white border
                                                ${j === 0 ? 'border-blue-300' : 'border-gray-200'}`}
                                        >
                                            <div className={`font-mono text-[10px] font-medium mb-0.5
                                                ${j === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {citation.source} · chunk {citation.chunkIndex}
                                            </div>
                                            <p className="text-gray-500 leading-relaxed line-clamp-2">
                                                {citation.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={`flex items-center gap-2 mt-1.5 px-0.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                                {msg.role === 'assistant' && (
                                    <button
                                        onClick={() => handleCopy(msg.id, msg.content)}
                                        aria-label="Copy message"
                                        className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
                                    >
                                        {copiedId === msg.id ? (
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-green-500" aria-hidden="true">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-2.5 animate-fade-up">
                        <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-medium bg-blue-100 text-blue-600">
                            AI
                        </div>
                        <div>
                            <div className="flex gap-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl rounded-tl-sm items-center w-fit">
                                <span className="typing-dot w-1.25 h-1.25 rounded-full bg-gray-300" />
                                <span className="typing-dot w-1.25 h-1.25 rounded-full bg-gray-300" />
                                <span className="typing-dot w-1.25 h-1.25 rounded-full bg-gray-300" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 border-t border-gray-200">
                <div className="flex gap-2 items-end bg-white border border-gray-200 rounded-xl py-2 pr-2 pl-3.5 transition-colors focus-within:border-blue-400">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => { setInput(e.target.value); autoGrow(e.target); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about your documents..."
                        aria-label="Question input"
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none text-[13px] text-gray-800
                            resize-none leading-relaxed max-h-30 min-h-5.5
                            placeholder:text-gray-400"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        aria-label="Send message"
                        className="w-8 h-8 rounded-lg bg-blue-500 cursor-pointer flex items-center justify-center
                            transition-all shrink-0 hover:bg-blue-600 hover:scale-105 active:scale-[0.97]
                            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-blue-500"
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-[10px] text-gray-300">Enter to send · Shift+Enter for new line</span>
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-500 inline-block" />
                        {contextLabel}
                    </span>
                </div>
            </div>
        </div>
    );
}
