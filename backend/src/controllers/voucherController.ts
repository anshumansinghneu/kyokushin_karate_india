import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { PAYMENT_CONFIG, calculateTotal } from '../services/paymentService';

// Generate a unique 8-character alphanumeric voucher code
const generateVoucherCode = (): string => {
    return 'KKFI-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// ─── Create Cash Voucher (Admin Only) ──────────────────────────────────
export const createVoucher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const adminUser = req.user;
    const { applicableTo, specificEventId, expiryDays } = req.body;

    if (!applicableTo) {
        return next(new AppError('Please specify what the voucher is for (MEMBERSHIP, TOURNAMENT, CAMP, or ALL)', 400));
    }

    // Calculate amount based on voucher type
    let amount: number;
    let description: string;

    if (applicableTo === 'MEMBERSHIP') {
        const { totalAmount } = calculateTotal(PAYMENT_CONFIG.MEMBERSHIP_FEE);
        amount = totalAmount;
        description = `Annual Membership Fee (₹${PAYMENT_CONFIG.MEMBERSHIP_FEE} + GST)`;
    } else if (specificEventId) {
        // Fetch event fee
        const event = await prisma.event.findUnique({
            where: { id: specificEventId },
            select: { id: true, name: true, memberFee: true },
        });
        if (!event) {
            return next(new AppError('Event not found', 404));
        }
        if (!event.memberFee || event.memberFee <= 0) {
            return next(new AppError('This event has no fee configured', 400));
        }
        amount = event.memberFee;
        description = `Event: ${event.name} (₹${event.memberFee})`;
    } else {
        // Generic voucher — admin must provide amount manually
        const { amount: manualAmount } = req.body;
        if (!manualAmount || manualAmount <= 0) {
            return next(new AppError('Please select an event or provide a custom amount', 400));
        }
        amount = manualAmount;
        description = `Cash voucher - ₹${amount}`;
    }

    // Generate unique code
    let code = generateVoucherCode();
    let attempts = 0;
    while (attempts < 5) {
        const existing = await prisma.cashVoucher.findUnique({ where: { code } });
        if (!existing) break;
        code = generateVoucherCode();
        attempts++;
    }

    // Default expiry: 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30));

    const voucher = await prisma.cashVoucher.create({
        data: {
            code,
            amount,
            applicableTo,
            specificEventId: specificEventId || null,
            expiryDate,
            createdBy: adminUser.id,
        },
    });

    res.status(201).json({
        status: 'success',
        message: `Voucher created successfully! Code: ${code}`,
        data: {
            voucher: {
                ...voucher,
                description,
            },
        },
    });
});

// ─── Validate Voucher Code (Public) ────────────────────────────────────
// Returns voucher info without redeeming it
export const validateVoucher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { code, type, eventId } = req.body;

    if (!code) {
        return next(new AppError('Please enter a voucher code', 400));
    }

    const voucher = await prisma.cashVoucher.findUnique({
        where: { code: code.trim().toUpperCase() },
        include: {
            specificEvent: { select: { id: true, name: true, memberFee: true } },
        },
    });

    if (!voucher) {
        return next(new AppError('Invalid voucher code', 404));
    }

    if (!voucher.isActive) {
        return next(new AppError('This voucher has been deactivated', 400));
    }

    if (voucher.isRedeemed) {
        return next(new AppError('This voucher has already been used', 400));
    }

    if (new Date() > voucher.expiryDate) {
        return next(new AppError('This voucher has expired', 400));
    }

    // Check applicability
    if (type === 'MEMBERSHIP' && voucher.applicableTo !== 'MEMBERSHIP' && voucher.applicableTo !== 'ALL') {
        return next(new AppError('This voucher is not applicable for membership registration', 400));
    }

    if (type === 'TOURNAMENT' || type === 'CAMP') {
        if (voucher.applicableTo !== type && voucher.applicableTo !== 'ALL') {
            return next(new AppError(`This voucher is not applicable for ${type.toLowerCase()} registration`, 400));
        }
        // If voucher is for a specific event, verify it matches
        if (voucher.specificEventId && eventId && voucher.specificEventId !== eventId) {
            return next(new AppError('This voucher is for a different event', 400));
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Voucher is valid!',
        data: {
            voucher: {
                id: voucher.id,
                code: voucher.code,
                amount: voucher.amount,
                applicableTo: voucher.applicableTo,
                expiryDate: voucher.expiryDate,
                eventName: voucher.specificEvent?.name || null,
            },
        },
    });
});

