import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/paymentService';
import { sendOrderConfirmationEmail } from '../services/emailService';

// ========== PUBLIC ENDPOINTS ==========

export const getProducts = catchAsync(async (req: Request, res: Response) => {
    const { category, featured } = req.query;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (featured === 'true') where.featured = true;

    const products = await prisma.product.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
        status: 'success',
        data: { products },
    });
});

export const getProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const product = await prisma.product.findUnique({
        where: { id: req.params.id },
    });

    if (!product) return next(new AppError('Product not found', 404));

    res.status(200).json({
        status: 'success',
        data: { product },
    });
});

// ========== ADMIN ENDPOINTS ==========

export const createProduct = catchAsync(async (req: Request, res: Response) => {
    const { name, description, price, comparePrice, category, images, sizes, stockCount, featured } = req.body;

    const product = await prisma.product.create({
        data: {
            name,
            description,
            price,
            comparePrice,
            category: category || 'APPAREL',
            images: images || [],
            sizes: sizes || [],
            stockCount: stockCount || 0,
            inStock: (stockCount || 0) > 0,
            featured: featured || false,
        },
    });

    res.status(201).json({
        status: 'success',
        data: { product },
    });
});

export const updateProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new AppError('Product not found', 404));

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['name', 'description', 'price', 'comparePrice', 'category', 'images', 'sizes', 'stockCount', 'inStock', 'featured', 'isActive'];
    const data: any = {};
    for (const key of allowedFields) {
        if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const product = await prisma.product.update({
        where: { id: req.params.id },
        data,
    });

    res.status(200).json({
        status: 'success',
        data: { product },
    });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    await prisma.product.update({
        where: { id: req.params.id },
        data: { isActive: false },
    });

    res.status(200).json({
        status: 'success',
        message: 'Product deactivated',
    });
});

// ========== ORDER ENDPOINTS ==========

// Step 1: Create order & Razorpay payment
export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const { items, shippingName, shippingPhone, shippingAddress, shippingCity, shippingState, shippingPincode, notes } = req.body;

    if (!items || items.length === 0) {
        return next(new AppError('Order must have at least one item', 400));
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) return next(new AppError(`Product ${item.productId} not found`, 404));
        if (!product.inStock) return next(new AppError(`${product.name} is out of stock`, 400));

        const qty = item.quantity || 1;
        if (qty > product.stockCount) {
            return next(new AppError(`Only ${product.stockCount} units of ${product.name} are available`, 400));
        }

        const itemTotal = product.price * qty;
        totalAmount += itemTotal;

        orderItems.push({
            productId: item.productId,
            size: item.size,
            quantity: qty,
            price: product.price,
        });
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(totalAmount * 100), // paise
        receipt: `mch_${userId.slice(0,8)}_${Date.now()}`,
        notes: {
            type: 'MERCHANDISE',
            userId,
            itemCount: String(items.length),
        },
    });

    // Create the merch order in DB with PENDING status
    const order = await prisma.merchOrder.create({
        data: {
            userId,
            totalAmount,
            razorpayOrderId: razorpayOrder.id,
            shippingName,
            shippingPhone,
            shippingAddress,
            shippingCity,
            shippingState,
            shippingPincode,
            notes,
            status: 'PENDING',
            items: {
                create: orderItems,
            },
        },
        include: {
            items: { include: { product: true } },
        },
    });

    res.status(201).json({
        status: 'success',
        data: {
            order,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
        },
    });
});

// Step 2: Verify Razorpay payment
export const verifyMerchPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new AppError('Missing payment verification data', 400));
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        return next(new AppError('Payment verification failed', 400));
    }

    const order = await prisma.merchOrder.findFirst({
        where: { razorpayOrderId: razorpay_order_id, userId },
        include: {
            items: { include: { product: true } },
            user: { select: { name: true, email: true, phone: true } },
        },
    });

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    if (order.razorpayPaymentId) {
        return next(new AppError('Payment already verified', 400));
    }

    // Update order with payment info and set to CONFIRMED
    const updatedOrder = await prisma.merchOrder.update({
        where: { id: order.id },
        data: {
            razorpayPaymentId: razorpay_payment_id,
            status: 'CONFIRMED',
        },
        include: {
            items: { include: { product: true } },
            user: { select: { name: true, email: true, phone: true } },
        },
    });

    // Decrease stock counts
    for (const item of updatedOrder.items) {
        await prisma.product.update({
            where: { id: item.productId },
            data: {
                stockCount: { decrement: item.quantity },
            },
        });
    }

    // Send confirmation email
    try {
        await sendOrderConfirmationEmail(
            updatedOrder.user.email,
            updatedOrder.user.name,
            updatedOrder.id,
            updatedOrder.items.map(i => ({
                name: i.product.name,
                size: i.size || 'One Size',
                quantity: i.quantity,
                price: i.price,
            })),
            updatedOrder.totalAmount,
            razorpay_payment_id
        );
    } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr);
    }

    res.status(200).json({
        status: 'success',
        message: 'Payment verified! Order confirmed.',
        data: { order: updatedOrder },
    });
});

export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const orders = await prisma.merchOrder.findMany({
        where: { userId },
        include: {
            items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
        status: 'success',
        data: { orders },
    });
});

export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const orders = await prisma.merchOrder.findMany({
        include: {
            user: { select: { name: true, email: true, phone: true } },
            items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
        status: 'success',
        data: { orders },
    });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
        return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const existing = await prisma.merchOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new AppError('Order not found', 404));

    const order = await prisma.merchOrder.update({
        where: { id: req.params.id },
        data: { status },
        include: {
            items: { include: { product: true } },
            user: { select: { name: true, email: true } },
        },
    });

    res.status(200).json({
        status: 'success',
        data: { order },
    });
});
