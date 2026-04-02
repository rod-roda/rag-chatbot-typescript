import { describe, it, expect, afterEach } from 'vitest';
import { loadText } from '../ingestion/loader.js';
import { EmptyDocumentError } from '../ingestion/errors/EmptyDocumentError.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tempFiles: string[] = [];

function createTempFile(content: string): string {
    const filePath = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
    fs.writeFileSync(filePath, content);
    tempFiles.push(filePath);
    return filePath;
}

describe('loadText', () => {
    afterEach(() => {
        for (const f of tempFiles) {
            try { fs.unlinkSync(f); } catch {}
        }
        tempFiles.length = 0;
    });

    it('should load and return the content of a text file', async () => {
        const filePath = createTempFile('This is a sample text for testing.');
        const result = await loadText(filePath);
        expect(result).toBe('This is a sample text for testing.');
    });

    it('should clean control characters from the text', async () => {
        const filePath = createTempFile('Text\x00 with\x07 strange\x1F characters');
        const result = await loadText(filePath);
        expect(result).not.toMatch(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/);
        expect(result).toContain('Text');
        expect(result).toContain('characters');
    });

    it('should normalize multiple spaces into one', async () => {
        const filePath = createTempFile('Text    with     many    spaces');
        const result = await loadText(filePath);
        expect(result).toBe('Text with many spaces');
    });

    it('should throw EmptyDocumentError for empty file', async () => {
        const filePath = createTempFile('');
        await expect(loadText(filePath)).rejects.toThrow(EmptyDocumentError);
    });

    it('should throw EmptyDocumentError for file with only whitespace', async () => {
        const filePath = createTempFile('   \n\n  \t  ');
        await expect(loadText(filePath)).rejects.toThrow(EmptyDocumentError);
    });
});
