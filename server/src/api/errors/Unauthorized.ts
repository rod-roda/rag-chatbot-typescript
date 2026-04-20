import DefaultError from "./DefaultError.js";

class Unauthorized extends DefaultError
{
    constructor(message: string = "Authentication required")
    {
        super(message, 401);
    }
}

export default Unauthorized;