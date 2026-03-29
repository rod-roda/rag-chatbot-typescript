export class EmbeddingError extends Error
{
    constructor(message: string = 'Falha ao gerar embeddings via OpenAI')
    {
        super(message);
    }
}
