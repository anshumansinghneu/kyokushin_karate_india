import express from 'express';
import { getMe } from '../controllers/authController';
import { getAllUsers, getUser, approveUser, rejectUser, deleteUser, inviteUser, updateMe, updateUser, createUser } from '../controllers/userController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.patch('/updateMe', updateMe);

router.post('/invite', restrictTo('ADMIN', 'INSTRUCTOR'), inviteUser);

router.route('/')
    .get(restrictTo('ADMIN', 'INSTRUCTOR'), getAllUsers)
    .post(restrictTo('ADMIN'), createUser);

router.route('/:id')
    .get(getUser)
    .patch(restrictTo('ADMIN'), updateUser)
    .delete(restrictTo('ADMIN'), deleteUser);

router.patch('/:id/approve', restrictTo('ADMIN', 'INSTRUCTOR'), approveUser);
router.patch('/:id/reject', restrictTo('ADMIN', 'INSTRUCTOR'), rejectUser);

export default router;
