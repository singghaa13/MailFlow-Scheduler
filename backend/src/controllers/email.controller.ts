import { Request, Response } from 'express';
import { emailQueue, addEmailJob, getQueueStats as getQueueStatsFromQueue } from '../queues/email.queue';
import { rateLimiterService } from '../services/rateLimiter.service';
import { logger } from '../utils/logger';
import { prisma } from '../db/prisma';

interface ScheduleEmailRequest {
    to: string;
    subject: string;
    body: string;
    html?: string;
    scheduledAt: string;
    userId: string;
}

export const scheduleEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, subject, body, html, scheduledAt } = req.body as ScheduleEmailRequest;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Validate input
        if (!to || !subject || !body || !scheduledAt) {
            res.status(400).json({
                error: 'Missing required fields: to, subject, body, scheduledAt',
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

        const scheduledDate = new Date(scheduledAt);
        const jobId = `${userId}-${Date.now()}`;

        // Persist to database
        const email = await prisma.email.create({
            data: {
                id: jobId, // Using the same ID for simplicity, or let Prisma generate one and use it for job
                userId,
                to,
                subject,
                body,
                html,
                scheduledAt: scheduledDate,
                status: 'pending',
                jobId: jobId
            }
        });

        await addEmailJob({
            id: jobId,
            to,
            subject,
            body,
            html,
            scheduledAt: scheduledDate,
            userId,
        });

        res.status(201).json({
            success: true,
            jobId,
            emailId: email.id,
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
};

export const getEmails = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [emails, total] = await Promise.all([
            prisma.email.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.email.count({ where: { userId } }),
        ]);

        res.json({
            emails,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Failed to get emails', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getQueueStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await getQueueStatsFromQueue();
        res.json(stats);
    } catch (error) {
        logger.error('Failed to get queue stats', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            error: 'Failed to get queue stats',
        });
    }
};

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
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
        const progress = job.progress;

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
};
