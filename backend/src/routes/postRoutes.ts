import express from 'express';
import { getAllPosts, getPost, getPostBySlug, createPost, updatePost, deletePost, approvePost } from '../controllers/postController';
import { optionalAuth, protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllPosts);
router.get('/slug/:slug', optionalAuth, getPostBySlug);

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
