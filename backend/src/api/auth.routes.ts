import express, { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

// Health check for auth service
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      status: 'healthy',
      service: 'auth',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      status: 'unhealthy',
    });
  }
});

export const authRoutes = router;
