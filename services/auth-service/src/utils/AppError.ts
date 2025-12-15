export class AppError extends Error {
    statusCode: number;
    status: 'fail' | 'error';
    isOperational: boolean;
    // New fields for RFC 7807
    type?: string;
    title?: string;
    detail?: string;
    instance?: string;

    constructor(message: string, statusCode: number, title?: string, type?: string) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        
        // RFC 7807 fields
        this.detail = message;
        this.title = title || (statusCode === 400 ? 'Bad Request' : 'Error');
        this.type = type || 'about:blank';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}