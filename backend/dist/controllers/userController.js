"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.inviteUser = exports.createUser = exports.deleteUser = exports.updateMe = exports.rejectUser = exports.approveUser = exports.getUser = exports.getAllUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
const emailService_1 = require("../services/emailService");
exports.getAllUsers = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // @ts-ignore
    const currentUser = req.user;
    let where = {};
    // Instructor can see ALL students (Global Directory)
    if (currentUser.role === 'INSTRUCTOR') {
        // No restriction on dojoId for viewing
        where.role = 'STUDENT';
    }
    // Student can only see themselves (though they shouldn't really call this endpoint)
    else if (currentUser.role === 'STUDENT') {
        where.id = currentUser.id;
    }
    // Admin sees all, or can filter
    if (req.query.role) {
        const roles = req.query.role.split(',');
        if (roles.length > 1) {
            where.role = { in: roles };
        }
        else {
            where.role = roles[0];
        }
    }
    if (req.query.dojoId) {
        where.dojoId = req.query.dojoId;
    }
    if (req.query.status) {
        where.membershipStatus = req.query.status;
    }
    const users = await prisma_1.default.user.findMany({
        where,
        include: {
            dojo: true,
            primaryInstructor: {
                select: { name: true }
            }
        }
    });
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});
exports.getUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.params.id },
        include: {
            dojo: true,
            beltHistory: true,
            tournamentResults: true
        }
    });
    if (!user) {
        return next(new errorHandler_1.AppError('No user found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});
// Generate Membership Number: KKI-[YEAR]-[DOJO_CODE]-[SEQUENCE]
const generateMembershipNumber = async (dojoId) => {
    const dojo = await prisma_1.default.dojo.findUnique({ where: { id: dojoId } });
    if (!dojo)
        throw new errorHandler_1.AppError('Dojo not found', 404);
    const year = new Date().getFullYear();
    const dojoCode = dojo.dojoCode;
    // Count existing members in this dojo for this year to generate sequence
    // This is a simplified sequence generation. In production, might need a separate counter table to avoid race conditions.
    const count = await prisma_1.default.user.count({
        where: {
            dojoId,
            membershipNumber: {
                startsWith: `KKI-${year}-${dojoCode}`
            }
        }
    });
    const sequence = (count + 1).toString().padStart(5, '0');
    return `KKI-${year}-${dojoCode}-${sequence}`;
};
exports.approveUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const userId = req.params.id;
    // @ts-ignore
    const currentUser = req.user;
    const userToApprove = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!userToApprove) {
        return next(new errorHandler_1.AppError('User not found', 404));
    }
    // Instructor Approval
    if (currentUser.role === 'INSTRUCTOR') {
        if (userToApprove.dojoId !== currentUser.dojoId) {
            return next(new errorHandler_1.AppError('You can only approve students from your dojo', 403));
        }
        if (userToApprove.isInstructorApproved) {
            return next(new errorHandler_1.AppError('Student is already approved by instructor', 400));
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                isInstructorApproved: true,
                instructorApprovedAt: new Date(),
                // Status remains PENDING until Admin approves
            }
        });
        // Notify Admin about Instructor Approval
        // In a real app, we'd fetch Admin email. For now, mock it.
        await (0, emailService_1.sendInstructorApprovalEmail)('admin@kyokushin.com', userToApprove.name, currentUser.name);
        res.status(200).json({
            status: 'success',
            message: 'Student approved by instructor. Waiting for Admin confirmation.',
            data: {
                user: updatedUser
            }
        });
        return;
    }
    // Admin Approval
    if (currentUser.role === 'ADMIN') {
        const membershipNumber = await generateMembershipNumber(userToApprove.dojoId);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                membershipStatus: 'ACTIVE',
                membershipNumber,
                membershipStartDate: startDate,
                membershipEndDate: endDate,
                approvedBy: currentUser.id,
                approvedAt: new Date(),
            },
        });
        // Send Email Notification
        await (0, emailService_1.sendMembershipActiveEmail)(updatedUser.email, updatedUser.name, membershipNumber);
        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
            },
        });
    }
    else {
        return next(new errorHandler_1.AppError('Not authorized to approve users', 403));
    }
});
exports.rejectUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const userId = req.params.id;
    const updatedUser = await prisma_1.default.user.update({
        where: { id: userId },
        data: {
            membershipStatus: 'REJECTED',
        },
    });
    // Send Email Notification
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (user) {
        await (0, emailService_1.sendRejectionEmail)(user.email, user.name);
    }
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});
exports.updateMe = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // @ts-ignore
    const currentUser = req.user;
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new errorHandler_1.AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    // For now, allow updating phone, city, address, bio/description, and profilePhotoUrl
    const allowedFields = ['phone', 'city', 'address', 'description', 'profilePhotoUrl'];
    const filteredBody = {};
    Object.keys(req.body).forEach(el => {
        if (allowedFields.includes(el))
            filteredBody[el] = req.body[el];
    });
    // 3) Update user document
    const updatedUser = await prisma_1.default.user.update({
        where: { id: currentUser.id },
        data: filteredBody,
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});
exports.deleteUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    await prisma_1.default.user.delete({
        where: { id }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
});
exports.createUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, email, password, role, phone, dojoId, currentBeltRank, membershipStatus, city, state } = req.body;
    // Validation
    if (!name || !email || !password || !role) {
        return next(new errorHandler_1.AppError('Please provide name, email, password, and role', 400));
    }
    if (password.length < 8) {
        return next(new errorHandler_1.AppError('Password must be at least 8 characters long', 400));
    }
    if (!['STUDENT', 'INSTRUCTOR'].includes(role)) {
        return next(new errorHandler_1.AppError('Role must be either STUDENT or INSTRUCTOR', 400));
    }
    // Check if user already exists
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        return next(new errorHandler_1.AppError('User with this email already exists', 400));
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    // Prepare user data based on role
    const userData = {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        phone: phone || null,
        city: city || null,
        state: state || null,
        country: 'India',
        dojoId: dojoId || null,
    };
    // Role-specific defaults
    if (role === 'STUDENT') {
        // Generate membership number if dojo is assigned
        let membershipNumber = null;
        if (dojoId) {
            membershipNumber = await generateMembershipNumber(dojoId);
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        userData.membershipNumber = membershipNumber;
        userData.membershipStatus = membershipStatus || 'ACTIVE';
        userData.membershipStartDate = startDate;
        userData.membershipEndDate = endDate;
        userData.currentBeltRank = currentBeltRank || 'White';
        userData.isInstructorApproved = true; // Auto-approved
        // @ts-ignore
        userData.approvedBy = req.user.id;
        userData.approvedAt = new Date();
    }
    else if (role === 'INSTRUCTOR') {
        userData.isInstructorApproved = true;
        userData.instructorApprovedAt = new Date();
        userData.membershipStatus = 'ACTIVE';
        // @ts-ignore
        userData.approvedBy = req.user.id;
        userData.approvedAt = new Date();
    }
    // Create user
    const newUser = await prisma_1.default.user.create({
        data: userData,
        include: {
            dojo: true
        }
    });
    res.status(201).json({
        status: 'success',
        message: `${role} created successfully`,
        data: {
            user: newUser
        }
    });
});
exports.inviteUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, email, phone } = req.body;
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        return next(new errorHandler_1.AppError('User with this email already exists', 400));
    }
    // In a real app, we would generate a random password and email it.
    // For now, we'll set a default password 'welcome123'
    const hashedPassword = await bcryptjs_1.default.hash('welcome123', 12);
    const newUser = await prisma_1.default.user.create({
        data: {
            name,
            email,
            phone,
            passwordHash: hashedPassword,
            role: 'STUDENT',
            membershipStatus: 'PENDING',
            // @ts-ignore
            dojoId: req.user.dojoId // Assign to instructor's dojo if available
        }
    });
    // Send Email Notification (Invite)
    // Re-using Registration Email or creating a specific Invite one. 
    // For now, let's use sendRegistrationEmail as a placeholder or create a new one.
    // Let's use sendRegistrationEmail for simplicity as it welcomes them.
    await (0, emailService_1.sendRegistrationEmail)(newUser.email, newUser.name);
    res.status(201).json({
        status: 'success',
        message: 'Invitation sent successfully',
        data: {
            user: newUser
        }
    });
});
exports.updateUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    // Filter out fields that shouldn't be updated directly if needed, 
    // but for Admin, we generally trust them. 
    // However, password updates should still go through a specific route or be hashed if allowed here.
    // For now, let's exclude password from this general update to be safe.
    const { password, passwordConfirm, ...dataToUpdate } = req.body;
    const updatedUser = await prisma_1.default.user.update({
        where: { id },
        data: dataToUpdate,
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});
