import { describe, it, expect, vi, beforeEach } from "vitest";
import BadRequest from "../api/errors/BadRequest.js";
import Unauthorized from "../api/errors/Unauthorized.js";
import Forbidden from "../api/errors/Forbidden.js";

vi.hoisted(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
    process.env.JWT_EXPIRES_IN = '7d';
});

vi.mock('../database/prisma.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        emailVerificationToken: {
            create: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
    }
}));

vi.mock('../services/emailService.js', () => ({
    sendVerificationEmail: vi.fn(),
}));

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed-password'),
        compare: vi.fn(),
    }
}));

const { register, verifyEmail, login } = await import('../api/controllers/authController.js');
const prisma = (await import('../database/prisma.js')).default;
const { sendVerificationEmail } = await import('../services/emailService.js');
const bcrypt = (await import('bcrypt')).default;

function createMockRes()
{
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as any;
}

function createNext() { return vi.fn(); }

const VALID_BODY = { email: 'user@example.com', password: 'Abcdef1!' };

beforeEach(() => { vi.clearAllMocks(); });

// ─── register ───────────────────────────────────────────────────────────────

describe('register', () => {
    it('returns 400 when email is missing', async () => {
        const req = { body: { password: 'Abcdef1!' } } as any;
        const next = createNext();

        await register(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('returns 400 for invalid email format', async () => {
        const req = { body: { email: 'not-an-email', password: 'Abcdef1!' } } as any;
        const next = createNext();

        await register(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('returns 400 when password is too short', async () => {
        const req = { body: { email: 'user@example.com', password: 'Ab1!' } } as any;
        const next = createNext();

        await register(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('returns 400 when password does not meet complexity requirements', async () => {
        const req = { body: { email: 'user@example.com', password: 'alllowercase1!' } } as any;
        const next = createNext();

        await register(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('returns 400 when email is already registered', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1', email: VALID_BODY.email } as any);
        const req = { body: VALID_BODY } as any;
        const next = createNext();

        await register(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('sends verification email and returns 201 message (no JWT)', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
        vi.mocked(prisma.user.create).mockResolvedValueOnce({ id: 'user-1', email: VALID_BODY.email } as any);
        vi.mocked(prisma.emailVerificationToken.create).mockResolvedValueOnce({} as any);
        vi.mocked(sendVerificationEmail).mockResolvedValueOnce();

        const req = { body: VALID_BODY } as any;
        const res = createMockRes();
        const next = createNext();

        await register(req, res, next);

        expect(sendVerificationEmail).toHaveBeenCalledOnce();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
        expect(next).not.toHaveBeenCalled();

        const body = vi.mocked(res.json).mock.calls[0][0];
        expect(body).not.toHaveProperty('token');
    });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────

describe('verifyEmail', () => {
    it('returns 400 when token query param is missing', async () => {
        const req = { query: {} } as any;
        const next = createNext();

        await verifyEmail(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('returns 400 when token is not found in DB', async () => {
        vi.mocked(prisma.emailVerificationToken.findUnique).mockResolvedValueOnce(null);
        const req = { query: { token: 'deadbeef' } } as any;
        const next = createNext();

        await verifyEmail(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('returns 400 when token is expired', async () => {
        vi.mocked(prisma.emailVerificationToken.findUnique).mockResolvedValueOnce({
            tokenHash: 'hash',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 1000),
        } as any);
        const req = { query: { token: 'sometoken' } } as any;
        const next = createNext();

        await verifyEmail(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(BadRequest));
    });

    it('marks user as verified, deletes token and returns JWT on valid token', async () => {
        vi.mocked(prisma.emailVerificationToken.findUnique).mockResolvedValueOnce({
            tokenHash: 'hash',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 60_000),
        } as any);
        vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);
        vi.mocked(prisma.emailVerificationToken.delete).mockResolvedValueOnce({} as any);

        const req = { query: { token: 'validrawtoken' } } as any;
        const res = createMockRes();
        const next = createNext();

        await verifyEmail(req, res, next);

        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { emailVerified: true }
        }));
        expect(prisma.emailVerificationToken.delete).toHaveBeenCalledOnce();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('login', () => {
    it('returns 401 for unknown email', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
        const req = { body: VALID_BODY } as any;
        const next = createNext();

        await login(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
    });

    it('returns 403 when email is not verified', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 'user-1',
            email: VALID_BODY.email,
            passwordHash: '$2b$10$fakehashedpasswordxxx',
            emailVerified: false,
        } as any);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        const req = { body: VALID_BODY } as any;
        const next = createNext();

        await login(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Forbidden));
    });

    it('returns JWT for verified user with correct password', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 'user-1',
            email: VALID_BODY.email,
            passwordHash: '$2b$10$fakehashedpasswordxxx',
            emailVerified: true,
        } as any);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        const req = { body: VALID_BODY } as any;
        const res = createMockRes();
        const next = createNext();

        await login(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
        expect(next).not.toHaveBeenCalled();
    });
});
