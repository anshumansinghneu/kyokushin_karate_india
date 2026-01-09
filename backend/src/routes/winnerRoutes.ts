import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    getAllWinners,
    getRecentWinners,
    getTournamentWinners,
    getUserTournamentHistory,
} from '../controllers/winnerController';

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Get recent winners (last 3 tournaments) - All authenticated users
router.get('/recent', getRecentWinners);

// Get all tournament winners - Admin and Instructors
router.get('/all', restrictTo('ADMIN', 'INSTRUCTOR'), getAllWinners);

// Get winners for a specific tournament - All authenticated users
router.get('/tournament/:eventId', getTournamentWinners);

// Get user's tournament history - All authenticated users
router.get('/user/:userId', getUserTournamentHistory);

export default router;
