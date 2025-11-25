import express from 'express';
import { uploadImage, handleUpload } from '../controllers/uploadController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
// router.use(restrictTo('ADMIN')); // Allow all authenticated users to upload

router.post('/', uploadImage, handleUpload);

export default router;
