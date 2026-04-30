import { Router } from 'express';
import type { RequestHandler } from 'express';

import multer from 'multer';
import path from 'path';
import os from 'os';

import { documentsController } from './controllers/documentsController.js';
import { register, login, verifyEmail } from './controllers/authController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { SUPPORTED_MODELS } from '../services/providers/supportedModels.js';

import BadRequest from './errors/BadRequest.js';

interface RouterDeps
{
    ingestController: RequestHandler;
    queryController: RequestHandler;
}

export function createRouter({ ingestController, queryController }: RouterDeps)
{
    const router = Router();

    const upload = multer({
        dest: os.tmpdir(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext !== '.pdf' && ext !== '.txt'){
                return cb(new BadRequest('Only PDF and TXT files are allowed'));
            }
            cb(null, true);
        }
    });

    router.get('/models', (_req, res) => {
        const models = Object.entries(SUPPORTED_MODELS).map(([id, { displayName }]) => ({ id, displayName }));
        res.json(models);
    });

    router.post('/ingest', authMiddleware, upload.single('file'), ingestController);
    router.post('/query', authMiddleware, queryController);
    router.get('/documents', authMiddleware, documentsController);

    router.post('/auth/register', register);
    router.post('/auth/login', login);
    router.get('/auth/verify-email', verifyEmail);

    return router;

}