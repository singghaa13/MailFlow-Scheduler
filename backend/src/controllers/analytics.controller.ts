import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export const getDailyStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get stats for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const emails = await prisma.email.findMany({
            where: {
                userId,
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            select: {
                status: true,
                createdAt: true,
            },
        });

        // Group by day and status
        const statsMap = new Map<string, { sent: number; failed: number; pending: number }>();

        // Initialize last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            statsMap.set(dateStr, { sent: 0, failed: 0, pending: 0 });
        }

        emails.forEach((email) => {
            const dateStr = email.createdAt.toISOString().split('T')[0];
            if (statsMap.has(dateStr)) {
                const dayStats = statsMap.get(dateStr)!;
                if (email.status === 'sent') dayStats.sent++;
                else if (email.status === 'failed') dayStats.failed++;
                else dayStats.pending++;
            }
        });

        const dailyStats = Array.from(statsMap.entries())
            .map(([date, counts]) => ({
                date,
                ...counts,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json(dailyStats);
    } catch (error) {
        logger.error('Failed to get daily stats', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
