import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    submitFeedback,
    getApprovedFeedback,
    getMyFeedback,
    editFeedback,
    getPendingFeedback,
    getAllFeedback,
    approveFeedback,
    rejectFeedback,
} from '../controllers/eventFeedbackController';

const router = Router();

// Admin routes (must be before :eventId params to avoid conflicts)
router.get('/pending', protect, restrictTo('ADMIN'), getPendingFeedback);
router.get('/all', protect, restrictTo('ADMIN'), getAllFeedback);
router.patch('/:id/approve', protect, restrictTo('ADMIN'), approveFeedback);
router.patch('/:id/reject', protect, restrictTo('ADMIN'), rejectFeedback);

// Event-specific routes
router.get('/:eventId', getApprovedFeedback);
router.get('/:eventId/mine', protect, getMyFeedback);
router.post('/:eventId', protect, submitFeedback);
router.put('/:eventId', protect, editFeedback);

export default router;
