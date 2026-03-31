import { describe, it, expect } from 'vitest';
import { chunkText } from '../ingestion/chunker.js';

describe('chunkText', () => {
    const longText = Array(20).fill('Lorem ipsum dolor sit amet consectetur adipiscing elit').join('. ');

    it('should return chunks with approximate chunkSize', () => {
        const chunks = chunkText(longText, { chunkSize: 200, chunkOverlap: 20 });

        for (const chunk of chunks) {
            expect(chunk.length).toBeGreaterThan(50);
            expect(chunk.length).toBeLessThanOrEqual(300);
        }
    });

    it('should generate multiple chunks for large texts', () => {
        const chunks = chunkText(longText, { chunkSize: 200, chunkOverlap: 20 });
        expect(chunks.length).toBeGreaterThan(1);
    });

    it('should filter out chunks with less than 50 characters', () => {
        const chunks = chunkText('Short text.', { chunkSize: 500, chunkOverlap: 50 });
        expect(chunks).toHaveLength(0);
    });

    it('should return empty array for empty text', () => {
        const chunks = chunkText('');
        expect(chunks).toHaveLength(0);
    });

    it('should respect overlap between chunks', () => {
        const chunks = chunkText(longText, { chunkSize: 200, chunkOverlap: 50 });

        for (let i = 0; i < chunks.length - 1; i++) {
            const currentEnd = chunks[i]!.slice(-30);
            const nextStart = chunks[i + 1]!.slice(0, 100);
            // The end of one chunk should appear at the start of the next (overlap)
            expect(nextStart).toContain(currentEnd.split(' ').pop());
        }
    });

    it('should use default values when options are not provided', () => {
        const chunks = chunkText(longText);
        expect(chunks.length).toBeGreaterThan(0);
    });
});
