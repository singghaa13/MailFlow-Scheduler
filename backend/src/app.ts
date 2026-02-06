import express from 'express';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { emailRoutes } from './api/email.routes';
import { authRoutes } from './api/auth.routes';
import { rateLimiterService } from './services/rateLimiter.service';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mailflow-scheduler-backend',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : 'Unknown error',
    path: req.path,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
  });
});

export { app };
