import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationMicroseconds } from '../config/metrics.js';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds.observe(
      { 
        method: req.method, 
        route: req.route ? req.route.path : req.path, 
        status_code: res.statusCode 
      }, 
      duration / 1000
    );
  });
  
  next();
};