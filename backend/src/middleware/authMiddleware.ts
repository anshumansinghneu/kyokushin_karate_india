import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

/**
 * Whether a user really holds staff powers. Anyone can sign up choosing the instructor
 * role, so the role alone proves nothing: an instructor whose application is still
 * PENDING, or was REJECTED, is treated as a member without staff rights. (Approval sets
 * ACTIVE; `isInstructorApproved` is not set on every approval path, so it is not used.)
 */
export const hasStaffPowers = (user: { role: string; membershipStatus?: string | null } | undefined | null): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role !== 'INSTRUCTOR') return false;
    return !!user.membershipStatus && user.membershipStatus !== 'PENDING' && user.membershipStatus !== 'REJECTED';
};

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // An expired or malformed token is "not logged in" (401), which lets the client use its
    // refresh token; uncaught, jsonwebtoken's errors became a 500 and logged members out.
    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        return next(new AppError('Your session has expired. Please log in again.', 401));
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
    });

    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // ── Auto-expire membership if annual period has passed ──
    if (
        currentUser.role !== 'ADMIN' &&
        currentUser.membershipStatus === 'ACTIVE' &&
        currentUser.membershipEndDate &&
        new Date(currentUser.membershipEndDate) < new Date()
    ) {
        await prisma.user.update({
            where: { id: currentUser.id },
            data: { membershipStatus: 'EXPIRED' },
        });
        currentUser.membershipStatus = 'EXPIRED';
    }

    req.user = currentUser;
    next();
});

/**
 * Like protect, but never rejects: attaches req.user when a valid token is
 * present and carries on anonymously otherwise. For public reads that show
 * admins a little more (e.g. draft brackets).
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return next();
    try {
        const decoded: any = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (user) req.user = user;
    } catch {
        // An expired or bad token on a public route just means "anonymous".
    }
    next();
};

// Middleware to require active membership (blocks expired users)
export const requireActiveMembership = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Admins bypass membership check
    if (user.role === 'ADMIN') return next();

    if (user.membershipStatus === 'EXPIRED') {
        return next(new AppError(
            'Your annual membership has expired. Please renew your membership (₹250 + GST) to continue.',
            403
        ));
    }

    next();
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        // The instructor role is self-chosen at sign-up: staff routes wait for approval.
        if (req.user.role === 'INSTRUCTOR' && !hasStaffPowers(req.user)) {
            return next(new AppError('Your instructor account is awaiting approval.', 403));
        }
        next();
    };
};

// Like `protect`, but never blocks: attaches req.user if a valid token is present, else continues.
export const attachUserIfPresent = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) req.user = user;
  } catch {
    // ignore — anonymous request, leave req.user undefined
  }
  return next();
};
