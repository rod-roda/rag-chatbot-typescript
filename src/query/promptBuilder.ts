import type { RetrievedChunk } from "./retriever.js";

export interface BuiltPrompt 
{
    system: string,
    user: string
}

export function buildPrompt(question: string, chunks: RetrievedChunk[]): BuiltPrompt
{
    const context = chunks
        .map((chunk, i) => `[Trecho ${i+1} - Fonte:${chunk.source}\n${chunk.content}]`)
        .join('\n\n');
    
    const system = `Você é um assistente especializado em responder perguntas com base em documentos fornecidos.

Regras:
- Responda APENAS com base nos trechos fornecidos
- Cite qual trecho embasou sua resposta usando [Trecho N]
- Se a resposta não estiver nos trechos, diga claramente que não encontrou a informação
- Seja objetivo e claro`;

    const user = `Trechos do documento:
${context}

Pergunta: ${question};`

    return { system, user };
}