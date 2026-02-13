import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import {
    PAYMENT_CONFIG,
    calculateTotal,
    createRazorpayOrder,
    verifyRazorpaySignature,
} from '../services/paymentService';
import { sendRegistrationEmail, sendNewApplicantEmail } from '../services/emailService';

const signToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: '90d',
    });
};

// ─── Step 1: Create Registration Order ────────────────────────────────
// Called when a student/instructor submits the registration form.
// Validates data, stores it temporarily, creates Razorpay order.
export const createRegistrationOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        email, password, name, phone, dob, height, weight, city, state, country,
        dojoId, instructorId, currentBeltRank, beltExamDate, beltClaimReason,
        yearsOfExperience, countryCode, fatherName, fatherPhone, role,
        experienceYears, experienceMonths
    } = req.body;

    // ── Validation ──
    if (!password || password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long', 400));
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
        return next(new AppError('Password must contain at least one special character', 400));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
    }
    if (!name) {
        return next(new AppError('Please provide your name', 400));
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return next(new AppError('Email already exists', 400));
    }

    // Check for any pending payments with same email
    const existingPending = await prisma.payment.findFirst({
        where: {
            type: 'MEMBERSHIP',
            status: 'PENDING',
            registrationData: {
                path: ['email'],
                equals: email,
            },
        },
    });

    // If there's an existing pending order less than 30 mins old, return it
    if (existingPending) {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (existingPending.createdAt > thirtyMinsAgo) {
            return res.status(200).json({
                status: 'success',
                message: 'Existing order found',
                data: {
                    orderId: existingPending.razorpayOrderId,
                    paymentId: existingPending.id,
                    amount: existingPending.amount,
                    taxAmount: existingPending.taxAmount,
                    totalAmount: existingPending.totalAmount,
                    currency: existingPending.currency,
                    keyId: process.env.RAZORPAY_KEY_ID,
                },
            });
        }
        // Old pending order — mark as failed
        await prisma.payment.update({
            where: { id: existingPending.id },
            data: { status: 'FAILED' },
        });
    }

    // ── Calculate Amount ──
    const { amount, taxAmount, totalAmount, totalAmountPaise } = calculateTotal(PAYMENT_CONFIG.MEMBERSHIP_FEE);

    // ── Create Razorpay Order ──
    const razorpayOrder = await createRazorpayOrder({
        amount: totalAmountPaise,
        receipt: `reg_${Date.now()}`,
        notes: {
            type: 'MEMBERSHIP',
            email,
            name,
        },
    });

    // ── Store Registration Data + Order ──
    // Hash password before storing to avoid plaintext in DB JSON
    const hashedPasswordForStorage = await bcrypt.hash(password, 12);
    const registrationData = {
        email, passwordHash: hashedPasswordForStorage, name, phone, dob, height, weight, city, state,
        country: country || 'India', dojoId, instructorId, currentBeltRank,
        beltExamDate, beltClaimReason, yearsOfExperience,
        countryCode: countryCode || '+91', fatherName, fatherPhone,
        role: role || 'STUDENT',
        experienceYears: experienceYears || 0,
        experienceMonths: experienceMonths || 0,
    };

    const payment = await prisma.payment.create({
        data: {
            type: 'MEMBERSHIP',
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            razorpayOrderId: razorpayOrder.id,
            status: 'PENDING',
            registrationData,
            description: `Annual Membership Fee - ${name}`,
        },
    });

    res.status(201).json({
        status: 'success',
        message: 'Payment order created. Complete UPI payment to finish registration.',
        data: {
            orderId: razorpayOrder.id,
            paymentId: payment.id,
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
        },
    });
});

