import { openai } from "./openaiClient.js";
import { OpenAIError } from "./errors/OpenAIError.js";

export async function isValidQuery(query: string): Promise<boolean>
{
    if (query.trim().length < 10) return false;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: `Classifique se a mensagem abaixo é uma pergunta válida sobre um documento ou apenas uma saudação/mensagem casual. Responda apenas "valid" ou "invalid".
                    
                Mensagem: "${query}"`
            }],
            max_tokens: 10
        });

        return response.choices[0]?.message.content?.trim() === 'valid';
    } catch (error) {
        throw new OpenAIError('Falha ao validar a intenção da query');
    }
}