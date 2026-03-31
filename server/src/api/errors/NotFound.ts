import DefaultError from "./DefaultError.js";

class NotFound extends DefaultError
{
    constructor(message: string = "Page not found")
    {
        super(message, 404);
    }
}

export default NotFound;