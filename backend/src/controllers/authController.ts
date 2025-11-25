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

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return next(new AppError('Email already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            name,
            phone,
            dateOfBirth: dob ? new Date(dob) : undefined,
            height,
            weight,
            city,
            state,
            country,
            dojoId,
            primaryInstructorId: instructorId,
            role: 'STUDENT',
            membershipStatus: 'PENDING',
            currentBeltRank,
        },
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
