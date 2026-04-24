import { openai } from "../openaiClient.js";
import { OpenAIError } from "openai";
import type { EmbeddingProvider } from "./EmbeddingProvider.js";

export class OpenAIEmbeddingProvider implements EmbeddingProvider
{
    private readonly BATCH_SIZE = 100;

    async embedTexts(texts: string[]): Promise<number[][]> 
    {
        const allEmbeddings: number[][] = [];
        try {
            for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
                const batch = texts.slice(i, i + this.BATCH_SIZE);
                const response = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: batch
                });
                allEmbeddings.push(...response.data.map(item => item.embedding));
            }
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new OpenAIError('Failed to generate embeddings', { cause: error });
        }
        return allEmbeddings;
    }

    async embedQuery(query: string): Promise<number[]> 
    {
        const [embedding] = await this.embedTexts([query]);
        if (!embedding) throw new OpenAIError('Failed to generate embeddings');
        return embedding;
    }
}
