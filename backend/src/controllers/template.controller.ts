import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, subject, body, html } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!name || !subject || !body) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const template = await prisma.template.create({
            data: {
                userId,
                name,
                subject,
                body,
                html,
            },
        });

        res.status(201).json(template);
    } catch (error) {
        logger.error('Failed to create template', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const templates = await prisma.template.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(templates);
    } catch (error) {
        logger.error('Failed to get templates', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, subject, body, html } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const template = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        const updatedTemplate = await prisma.template.update({
            where: { id },
            data: { name, subject, body, html },
        });

        res.json(updatedTemplate);
    } catch (error) {
        logger.error('Failed to update template', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const template = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        await prisma.template.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        logger.error('Failed to delete template', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
