import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../query/promptBuilder.js';
import type { RetrievedChunk } from '../query/retriever.js';

const mockChunks: RetrievedChunk[] = [
    { content: 'The cat sat on the mat.', source: 'abc123', chunkIndex: 0, distance: 0.3 },
    { content: 'The dog ran in the park.', source: 'abc123', chunkIndex: 1, distance: 0.5 },
];

describe('buildPrompt', () => {
    it('should return system and user as strings', () => {
        const prompt = buildPrompt('Where did the cat sit?', mockChunks);
        expect(prompt).toHaveProperty('system');
        expect(prompt).toHaveProperty('user');
        expect(typeof prompt.system).toBe('string');
        expect(typeof prompt.user).toBe('string');
    });

    it('should include the question in the user prompt', () => {
        const question = 'Where did the cat sit?';
        const prompt = buildPrompt(question, mockChunks);
        expect(prompt.user).toContain(question);
    });

    it('should include the content of the chunks in the user prompt', () => {
        const prompt = buildPrompt('Any question', mockChunks);
        expect(prompt.user).toContain('The cat sat on the mat.');
        expect(prompt.user).toContain('The dog ran in the park.');
    });

    it('should number the excerpts correctly', () => {
        const prompt = buildPrompt('Question', mockChunks);
        expect(prompt.user).toContain('[Excerpt 1');
        expect(prompt.user).toContain('[Excerpt 2');
    });

    it('should include the source of each chunk', () => {
        const prompt = buildPrompt('Question', mockChunks);
        expect(prompt.user).toContain('Source:abc123');
    });

    it('should instruct the model to cite excerpts in the system prompt', () => {
        const prompt = buildPrompt('Question', mockChunks);
        expect(prompt.system).toContain('[Excerpt N]');
    });
});
