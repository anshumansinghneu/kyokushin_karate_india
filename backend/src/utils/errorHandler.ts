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

    // Handle Prisma errors
    if (err.code === 'P2002') {
        err.statusCode = 409;
        err.status = 'fail';
        err.message = 'A record with this value already exists.';
        err.isOperational = true;
    } else if (err.code === 'P2025') {
        err.statusCode = 404;
        err.status = 'fail';
        err.message = 'Record not found.';
        err.isOperational = true;
    } else if (err.code === 'P2003') {
        err.statusCode = 409;
        err.status = 'fail';
        err.message = 'Cannot delete: this record is referenced by other data.';
        err.isOperational = true;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        err.statusCode = 401;
        err.status = 'fail';
        err.message = 'Invalid token. Please log in again.';
        err.isOperational = true;
    } else if (err.name === 'TokenExpiredError') {
        err.statusCode = 401;
        err.status = 'fail';
        err.message = 'Your session has expired. Please log in again.';
        err.isOperational = true;
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
