import { anthropic } from "../anthropicClient.js";
import { AnthropicError } from "../errors/AnthropicError.js";
import type { BuiltPrompt } from "../../query/promptBuilder.js";
import type { LLMProvider, LLMResponse } from "./LLMProvider.js";

export class ClaudeLLMProvider implements LLMProvider
{
    constructor(private readonly model: string = 'claude-sonnet-4-20250514') {}

    async askLLM(prompt: BuiltPrompt): Promise<LLMResponse>
    {
        try {
            const response = await anthropic.messages.create({
                model: this.model,
                max_tokens: 1024,
                system: prompt.system,
                messages: [
                    { role: 'user', content: prompt.user }
                ]
            });
    
            const answer = response.content
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('');
            
            return {
                answer,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens
            }
        } catch (error) {
            console.error('Anthropic API error:', error);
            throw new AnthropicError('Failed to query the Anthropic API', { cause: error });
        }
    }
}