import express from 'express';
import { getAllContent, updateContent, initializeContent } from '../controllers/contentController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public route to get content
router.get('/', getAllContent);

// Admin only routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.patch('/:key', updateContent);
router.post('/init', initializeContent);

export default router;
