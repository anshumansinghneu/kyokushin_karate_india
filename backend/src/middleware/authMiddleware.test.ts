import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// No database: these rules are decided before any query.
vi.mock('../prisma', () => ({ default: {} }));

import { hasStaffPowers, protect, restrictTo } from './authMiddleware';
import { AppError, globalErrorHandler } from '../utils/errorHandler';

type Next = (err?: unknown) => void;

function run(mw: (req: any, res: any, next: Next) => unknown, req: any): Promise<unknown> {
    return new Promise((resolve) => {
        const out = mw(req, {}, (err?: unknown) => resolve(err ?? 'next'));
        // catchAsync handlers return a promise; plain ones may not call next on success.
        Promise.resolve(out).catch(resolve);
    });
}

describe('hasStaffPowers', () => {
    it('trusts admins and approved instructors', () => {
        expect(hasStaffPowers({ role: 'ADMIN', membershipStatus: 'ACTIVE' })).toBe(true);
        expect(hasStaffPowers({ role: 'INSTRUCTOR', membershipStatus: 'ACTIVE' })).toBe(true);
        expect(hasStaffPowers({ role: 'INSTRUCTOR', membershipStatus: 'EXPIRED' })).toBe(true);
    });

    it('does not trust a self-chosen instructor role before approval', () => {
        expect(hasStaffPowers({ role: 'INSTRUCTOR', membershipStatus: 'PENDING' })).toBe(false);
        expect(hasStaffPowers({ role: 'INSTRUCTOR', membershipStatus: 'REJECTED' })).toBe(false);
        expect(hasStaffPowers({ role: 'INSTRUCTOR', membershipStatus: null })).toBe(false);
    });

    it('never gives students or anonymous requests staff powers', () => {
        expect(hasStaffPowers({ role: 'STUDENT', membershipStatus: 'ACTIVE' })).toBe(false);
        expect(hasStaffPowers(undefined)).toBe(false);
    });
});

describe('restrictTo', () => {
    const staffOnly = restrictTo('ADMIN', 'INSTRUCTOR');

    it('lets an approved instructor through', async () => {
        expect(await run(staffOnly, { user: { role: 'INSTRUCTOR', membershipStatus: 'ACTIVE' } })).toBe('next');
    });

    it('blocks a pending instructor with 403', async () => {
        const err = (await run(staffOnly, { user: { role: 'INSTRUCTOR', membershipStatus: 'PENDING' } })) as AppError;
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(403);
    });

    it('still blocks roles that are not listed', async () => {
        const err = (await run(staffOnly, { user: { role: 'STUDENT', membershipStatus: 'ACTIVE' } })) as AppError;
        expect(err.statusCode).toBe(403);
    });
});

describe('protect with a bad token', () => {
    it('answers 401 (not 500) for a malformed token, so the client can refresh', async () => {
        process.env.JWT_SECRET = 'test-secret';
        const err = (await run(protect, { headers: { authorization: 'Bearer abc.def.ghi' } })) as AppError;
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(401);
    });

    it('answers 401 for an expired token', async () => {
        process.env.JWT_SECRET = 'test-secret';
        const expired = jwt.sign({ id: 'u1', exp: Math.floor(Date.now() / 1000) - 60 }, 'test-secret');
        const err = (await run(protect, { headers: { authorization: `Bearer ${expired}` } })) as AppError;
        expect(err.statusCode).toBe(401);
    });
});

describe('globalErrorHandler', () => {
    it('turns a stray JWT error into a 401', () => {
        const res: any = { status: vi.fn(() => res), json: vi.fn(() => res) };
        const err = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
        globalErrorHandler(err, {} as any, res, () => {});
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
