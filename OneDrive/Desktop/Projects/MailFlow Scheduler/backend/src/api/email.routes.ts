import express, { Router, Request, Response } from 'express';
import { emailQueue, addEmailJob, getQueueStats } from '../queues/email.queue';
import { rateLimiterService } from '../services/rateLimiter.service';
import { logger } from '../utils/logger';

const router = Router();

interface ScheduleEmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  scheduledAt: string;
  userId: string;
}

// Schedule an email
router.post('/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, subject, body, html, scheduledAt, userId } = req.body as ScheduleEmailRequest;

    // Validate input
    if (!to || !subject || !body || !scheduledAt || !userId) {
      res.status(400).json({
        error: 'Missing required fields: to, subject, body, scheduledAt, userId',
      });
      return;
    }

    // Check rate limit
    const rateLimitResult = await rateLimiterService.checkLimit(userId);
    if (!rateLimitResult.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      });
      return;
    }

    // TODO: Implement database persistence of email job
    const jobId = `${userId}-${Date.now()}`;
    await addEmailJob({
      id: jobId,
      to,
      subject,
      body,
      html,
      scheduledAt: new Date(scheduledAt),
      userId,
    });

    res.status(201).json({
      success: true,
      jobId,
      message: 'Email scheduled successfully',
    });
  } catch (error) {
    logger.error('Failed to schedule email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to schedule email',
    });
  }
});

// Get queue stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get queue stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to get queue stats',
    });
  }
});

// Get job status
router.get('/job/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = await emailQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({
        error: 'Job not found',
      });
      return;
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      id: job.id,
      state,
      progress,
      data: job.data,
    });
  } catch (error) {
    logger.error('Failed to get job status', {
      jobId: req.params.jobId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to get job status',
    });
  }
});

export const emailRoutes = router;
