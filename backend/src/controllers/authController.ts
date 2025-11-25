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
    const { email, password, name, phone, countryCode, dob, height, weight, city, state, country, dojoId, instructorId, currentBeltRank, fatherName, fatherPhone } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return next(new AppError('Email already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Use transaction to create user and initial belt history
    const userId = await prisma.$transaction(async (tx) => {
        const userData: any = {
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
            role: 'STUDENT',
            membershipStatus: 'PENDING',
            currentBeltRank: currentBeltRank || 'White',
        };

        // Add new fields only if they exist in schema (backward compatible)
        if (countryCode !== undefined) userData.countryCode = countryCode || '+91';
        if (fatherName !== undefined) userData.fatherName = fatherName;
        if (fatherPhone !== undefined) userData.fatherPhone = fatherPhone;

        const user = await tx.user.create({
            data: userData,
        });

        // Create initial belt history record
        await tx.beltHistory.create({
            data: {
                studentId: user.id,
                oldBelt: null,
                newBelt: currentBeltRank || 'White',
                promotedBy: instructorId || null,
                notes: 'Initial registration',
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
