import { QueueEvents } from 'bullmq';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { SocketService } from './socket.service';

export class QueueListenerService {
    private queueEvents: QueueEvents;
    private socketService: SocketService;

    constructor(socketService: SocketService) {
        this.socketService = socketService;
        this.queueEvents = new QueueEvents('email-queue', {
            connection: {
                host: env.redis.host,
                port: env.redis.port,
                password: env.redis.password,
            },
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
