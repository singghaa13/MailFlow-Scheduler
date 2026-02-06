import dotenv from 'dotenv';

dotenv.config();

export const env = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mailflow',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },
  rateLimiter: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  bullMq: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    queueName: process.env.QUEUE_NAME || 'email_jobs',
  },
};
