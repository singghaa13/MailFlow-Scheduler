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
        const status = req.query.status as string;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = { userId };

        if (status && status !== 'all') {
            if (status === 'starred') {
                where.isStarred = true;
            } else {
                where.status = status;
            }
        }

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { to: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [emails, total] = await Promise.all([
            prisma.email.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.email.count({ where }),
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

export const batchScheduleEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { recipients, subject, body, html, scheduledAt } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !body || !scheduledAt) {
            res.status(400).json({
                error: 'Missing required fields or invalid recipients list',
            });
            return;
        }

        const scheduledDate = new Date(scheduledAt);
        const jobs = [];

        const delaySeconds = req.body.delaySeconds || 0;
        const hourlyLimit = req.body.hourlyLimit || 0;

        // Calculate effective delay (minimum spacing between emails to respect hourly limit)
        // If hourlyLimit is 100, then min spacing is 3600 / 100 = 36 seconds.
        // We take the MAX of user-defined delay and valid hourly-limit delay.
        let effectiveDelayMs = delaySeconds * 1000;

        if (hourlyLimit > 0) {
            const minSpacingMs = (3600 / hourlyLimit) * 1000;
            if (minSpacingMs > effectiveDelayMs) {
                effectiveDelayMs = minSpacingMs;
            }
        }

        for (let i = 0; i < recipients.length; i++) {
            const to = recipients[i];
            const jobId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Calculate individual schedule time
            const jobScheduledDate = new Date(scheduledDate.getTime() + (i * effectiveDelayMs));

            // Create database entry
            await prisma.email.create({
                data: {
                    id: jobId,
                    userId,
                    to,
                    subject,
                    body,
                    html,
                    scheduledAt: jobScheduledDate,
                    status: 'pending',
                    jobId: jobId
                }
            });

            // Add to queue
            jobs.push(addEmailJob({
                id: jobId,
                to,
                subject,
                body,
                html,
                scheduledAt: jobScheduledDate,
                userId,
            }));
        }

        await Promise.all(jobs);

        res.status(201).json({
            success: true,
            message: `Scheduled ${jobs.length} emails successfully`,
        });
    } catch (error) {
        logger.error('Failed to batch schedule emails', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            error: 'Failed to batch schedule emails',
        });
    }
};

export const toggleStar = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const email = await prisma.email.findUnique({
            where: { id, userId },
        });

        if (!email) {
            res.status(404).json({ error: 'Email not found' });
            return;
        }

        const updatedEmail = await prisma.email.update({
            where: { id },
            data: { isStarred: !(email.isStarred || false) },
        });

        res.json({ success: true, isStarred: updatedEmail.isStarred });
    } catch (error) {
        logger.error('Failed to toggle star', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Failed to toggle star' });
    }
};

// Get single email by ID
export const getEmailById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const email = await prisma.email.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!email) {
            res.status(404).json({ error: 'Email not found' });
            return;
        }

        res.json(email);
    } catch (error) {
        logger.error('Error fetching email:', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({ error: 'Failed to fetch email' });
    }
};

