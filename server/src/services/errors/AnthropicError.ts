import BadGateway from '../../api/errors/BadGateway.js';

export class AnthropicError extends BadGateway
{
    constructor(message: string = 'Failed to query the Anthropic API', options?: { cause?: unknown })
    {
        super(message, options);
    }
}
