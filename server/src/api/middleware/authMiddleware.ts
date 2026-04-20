import type { Request, Response, NextFunction } from "express";
import jwt  from "jsonwebtoken";
import Unauthorized from "../errors/Unauthorized.js";

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void
{
    const header = req.headers.authorization;

    if(!header?.startsWith('Bearer ')) {
        next(new Unauthorized());
        return;
    }

    const token = header.split(' ')[1];

    if(!token){
        next(new Unauthorized());
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = payload.userId;
        next();
    }catch {
        next(new Unauthorized('Invalid or expired token'));
    }
}