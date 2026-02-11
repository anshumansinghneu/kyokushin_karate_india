import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

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
    const product = await prisma.product.update({
        where: { id: req.params.id },
        data: req.body,
    });

    if (!product) return next(new AppError('Product not found', 404));

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

    const order = await prisma.merchOrder.update({
        where: { id: req.params.id },
        data: { status },
        include: {
            items: { include: { product: true } },
            user: { select: { name: true, email: true } },
        },
    });

    if (!order) return next(new AppError('Order not found', 404));

    res.status(200).json({
        status: 'success',
        data: { order },
    });
});
