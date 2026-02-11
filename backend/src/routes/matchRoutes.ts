import express from 'express';
import { getMatch, getLiveMatches, getRecentResults, getLastTournamentChampions, startMatch, endMatch, updateScore } from '../controllers/matchController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/live', getLiveMatches);
router.get('/results/recent', getRecentResults);
router.get('/results/champions', getLastTournamentChampions);

router.use(protect);

router.get('/:id', getMatch);
router.patch('/:matchId', restrictTo('ADMIN'), updateScore);
router.post('/:matchId/start', restrictTo('ADMIN'), startMatch);
router.post('/:matchId/end', restrictTo('ADMIN'), endMatch);

export default router;
