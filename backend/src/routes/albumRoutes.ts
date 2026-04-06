import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import {
    getAlbums,
    getAlbum,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addPhotosToAlbum,
    removePhotoFromAlbum,
    reorderPhotos,
} from '../controllers/albumController';

const router = Router();

// Public
router.get('/', getAlbums);
router.get('/:id', getAlbum);

// Admin only
router.post('/', protect, restrictTo('ADMIN'), createAlbum);
router.patch('/:id', protect, restrictTo('ADMIN'), updateAlbum);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteAlbum);

// Album photo management — Admin only
router.post('/:id/photos', protect, restrictTo('ADMIN'), addPhotosToAlbum);
router.delete('/:id/photos/:photoId', protect, restrictTo('ADMIN'), removePhotoFromAlbum);
router.patch('/:id/photos/reorder', protect, restrictTo('ADMIN'), reorderPhotos);

export default router;