// ─── Step 2: Verify Registration Payment & Create Account ─────────────
// Called after Razorpay checkout completes successfully on frontend.
export const verifyRegistrationPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new AppError('Missing payment verification data', 400));
    }

    // ── Verify Signature ──
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        return next(new AppError('Payment verification failed. Invalid signature.', 400));
    }

    // ── Find Payment Record ──
    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) {
        return next(new AppError('Payment record not found', 404));
    }

    if (payment.status === 'PAID') {
        return next(new AppError('This payment has already been processed', 400));
    }

    const regData = payment.registrationData as any;
    if (!regData || !regData.email) {
        return next(new AppError('Registration data not found for this payment', 400));
    }

    // Check email uniqueness again (race condition protection)
    const existingUser = await prisma.user.findUnique({ where: { email: regData.email } });
    if (existingUser) {
        // Mark payment as paid but inform about the issue
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'PAID',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: new Date(),
            },
        });
        return next(new AppError('Email already registered. Payment recorded — contact admin for refund if needed.', 400));
    }

    // ── Create User Account via Transaction ──
    // Password is already hashed in registrationData (hashed before storage)
    const hashedPassword = regData.passwordHash || await bcrypt.hash(regData.password, 12);
    const isStudent = regData.role === 'STUDENT';
    const isInstructor = regData.role === 'INSTRUCTOR';
    const requestedBelt = regData.currentBeltRank || 'White';
    const isClaimingHigherBelt = isStudent && requestedBelt !== 'White';

    const membershipStartDate = new Date();
    const membershipEndDate = new Date();
    membershipEndDate.setDate(membershipEndDate.getDate() + PAYMENT_CONFIG.MEMBERSHIP_DURATION_DAYS);

    const userId = await prisma.$transaction(async (tx) => {
        // Resolve instructor – validate the ID actually exists to avoid FK violations
        let resolvedInstructorId: string | null = null;
        if (regData.instructorId) {
            const instructor = await tx.user.findUnique({ where: { id: regData.instructorId }, select: { id: true } });
            if (instructor) resolvedInstructorId = instructor.id;
        }
        if (!resolvedInstructorId && isStudent) {
            const admin = await tx.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
            if (admin) resolvedInstructorId = admin.id;
        }

        // Determine verification status
        let verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' = 'VERIFIED';
        let initialBelt = 'White';

        if (isInstructor) {
            initialBelt = requestedBelt;
        } else if (isStudent) {
            if (requestedBelt === 'White') {
                initialBelt = 'White';
                verificationStatus = 'VERIFIED';
            } else {
                initialBelt = 'White';
                verificationStatus = 'PENDING_VERIFICATION';
            }
        }

        // Create user — membership is PENDING until instructor/admin approves
        const user = await tx.user.create({
            data: {
                email: regData.email,
                passwordHash: hashedPassword,
                name: regData.name,
                phone: regData.phone,
                countryCode: regData.countryCode || '+91',
                dateOfBirth: regData.dob ? new Date(regData.dob) : undefined,
                height: regData.height ? parseFloat(regData.height) : undefined,
                weight: regData.weight ? parseFloat(regData.weight) : undefined,
                city: regData.city,
                state: regData.state,
                country: regData.country || 'India',
                dojoId: regData.dojoId || undefined,
                primaryInstructorId: resolvedInstructorId || undefined,
                role: regData.role || 'STUDENT',
                membershipStatus: 'PENDING',  // Awaiting instructor/admin verification
                membershipStartDate,
                membershipEndDate,
                currentBeltRank: initialBelt,
                verificationStatus,
                fatherName: isStudent ? regData.fatherName : undefined,
                fatherPhone: isStudent ? regData.fatherPhone : undefined,
                experienceYears: regData.experienceYears ? parseInt(regData.experienceYears) : 0,
                experienceMonths: regData.experienceMonths ? parseInt(regData.experienceMonths) : 0,
            },
        });

        // Belt logic
        if (isClaimingHigherBelt) {
            await tx.beltVerificationRequest.create({
                data: {
                    studentId: user.id,
                    requestedBelt,
                    examDate: regData.beltExamDate ? new Date(regData.beltExamDate) : new Date(),
                    reason: regData.beltClaimReason || `Student claims ${requestedBelt} belt from previous training`,
                    status: 'PENDING',
                },
            });
        } else {
            await tx.beltHistory.create({
                data: {
                    studentId: user.id,
                    oldBelt: null,
                    newBelt: initialBelt,
                    promotedBy: resolvedInstructorId || user.id,
                    notes: isInstructor ? 'Initial registration - Instructor' : 'Initial registration - White Belt',
                    promotionDate: new Date(),
                },
            });
        }

        // Update payment record
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: 'PAID',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: new Date(),
                userId: user.id,
            },
        });

        return user.id;
    });

    // Fetch user with relations
    const newUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            dojo: {
                select: { id: true, name: true, city: true, state: true }
            },
            primaryInstructor: {
                select: { email: true, name: true }
            },
        },
    });

    // Send emails
    if (newUser) {
        sendRegistrationEmail(newUser.email, newUser.name);
        if (newUser.primaryInstructor?.email) {
            sendNewApplicantEmail(newUser.primaryInstructor.email, newUser.name);
        }
    }

    // Generate token for auto-login
    const token = signToken(userId);

    // Remove password from output
    if (newUser) (newUser as any).passwordHash = undefined;

    res.status(201).json({
        status: 'success',
        message: 'Payment verified and account created successfully! Awaiting instructor/admin approval for full access.',
        token,
        data: {
            user: newUser,
            payment: {
                id: payment.id,
                amount: payment.totalAmount,
                status: 'PAID',
            },
        },
    });
});

