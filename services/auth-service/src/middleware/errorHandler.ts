import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {


    // 1. Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid input data',
            issues: err.flatten().fieldErrors, // .flatten() provides a cleaner error structure
        });
    }
    // 2. Handle your custom AppError (operational/trusted errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // 3. Handle programming or unknown errors (don't leak details in production)
    const isProduction = process.env.NODE_ENV === 'production';
    const response = {
        status: 'error',
        message: isProduction ? 'Internal Server Error' : err.message,
        ...(!isProduction && { stack: err.stack }), // Conditionally add stack trace
    };

    // log the error for diagnostics
    // eslint-disable-next-line no-console
    console.error(err);

     res.status(500).json(response);
}
