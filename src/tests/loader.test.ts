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
    it('deve carregar e retornar o conteúdo de um arquivo de texto', async () => {
        const filePath = createTempFile('Este é um texto de exemplo para teste.');
        const result = await loadText(filePath);
        expect(result).toBe('Este é um texto de exemplo para teste.');
        fs.unlinkSync(filePath);
    });

    it('deve limpar caracteres de controle do texto', async () => {
        const filePath = createTempFile('Texto\x00 com\x07 caracteres\x1F estranhos');
        const result = await loadText(filePath);
        expect(result).not.toMatch(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/);
        expect(result).toContain('Texto');
        expect(result).toContain('caracteres');
        fs.unlinkSync(filePath);
    });

    it('deve normalizar múltiplos espaços em um só', async () => {
        const filePath = createTempFile('Texto    com     muitos    espaços');
        const result = await loadText(filePath);
        expect(result).toBe('Texto com muitos espaços');
        fs.unlinkSync(filePath);
    });

    it('deve lançar EmptyDocumentError para arquivo vazio', async () => {
        const filePath = createTempFile('');
        await expect(loadText(filePath)).rejects.toThrow(EmptyDocumentError);
        fs.unlinkSync(filePath);
    });

    it('deve lançar EmptyDocumentError para arquivo com apenas espaços em branco', async () => {
        const filePath = createTempFile('   \n\n  \t  ');
        await expect(loadText(filePath)).rejects.toThrow(EmptyDocumentError);
        fs.unlinkSync(filePath);
    });
});
