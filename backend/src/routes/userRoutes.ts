import express from 'express';
import { getMe } from '../controllers/authController';
import { getAllUsers, getUser, getUserFullProfile, getUserByMembershipId, searchUsers, approveUser, rejectUser, deleteUser, inviteUser, updateMe, updateUser, createUser, getPublicInstructors } from '../controllers/userController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (no auth required)
router.get('/public-instructors', getPublicInstructors);

router.use(protect);

router.get('/me', getMe);
router.patch('/updateMe', updateMe);

router.post('/invite', restrictTo('ADMIN', 'INSTRUCTOR'), inviteUser);

// Search route (must come before other routes)
router.get('/search', restrictTo('ADMIN', 'INSTRUCTOR'), searchUsers);

// Lookup by membership ID (e.g. KKFI-STD-00001)
router.get('/member/:membershipId', getUserByMembershipId);

router.route('/')
    .get(restrictTo('ADMIN', 'INSTRUCTOR'), getAllUsers)
    .post(restrictTo('ADMIN'), createUser);

// Full profile route (must come before /:id)
router.get('/:id/full-profile', getUserFullProfile);

router.route('/:id')
    .get(getUser)
    .patch(restrictTo('ADMIN'), updateUser)
    .delete(restrictTo('ADMIN'), deleteUser);

router.patch('/:id/approve', restrictTo('ADMIN', 'INSTRUCTOR'), approveUser);
router.patch('/:id/reject', restrictTo('ADMIN', 'INSTRUCTOR'), rejectUser);

export default router;
