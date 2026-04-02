import DefaultError from "./DefaultError.js";

class BadGateway extends DefaultError
{
    constructor(message: string = 'External API Error', options?: { cause?: unknown })
    {
        super(message, 502);
        if (options?.cause) this.cause = options.cause;
    }
}

export default BadGateway;