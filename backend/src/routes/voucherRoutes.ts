import express from 'express';
import {
    createVoucher,
    validateVoucher,
    redeemVoucherForEvent,
    redeemVoucherForRenewal,
    registerStudentOnBehalf,
    getAllVouchers,
    deactivateVoucher,
} from '../controllers/voucherController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { voucherValidateLimiter } from '../middleware/rateLimiters';

const router = express.Router();

// ── Public Routes (no auth needed) ──
router.post('/validate', voucherValidateLimiter, validateVoucher);   // Validate a voucher code (throttled: anonymous brute-force surface)

// ── Protected Routes (login required) ──
router.use(protect);
router.post('/redeem/event/:eventId', redeemVoucherForEvent);        // Register for event with voucher
router.post('/redeem/renewal', redeemVoucherForRenewal);             // Renew membership with voucher
router.post('/redeem/register-student', restrictTo('INSTRUCTOR', 'ADMIN'), registerStudentOnBehalf); // Instructor registers student with voucher

// ── Admin Only ──
router.use(restrictTo('ADMIN'));
router.post('/create', createVoucher);                               // Create a new voucher
router.get('/all', getAllVouchers);                                   // List all vouchers
router.patch('/:id/deactivate', deactivateVoucher);                  // Deactivate a voucher

export default router;
