import crypto from "crypto";
import { getCollection } from "../database/chroma.js";
import { chunkText } from "./chunker.js";
import { loadPDF, loadText } from "./loader.js";
import { embedTexts } from "../services/embedService.js";

async function indexChunks(text: string, fileName?: string): Promise<void>
{
    const chunks = chunkText(text);

    const collection = await getCollection('documents');
    const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 12);
    const embeddings = await embedTexts(chunks);

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

export async function ingestPDF(filePath: string, fileName?: string): Promise<void>
{
    const text = await loadPDF(filePath);
    await indexChunks(text, fileName);
}

export async function ingestText(filePath: string, fileName?: string): Promise<void>
{
    const text = await loadText(filePath);
    await indexChunks(text, fileName);
}