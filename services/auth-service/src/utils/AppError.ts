export class AppError extends Error {
    statusCode: number;
    status: 'fail' | 'error';
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        // 4xx -> 'fail' (client error), 5xx -> 'error' (server error)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // mark operational (trusted) error
        this.isOperational = true;

        // capture stack trace (V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

}
