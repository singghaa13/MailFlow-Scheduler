import { app } from './app';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { emailWorker } from './workers/email.worker';
import { rateLimiterService } from './services/rateLimiter.service';
import { emailService } from './services/email.service';

let server: ReturnType<typeof app.listen>;

async function start(): Promise<void> {
  try {
    // Initialize services
    logger.info('Initializing services...');

    await rateLimiterService.connect();
    await emailService.verifyConnection();
    await emailWorker.start();

    // Start Express server
    server = app.listen(env.server.port, () => {
      logger.info('Server started successfully', {
        port: env.server.port,
        nodeEnv: env.server.nodeEnv,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    if (server) {
      server.close(() => {
        logger.info('Server closed');
      });
    }

    await emailWorker.close();
    await rateLimiterService.disconnect();

    logger.info('Shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
