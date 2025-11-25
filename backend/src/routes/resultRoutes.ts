import express from 'express';
import { calculateResults, getResults } from '../controllers/resultController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public
router.get('/:eventId', getResults);

// Protected
router.use(protect);

router.post('/:bracketId/calculate', restrictTo('ADMIN'), calculateResults);

export default router;
