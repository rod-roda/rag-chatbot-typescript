import { Router } from 'express';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

import multer from 'multer';
import path from 'path';
import os from 'os';

import { documentsController } from './controllers/documentsController.js';
import { register, login, verifyEmail } from './controllers/authController.js';
import { createChat, listChats, deleteChat, getChatMessages, saveMessages } from './controllers/chatController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { SUPPORTED_MODELS } from '../services/providers/supportedModels.js';

import BadRequest from './errors/BadRequest.js';

const authRateLimit = rateLimit({
    windowMs: 15 * 60_000,
    max: 10,
    message: { error: 'Too many attempts, please try again later.' },
});

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

    router.post('/chats', authMiddleware, createChat);
    router.get('/chats', authMiddleware, listChats);
    router.delete('/chats/:id', authMiddleware, deleteChat);
    router.get('/chats/:id/messages', authMiddleware, getChatMessages);
    router.post('/chats/:id/messages', authMiddleware, saveMessages);

    router.post('/auth/register', authRateLimit, register);
    router.post('/auth/login', authRateLimit, login);
    router.get('/auth/verify-email', verifyEmail);

    return router;

}