// ─── Create Renewal Order ──────────────────────────────────────────────
// For annual membership renewal
export const createRenewalOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;

    // Check if user already has an active non-expired membership
    if (currentUser.membershipEndDate && new Date(currentUser.membershipEndDate) > new Date()) {
        return next(new AppError('Your membership is still active. No renewal needed yet.', 400));
    }

    // Check for existing pending renewal
    const existingPending = await prisma.payment.findFirst({
        where: {
            userId: currentUser.id,
            type: 'RENEWAL',
            status: 'PENDING',
        },
    });

    if (existingPending) {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (existingPending.createdAt > thirtyMinsAgo) {
            return res.status(200).json({
                status: 'success',
                message: 'Existing renewal order found',
                data: {
                    orderId: existingPending.razorpayOrderId,
                    paymentId: existingPending.id,
                    amount: existingPending.amount,
                    taxAmount: existingPending.taxAmount,
                    totalAmount: existingPending.totalAmount,
                    currency: existingPending.currency,
                    keyId: process.env.RAZORPAY_KEY_ID,
                },
            });
        }
        await prisma.payment.update({
            where: { id: existingPending.id },
            data: { status: 'FAILED' },
        });
    }

    const { amount, taxAmount, totalAmount, totalAmountPaise } = calculateTotal(PAYMENT_CONFIG.MEMBERSHIP_FEE);

    const razorpayOrder = await createRazorpayOrder({
        amount: totalAmountPaise,
        receipt: `rnw_${currentUser.id.slice(0,8)}_${Date.now()}`,
        notes: {
            type: 'RENEWAL',
            userId: currentUser.id,
            email: currentUser.email,
        },
    });

    const payment = await prisma.payment.create({
        data: {
            type: 'RENEWAL',
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            razorpayOrderId: razorpayOrder.id,
            userId: currentUser.id,
            status: 'PENDING',
            description: `Annual Membership Renewal - ${currentUser.name}`,
        },
    });

    res.status(201).json({
        status: 'success',
        data: {
            orderId: razorpayOrder.id,
            paymentId: payment.id,
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
        },
    });
});

