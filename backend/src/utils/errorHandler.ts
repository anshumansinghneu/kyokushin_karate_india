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
