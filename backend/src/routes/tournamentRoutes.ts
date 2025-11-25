import express from 'express';
import { generateBrackets, getBrackets } from '../controllers/tournamentController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/:eventId/generate', restrictTo('ADMIN'), generateBrackets);
router.get('/:eventId', getBrackets);

export default router;
