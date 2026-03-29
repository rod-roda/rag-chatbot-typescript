import OpenAI from "openai";
import crypto from "crypto";
import { getCollection } from "../database/chroma.js";
import { chunkText } from "./chunker.js";
import { loadPDF } from "./loader.js";
import { EmbeddingError } from "./errors/EmbeddingError.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

async function embedChunks(chunks: string[]): Promise<number[][]>
{
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    try {
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: batch
            });
            allEmbeddings.push(...response.data.map(item => item.embedding));
        }
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new EmbeddingError();
    }

    return allEmbeddings;
}

export async function ingestPDF(filePath: string, fileName?: string): Promise<void>
{
    const text = await loadPDF(filePath);
    const chunks = chunkText(text);

    const collection = await getCollection('documents');
    const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 12);
    const embeddings = await embedChunks(chunks);

    await collection.upsert({
        ids: chunks.map((_, i) => `${hash}-chunk-${i}`),
        embeddings,
        documents: chunks,
        metadatas: chunks.map((_, i) => ({
            source: hash,
            fileName: fileName ?? 'unknown',
            chunkIndex: i
        }))
    });

    console.log(`${chunks.length} chunks salvos no chroma`);
}