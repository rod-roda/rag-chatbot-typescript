import { anthropic } from "../services/anthropicClient.js";
import { AnthropicError } from "../services/errors/AnthropicError.js";
import type { BuiltPrompt } from "./promptBuilder.js";

export interface LLMResponse
{
    answer: string,
    inputTokens: number,
    outputTokens: number
}

export async function askClaude(prompt: BuiltPrompt): Promise<LLMResponse> 
{
    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
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