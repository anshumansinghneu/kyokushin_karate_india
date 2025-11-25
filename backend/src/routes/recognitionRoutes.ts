import express from 'express';
import { getCurrentMonthRecognitions, assignRecognition, removeRecognition } from '../controllers/recognitionController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public route to get current champions
router.get('/', getCurrentMonthRecognitions);

// Admin only routes
router.post('/', protect, restrictTo('ADMIN'), assignRecognition);
router.delete('/:id', protect, restrictTo('ADMIN'), removeRecognition);

export default router;
