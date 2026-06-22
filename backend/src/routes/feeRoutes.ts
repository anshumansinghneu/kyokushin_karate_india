import express from 'express';
import { getDojoFees, markFee, getMyFees } from '../controllers/feeController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMyFees);
router.get('/dojo/:dojoId', restrictTo('ADMIN', 'INSTRUCTOR'), getDojoFees);
router.post('/mark', restrictTo('ADMIN', 'INSTRUCTOR'), markFee);

export default router;
