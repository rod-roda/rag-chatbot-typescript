export interface ChunkOptions {
  chunkSize?: number
  chunkOverlap?: number
}

export function chunkText(text: string, options: ChunkOptions = {}): string[]
{
    const { chunkSize = 500, chunkOverlap = 50 } = options;
    
    const chunks: string[] = [];
    let start: number = 0;

    while (start < text.length) {
        let end: number = start + chunkSize;

        if(end < text.length) {
            const nextSpace = text.indexOf(' ', end);
            end = nextSpace !== -1 ? nextSpace : text.length;
        }

        const chunk = text.slice(start, end);
        chunks.push(chunk.trim());

        let nextStart = end - chunkOverlap;
        const prevSpace = text.lastIndexOf(' ', nextStart);
        start = prevSpace > start ? prevSpace + 1 : nextStart;
    }

    return chunks.filter(chunk => chunk.length > 50);
}