import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import {
    PAYMENT_CONFIG,
    calculateTotal,
} from '../services/paymentService';

// ─── Get Payment History ───────────────────────────────────────────────
export const getMyPayments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.user;

    const payments = await prisma.payment.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            type: true,
            amount: true,
            taxAmount: true,
            totalAmount: true,
            currency: true,
            status: true,
            description: true,
            paidAt: true,
            createdAt: true,
            event: {
                select: { id: true, name: true, type: true },
            },
        },
    });

    res.status(200).json({
        status: 'success',
        results: payments.length,
        data: { payments },
    });
});

// ─── Admin: Get All Payments ────────────────────────────────────────────
export const getAllPayments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type, status, page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: {
            user: {
                select: { id: true, name: true, email: true, membershipNumber: true },
            },
            event: {
                select: { id: true, name: true, type: true },
            },
        },
    });

    const total = await prisma.payment.count({ where });

    res.status(200).json({
        status: 'success',
        results: payments.length,
        total,
        data: { payments },
    });
});

// ─── Get Payment Config (public) ────────────────────────────────────────
export const getPaymentConfig = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { amount, taxAmount, totalAmount } = calculateTotal(PAYMENT_CONFIG.MEMBERSHIP_FEE);

    res.status(200).json({
        status: 'success',
        data: {
            membershipFee: amount,
            taxAmount,
            totalAmount,
            gstRate: `${PAYMENT_CONFIG.GST_RATE * 100}%`,
            currency: PAYMENT_CONFIG.CURRENCY,
            duration: '1 year',
        },
    });
});

// ─── Get Invoice/Receipt Data for a Payment ─────────────────────────────
export const getPaymentInvoice = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.user;
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            user: {
                select: {
                    id: true, name: true, email: true, phone: true,
                    membershipNumber: true, city: true, state: true,
                    dojo: { select: { name: true, city: true } },
                },
            },
            event: {
                select: { id: true, name: true, type: true, startDate: true, location: true },
            },
        },
    });

    if (!payment) {
        return next(new AppError('Payment not found', 404));
    }

    // Only allow the payer or admin to view invoice
    if (payment.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
        return next(new AppError('Not authorized to view this invoice', 403));
    }

    if (payment.status !== 'PAID') {
        return next(new AppError('Invoice is only available for completed payments', 400));
    }

    const invoiceNumber = `KKFI-${payment.paidAt ? new Date(payment.paidAt).getFullYear() : new Date().getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;

    res.status(200).json({
        status: 'success',
        data: {
            invoice: {
                invoiceNumber,
                paymentId: payment.id,
                type: payment.type,
                amount: payment.amount,
                taxAmount: payment.taxAmount,
                totalAmount: payment.totalAmount,
                currency: payment.currency,
                razorpayPaymentId: payment.razorpayPaymentId || null,  // historical — kept for old records
                paidAt: payment.paidAt,
                description: payment.description,
                user: payment.user,
                event: payment.event,
                organization: {
                    name: 'Kyokushin Karate Foundation of India',
                    shortName: 'KKFI',
                    address: 'India',
                    gstNote: 'GST @ 18%',
                },
            },
        },
    });
});
