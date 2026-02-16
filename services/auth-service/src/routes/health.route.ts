import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import redis from '../config/redis.js';

const router:Router = Router();

// Liveness Probe (Is the service running?)
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Readiness Probe (Can it accept traffic?)
router.get('/health/ready', async (req: Request, res: Response) => {
  const details: Record<string, string> = {
    database: 'down',
    redis: 'down',
    timestamp: new Date().toISOString()
  };

  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    details.database = 'up';

    // Check Redis
    const ping = await redis.ping();
    if (ping === 'PONG') {
      details.redis = 'up';
    }

    if (details.database === 'up' && details.redis === 'up') {
      res.status(200).json({ status: 'READY', details });
    } else {
      res.status(503).json({ status: 'NOT_READY', details });
    }
  } catch (error) {
    res.status(503).json({ status: 'NOT_READY', details, error: 'Dependency failure' });
  }
});

export default router;