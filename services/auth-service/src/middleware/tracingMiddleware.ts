import { Request, Response, NextFunction } from 'express';
import { trace, context } from '@opentelemetry/api';
import { logger } from '../config/logger.js';

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const span = trace.getSpan(context.active());
  
  if (span) {
    const { traceId, spanId } = span.spanContext();
    // Add trace context to response headers for debugging
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Span-ID', spanId);
    
    // Attach to request object for logging
    (req as any).traceId = traceId;
    
    // Log request with traceId
    logger.info('Incoming request', {
      traceId,
      method: req.method,
      path: req.path,
      ip: req.ip
    });
  }
  
  next();
};