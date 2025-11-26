import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

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
    const { email, password, name, phone, dob, height, weight, city, state, country, dojoId, instructorId, currentBeltRank } = req.body;

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

    // Use transaction to create user and initial belt history
    const userId = await prisma.$transaction(async (tx) => {
        // ALL STUDENTS START AT WHITE BELT - Higher belts require instructor verification
        const initialBelt = req.body.role === 'STUDENT' ? 'White' : (currentBeltRank || 'White');
        
        const user = await tx.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                phone,
                dateOfBirth: dob ? new Date(dob) : undefined,
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                city,
                state,
                country: country || 'India',
                dojoId,
                primaryInstructorId: instructorId,
                role: req.body.role || 'STUDENT',
                membershipStatus: 'PENDING',
                currentBeltRank: initialBelt,
            },
        });

        // Create initial belt history record
        await tx.beltHistory.create({
            data: {
                studentId: user.id,
                oldBelt: null,
                newBelt: initialBelt,
                promotedBy: instructorId || null,
                notes: req.body.role === 'STUDENT' ? 'Initial registration - Started at White Belt' : 'Initial registration',
                promotionDate: new Date(),
            },
        });

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
            }
        }
    });

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
