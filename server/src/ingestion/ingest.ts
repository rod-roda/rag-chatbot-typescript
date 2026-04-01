import crypto from "crypto";
import { getCollection } from "../database/chroma.js";
import { chunkText } from "./chunker.js";
import { loadPDF, loadText } from "./loader.js";
import { embedTexts } from "../services/embedService.js";
import DatabaseError from "../database/errors/DatabaseError.js";

async function removeExistingChunks(fileName: string): Promise<void>
{
    const collection = await getCollection('documents');

    try {
        const existing = await collection.get({ where: { fileName }, include: [] });
        if (existing.ids.length > 0) {
            await collection.delete({ ids: existing.ids });
            console.log(`Removed ${existing.ids.length} existing chunks for "${fileName}"`);
        }
    } catch (error) {
        console.error('ChromaDB delete error:', error);
        throw new DatabaseError('Failed to remove existing document chunks', 500, { cause: error });
    }
}

async function indexChunks(text: string, fileName?: string): Promise<void>
{
    const chunks = chunkText(text);
    const collection = await getCollection('documents');
    const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 12);
    const embeddings = await embedTexts(chunks);

    if (fileName) {
        await removeExistingChunks(fileName);
    }

    try {
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
    } catch (error) {
        console.error('ChromaDB upsert error:', error);
        throw new DatabaseError('Failed to save document chunks to database', 500, { cause: error });
    }

    console.log(`${chunks.length} chunks saved to ChromaDB`);
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