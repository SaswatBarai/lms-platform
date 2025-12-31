import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import redis from '../config/redis.js';

const router:Router = Router();

// Liveness Probe
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness Probe (checks dependencies)
router.get('/health/ready', async (req: Request, res: Response) => {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  let isHealthy = true;

  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = { status: 'up' };
  } catch (error) {
    checks.services.database = { status: 'down', error: 'Connection failed' };
    isHealthy = false;
  }

  // Check Redis
  try {
    const ping = await redis.ping();
    if (ping === 'PONG') {
        checks.services.redis = { status: 'up' };
    } else {
        throw new Error('Redis ping failed');
    }
  } catch (error) {
    checks.services.redis = { status: 'down', error: 'Connection failed' };
    isHealthy = false;
  }

  // Kafka check can be added here similar to others

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(checks);
});

export default router;