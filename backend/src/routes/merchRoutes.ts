import express from 'express';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    createOrder,
    verifyMerchPayment,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
} from '../controllers/merchController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/products', getProducts);
router.get('/products/:id', getProduct);

// Auth required
router.use(protect);

// User routes
router.post('/orders', createOrder);
router.post('/orders/verify', verifyMerchPayment);
router.get('/orders/mine', getMyOrders);

// Admin routes
router.use(restrictTo('ADMIN'));
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
