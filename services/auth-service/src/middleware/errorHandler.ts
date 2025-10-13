import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    // If it's an AppError (operational/trusted), use its values
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // For programming or unknown errors don't leak details in production
    const statusCode = 500;
    const response: any = {
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err?.message || 'Internal Server Error',
    };

    // include stack in non-production for debugging
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err?.stack;
    }

    // log the error for diagnostics
    // eslint-disable-next-line no-console
    console.error(err);

    res.status(statusCode).json(response);
}
