import "dotenv/config";
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import router from './api/routes.js';
import type { Request, Response, NextFunction } from "express";
import NotFound from "./api/errors/NotFound.js";
import errorsMiddleware from "./api/middleware/errorsMiddleware.js";
import { checkConnection } from "./database/chroma.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
}));
app.use(rateLimit({
    windowMs: 60_000,
    max: 30,
    message: { error: 'Too many requests, please try again later.' },
}));

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);

app.use((req: Request, res: Response, next: NextFunction): void => {
    next(new NotFound());
});

app.use(errorsMiddleware);

await checkConnection();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});