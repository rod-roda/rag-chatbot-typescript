export class AnthropicError extends Error
{
    constructor(message: string = 'Falha ao consultar a API da Anthropic')
    {
        super(message);
    }
}
