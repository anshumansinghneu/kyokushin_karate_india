import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword, refreshAccessToken, logout } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
