import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationMicroseconds, httpRequestsTotal } from '../config/metrics.js';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    const labels = { 
      method: req.method, 
      route: route, 
      status_code: res.statusCode.toString()
    };
    
    // Increment request counter
    httpRequestsTotal.inc(labels);
    
    // Record duration
    httpRequestDurationMicroseconds.observe(labels, duration / 1000);
  });
  
  next();
};