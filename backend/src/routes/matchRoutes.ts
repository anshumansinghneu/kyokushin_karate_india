import express from 'express';
import { getMatch, getLiveMatches, startMatch, endMatch, updateScore } from '../controllers/matchController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public route - live matches for spectators
router.get('/live', getLiveMatches);

router.use(protect);

router.get('/:id', getMatch);
router.patch('/:matchId', restrictTo('ADMIN'), updateScore);
router.post('/:matchId/start', restrictTo('ADMIN'), startMatch);
router.post('/:matchId/end', restrictTo('ADMIN'), endMatch);

export default router;
