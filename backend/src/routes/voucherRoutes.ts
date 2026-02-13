import express from 'express';
import {
    createVoucher,
    validateVoucher,
    redeemVoucherForRegistration,
    redeemVoucherForEvent,
    getAllVouchers,
    deactivateVoucher,
} from '../controllers/voucherController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// ── Public Routes (no auth needed) ──
router.post('/validate', validateVoucher);                           // Validate a voucher code
router.post('/redeem/registration', redeemVoucherForRegistration);   // Register with voucher (instead of Razorpay)

// ── Protected Routes (login required) ──
router.use(protect);
router.post('/redeem/event/:eventId', redeemVoucherForEvent);        // Register for event with voucher

// ── Admin Only ──
router.use(restrictTo('ADMIN'));
router.post('/create', createVoucher);                               // Create a new voucher
router.get('/all', getAllVouchers);                                   // List all vouchers
router.patch('/:id/deactivate', deactivateVoucher);                  // Deactivate a voucher

export default router;
