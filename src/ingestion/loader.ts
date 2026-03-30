import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api.js'
import { EmptyPDFError } from './errors/EmptyPDFError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standardFontDataUrl = path.join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/');

export async function loadPDF(filePath: string): Promise<string> 
{
  const buffer = await fs.promises.readFile(filePath);
  const data = new Uint8Array(buffer);

  const pdf = await pdfjsLib.getDocument({ data, standardFontDataUrl }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item: TextItem | TextMarkedContent) => ('str' in item ? item.str: ''))
      .join(' ');
    
    fullText += pageText + '\n';
  }

  const cleaned = cleanText(fullText);

  if (cleaned.length === 0) {
    throw new EmptyPDFError();
  }

  return cleaned;
}

function cleanText(text: string): string {
  return text
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}