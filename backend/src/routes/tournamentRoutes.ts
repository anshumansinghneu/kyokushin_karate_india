import express from 'express';
import {
    generateBrackets, generateBracketsStream, getBrackets,
    getTournamentStatistics, updateBracketStatus,
    getCategories, moveParticipantCategory, bulkMoveParticipants
} from '../controllers/tournamentController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public route for statistics
router.get('/:eventId/statistics', getTournamentStatistics);

router.use(protect);

// Category management (admin only)
router.get('/:eventId/categories', restrictTo('ADMIN', 'INSTRUCTOR'), getCategories);
router.patch('/registrations/:registrationId/category', restrictTo('ADMIN'), moveParticipantCategory);
router.post('/:eventId/categories/bulk-move', restrictTo('ADMIN'), bulkMoveParticipants);

router.post('/:eventId/generate', restrictTo('ADMIN'), generateBrackets);
router.get('/:eventId/generate/stream', restrictTo('ADMIN'), generateBracketsStream);
router.patch('/brackets/:bracketId/status', restrictTo('ADMIN'), updateBracketStatus);
router.get('/:eventId', getBrackets);

export default router;
