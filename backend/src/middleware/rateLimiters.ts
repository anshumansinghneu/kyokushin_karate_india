/**
 * Rate limiters for the unauthenticated attack surface.
 *
 * express-rate-limit was a dependency for a long time without ever being wired
 * up, leaving /auth/register, /auth/login, /auth/forgot-password and the public
 * /vouchers/validate endpoint completely unthrottled. The voucher endpoint was
 * the worst of them: a free, anonymous oracle over an 8-hex-character code space
 * that also echoed back the voucher's amount and applicability.
 *
 * NOTE: these count against `req.ip`, so `app.set('trust proxy', 1)` must stay
 * set — Render terminates TLS at a proxy and without it every request appears to
 * originate from the same address.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

const minutes = (n: number) => n * 60 * 1000;

/** Uniform JSON shape so clients can treat 429 like any other API error. */
const rejection = (message: string) => (req: Request, res: Response) => {
    res.status(429).json({ status: 'fail', message });
};

/**
 * Account creation. Deliberately generous enough for a family signing up
 * together on one connection, tight enough to stop scripted abuse.
 */
export const registerLimiter = rateLimit({
    windowMs: minutes(60),
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rejection('Too many accounts created from this network. Please try again later.'),
});

/**
 * Credential stuffing guard. Successful logins are not counted, so a legitimate
 * user who signs in repeatedly is never locked out — only failures accumulate.
 */
export const loginLimiter = rateLimit({
    windowMs: minutes(15),
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rejection('Too many failed login attempts. Please try again in a few minutes.'),
});

/** Password reset: throttled per email as well as per IP, to curb mail-bombing. */
export const passwordResetLimiter = rateLimit({
    windowMs: minutes(60),
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // ipKeyGenerator normalises IPv6 properly; appending the email stops one
    // address being spammed from a rotating pool of clients.
    keyGenerator: (req: Request) => {
        const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
        return `${ipKeyGenerator(req.ip ?? '')}:${email}`;
    },
    handler: rejection('Too many password reset requests. Please try again later.'),
});

/**
 * Voucher code validation. This is the brute-force surface: keep it strict.
 */
export const voucherValidateLimiter = rateLimit({
    windowMs: minutes(15),
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rejection('Too many voucher checks. Please wait a few minutes and try again.'),
});

/**
 * Public contact form: real people write a message or two; anything beyond
 * that from one network in an hour is a bot.
 */
export const contactLimiter = rateLimit({
    windowMs: minutes(60),
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rejection('Too many messages from this network. Please try again later, or call us.'),
});
