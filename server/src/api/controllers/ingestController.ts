import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import BadRequest from '../errors/BadRequest.js';
import { IngestService } from '../../ingestion/ingest.js';


export function makeIngestController(ingestService: IngestService)
{
    return async function (req: Request, res: Response, next: NextFunction): Promise<void>
    {
        try {
            if(!req.file){
                next(new BadRequest('File not found'));
                return;
            }

            const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            await ingestService.ingestFile(req.file.path, req.userId, originalName);

            fs.unlinkSync(req.file.path);
            
            res.status(200).json({ 
            message: 'Document processed and vectors saved successfully.'
            });
        } catch (error) {
            if (req.file) {
                try { fs.unlinkSync(req.file.path); } catch {}
            }
            next(error);
        }
    }
}