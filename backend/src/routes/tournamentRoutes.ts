import express from 'express';
import {
    generateBrackets, generateBracketsStream, getBrackets,
    getTournamentStatistics, updateBracketStatus,
    getCategories, moveParticipantCategory, bulkMoveParticipants
} from '../controllers/tournamentController';
import { protect, restrictTo, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Public reads: statistics, and published brackets (draft brackets stay admin-only
// inside getBrackets; optionalAuth lets a signed-in admin still see them here).
router.get('/:eventId/statistics', getTournamentStatistics);
router.get('/:eventId', optionalAuth, getBrackets);

router.use(protect);

// Category management (admin only)
router.get('/:eventId/categories', restrictTo('ADMIN'), getCategories);
router.patch('/registrations/:registrationId/category', restrictTo('ADMIN'), moveParticipantCategory);
router.post('/:eventId/categories/bulk-move', restrictTo('ADMIN'), bulkMoveParticipants);

router.post('/:eventId/generate', restrictTo('ADMIN'), generateBrackets);
router.get('/:eventId/generate/stream', restrictTo('ADMIN'), generateBracketsStream);
router.patch('/brackets/:bracketId/status', restrictTo('ADMIN'), updateBracketStatus);

export default router;
