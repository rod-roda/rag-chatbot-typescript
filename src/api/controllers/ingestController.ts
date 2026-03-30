import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import BadRequest from '../errors/BadRequest.js';
import { ingestPDF } from '../../ingestion/ingest.js';

export async function ingestController(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        if(!req.file){
            next(new BadRequest('File not found'));
            return;
        }
        
        await ingestPDF(req.file.path, req.file.originalname);
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ 
           message: 'PDF processado e vetores salvos com sucesso'
        });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch {}
        }
        next(error);
    }
}