export class OpenAIError extends Error
{
    constructor(message: string = 'Falha ao consultar a API da OpenAI')
    {
        super(message);
    }
}
