import { ClaudeLLMProvider } from './ClaudeLLMProvider.js';
import { OpenAILLMProvider } from './OpenAILLMProvider.js';
import type { LLMProvider } from './LLMProvider.js';
import { SUPPORTED_MODELS, type ModelId } from './supportedModels.js';

export class LLMProviderFactory
{
    getProvider(modelId: ModelId): LLMProvider
    {
        const { provider } = SUPPORTED_MODELS[modelId];
        if (provider === 'anthropic') return new ClaudeLLMProvider(modelId);
        return new OpenAILLMProvider(modelId);
    }
}
