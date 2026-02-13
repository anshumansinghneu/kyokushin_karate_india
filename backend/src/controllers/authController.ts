import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendRegistrationEmail, sendNewApplicantEmail, sendPasswordResetEmail } from '../services/emailService';

const signToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: '90d',
    });
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
    const token = signToken(user.id);

    // Remove password from output
    user.passwordHash = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name, phone, dob, height, weight, city, state, country, dojoId, instructorId, currentBeltRank, beltExamDate, beltClaimReason, yearsOfExperience, countryCode, fatherName, fatherPhone, experienceYears, experienceMonths } = req.body;

    // Password validation
    if (!password || password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long', 400));
    }

    // Check for at least one special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
        return next(new AppError('Password must contain at least one special character', 400));
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return next(new AppError('Email already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Use transaction to create user and handle belt logic
    const userId = await prisma.$transaction(async (tx) => {
        const isStudent = req.body.role === 'STUDENT';
        const isInstructor = req.body.role === 'INSTRUCTOR';
        const requestedBelt = currentBeltRank || 'White';
        const isClaimingHigherBelt = isStudent && requestedBelt !== 'White';

        // If no instructor specified, default to the admin (Shihan)
        let resolvedInstructorId = instructorId;
        if (!resolvedInstructorId && isStudent) {
            const admin = await tx.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
            if (admin) resolvedInstructorId = admin.id;
        }

        // Determine verification status and initial belt
        let verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' = 'VERIFIED';
        let initialBelt = 'White';

        if (isInstructor) {
            // Instructors can set their belt directly
            initialBelt = requestedBelt;
        } else if (isStudent) {
            if (requestedBelt === 'White') {
                // White belt students are auto-verified
                initialBelt = 'White';
                verificationStatus = 'VERIFIED';
            } else {
                // Higher belt claims need verification
                initialBelt = 'White'; // Start at White until verified
                verificationStatus = 'PENDING_VERIFICATION';
            }
        }

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
                city,
                state,
                country: country || 'India',
                dojoId: dojoId || undefined,
                primaryInstructorId: resolvedInstructorId || undefined,
                role: req.body.role || 'STUDENT',
                membershipStatus: 'PENDING',
                currentBeltRank: initialBelt,
                verificationStatus,
                fatherName: isStudent ? fatherName : undefined,
                fatherPhone: isStudent ? fatherPhone : undefined,
                experienceYears: experienceYears ? parseInt(experienceYears) : 0,
                experienceMonths: experienceMonths ? parseInt(experienceMonths) : 0,
            },
        });

        if (isClaimingHigherBelt) {
            // Create belt verification request for instructor review
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
            // Create initial belt history for auto-approved cases
            await tx.beltHistory.create({
                data: {
                    studentId: user.id,
                    oldBelt: null,
                    newBelt: initialBelt,
                    promotedBy: instructorId || user.id,
                    notes: isInstructor ? 'Initial registration - Instructor' : 'Initial registration - White Belt',
                    promotionDate: new Date(),
                },
            });
        }

        return user.id;
    });

    // Fetch user with relations
    const newUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            dojo: {
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                }
            },
            primaryInstructor: {
                select: { email: true, name: true }
            }
        }
    });

    // Send welcome email to the new user
    if (newUser) {
        try {
            await sendRegistrationEmail(newUser.email, newUser.name);
        } catch (e) {
            console.error('[AUTH] Failed to send registration email:', e);
        }

        // Notify their instructor about the new applicant
        if (newUser.primaryInstructor?.email) {
            try {
                await sendNewApplicantEmail(newUser.primaryInstructor.email, newUser.name);
            } catch (e) {
                console.error('[AUTH] Failed to send new applicant email:', e);
            }
        }
    }

    createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            dojo: {
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                }
            }
        }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
});

export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            dojo: true,
            beltHistory: {
                orderBy: { promotionDate: 'desc' }
            },
            tournamentResults: {
                include: { event: true }
            },
            registrations: {
                include: { event: true },
                orderBy: { registeredAt: 'desc' }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// ── Password Reset ─────────────────────────────────────────

// In-memory store for reset tokens (key: hashedToken → { userId, expires })
// In production you'd use a DB table, but this is simple and effective for moderate scale
const resetTokens = new Map<string, { userId: string; expires: Date }>();

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) return next(new AppError('Please provide an email address', 400));

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
        return res.status(200).json({
            status: 'success',
            message: 'If that email is registered, a reset link has been sent.',
        });
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    resetTokens.set(hashedToken, { userId: user.id, expires });

    // Clean up old tokens (older than 2 hours)
    for (const [key, val] of resetTokens.entries()) {
        if (val.expires < new Date()) resetTokens.delete(key);
    }

    // Send email with raw token (user will send it back, we hash to compare)
    await sendPasswordResetEmail(user.email, user.name, rawToken);

    res.status(200).json({
        status: 'success',
        message: 'If that email is registered, a reset link has been sent.',
    });
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token, password } = req.body;
    if (!token || !password) return next(new AppError('Token and password are required', 400));

    if (password.length < 8) return next(new AppError('Password must be at least 8 characters', 400));
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) return next(new AppError('Password must contain at least one special character', 400));

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const stored = resetTokens.get(hashedToken);

    if (!stored || stored.expires < new Date()) {
        resetTokens.delete(hashedToken);
        return next(new AppError('Token is invalid or has expired', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash: hashedPassword },
    });

    // Invalidate the token
    resetTokens.delete(hashedToken);

    createSendToken(user, 200, res);
});