// ─── Verify Renewal Payment ────────────────────────────────────────────
export const verifyRenewalPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // @ts-ignore
    const currentUser = req.user;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new AppError('Missing payment verification data', 400));
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        return next(new AppError('Payment verification failed', 400));
    }

    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment || payment.userId !== currentUser.id) {
        return next(new AppError('Payment not found or unauthorized', 404));
    }

    if (payment.status === 'PAID') {
        return next(new AppError('This payment has already been processed', 400));
    }

    // Extend membership by 1 year from today (or from current end date if still in grace period)
    const now = new Date();
    const newStartDate = now;
    const newEndDate = new Date(now);
    newEndDate.setDate(newEndDate.getDate() + PAYMENT_CONFIG.MEMBERSHIP_DURATION_DAYS);

    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: 'PAID',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: now,
            },
        });

        await tx.user.update({
            where: { id: currentUser.id },
            data: {
                membershipStatus: 'ACTIVE',
                membershipStartDate: newStartDate,
                membershipEndDate: newEndDate,
            },
        });
    });

    res.status(200).json({
        status: 'success',
        message: 'Membership renewed successfully!',
        data: {
            membershipStartDate: newStartDate,
            membershipEndDate: newEndDate,
        },
    });
});

// ─── Create Tournament Payment Order ───────────────────────────────────
export const createTournamentOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    // @ts-ignore
    const currentUser = req.user;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));

    if (new Date() > event.registrationDeadline) {
        return next(new AppError('Registration deadline has passed', 400));
    }

    // Check if already registered
    const existingReg = await prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId: currentUser.id } },
    });
    if (existingReg) {
        return next(new AppError('You are already registered for this event', 400));
    }

    // Determine fee
    const baseFee = event.memberFee; // Use memberFee for members
    const { amount, taxAmount, totalAmount, totalAmountPaise } = calculateTotal(baseFee);

    const razorpayOrder = await createRazorpayOrder({
        amount: totalAmountPaise,
        receipt: `evt_${eventId.slice(0,8)}_${Date.now()}`,
        notes: {
            type: 'TOURNAMENT',
            eventId,
            userId: currentUser.id,
        },
    });

    const payment = await prisma.payment.create({
        data: {
            type: 'TOURNAMENT',
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            razorpayOrderId: razorpayOrder.id,
            userId: currentUser.id,
            eventId,
            status: 'PENDING',
            description: `Tournament Registration - ${event.name}`,
        },
    });

    res.status(201).json({
        status: 'success',
        data: {
            orderId: razorpayOrder.id,
            paymentId: payment.id,
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            eventName: event.name,
        },
    });
});

// ─── Verify Tournament Payment ─────────────────────────────────────────
export const verifyTournamentPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, categoryAge, categoryWeight, categoryBelt, eventType } = req.body;
    // @ts-ignore
    const currentUser = req.user;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new AppError('Missing payment verification data', 400));
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        return next(new AppError('Payment verification failed', 400));
    }

    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment || payment.userId !== currentUser.id) {
        return next(new AppError('Payment not found or unauthorized', 404));
    }

    if (payment.status === 'PAID') {
        return next(new AppError('This payment has already been processed', 400));
    }

    if (!payment.eventId) {
        return next(new AppError('No event associated with this payment', 400));
    }

    const event = await prisma.event.findUnique({ where: { id: payment.eventId } });
    if (!event) return next(new AppError('Event not found', 404));

    const result = await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: 'PAID',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: new Date(),
            },
        });

        const registration = await tx.eventRegistration.create({
            data: {
                eventId: payment.eventId!,
                userId: currentUser.id,
                categoryAge,
                categoryWeight,
                categoryBelt,
                eventType,
                paymentStatus: 'PAID',
                paymentAmount: payment.totalAmount,
                finalAmount: payment.totalAmount,
                approvalStatus: event.type === 'TOURNAMENT' ? 'PENDING' : 'APPROVED',
            },
        });

        return registration;
    });

    res.status(201).json({
        status: 'success',
        message: 'Payment verified and event registration completed!',
        data: {
            registration: result,
        },
    });
});

// ─── Get Payment History ───────────────────────────────────────────────
export const getMyPayments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
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
    // @ts-ignore
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
                razorpayPaymentId: payment.razorpayPaymentId,
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
