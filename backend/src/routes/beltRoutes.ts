import express from 'express';
import { promoteStudent, getBeltHistory, getPendingVerifications, reviewVerification, getStudentVerifications, getEligibleStudents } from '../controllers/beltController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/promote', restrictTo('ADMIN', 'INSTRUCTOR'), promoteStudent);
router.get('/history/:userId', getBeltHistory);
router.get('/eligible', restrictTo('ADMIN', 'INSTRUCTOR'), getEligibleStudents);

// Belt Verification Routes
router.get('/verifications/pending', restrictTo('ADMIN', 'INSTRUCTOR'), getPendingVerifications);
router.patch('/verifications/:id', restrictTo('ADMIN', 'INSTRUCTOR'), reviewVerification);
router.get('/verifications/student/:studentId', getStudentVerifications);

export default router;
