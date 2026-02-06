import { createClient } from 'redis';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export class RateLimiterService {
  private client: ReturnType<typeof createClient>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor() {
    this.windowMs = env.rateLimiter.windowMs;
    this.maxRequests = env.rateLimiter.maxRequests;
    this.client = createClient({
      url: env.redis.url,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Rate limiter connected to Redis');
    } catch (error) {
      logger.error('Failed to connect rate limiter to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Rate limiter disconnected from Redis');
    } catch (error) {
      logger.error('Failed to disconnect rate limiter', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkLimit(userId: string): Promise<RateLimitResult> {
    try {
      const key = `rate-limit:${userId}`;
      const current = await this.client.incr(key);

      if (current === 1) {
        // Set expiration on first request in window
        await this.client.expire(key, Math.ceil(this.windowMs / 1000));
      }

      const remaining = Math.max(0, this.maxRequests - current);
      const allowed = current <= this.maxRequests;

      if (!allowed) {
        logger.warn('Rate limit exceeded', {
          userId,
          current,
          maxRequests: this.maxRequests,
        });
      }

      return {
        allowed,
        remaining,
        resetTime: await this.getTTL(key),
      };
    } catch (error) {
      logger.error('Rate limit check failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // TODO: Implement fallback behavior (allow or deny on error)
      return {
        allowed: true,
        remaining: 0,
        resetTime: 0,
      };
    }
  }

  private async getTTL(key: string): Promise<number> {
    const ttl = await this.client.ttl(key);
    return ttl === -1 ? this.windowMs : ttl * 1000;
  }
}

export const rateLimiterService = new RateLimiterService();
