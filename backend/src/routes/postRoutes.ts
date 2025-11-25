import express from 'express';
import { getAllPosts, getPost, getPostBySlug, createPost, updatePost, deletePost, approvePost } from '../controllers/postController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/slug/:slug', getPostBySlug);

// Protected routes
router.use(protect);

// Allow Students/Instructors to create posts
router.post('/', createPost);

// Admin only routes
router.use(restrictTo('ADMIN'));

router.patch('/:id/approve', approvePost as any);

router.route('/:id')
    .get(getPost)
    .patch(updatePost)
    .delete(deletePost);

export default router;
