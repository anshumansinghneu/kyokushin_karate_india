"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
const signToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '90d',
    });
};
const createSendToken = (user, statusCode, res) => {
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
exports.register = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { email, password, name, phone, dob, height, weight, city, state, country, dojoId, instructorId, currentBeltRank } = req.body;
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return next(new errorHandler_1.AppError('Email already exists', 400));
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const newUser = await prisma_1.default.user.create({
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
exports.login = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errorHandler_1.AppError('Please provide email and password', 400));
    }
    const user = await prisma_1.default.user.findUnique({
        where: { email },
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        return next(new errorHandler_1.AppError('Incorrect email or password', 401));
    }
    createSendToken(user, 200, res);
});
exports.getMe = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // @ts-ignore
    const userId = req.user.id;
    const user = await prisma_1.default.user.findUnique({
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
