import type { Response } from 'express';

class DefaultError extends Error {
    
    // no need to declare 'message' as this attribute already exists in the 'Error' class
    constructor(message: string = "Internal Server Error", protected status: number = 500)
    {
        super(message);
    }

    sendResponse(response: Response): void
    {
        response.status(this.status).send({
            message: this.message,
            status: this.status
        });
    }
}

export default DefaultError;