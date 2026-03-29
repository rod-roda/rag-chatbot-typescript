export class EmptyPDFError extends Error
{
    constructor(message: string = 'PDF não contém texto extraível')
    {
        super(message);
    }
}
