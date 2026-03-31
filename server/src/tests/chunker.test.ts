import { describe, it, expect } from 'vitest';
import { chunkText } from '../ingestion/chunker.js';

describe('chunkText', () => {
    const longText = Array(20).fill('Lorem ipsum dolor sit amet consectetur adipiscing elit').join('. ');

    it('deve retornar chunks com o tamanho aproximado do chunkSize', () => {
        const chunks = chunkText(longText, { chunkSize: 200, chunkOverlap: 20 });

        for (const chunk of chunks) {
            expect(chunk.length).toBeGreaterThan(50);
            expect(chunk.length).toBeLessThanOrEqual(300);
        }
    });

    it('deve gerar múltiplos chunks para textos grandes', () => {
        const chunks = chunkText(longText, { chunkSize: 200, chunkOverlap: 20 });
        expect(chunks.length).toBeGreaterThan(1);
    });

    it('deve filtrar chunks com menos de 50 caracteres', () => {
        const chunks = chunkText('Texto curto.', { chunkSize: 500, chunkOverlap: 50 });
        expect(chunks).toHaveLength(0);
    });

    it('deve retornar array vazio para texto vazio', () => {
        const chunks = chunkText('');
        expect(chunks).toHaveLength(0);
    });

    it('deve respeitar o overlap entre chunks', () => {
        const chunks = chunkText(longText, { chunkSize: 200, chunkOverlap: 50 });

        for (let i = 0; i < chunks.length - 1; i++) {
            const currentEnd = chunks[i]!.slice(-30);
            const nextStart = chunks[i + 1]!.slice(0, 100);
            // O final de um chunk deve aparecer no início do próximo (overlap)
            expect(nextStart).toContain(currentEnd.split(' ').pop());
        }
    });

    it('deve usar valores padrão quando options não é fornecido', () => {
        const chunks = chunkText(longText);
        expect(chunks.length).toBeGreaterThan(0);
    });
});
