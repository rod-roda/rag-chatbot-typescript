import crypto from "crypto";
import { getCollection } from "../database/chroma.js";
import { chunkText } from "./chunker.js";
import { loadPDF, loadText } from "./loader.js";
import DatabaseError from "../database/errors/DatabaseError.js";
import type { EmbeddingProvider } from "../services/providers/EmbeddingProvider.js";
import path from "path";


export class IngestService
{
    constructor(private readonly embeddingProvider: EmbeddingProvider) {}

    async removeExistingChunks(fileName: string, userId: string): Promise<void>
    {
        const collection = await getCollection('documents');

        try {
            const existing = await collection.get({ where: { $and: [{ fileName }, { userId }] }, include: [] });
            if (existing.ids.length > 0) {
                await collection.delete({ ids: existing.ids });
                console.log(`Removed ${existing.ids.length} existing chunks for "${fileName}"`);
            }
        } catch (error) {
            console.error('ChromaDB delete error:', error);
            throw new DatabaseError('Failed to remove existing document chunks', 500, { cause: error });
        }
    }
    
    async indexChunks(text: string, userId: string, fileName: string): Promise<void>
    {
        const chunks = chunkText(text);
        const collection = await getCollection('documents');
        const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 12);
        const embeddings = await this.embeddingProvider.embedTexts(chunks);

        await this.removeExistingChunks(fileName, userId);

        try {
            await collection.upsert({
                ids: chunks.map((_, i) => `${hash}-chunk-${i}`),
                embeddings,
                documents: chunks,
                metadatas: chunks.map((_, i) => ({
                    source: hash,
                    fileName: fileName ?? 'unknown',
                    chunkIndex: i,
                    userId
                }))
            });
        } catch (error) {
            console.error('ChromaDB upsert error:', error);
            throw new DatabaseError('Failed to save document chunks to database', 500, { cause: error });
        }

        console.log(`${chunks.length} chunks saved to ChromaDB`);
    }

    async ingestFile(filePath: string, userId: string, fileName: string): Promise<void>
    {
        const ext = path.extname(fileName).toLocaleLowerCase();
        const text = ext === '.pdf'
            ? await loadPDF(filePath)
            : await loadText(filePath);
        
        await this.indexChunks(text, userId, fileName);
    }
}