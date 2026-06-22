import express from 'express';
import { getDojoAttendance, markAttendance, getMyAttendance } from '../controllers/attendanceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMyAttendance);
router.get('/dojo/:dojoId', restrictTo('ADMIN', 'INSTRUCTOR'), getDojoAttendance);
router.post('/mark', restrictTo('ADMIN', 'INSTRUCTOR'), markAttendance);

export default router;
