import { Router } from 'express';
import { getDailyStats } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/daily', getDailyStats);

export const analyticsRoutes = router;
