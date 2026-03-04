import { Router } from 'express';
import { recordVisit, getAnalyticsStats } from '../controllers/analyticsController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Public: record a visit (called from frontend on every page load)
router.post('/visit', recordVisit);

// Admin only: get analytics dashboard
router.get('/stats', protect, restrictTo('ADMIN'), getAnalyticsStats);

export default router;
