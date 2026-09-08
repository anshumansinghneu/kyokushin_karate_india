import express from 'express';
import {
    getPublishedDelegations,
    getFeaturedDelegation,
    getDelegationById,
    getAllDelegations,
    getEligibleMembers,
    getMyAppearances,
    createDelegation,
    updateDelegation,
    setFeaturedDelegation,
    deleteDelegation,
    addDelegationMember,
    updateDelegationMember,
    removeDelegationMember,
} from '../controllers/delegationController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// ── Public: the Team India page and the homepage strip ──
router.get('/', getPublishedDelegations);
router.get('/featured', getFeaturedDelegation);

// ── The signed-in member's own international record ──
router.get('/me/appearances', protect, getMyAppearances);

// ── Admin ──
// Declared before '/:id' so "admin" and "eligible-members" are not swallowed
// by the dynamic segment.
router.get('/admin/all', protect, restrictTo('ADMIN'), getAllDelegations);
router.get('/admin/eligible-members', protect, restrictTo('ADMIN'), getEligibleMembers);

router.post('/', protect, restrictTo('ADMIN'), createDelegation);
router.patch('/:id', protect, restrictTo('ADMIN'), updateDelegation);
router.patch('/:id/feature', protect, restrictTo('ADMIN'), setFeaturedDelegation);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteDelegation);

router.post('/:id/members', protect, restrictTo('ADMIN'), addDelegationMember);
router.patch('/:id/members/:memberId', protect, restrictTo('ADMIN'), updateDelegationMember);
router.delete('/:id/members/:memberId', protect, restrictTo('ADMIN'), removeDelegationMember);

// Public single-delegation lookup. Last, so the literal routes above win.
router.get('/:id', getDelegationById);

export default router;
