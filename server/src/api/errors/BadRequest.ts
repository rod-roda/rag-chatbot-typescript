import DefaultError from "./DefaultError.js";

class BadRequest extends DefaultError
{
    constructor(message: string = "Bad request")
    {
        super(message, 400);
    }
}

export default BadRequest;