import { Queue, Worker } from 'bullmq';
import { createClient } from 'redis';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

export interface EmailJob {
  id: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  scheduledAt: Date;
  userId: string;
}

let redis: { host: string; port: number; password?: string };

try {
  const redisUrl = new URL(env.redis.url);
  // Extract password from URL (format: redis://username:password@host:port)
  const password = redisUrl.password || env.redis.password;
  redis = {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port),
    password: password,
  };
  logger.info('Redis config for email queue', {
    url: env.redis.url.replace(/:([^:@]+)@/, ':****@'), // Mask password in logs
    host: redis.host,
    port: redis.port,
    hasPassword: !!redis.password
  });
} catch (error) {
  // Fallback to individual env variables if URL parsing fails
  logger.error('Failed to parse REDIS_URL, using fallback', { error });
  redis = {
    host: env.redis.host || 'localhost',
    port: env.redis.port || 6379,
    password: env.redis.password,
  };
}

export const emailQueue = new Queue<EmailJob>(env.bullMq.queueName, {
  connection: redis,
});

export async function addEmailJob(job: EmailJob): Promise<void> {
  try {
    await emailQueue.add(`email-${job.id}`, job, {
      jobId: job.id,
      delay: new Date(job.scheduledAt).getTime() - Date.now(),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    logger.info('Email job added to queue', {
      jobId: job.id,
      scheduledAt: job.scheduledAt,
      to: job.to,
    });
  } catch (error) {
    logger.error('Failed to add email job to queue', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  try {
    const counts = await emailQueue.getJobCounts(
      'wait',
      'active',
      'completed',
      'failed',
      'delayed'
    );

    return {
      waiting: counts.wait || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  } catch (error) {
    logger.error('Failed to get queue stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
}

export async function closeQueue(): Promise<void> {
  try {
    await emailQueue.close();
    logger.info('Email queue closed');
  } catch (error) {
    logger.error('Failed to close email queue', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

