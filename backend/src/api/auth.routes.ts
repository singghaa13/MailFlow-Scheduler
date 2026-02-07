import express, { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { register, login, me, googleCallback, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import passport from 'passport';

const router = Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

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
