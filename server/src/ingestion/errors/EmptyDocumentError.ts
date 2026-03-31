import BadRequest from '../../api/errors/BadRequest.js';

export class EmptyDocumentError extends BadRequest
{
    constructor(message: string = 'Documento não contém texto extraível')
    {
        super(message);
    }
}
