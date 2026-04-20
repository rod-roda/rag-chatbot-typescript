import { describe, it, expect, vi } from "vitest";
import jwt from 'jsonwebtoken';
import Unauthorized from "../api/errors/Unauthorized.js";

const TEST_SECRET = vi.hoisted(() => {
    const secret = 'test-secret-key-for-unit-tests';
    process.env.JWT_SECRET = secret;
    return secret;
});

const { authMiddleware } = await import("../api/middleware/authMiddleware.js");

function createMockReq(authHeader?: string)
{
    return { headers: { authorization: authHeader }, userId: undefined } as any;
}

function createMockRes()
{
    return {} as any;
}

describe('authMiddleware', () => {
    it('should call next with Unauthorized when no Authorization header', () => {
        const req = createMockReq(undefined);
        const next = vi.fn();

        authMiddleware(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
    });

    it('should call next with Unauthorized when header does not start with Bearer', () => {
       const req = createMockReq('Basic abc123');
       const next = vi.fn();
       
       authMiddleware(req, createMockRes(), next);

       expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
    });

    it('should call next with Unauthorized when token is invalid', () => {
        const req = createMockReq('Bearer invalid-token');
        const next = vi.fn();

        authMiddleware(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
    });

    it('should call next with Unauthorized when token is expired', () => {
        const token = jwt.sign({ userId: 'user-1' }, TEST_SECRET, { expiresIn: '0s' });
        const req = createMockReq(`Bearer ${token}`);
        const next = vi.fn();

        authMiddleware(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
    });

    it('should inject userId and call next whithout error for valid token', () => {
        const token = jwt.sign({ userId: 'user-123' }, TEST_SECRET);
        const req = createMockReq(`Bearer ${token}`);
        const next = vi.fn();

        authMiddleware(req, createMockRes(), next);

        expect(req.userId).toBe('user-123');
        expect(next).toHaveBeenCalledWith();
    });

    it('should call next with Unauthorized when Bearer has no token after it', () => {
        const req = createMockReq('Bearer ');
        const next = vi.fn();

        authMiddleware(req, createMockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
    });
});