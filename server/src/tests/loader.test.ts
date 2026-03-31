import { describe, it, expect } from 'vitest';
import { loadText } from '../ingestion/loader.js';
import { EmptyDocumentError } from '../ingestion/errors/EmptyDocumentError.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

function createTempFile(content: string): string {
    const filePath = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
    fs.writeFileSync(filePath, content);
    return filePath;
}

describe('loadText', () => {
    it('should load and return the content of a text file', async () => {
        const filePath = createTempFile('This is a sample text for testing.');
        const result = await loadText(filePath);
        expect(result).toBe('This is a sample text for testing.');
        fs.unlinkSync(filePath);
    });

    it('should clean control characters from the text', async () => {
        const filePath = createTempFile('Text\x00 with\x07 strange\x1F characters');
        const result = await loadText(filePath);
        expect(result).not.toMatch(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/);
        expect(result).toContain('Text');
        expect(result).toContain('characters');
        fs.unlinkSync(filePath);
    });

    it('should normalize multiple spaces into one', async () => {
        const filePath = createTempFile('Text    with     many    spaces');
        const result = await loadText(filePath);
        expect(result).toBe('Text with many spaces');
        fs.unlinkSync(filePath);
    });

    it('should throw EmptyDocumentError for empty file', async () => {
        const filePath = createTempFile('');
        await expect(loadText(filePath)).rejects.toThrow(EmptyDocumentError);
        fs.unlinkSync(filePath);
    });

    it('should throw EmptyDocumentError for file with only whitespace', async () => {
        const filePath = createTempFile('   \n\n  \t  ');
        await expect(loadText(filePath)).rejects.toThrow(EmptyDocumentError);
        fs.unlinkSync(filePath);
    });
});
