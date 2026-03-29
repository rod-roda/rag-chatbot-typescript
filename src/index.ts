import "dotenv/config";
import express from 'express';
import router from './api/routes.js';
import type { Request, Response, NextFunction } from "express";
import NotFound from "./api/errors/NotFound.js";
import errorsMiddleware from "./api/middleware/errorsMiddleware.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api', router);

app.use((req: Request, res: Response, next: NextFunction): void => {
    next(new NotFound());
});

app.use(errorsMiddleware);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
