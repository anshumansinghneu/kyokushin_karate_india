import express from 'express';
import { getMatch, startMatch, endMatch, updateScore } from '../controllers/matchController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/:id', getMatch);
router.patch('/:matchId', restrictTo('ADMIN'), updateScore);
router.post('/:matchId/start', restrictTo('ADMIN'), startMatch);
router.post('/:matchId/end', restrictTo('ADMIN'), endMatch);

export default router;
