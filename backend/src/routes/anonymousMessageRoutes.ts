import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    sendMessage,
    getMessages,
    getStats,
    markAsRead,
    archiveMessage,
} from '../controllers/anonymousMessageController';

const router = Router();

// Authenticated: send message
router.post('/', protect, sendMessage);

// Admin only: inbox
router.get('/stats', protect, restrictTo('ADMIN'), getStats);
router.get('/', protect, restrictTo('ADMIN'), getMessages);
router.patch('/:id/read', protect, restrictTo('ADMIN'), markAsRead);
router.patch('/:id/archive', protect, restrictTo('ADMIN'), archiveMessage);

export default router;
