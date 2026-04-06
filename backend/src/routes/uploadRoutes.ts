import express from 'express';
import { uploadImage, uploadImages, handleUpload, handleMultiUpload } from '../controllers/uploadController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
// router.use(restrictTo('ADMIN')); // Allow all authenticated users to upload

router.post('/', uploadImage, handleUpload);
router.post('/multiple', uploadImages, handleMultiUpload);

export default router;
