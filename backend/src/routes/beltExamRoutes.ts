import express from 'express';
import { getBeltExamParticipants, gradeStudent, bulkGradeStudents } from '../controllers/beltExamController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Admin/Instructor: view exam participants + results
router.get('/:eventId/participants', restrictTo('ADMIN', 'INSTRUCTOR'), getBeltExamParticipants);

// Admin/Instructor: grade a single student
router.post('/:eventId/grade/:studentId', restrictTo('ADMIN', 'INSTRUCTOR'), gradeStudent);

// Admin/Instructor: bulk grade
router.post('/:eventId/grade', restrictTo('ADMIN', 'INSTRUCTOR'), bulkGradeStudents);

export default router;
