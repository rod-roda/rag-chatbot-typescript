export const SUPPORTED_MODELS = {
    'claude-sonnet-4-20250514':  { provider: 'anthropic', displayName: 'Claude Sonnet 4' },
    'claude-haiku-4-5-20251001': { provider: 'anthropic', displayName: 'Claude Haiku 4.5' },
    'gpt-4o':                    { provider: 'openai',    displayName: 'GPT-4o' },
    'gpt-4o-mini':               { provider: 'openai',    displayName: 'GPT-4o mini' },
} as const;

export type ModelId = keyof typeof SUPPORTED_MODELS;

export const DEFAULT_MODEL: ModelId = 'claude-sonnet-4-20250514';

export function isModelId(value: unknown): value is ModelId {
    return typeof value === 'string' && value in SUPPORTED_MODELS;
}
