import { describe, it, expect, vi, beforeEach } from 'vitest';

// Plain stub rather than vi.fn: vitest's spy wraps returned promises and reports a
// rejection the controller has already handled as a test failure.
const calls: unknown[][] = [];
let behaviour: 'ok' | 'fail' = 'ok';
const sendContactMessageEmail = Object.assign(
    async (...a: unknown[]) => {
        calls.push(a);
        if (behaviour === 'fail') throw new Error('brevo down');
    },
    { calls },
);
vi.mock('../services/emailService', () => ({ sendContactMessageEmail: (...a: unknown[]) => sendContactMessageEmail(...a) }));

import { submitContact } from './contactController';

function run(body: Record<string, unknown>) {
    const res: any = { statusCode: 0, body: undefined };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    return new Promise<{ res: any; err: any }>((resolve) => {
        const next = (err?: unknown) => resolve({ res, err });
        (submitContact as any)({ body } as any, res, next);
        setTimeout(() => resolve({ res, err: undefined }), 20);
    });
}

const valid = { name: 'Asha', email: 'asha@example.com', subject: 'Classes', message: 'When are the kids classes held?' };

describe('submitContact', () => {
    beforeEach(() => { calls.length = 0; behaviour = 'ok'; });

    it('emails a valid message and reports success', async () => {
        const { res, err } = await run(valid);
        expect(err).toBeUndefined();
        expect(res.statusCode).toBe(200);
        expect(calls[0][0]).toEqual(expect.objectContaining({ name: 'Asha', email: 'asha@example.com' }));
    });

    it('rejects a missing message without sending', async () => {
        const { err } = await run({ ...valid, message: '' });
        expect(err?.statusCode).toBe(400);
        expect(calls).toHaveLength(0);
    });

    it('rejects an invalid email', async () => {
        const { err } = await run({ ...valid, email: 'not-an-email' });
        expect(err?.statusCode).toBe(400);
    });

    it('silently accepts honeypot submissions without sending', async () => {
        const { res } = await run({ ...valid, website: 'http://spam.example' });
        expect(res.statusCode).toBe(200);
        expect(calls).toHaveLength(0);
    });

    it('returns 500 when delivery fails, never a false success', async () => {
        behaviour = 'fail';
        const { res, err } = await run(valid);
        expect(err?.statusCode).toBe(500);
        expect(res.statusCode).not.toBe(200);
    });
});
