import net from 'net';
import { logger } from './logger';

export const runNetworkDiagnostics = async () => {
    const hosts = [
        { host: 'smtp.gmail.com', port: 587 },
        { host: 'smtp.gmail.com', port: 465 },
        { host: 'google.com', port: 80 },
    ];

    logger.info('Starting network diagnostics...');

    for (const { host, port } of hosts) {
        await new Promise<void>((resolve) => {
            const start = Date.now();
            const socket = net.createConnection(port, host, () => {
                logger.info(`Diagnostic: Successfully connected to ${host}:${port} in ${Date.now() - start}ms`);
                socket.end();
                resolve();
            });

            socket.on('error', (err) => {
                logger.error(`Diagnostic: Failed to connect to ${host}:${port}: ${err.message}`);
                resolve();
            });

            socket.setTimeout(5000, () => {
                logger.error(`Diagnostic: Timeout connecting to ${host}:${port} after 5000ms`);
                socket.destroy();
                resolve();
            });
        });
    }
    logger.info('Network diagnostics completed.');
};
