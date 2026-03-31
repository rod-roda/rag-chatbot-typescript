import BadGateway from '../../api/errors/BadGateway.js';

export class AnthropicError extends BadGateway
{
    constructor(message: string = 'Failed to query the Anthropic API')
    {
        super(message);
    }
}
