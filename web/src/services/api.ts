const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export function getToken(): string | null {
    return localStorage.getItem('token');
}

export function saveToken(token: string): void {
    localStorage.setItem('token', token);
}

export function removeToken(): void {
    localStorage.removeItem('token');
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonResponse(response: Response, fallbackError: string) {
    try {
        return await response.json();
    } catch {
        throw new Error(response.ok ? fallbackError : `Server error (${response.status})`);
    }
}

function checkUnauthorized(response: Response): void {
    if (response.status === 401) {
        removeToken();
        window.dispatchEvent(new Event('auth:logout'));
        throw new Error('Session expired. Please log in again.');
    }
}

export async function registerUser(email: string, password: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await parseJsonResponse(response, 'Failed to register');

    if (!response.ok) {
        throw new Error(data.message ?? 'Failed to register');
    }
}

export async function verifyEmail(token: string): Promise<void> {
    const response = await fetch(
        `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
    );

    const data = await parseJsonResponse(response, 'Failed to verify email');

    if (!response.ok) {
        throw new Error(data.message ?? 'Failed to verify email');
    }

    saveToken(data.token);
}

export async function loginUser(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await parseJsonResponse(response, 'Failed to login');

    if (!response.ok) {
        throw new Error(data.message ?? 'Failed to login');
    }

    saveToken(data.token);
    return data.token;
}

export async function uploadDocument(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
    });

    checkUnauthorized(response);
    const data = await parseJsonResponse(response, 'Failed to upload document');

    if (!response.ok) {
        throw new Error(data.message ?? 'Failed to upload document');
    }

    return data;
}

export interface Citation {
    content: string;
    source: string;
    chunkIndex: number;
}

export interface QueryResponse {
    answer: string;
    citations: Citation[];
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
}

export interface ModelOption {
    id: string;
    displayName: string;
}

export async function fetchModels(): Promise<ModelOption[]> {
    const response = await fetch(`${API_URL}/models`);
    const data = await parseJsonResponse(response, 'Failed to fetch models');
    if (!response.ok) throw new Error(data.message ?? 'Failed to fetch models');
    return data;
}

export async function queryDocuments(question: string, fileName?: string, modelId?: string): Promise<QueryResponse> {
    const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ question, ...(fileName && { fileName }), ...(modelId && { model: modelId }) }),
    });

    checkUnauthorized(response);
    const data = await parseJsonResponse(response, 'Failed to query documents');

    if (!response.ok) {
        throw new Error(data.message ?? data.error ?? 'Failed to query documents');
    }

    return data;
}

export interface Chat {
    id: string;
    title: string;
    createdAt: string;
}

export interface StoredMessage {
    role: 'user' | 'assistant' | 'error';
    content: string;
    citations?: Citation[];
}

export interface StoredMessageWithId extends StoredMessage {
    id: string;
    createdAt: string;
}

export async function createChat(title: string): Promise<Chat> {
    const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title }),
    });
    checkUnauthorized(response);
    const data = await parseJsonResponse(response, 'Failed to create chat');
    if (!response.ok) throw new Error(data.message ?? 'Failed to create chat');
    return data;
}

export async function listChats(): Promise<Chat[]> {
    const response = await fetch(`${API_URL}/chats`, {
        headers: { ...authHeaders() },
    });
    checkUnauthorized(response);
    const data = await parseJsonResponse(response, 'Failed to list chats');
    if (!response.ok) throw new Error(data.message ?? 'Failed to list chats');
    return data;
}

export async function deleteChat(chatId: string): Promise<void> {
    const response = await fetch(`${API_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
    });
    checkUnauthorized(response);
    if (!response.ok) {
        const data = await parseJsonResponse(response, 'Failed to delete chat');
        throw new Error(data.message ?? 'Failed to delete chat');
    }
}

export async function getChatMessages(chatId: string): Promise<StoredMessageWithId[]> {
    const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { ...authHeaders() },
    });
    checkUnauthorized(response);
    const data = await parseJsonResponse(response, 'Failed to get messages');
    if (!response.ok) throw new Error(data.message ?? 'Failed to get messages');
    return data;
}

export async function saveMessages(chatId: string, messages: StoredMessage[]): Promise<void> {
    const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ messages }),
    });
    checkUnauthorized(response);
    if (!response.ok) {
        const data = await parseJsonResponse(response, 'Failed to save messages');
        throw new Error(data.message ?? 'Failed to save messages');
    }
}

export async function listDocuments(): Promise<string[]> {
    const response = await fetch(`${API_URL}/documents`, {
        headers: { ...authHeaders() },
    });

    checkUnauthorized(response);
    const data = await parseJsonResponse(response, 'Failed to list documents');

    if (!response.ok) {
        throw new Error(data.message ?? 'Failed to list documents');
    }

    return data.documents;
}
