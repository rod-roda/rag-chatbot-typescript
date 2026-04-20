import type { Request, Response, NextFunction } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../database/prisma.js"
import BadRequest from "../errors/BadRequest.js";
import Unauthorized from "../errors/Unauthorized.js";
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as StringValue ?? '7d';

function generateToken(userId: string): string
{
    return jwt.sign({userId}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            next(new BadRequest('Email and password are required'));
            return;
        }

        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!EMAIL_REGEX.test(email)) {
            next(new BadRequest('Invalid email format'));
            return;
        }

        if (password.length < 6) {
            next(new BadRequest('Password must be at least 6 characters'));
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            next(new BadRequest('Email already registered'));
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, passwordHash }
        });

        const token = generateToken(user.id);

        res.status(201).json({ token });
    } catch (error) {
        next(error);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            next(new BadRequest('Email and password are required'));
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            next(new Unauthorized('Invalid email or password'));
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            next(new Unauthorized('Invalid email or password'));
            return;
        }

        const token = generateToken(user.id);

        res.status(200).json({ token });
    } catch (error) {
        next(error);
    }
}