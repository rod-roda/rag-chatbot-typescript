import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import BadRequest from '../errors/BadRequest.js';
import { ingestPDF, ingestText } from '../../ingestion/ingest.js';

export async function ingestController(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        if(!req.file){
            next(new BadRequest('File not found'));
            return;
        }
        
        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === '.pdf') {
            await ingestPDF(req.file.path, req.file.originalname);
        } else {
            await ingestText(req.file.path, req.file.originalname);
        }

        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ 
           message: 'Documento processado e vetores salvos com sucesso'
        });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch {}
        }
        next(error);
    }
}