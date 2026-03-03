import express from 'express';
import {
    getMyPayments,
    getAllPayments,
    getPaymentConfig,
    getPaymentInvoice,
} from '../controllers/paymentController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// ── Public Routes (no auth needed) ──
router.get('/config', getPaymentConfig);                         // Get fee structure

// ── Protected Routes (login required) ──
router.use(protect);
router.get('/my-payments', getMyPayments);                           // User's payment history
router.get('/invoice/:paymentId', getPaymentInvoice);                // Get invoice data for a payment

// ── Admin Only ──
router.get('/all', restrictTo('ADMIN'), getAllPayments);             // All payments (admin view)

export default router;
