import DefaultError from "./DefaultError.js";

class BadGateway extends DefaultError
{
    constructor(message: string = 'External API Error')
    {
        super(message, 502);
    }
}

export default BadGateway;