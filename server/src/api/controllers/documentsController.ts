import type { Request, Response, NextFunction } from 'express';
import { getCollection } from '../../database/chroma.js';

export async function documentsController(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        const collection = await getCollection('documents');
        const result = await collection.get({ include: ['metadatas'] });

        const fileNames = [...new Set(
            result.metadatas
                ?.map(m => m?.fileName)
                .filter((name): name is string => typeof name === 'string')
        )];

        res.status(200).json({ documents: fileNames });
    } catch (error) {
        next(error);
    }
}