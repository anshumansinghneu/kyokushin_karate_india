import express from 'express';
import { getAllDojos, getDojo, createDojo, updateDojo, deleteDojo, getDojoLocations } from '../controllers/dojoController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getAllDojos);
router.get('/locations', getDojoLocations);
router.get('/:id', getDojo);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('ADMIN'));

router.post('/', createDojo);
router.patch('/:id', updateDojo);
router.delete('/:id', deleteDojo);

export default router;
