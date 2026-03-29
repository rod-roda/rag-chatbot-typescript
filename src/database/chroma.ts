import { ChromaClient } from "chromadb";
import type { Collection } from "chromadb";

const client = new ChromaClient({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 8000)
});

export async function getCollection(name: string): Promise<Collection>
{
    return await client.getOrCreateCollection({ name });
}