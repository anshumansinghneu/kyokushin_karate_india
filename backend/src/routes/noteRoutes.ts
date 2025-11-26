import express from 'express';
import {
    getStudentNotes,
    createStudentNote,
    updateStudentNote,
    deleteStudentNote,
    logProfileView,
    getProfileViews
} from '../controllers/noteController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

// Profile view tracking
router.post('/users/:studentId/profile-view', logProfileView);
router.get('/users/:studentId/profile-views', restrictTo('ADMIN'), getProfileViews);

// Student notes
router.route('/users/:studentId/notes')
    .get(restrictTo('ADMIN', 'INSTRUCTOR'), getStudentNotes)
    .post(restrictTo('ADMIN', 'INSTRUCTOR'), createStudentNote);

router.route('/notes/:noteId')
    .patch(restrictTo('ADMIN', 'INSTRUCTOR'), updateStudentNote)
    .delete(restrictTo('ADMIN', 'INSTRUCTOR'), deleteStudentNote);

export default router;
