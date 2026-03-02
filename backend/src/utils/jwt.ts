import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';      // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 30;   // Refresh token valid for 30 days

/**
 * Sign a short-lived access token (15 minutes)
 */
export const signAccessToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
};

/**
 * Create a refresh token, store hash in DB, return raw token
 */
export const createRefreshToken = async (userId: string): Promise<string> => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
        data: {
            token: tokenHash,
            userId,
            expiresAt,
        },
    });

    // Clean up old/expired tokens for this user (keep max 5)
    const tokens = await prisma.refreshToken.findMany({
        where: { userId, revokedAt: null },
        orderBy: { createdAt: 'desc' },
    });
    if (tokens.length > 5) {
        const toDelete = tokens.slice(5).map(t => t.id);
        await prisma.refreshToken.deleteMany({
            where: { id: { in: toDelete } },
        });
    }

    return rawToken;
};

/**
 * Verify a refresh token and return userId if valid
 */
export const verifyRefreshToken = async (rawToken: string): Promise<string | null> => {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const stored = await prisma.refreshToken.findUnique({
        where: { token: tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        // Clean up if expired
        if (stored) {
            await prisma.refreshToken.delete({ where: { id: stored.id } });
        }
        return null;
    }

    return stored.userId;
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (rawToken: string): Promise<void> => {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.refreshToken.updateMany({
        where: { token: tokenHash },
        data: { revokedAt: new Date() },
    });
};

/**
 * Revoke all refresh tokens for a user (e.g., on password change)
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
};

/**
 * Clean up expired refresh tokens (call periodically)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
    await prisma.refreshToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { revokedAt: { not: null } },
            ],
        },
    });
};
