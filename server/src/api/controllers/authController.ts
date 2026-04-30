import type { Request, Response, NextFunction } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from "../../database/prisma.js"
import BadRequest from "../errors/BadRequest.js";
import Unauthorized from "../errors/Unauthorized.js";
import Forbidden from "../errors/Forbidden.js";
import { sendVerificationEmail } from "../../services/emailService.js";
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as StringValue ?? '7d';

function generateToken(userId: string): string
{
    return jwt.sign({userId}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});
}

function hashToken(rawToken: string): string
{
    return crypto.createHash('sha256').update(rawToken).digest('hex');
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

        if (!(/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)))
        {
            next(new BadRequest('Password must have at least one uppercase character, one number and one special character'));
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

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.emailVerificationToken.create({
            data: { tokenHash, userId: user.id, expiresAt }
        });

        await sendVerificationEmail(email, rawToken);

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        next(error);
    }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>
{
    try {
        const rawToken = req.query.token as string | undefined;

        if (!rawToken) {
            next(new BadRequest('Verification token is required'));
            return;
        }

        const tokenHash = hashToken(rawToken);

        const record = await prisma.emailVerificationToken.findUnique({
            where: { tokenHash }
        });

        if (!record || record.expiresAt < new Date()) {
            next(new BadRequest('Invalid or expired verification token'));
            return;
        }

        await prisma.user.update({
            where: { id: record.userId },
            data: { emailVerified: true }
        });

        await prisma.emailVerificationToken.delete({ where: { tokenHash } });

        const token = generateToken(record.userId);

        res.status(200).json({ token });
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

        if (!user.emailVerified) {
            next(new Forbidden('Please verify your email before logging in'));
            return;
        }

        const token = generateToken(user.id);

        res.status(200).json({ token });
    } catch (error) {
        next(error);
    }
}
