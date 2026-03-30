import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../query/promptBuilder.js';
import type { RetrievedChunk } from '../query/retriever.js';

const mockChunks: RetrievedChunk[] = [
    { content: 'O gato sentou no tapete.', source: 'abc123', chunkIndex: 0, distance: 0.3 },
    { content: 'O cachorro correu no parque.', source: 'abc123', chunkIndex: 1, distance: 0.5 },
];

describe('buildPrompt', () => {
    it('deve retornar system e user como strings', () => {
        const prompt = buildPrompt('Onde o gato sentou?', mockChunks);
        expect(prompt).toHaveProperty('system');
        expect(prompt).toHaveProperty('user');
        expect(typeof prompt.system).toBe('string');
        expect(typeof prompt.user).toBe('string');
    });

    it('deve incluir a pergunta no prompt do usuário', () => {
        const question = 'Onde o gato sentou?';
        const prompt = buildPrompt(question, mockChunks);
        expect(prompt.user).toContain(question);
    });

    it('deve incluir o conteúdo dos chunks no prompt do usuário', () => {
        const prompt = buildPrompt('Pergunta qualquer', mockChunks);
        expect(prompt.user).toContain('O gato sentou no tapete.');
        expect(prompt.user).toContain('O cachorro correu no parque.');
    });

    it('deve numerar os trechos corretamente', () => {
        const prompt = buildPrompt('Pergunta', mockChunks);
        expect(prompt.user).toContain('[Trecho 1');
        expect(prompt.user).toContain('[Trecho 2');
    });

    it('deve incluir a fonte de cada chunk', () => {
        const prompt = buildPrompt('Pergunta', mockChunks);
        expect(prompt.user).toContain('Fonte:abc123');
    });

    it('deve instruir o modelo a citar trechos no system prompt', () => {
        const prompt = buildPrompt('Pergunta', mockChunks);
        expect(prompt.system).toContain('[Trecho N]');
    });
});
