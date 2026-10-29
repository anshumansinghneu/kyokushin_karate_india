import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Upload limits (multer): the visitor's file was refused, not a server fault.
    if (err?.name === 'MulterError') {
        const messages: Record<string, string> = {
            LIMIT_FILE_SIZE: 'That file is too large.',
            LIMIT_FILE_COUNT: 'Too many files in one upload (20 at most).',
            LIMIT_UNEXPECTED_FILE: 'Unexpected file field, or too many files in one upload.',
        };
        err = new AppError(messages[err.code] ?? 'The upload was not accepted.', 400);
    }

    // A bad or expired JWT anywhere is "not logged in", never a server error.
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError' || err?.name === 'NotBeforeError') {
        err = new AppError('Your session has expired. Please log in again.', 401);
    }

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle Prisma unique constraint violations (P2002)
    if (err.code === 'P2002') {
        const target = err.meta?.target;
        let field = 'field';
        if (Array.isArray(target)) field = target[0];
        else if (typeof target === 'string') field = target;

        const friendlyMessages: Record<string, string> = {
            email: 'User with this email already exists',
            phone: 'User with this phone number already exists',
        };
        const message = friendlyMessages[field] || `A record with this ${field} already exists`;

        return res.status(409).json({
            status: 'fail',
            message,
        });
    }

    // Handle Prisma validation errors
    if (err.code === 'P2025') {
        return res.status(404).json({
            status: 'fail',
            message: err.meta?.cause || 'Record not found',
        });
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production: Don't leak stack traces
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            });
        }
    }
};
