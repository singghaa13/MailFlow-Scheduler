import dotenv from 'dotenv';

dotenv.config();

export const env = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mailflow',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
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
  client: {
    url: (process.env.CLIENT_URL || 'http://localhost:3001').replace(/\/$/, ''),
  },
};
