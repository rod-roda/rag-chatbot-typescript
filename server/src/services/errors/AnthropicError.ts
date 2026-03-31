import BadGateway from '../../api/errors/BadGateway.js';

export class AnthropicError extends BadGateway
{
    constructor(message: string = 'Falha ao consultar a API da Anthropic')
    {
        super(message);
    }
}
