import express from 'express';
import { getDojoFees, markFee, getMyFees, remindUnpaid, updateDojoFeeSettings } from '../controllers/feeController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMyFees);
router.get('/dojo/:dojoId', restrictTo('ADMIN', 'INSTRUCTOR'), getDojoFees);
router.post('/mark', restrictTo('ADMIN', 'INSTRUCTOR'), markFee);
router.post('/remind', restrictTo('ADMIN', 'INSTRUCTOR'), remindUnpaid);
router.patch('/dojo-settings', restrictTo('ADMIN', 'INSTRUCTOR'), updateDojoFeeSettings);

export default router;
