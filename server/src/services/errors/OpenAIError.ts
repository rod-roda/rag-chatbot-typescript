import BadGateway from '../../api/errors/BadGateway.js';

export class OpenAIError extends BadGateway
{
    constructor(message: string = 'Falha ao consultar a API da OpenAI')
    {
        super(message);
    }
}