// ─── Redeem Voucher for Registration (Public — during registration) ────
// Creates user account with voucher instead of Razorpay payment
export const redeemVoucherForRegistration = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        voucherCode,
        email, password, name, phone, dob, height, weight, city, state, country,
        dojoId, instructorId, currentBeltRank, beltExamDate, beltClaimReason,
        yearsOfExperience, countryCode, fatherName, fatherPhone, role
    } = req.body;

    // Basic validation
    if (!voucherCode) return next(new AppError('Voucher code is required', 400));
    if (!password || password.length < 8) return next(new AppError('Password must be at least 8 characters', 400));
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) return next(new AppError('Password must contain at least one special character', 400));
    if (!email) return next(new AppError('Email is required', 400));
    if (!name) return next(new AppError('Name is required', 400));

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return next(new AppError('Email already exists', 400));

    // Validate voucher
    const voucher = await prisma.cashVoucher.findUnique({
        where: { code: voucherCode.trim().toUpperCase() },
    });

    if (!voucher) return next(new AppError('Invalid voucher code', 404));
    if (!voucher.isActive) return next(new AppError('This voucher has been deactivated', 400));
    if (voucher.isRedeemed) return next(new AppError('This voucher has already been used', 400));
    if (new Date() > voucher.expiryDate) return next(new AppError('This voucher has expired', 400));
    if (voucher.applicableTo !== 'MEMBERSHIP' && voucher.applicableTo !== 'ALL') {
        return next(new AppError('This voucher is not valid for membership registration', 400));
    }

    // All good — create user via transaction (similar to verifyRegistrationPayment)
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { sendRegistrationEmail, sendNewApplicantEmail } = require('../services/emailService');

    const hashedPassword = await bcrypt.hash(password, 12);
    const isStudent = (role || 'STUDENT') === 'STUDENT';
    const isInstructor = (role || 'STUDENT') === 'INSTRUCTOR';
    const requestedBelt = currentBeltRank || 'White';
    const isClaimingHigherBelt = isStudent && requestedBelt !== 'White';

    const membershipStartDate = new Date();
    const membershipEndDate = new Date();
    membershipEndDate.setDate(membershipEndDate.getDate() + PAYMENT_CONFIG.MEMBERSHIP_DURATION_DAYS);

    const userId = await prisma.$transaction(async (tx: any) => {
        // Resolve instructor — validate the ID exists before using it
        let resolvedInstructorId = null;
        if (instructorId) {
            const instructor = await tx.user.findUnique({ where: { id: instructorId }, select: { id: true } });
            if (instructor) resolvedInstructorId = instructor.id;
        }
        if (!resolvedInstructorId && isStudent) {
            const admin = await tx.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
            if (admin) resolvedInstructorId = admin.id;
        }

        let verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' = 'VERIFIED';
        let initialBelt = 'White';

        if (isInstructor) {
            initialBelt = requestedBelt;
        } else if (isStudent) {
            if (requestedBelt !== 'White') {
                initialBelt = 'White';
                verificationStatus = 'PENDING_VERIFICATION';
            }
        }

        // Create user
        const user = await tx.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                phone,
                countryCode: countryCode || '+91',
                dateOfBirth: dob ? new Date(dob) : undefined,
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                city, state,
                country: country || 'India',
                dojoId: (dojoId && dojoId !== 'fallback') ? dojoId : undefined,
                primaryInstructorId: resolvedInstructorId || undefined,
                role: role || 'STUDENT',
                membershipStatus: 'PENDING',
                membershipStartDate,
                membershipEndDate,
                currentBeltRank: initialBelt,
                verificationStatus,
                fatherName: isStudent ? fatherName : undefined,
                fatherPhone: isStudent ? fatherPhone : undefined,
            },
        });

        // Belt history/verification
        if (isClaimingHigherBelt) {
            await tx.beltVerificationRequest.create({
                data: {
                    studentId: user.id,
                    requestedBelt,
                    examDate: beltExamDate ? new Date(beltExamDate) : new Date(),
                    reason: beltClaimReason || `Student claims ${requestedBelt} belt from previous training`,
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

        // Create payment record (type MEMBERSHIP, marked as PAID via voucher)
        await tx.payment.create({
            data: {
                type: 'MEMBERSHIP',
                amount: PAYMENT_CONFIG.MEMBERSHIP_FEE,
                taxAmount: Math.round(PAYMENT_CONFIG.MEMBERSHIP_FEE * PAYMENT_CONFIG.GST_RATE * 100) / 100,
                totalAmount: voucher.amount,
                currency: 'INR',
                status: 'PAID',
                paidAt: new Date(),
                userId: user.id,
                description: `Annual Membership Fee - ${name} (Cash Voucher: ${voucherCode})`,
            },
        });

        // Mark voucher as redeemed
        await tx.cashVoucher.update({
            where: { id: voucher.id },
            data: {
                isRedeemed: true,
                redeemedBy: user.id,
                redeemedAt: new Date(),
            },
        });

        return user.id;
    });

    // Fetch user with relations
    const newUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            dojo: { select: { id: true, name: true, city: true, state: true } },
            primaryInstructor: { select: { email: true, name: true } },
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
    const signToken = (id: string) => jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '90d' });
    const token = signToken(userId);

    if (newUser) (newUser as any).passwordHash = undefined;

    res.status(201).json({
        status: 'success',
        message: 'Registration successful! Voucher redeemed. Awaiting instructor/admin approval.',
        token,
        data: {
            user: newUser,
            payment: {
                amount: voucher.amount,
                status: 'PAID',
                method: 'CASH_VOUCHER',
            },
        },
    });
});

