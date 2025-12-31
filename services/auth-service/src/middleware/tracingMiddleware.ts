import { Request, Response, NextFunction } from 'express';
import { trace, context } from '@opentelemetry/api';
import { randomBytes } from 'crypto';
import { logger } from '../config/logger.js';

// Generate a random traceId (32 hex chars = 16 bytes)
const generateTraceId = (): string => {
  return randomBytes(16).toString('hex');
};

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let traceId: string;
  let spanId: string | undefined;
  
  // Try to get traceId from OpenTelemetry span
  const span = trace.getSpan(context.active());
  
  if (span) {
    const spanContext = span.spanContext();
    traceId = spanContext.traceId;
    spanId = spanContext.spanId;
  } else {
    // Fallback: check for incoming trace header or generate new traceId
    traceId = (req.headers['x-trace-id'] as string) || 
              (req.headers['x-request-id'] as string) || 
              generateTraceId();
  }
  
    // Add trace context to response headers for debugging
    res.setHeader('X-Trace-ID', traceId);
  if (spanId) {
    res.setHeader('X-Span-ID', spanId);
  }
    
    // Attach to request object for logging
    (req as any).traceId = traceId;
    
    // Log request with traceId
    logger.info('Incoming request', {
      traceId,
    spanId,
      method: req.method,
      path: req.path,
      ip: req.ip
    });
  
  next();
};