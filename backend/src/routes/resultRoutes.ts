import express from 'express';
import { calculateResults, getResults, getFightRecord } from '../controllers/resultController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public
router.get('/fight-record/:userId', getFightRecord);
router.get('/:eventId', getResults);

// Protected
router.use(protect);

router.post('/:bracketId/calculate', restrictTo('ADMIN'), calculateResults);

export default router;
