import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-request-id'] as string) || uuidv4();
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();

    // 1. Handle Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            type: "https://lms.example.com/errors/validation-failed",
            title: "Validation Failed",
            status: 400,
            detail: "The input data validation failed",
            instance: req.originalUrl,
            traceId,
            timestamp,
            errors: err.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }

    // 2. Handle custom AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            type: err.type,
            title: err.title,
            status: err.statusCode,
            detail: err.detail,
            instance: req.originalUrl,
            traceId,
            timestamp
        });
    }

    // 3. Handle unknown errors
    console.error('UNHANDLED ERROR:', err);
    return res.status(500).json({
        type: "https://lms.example.com/errors/internal-server-error",
        title: "Internal Server Error",
        status: 500,
        detail: isProduction ? "An unexpected error occurred" : err.message,
        instance: req.originalUrl,
        traceId,
        timestamp,
        ...( !isProduction && { stack: err.stack })
    });
}