import { QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { SocketService } from './socket.service';

export class QueueListenerService {
    private queueEvents: QueueEvents;
    private socketService: SocketService;

    constructor(socketService: SocketService) {
        this.socketService = socketService;
        const connection = new IORedis(env.redis.url, {
            maxRetriesPerRequest: null,
        });

        connection.on('error', (err) => {
            logger.error('Redis connection error in QueueListenerService:', { error: err.message });
        });

        connection.on('connect', () => {
            logger.info('QueueListenerService connected to Redis');
        });

        this.queueEvents = new QueueEvents('email-queue', {
            connection,
        });

        this.initializeListeners();
    }

    private initializeListeners() {
        this.queueEvents.on('completed', ({ jobId }) => {
            logger.info(`Job completed: ${jobId}`);
            this.notifyUser(jobId, 'job-completed', { jobId, status: 'completed' });
        });

        this.queueEvents.on('failed', ({ jobId, failedReason }) => {
            logger.error(`Job failed: ${jobId}, reason: ${failedReason}`);
            this.notifyUser(jobId, 'job-failed', { jobId, status: 'failed', reason: failedReason });
        });
    }

    private notifyUser(jobId: string, event: string, data: any) {
        // Extract userId from jobId (format: userId-timestamp)
        const userId = jobId.split('-')[0];
        if (userId) {
            this.socketService.emitToUser(userId, event, data);
        }
    }
}
