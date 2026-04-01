import { ChromaClient } from "chromadb";
import type { Collection } from "chromadb";
import DatabaseError from "./errors/DatabaseError.js";

const client = new ChromaClient({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 8000)
});

export async function checkConnection(): Promise<void>
{
    try {
        await client.heartbeat();
        console.log('ChromaDB connected successfully');
    } catch {
        console.error('Failed to connect to ChromaDB');
        process.exit(1);
    }
}

export async function getCollection(name: string): Promise<Collection>
{
    try {
        return await client.getOrCreateCollection({ name });
    } catch (error) {
        console.error('ChromaDB error:', error);
        throw new DatabaseError('Failed to access database collection', 503, { cause: error });
    }
}