import express from 'express';
import {
    createRegistrationOrder,
    verifyRegistrationPayment,
    createRenewalOrder,
    verifyRenewalPayment,
    createTournamentOrder,
    verifyTournamentPayment,
    getMyPayments,
    getAllPayments,
    getPaymentConfig,
    getPaymentInvoice,
} from '../controllers/paymentController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// ── Public Routes (no auth needed) ──
router.get('/config', getPaymentConfig);                         // Get fee structure
router.post('/registration/create-order', createRegistrationOrder);  // Step 1: Create order for new registration
router.post('/registration/verify', verifyRegistrationPayment);      // Step 2: Verify payment & create account

// ── Protected Routes (login required) ──
router.use(protect);
router.get('/my-payments', getMyPayments);                           // User's payment history
router.get('/invoice/:paymentId', getPaymentInvoice);                // Get invoice data for a payment
router.post('/renewal/create-order', createRenewalOrder);            // Create renewal order
router.post('/renewal/verify', verifyRenewalPayment);                // Verify renewal payment
router.post('/tournament/:eventId/create-order', createTournamentOrder);  // Tournament payment order
router.post('/tournament/verify', verifyTournamentPayment);              // Verify tournament payment

// ── Admin Only ──
router.get('/all', restrictTo('ADMIN'), getAllPayments);             // All payments (admin view)

export default router;
