import express from 'express';
import {
  getExamResults,
  getExamResult,
  createExamResult,
  updateExamResult,
  deleteExamResult,
  parseExamResult,
} from '../controllers/examResultController';
import { protect, restrictTo, attachUserIfPresent } from '../middleware/authMiddleware';

const router = express.Router();

// Public reads with optional auth (admins see unpublished too).
router.get('/', attachUserIfPresent, getExamResults);
router.get('/:id', attachUserIfPresent, getExamResult);

// Admin writes.
router.use(protect);
router.post('/parse', restrictTo('ADMIN'), parseExamResult);
router.post('/', restrictTo('ADMIN'), createExamResult);
router.patch('/:id', restrictTo('ADMIN'), updateExamResult);
router.delete('/:id', restrictTo('ADMIN'), deleteExamResult);

export default router;
