import type { RetrievedChunk } from "./retriever.js";

export interface BuiltPrompt 
{
    system: string,
    user: string
}

export function buildPrompt(question: string, chunks: RetrievedChunk[]): BuiltPrompt
{
    const context = chunks
        .map((chunk, i) => `[Excerpt ${i+1} - Source:${chunk.source}\n${chunk.content}]`)
        .join('\n\n');
    
    const system = `You are an assistant specialized in answering questions based on provided documents.

Rules:
- Answer ONLY based on the provided excerpts
- Cite which excerpt supported your answer using [Excerpt N]
- If the answer is not in the excerpts, clearly state that you did not find the information
- Be objective and clear`;

    const user = `Document excerpts:
${context}

Question: ${question};`

    return { system, user };
}