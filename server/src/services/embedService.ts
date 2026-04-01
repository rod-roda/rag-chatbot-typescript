import { openai } from "./openaiClient.js";
import { OpenAIError } from "./errors/OpenAIError.js";

export async function embedTexts(texts: string[]): Promise<number[][]>
{
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    try {
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            const batch = texts.slice(i, i + BATCH_SIZE);
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: batch
            });
            allEmbeddings.push(...response.data.map(item => item.embedding));
        }
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new OpenAIError('Failed to generate embeddings');
    }

    return allEmbeddings;
}

export async function embedQuery(query: string): Promise<number[]>
{
    const [embedding] = await embedTexts([query]);
    if (!embedding) throw new OpenAIError('Failed to generate embeddings');
    return embedding;
}
