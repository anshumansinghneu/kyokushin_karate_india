import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { sendAnnouncement } from '../controllers/announceController';

const router = Router();

// Admin only
router.post('/send', protect, restrictTo('ADMIN'), sendAnnouncement);

export default router;
