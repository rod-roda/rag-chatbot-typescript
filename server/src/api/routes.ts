import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { ingestController } from './controllers/ingestController.js';
import { queryController } from './controllers/queryController.js';
import { documentsController } from './controllers/documentsController.js';
import BadRequest from './errors/BadRequest.js';
import { register, login } from './controllers/authController.js';
import { authMiddleware } from './middleware/authMiddleware.js';

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

router.post('/ingest', authMiddleware, upload.single('file'), ingestController);
router.post('/query', authMiddleware, queryController);
router.get('/documents', authMiddleware, documentsController);

router.post('/auth/register',register);
router.post('/auth/login', login);

export default router;