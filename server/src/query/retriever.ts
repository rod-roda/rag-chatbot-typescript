import { getCollection } from "../database/chroma.js";
import { embedQuery } from "../services/embedService.js";

export interface RetrievedChunk
{
    content: string,
    source: string,
    chunkIndex: number,
    distance: number
}

export async function retrieveChunks(query: string, k: number = 3, maxDistance: number = 1.5): Promise<RetrievedChunk[]> 
{
    const collection = await getCollection('documents');
    const embedding = await embedQuery(query);

    const results = await collection.query({
        queryEmbeddings: [embedding],
        nResults: k
    });

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