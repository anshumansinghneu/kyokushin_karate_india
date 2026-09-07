import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword, refreshAccessToken, logout } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { registerLimiter, loginLimiter, passwordResetLimiter } from '../middleware/rateLimiters';

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
