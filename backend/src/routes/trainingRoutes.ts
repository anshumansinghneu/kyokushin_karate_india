import express from 'express';
import { logTrainingSession, getTrainingSessions } from '../controllers/trainingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getTrainingSessions)
    .post(logTrainingSession);

export default router;
