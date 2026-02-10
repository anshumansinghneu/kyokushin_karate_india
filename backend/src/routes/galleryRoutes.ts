import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    getGalleryItems,
    uploadGalleryItem,
    getPendingGalleryItems,
    approveGalleryItem,
    toggleFeatured,
    deleteGalleryItem,
} from '../controllers/galleryController';

const router = Router();

// Public
router.get('/', getGalleryItems);

// Authenticated
router.post('/', protect, uploadGalleryItem);
router.delete('/:id', protect, deleteGalleryItem);

// Admin/Instructor only
router.get('/pending', protect, restrictTo('ADMIN', 'INSTRUCTOR'), getPendingGalleryItems);
router.patch('/:id/approve', protect, restrictTo('ADMIN', 'INSTRUCTOR'), approveGalleryItem);
router.patch('/:id/feature', protect, restrictTo('ADMIN'), toggleFeatured);

export default router;
