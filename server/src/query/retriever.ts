import { getCollection } from "../database/chroma.js";
import DatabaseError from "../database/errors/DatabaseError.js";
import type { EmbeddingProvider } from "../services/providers/EmbeddingProvider.js";

export interface RetrievedChunk
{
    content: string,
    source: string,
    chunkIndex: number,
    distance: number
}

export class RetrieverService 
{
    constructor(private readonly embeddingProvider: EmbeddingProvider) {}

    async retrieveChunks(query: string, userId: string, k: number = 3, maxDistance: number = 1.5, fileName?: string): Promise<RetrievedChunk[]> 
    {
        const collection = await getCollection('documents');
        const embedding = await this.embeddingProvider.embedQuery(query);

        let results;
        try {
            results = await collection.query({
                queryEmbeddings: [embedding],
                nResults: k,
                where: fileName
                    ? { $and: [{ userId }, { fileName }] }
                    : { userId }
            });
        } catch (error) {
            console.error('ChromaDB query error:', error);
            throw new DatabaseError('Failed to retrieve relevant chunks from database', 500, { cause: error });
        }

        const ids = results.ids[0] ?? [];
        const documents = results.documents[0] ?? [];
        const metadatas = results.metadatas[0] ?? [];
        const distances = results.distances?.[0] ?? [];

        const chunks: RetrievedChunk[] = ids.map((id, i) => ({
            content: documents[i] ?? '',
            source: metadatas[i]?.source as string,
            chunkIndex: metadatas[i]?.chunkIndex as number,
            distance: distances[i] ?? 1
        }));

        return chunks.filter(chunk => chunk.distance < maxDistance);
    }
}