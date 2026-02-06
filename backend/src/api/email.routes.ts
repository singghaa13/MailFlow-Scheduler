import express, { Router } from 'express';
import * as emailController from '../controllers/email.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all email routes
router.use(authenticate);

// Routes
router.post('/schedule', emailController.scheduleEmail);
router.get('/', emailController.getEmails);
router.get('/stats', emailController.getQueueStats);
router.get('/job/:jobId', emailController.getJobStatus);

export const emailRoutes = router;
