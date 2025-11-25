import express from 'express';
import { promoteStudent, getBeltHistory } from '../controllers/beltController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/promote', restrictTo('ADMIN', 'INSTRUCTOR'), promoteStudent);
router.get('/history/:userId', getBeltHistory);

export default router;
