import { openai } from "../openaiClient.js";
import { OpenAIError } from "../errors/OpenAIError.js";
import type { BuiltPrompt } from "../../query/promptBuilder.js";
import type { LLMProvider, LLMResponse } from "./LLMProvider.js";

export class OpenAILLMProvider implements LLMProvider
{
    constructor(private readonly model: string = 'gpt-4o') {}

    async askLLM(prompt: BuiltPrompt): Promise<LLMResponse>
    {
        try {
            const response = await openai.chat.completions.create({
                model: this.model,
                max_tokens: 1024,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ]
            });

            const answer = response.choices
                .map(choice => choice.message.content ?? '')
                .join('');

            return {
                answer,
                inputTokens: response.usage?.prompt_tokens ?? 0,
                outputTokens: response.usage?.completion_tokens ?? 0
            };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new OpenAIError('Failed to query the OpenAI API', { cause: error });
        }
    }
}
