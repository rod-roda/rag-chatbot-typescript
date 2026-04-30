import DefaultError from "./DefaultError.js";

class Forbidden extends DefaultError
{
    constructor(message: string = "Forbidden")
    {
        super(message, 403);
    }
}

export default Forbidden;
