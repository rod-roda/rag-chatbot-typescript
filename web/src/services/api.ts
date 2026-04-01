const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function parseJsonResponse(response: Response, fallbackError: string) {
    try {
        return await response.json();
    } catch {
        throw new Error(response.ok ? fallbackError : `Server error (${response.status})`);
    }
}

export async function uploadDocument(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        body: formData,
    });

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

export async function queryDocuments(question: string, fileName?: string): Promise<QueryResponse> {
    const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, ...(fileName && { fileName }) }),
    });

    const data = await parseJsonResponse(response, 'Failed to query documents');

    if (!response.ok) {
        throw new Error(data.message ?? data.error ?? 'Failed to query documents');
    }

    return data;
}

export async function listDocuments(): Promise<string[]> {
    const response = await fetch(`${API_URL}/documents`);
    const data = await parseJsonResponse(response, 'Failed to list documents');

    if (!response.ok) {
        throw new Error(data.message ?? 'Failed to list documents');
    }

    return data.documents;
}
