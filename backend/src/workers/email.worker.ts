import { Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { emailService } from '../services/email.service';
import { prisma } from '../db/prisma';
import type { EmailJob } from '../queues/email.queue';

const redis = {
  host: new URL(env.redis.url).hostname || 'localhost',
  port: parseInt(new URL(env.redis.url).port || '6379'),
};

export class EmailWorker {
  private worker: Worker<EmailJob>;

  constructor() {
    this.worker = new Worker<EmailJob>(env.bullMq.queueName, this.process.bind(this), {
      connection: redis,
      concurrency: env.bullMq.concurrency,
    });

    this.setupEventHandlers();
  }

  private async process(job: Job<EmailJob>): Promise<void> {
    logger.info('Processing email job', {
      jobId: job.id,
      to: job.data.to,
    });

    try {
      // Implement email sending logic
      await emailService.sendEmail({
        to: job.data.to,
        subject: job.data.subject,
        body: job.data.body,
        html: job.data.html,
      });

      // Update job status in database
      await prisma.email.update({
        where: { id: job.data.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      logger.info('Email job completed successfully', {
        jobId: job.id,
      });
    } catch (error) {
      await prisma.email.update({
        where: { id: job.data.id },
        data: { status: 'failed' },
      });

      logger.error('Email job processing failed', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job: Job<EmailJob>) => {
      logger.info('Email job completed', {
        jobId: job.id,
        processedOn: job.processedOn,
      });
    });

    this.worker.on('failed', (job: Job<EmailJob> | undefined, error: Error) => {
      logger.error('Email job failed', {
        jobId: job?.id,
        error: error.message,
      });
    });

    this.worker.on('error', (error: Error) => {
      logger.error('Worker error', {
        error: error.message,
      });
    });
  }

  async start(): Promise<void> {
    logger.info('Email worker started', {
      concurrency: env.bullMq.concurrency,
      queueName: env.bullMq.queueName,
    });
  }

  async close(): Promise<void> {
    try {
      await this.worker.close();
      logger.info('Email worker closed');
    } catch (error) {
      logger.error('Failed to close email worker', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const emailWorker = new EmailWorker();
