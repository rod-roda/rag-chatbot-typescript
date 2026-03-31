const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export async function uploadDocument(file: File): Promise<{ message: string }>
{
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/ingest`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? 'Erro ao enviar documento');
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

export async function queryDocuments(question: string): Promise<QueryResponse>
{
    const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? data.error ?? 'Erro ao consultar');
    }

    return data;
}
