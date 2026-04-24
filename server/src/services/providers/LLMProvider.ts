import type { BuiltPrompt } from "../../query/promptBuilder.js"

export interface LLMResponse
{
    answer: string,
    inputTokens: number,
    outputTokens: number
}

export interface LLMProvider
{
    askLLM(prompt: BuiltPrompt): Promise<LLMResponse>;
}