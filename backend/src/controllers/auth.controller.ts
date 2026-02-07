import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: '24h',
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        logger.error('Registration error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: '24h',
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        logger.error('Login error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        // User is attached by auth middleware
        const user = req.user as any;

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Fetch fresh user data including avatar
        const freshUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, name: true, avatar: true, googleId: true }
        });

        res.json({
            user: freshUser
        });
    } catch (error) {
        logger.error('Get profile error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, avatar } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                avatar
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                googleId: true
            }
        });

        res.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        logger.error('Failed to update profile', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as any;
        if (!user) {
            res.redirect('http://localhost:3001/login?error=auth_failed');
            return;
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: '24h',
        });

        // Redirect to frontend with token
        res.redirect(`http://localhost:3001/login/success?token=${token}`);

    } catch (error) {
        logger.error('Google callback error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.redirect('http://localhost:3001/login?error=server_error');
    }
};
