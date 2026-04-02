import BadGateway from '../../api/errors/BadGateway.js';

export class OpenAIError extends BadGateway
{
    constructor(message: string = 'Failed to query the OpenAI API', options?: { cause?: unknown })
    {
        super(message, options);
    }
}
