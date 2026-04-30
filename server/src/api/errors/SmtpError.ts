import BadGateway from "./BadGateway.js";

class SmtpError extends BadGateway
{
    constructor(options?: { cause?: unknown })
    {
        super('Failed to send verification email. Please try again later.', options);
    }
}

export default SmtpError;