// ─── Redeem Voucher for Event (Protected — logged in user) ─────────────
export const redeemVoucherForEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const { eventId } = req.params;
    const { voucherCode, eventType } = req.body;

    if (!voucherCode) return next(new AppError('Voucher code is required', 400));

    // Validate user
    if (currentUser.membershipStatus !== 'ACTIVE') {
        return next(new AppError('Only active members can register for events', 400));
    }

    // Fetch event
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));

    // Check if already registered
    const existingReg = await prisma.eventRegistration.findFirst({
        where: { eventId, userId: currentUser.id },
    });
    if (existingReg) return next(new AppError('You are already registered for this event', 400));

    // Validate voucher
    const voucher = await prisma.cashVoucher.findUnique({
        where: { code: voucherCode.trim().toUpperCase() },
    });

    if (!voucher) return next(new AppError('Invalid voucher code', 404));
    if (!voucher.isActive) return next(new AppError('This voucher has been deactivated', 400));
    if (voucher.isRedeemed) return next(new AppError('This voucher has already been used', 400));
    if (new Date() > voucher.expiryDate) return next(new AppError('This voucher has expired', 400));

    // Check applicability
    const eventTypeLower = event.type; // TOURNAMENT, CAMP, SEMINAR
    if (voucher.applicableTo !== 'ALL') {
        if (voucher.applicableTo !== eventTypeLower) {
            return next(new AppError(`This voucher is not valid for ${eventTypeLower} events`, 400));
        }
    }
    if (voucher.specificEventId && voucher.specificEventId !== eventId) {
        return next(new AppError('This voucher is for a different event', 400));
    }

    // Create event registration + mark voucher
    const result = await prisma.$transaction(async (tx: any) => {
        // Create payment record
        const payment = await tx.payment.create({
            data: {
                type: 'TOURNAMENT',
                amount: event.memberFee || 0,
                taxAmount: 0,
                totalAmount: event.memberFee || 0,
                currency: 'INR',
                status: 'PAID',
                paidAt: new Date(),
                userId: currentUser.id,
                eventId,
                description: `Event Registration - ${event.name} (Cash Voucher: ${voucherCode})`,
            },
        });

        // Create event registration
        const registration = await tx.eventRegistration.create({
            data: {
                eventId,
                userId: currentUser.id,
                eventType: eventType || null,
                paymentStatus: 'PAID',
                paymentAmount: event.memberFee || 0,
                voucherCodeUsed: voucherCode,
                discountAmount: event.memberFee || 0,
                finalAmount: 0,
                approvalStatus: event.type === 'TOURNAMENT' ? 'PENDING' : 'APPROVED',
            },
        });

        // Mark voucher as redeemed
        await tx.cashVoucher.update({
            where: { id: voucher.id },
            data: {
                isRedeemed: true,
                redeemedBy: currentUser.id,
                redeemedAt: new Date(),
            },
        });

        return registration;
    });

    res.status(201).json({
        status: 'success',
        message: 'Event registration successful! Voucher redeemed.',
        data: { registration: result },
    });
});

// ─── Get All Vouchers (Admin Only) ─────────────────────────────────────
export const getAllVouchers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const vouchers = await prisma.cashVoucher.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            creator: { select: { id: true, name: true } },
            redeemedByUser: { select: { id: true, name: true, email: true } },
            specificEvent: { select: { id: true, name: true } },
        },
    });

    res.status(200).json({
        status: 'success',
        results: vouchers.length,
        data: { vouchers },
    });
});

// ─── Deactivate Voucher (Admin Only) ───────────────────────────────────
export const deactivateVoucher = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const voucher = await prisma.cashVoucher.findUnique({ where: { id } });
    if (!voucher) return next(new AppError('Voucher not found', 404));

    await prisma.cashVoucher.update({
        where: { id },
        data: { isActive: false },
    });

    res.status(200).json({
        status: 'success',
        message: 'Voucher deactivated successfully',
    });
});
