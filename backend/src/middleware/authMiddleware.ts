import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

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

    // @ts-ignore
    req.user = currentUser;
    next();
});

// Middleware to require active membership (blocks expired users)
export const requireActiveMembership = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
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
        // @ts-ignore
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
