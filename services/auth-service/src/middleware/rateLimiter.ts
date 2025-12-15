import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { AppError } from '@utils/AppError.js';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, 
    legacyHeaders: false, 
    store: new RedisStore({
        sendCommand: (command: string, ...args: (string | number)[]) => {
            return (redisClient.call as any)(command, ...args) as Promise<string | number | (string | number)[]>;
        },
    }),
    handler: (req, res, next, options) => {
        next(new AppError("Too many requests, please try again later.", 429, "Rate Limit Exceeded"));
    }
});

// Alias for backward compatibility
export const rateLimitMiddleware = globalLimiter;

export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 5, // 5 attempts per minute
    store: new RedisStore({
        sendCommand: (command: string, ...args: (string | number)[]) => {
            return (redisClient.call as any)(command, ...args) as Promise<string | number | (string | number)[]>;
        },
    }),
    handler: (req, res, next, options) => {
        next(new AppError("Too many login attempts, please try again later.", 429, "Rate Limit Exceeded"));
    }
});

// Alias for backward compatibility
export const authRateLimiter = authLimiter;