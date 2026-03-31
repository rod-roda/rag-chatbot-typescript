import BadRequest from '../../api/errors/BadRequest.js';

export class EmptyDocumentError extends BadRequest
{
    constructor(message: string = 'Document does not contain extractable text')
    {
        super(message);
    }
}
