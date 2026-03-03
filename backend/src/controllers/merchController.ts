import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
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
    const { name, description, price, comparePrice, category, images, sizes, stockCount, featured, inStock, isActive } = req.body;

    // Build update data with only valid Product model fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice;
    if (category !== undefined) updateData.category = category;
    if (images !== undefined) updateData.images = images;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (stockCount !== undefined) updateData.stockCount = stockCount;
    if (featured !== undefined) updateData.featured = featured;
    if (inStock !== undefined) updateData.inStock = inStock;
    if (isActive !== undefined) updateData.isActive = isActive;

    try {
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.status(200).json({
            status: 'success',
            data: { product },
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return next(new AppError('Product not found', 404));
        }
        throw error;
    }
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

// Create order (voucher-based or admin-confirmed)
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

        const itemTotal = product.price * (item.quantity || 1);
        totalAmount += itemTotal;

        orderItems.push({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity || 1,
            price: product.price,
        });
    }

    // Create the merch order in DB — PENDING until admin confirms
    const order = await prisma.merchOrder.create({
        data: {
            userId,
            totalAmount,
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
            user: { select: { name: true, email: true, phone: true } },
        },
    });

    // Decrease stock counts
    for (const item of order.items) {
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
            order.user.email,
            order.user.name,
            order.id,
            order.items.map(i => ({
                name: i.product.name,
                size: i.size || 'One Size',
                quantity: i.quantity,
                price: i.price,
            })),
            order.totalAmount,
            order.id.slice(0, 8).toUpperCase()
        );
    } catch (emailErr) {
        console.error('Failed to send order confirmation email:', emailErr);
    }

    res.status(201).json({
        status: 'success',
        message: 'Order placed successfully! You will be contacted for payment details.',
        data: { order },
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
