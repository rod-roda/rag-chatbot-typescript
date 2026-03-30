import DefaultError from "../errors/DefaultError.js";
import BadRequest from "../errors/BadRequest.js";
import multer from 'multer';

import type { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorsMiddleware(error: unknown, request: Request, response: Response, next: NextFunction): void {
    if (error instanceof multer.MulterError) {
        response.status(400).send({ message: error.message, status: 400 });
    } else if (error instanceof Error && !(error instanceof DefaultError)) {
        // Erros genéricos (ex: fileFilter do multer)
        new BadRequest(error.message).sendResponse(response);
    } else if (error instanceof DefaultError) {
        error.sendResponse(response);
    } else {
        console.error(error);
        new DefaultError().sendResponse(response);
    }
}

export default errorsMiddleware;