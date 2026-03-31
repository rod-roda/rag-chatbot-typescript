import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { ingestController } from './controllers/ingestController.js';
import { queryController } from './controllers/queryController.js';
import { documentsController } from './controllers/documentsController.js';
import BadRequest from './errors/BadRequest.js';

const router = Router();

const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf' && ext !== '.txt'){
            return cb(new BadRequest('Apenas arquivos PDF e TXT são permitidos'));
        }
        cb(null, true);
    }
});

router.post('/ingest', upload.single('file'), ingestController);
router.post('/query', queryController);
router.get('/documents', documentsController);

export default router;