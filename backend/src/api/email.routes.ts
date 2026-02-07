import { Router } from 'express';
import { scheduleEmail, getEmails, getQueueStats, getJobStatus, batchScheduleEmail, toggleStar, getEmailById } from '../controllers/email.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all email routes
router.use(authenticate);

// Routes
router.post('/schedule', scheduleEmail);
router.post('/batch-schedule', batchScheduleEmail);
router.get('/', getEmails);
router.get('/stats', getQueueStats);
router.get('/job/:jobId', getJobStatus);
router.get('/:id', getEmailById);  // Get single email by ID
router.put('/:id/star', toggleStar);

export const emailRoutes = router;
