import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

interface AuthSocket extends Socket {
    user?: {
        id: string;
        email: string;
    };
}

export class SocketService {
    private io: Server;

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*', // TODO: restrict to frontend URL in production
                methods: ['GET', 'POST'],
            },
        });

        this.initializeMiddleware();
        this.initializeEvents();
    }

    private initializeMiddleware() {
        this.io.use((socket: AuthSocket, next) => {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            try {
                const decoded = jwt.verify(token, env.jwt.secret) as { id: string; email: string };
                socket.user = decoded;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });
    }

    private initializeEvents() {
        this.io.on('connection', (socket: AuthSocket) => {
            if (socket.user) {
                logger.info(`User connected: ${socket.user.email}`);
                socket.join(socket.user.id); // Join a room named after the user ID
            }

            socket.on('disconnect', () => {
                logger.info('User disconnected');
            });
        });
    }

    public emitToUser(userId: string, event: string, data: any) {
        this.io.to(userId).emit(event, data);
    }
}
