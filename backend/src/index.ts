console.log('App starting: Loading modules...');
import { app } from './app';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { emailWorker } from './workers/email.worker';
import { rateLimiterService } from './services/rateLimiter.service';
import { emailService } from './services/email.service';
import { SocketService } from './services/socket.service';
import { QueueListenerService } from './services/queue-listener.service';
import { createServer } from 'http';
import { templateRoutes } from './api/template.routes';
import { analyticsRoutes } from './api/analytics.routes';

// Create HTTP server from Express app
const httpServer = createServer(app);
let server: ReturnType<typeof httpServer.listen>;

// Register routes
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);

async function start(): Promise<void> {
  try {
    // Initialize services
    logger.info('Initializing services...');

    await rateLimiterService.connect();
    await emailService.verifyConnection();
    await emailWorker.start();

    // Initialize Socket.IO
    const socketService = new SocketService(httpServer);
    new QueueListenerService(socketService);

    // Start HTTP server
    server = httpServer.listen(env.server.port, () => {
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
