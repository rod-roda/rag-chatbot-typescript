import type { Response } from 'express';

class DefaultError extends Error {
    
    // nao preciso declarar 'message' pois esse atributo já existe na classe 'Error'
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