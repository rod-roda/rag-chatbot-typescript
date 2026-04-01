import DefaultError from "../../api/errors/DefaultError.js";

class DatabaseError extends DefaultError
{
    constructor(message: string = "Database operation failed", status: number = 500, options?: { cause?: unknown })
    {
        super(message, status);
        if (options?.cause) this.cause = options.cause;
    }
}

export default DatabaseError;
