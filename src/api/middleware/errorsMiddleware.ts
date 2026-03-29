import DefaultError from "../errors/DefaultError.js";
import multer from 'multer';
import { EmptyPDFError } from '../../ingestion/errors/EmptyPDFError.js';
import { EmbeddingError } from '../../ingestion/errors/EmbeddingError.js';

import type { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorsMiddleware(error: unknown, request: Request, response: Response, next: NextFunction): void {
    if (error instanceof multer.MulterError) {
        response.status(400).send({ message: error.message, status: 400 });
    } else if (error instanceof EmptyPDFError) {
        response.status(400).send({ message: error.message, status: 400 });
    } else if (error instanceof EmbeddingError) {
        response.status(502).send({ message: error.message, status: 502 });
    } else if (error instanceof DefaultError) {
        error.sendResponse(response);
    } else {
        console.error(error);
        new DefaultError().sendResponse(response);
    }
}

export default errorsMiddleware;