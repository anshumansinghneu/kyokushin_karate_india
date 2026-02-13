import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendInstructorApprovalEmail, sendMembershipActiveEmail, sendRejectionEmail, sendRegistrationEmail, sendAdminCreatedUserEmail } from '../services/emailService';

export const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;

    let where: any = {};

    // Instructor can only see their assigned students
    if (currentUser.role === 'INSTRUCTOR') {
        where.role = 'STUDENT';
        where.primaryInstructorId = currentUser.id;
    }
    // Student can only see themselves
    else if (currentUser.role === 'STUDENT') {
        where.id = currentUser.id;
    }

    // Admin sees all, or can filter
    if (req.query.role) {
        const roles = (req.query.role as string).split(',');
        if (roles.length > 1) {
            where.role = { in: roles };
        } else {
            where.role = roles[0];
        }
    }
    if (req.query.dojoId) {
        where.dojoId = req.query.dojoId;
    }
    if (req.query.status) {
        where.membershipStatus = req.query.status;
    }

    const users = await prisma.user.findMany({
        where,
        include: {
            dojo: true,
            primaryInstructor: {
                select: { name: true }
            }
        }
    });

    // Strip passwordHash from all users
    const safeUsers = users.map(({ passwordHash, ...rest }) => rest);

    res.status(200).json({
        status: 'success',
        results: safeUsers.length,
        data: {
            users: safeUsers,
        },
    });
});

export const searchUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: {
                users: [],
            },
        });
    }

    const searchTerm = query.trim();

    // Build where clause for search
    let where: any = {
        OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { membershipNumber: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
        ],
    };

    // Instructor can only search their assigned students
    if (currentUser.role === 'INSTRUCTOR') {
        where.AND = [
            { role: 'STUDENT' },
            { primaryInstructorId: currentUser.id },
        ];
    }
    // Student can only search themselves (not very useful, but for consistency)
    else if (currentUser.role === 'STUDENT') {
        where.AND = [{ id: currentUser.id }];
    }
    // Admin can search all users

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            membershipNumber: true,
            currentBeltRank: true,
            role: true,
            membershipStatus: true,
            dojo: {
                select: {
                    name: true,
                },
            },
        },
        take: 20, // Limit results
        orderBy: {
            name: 'asc',
        },
    });

    // Transform results to include dojoName at top level
    const transformedUsers = users.map(user => ({
        ...user,
        dojoName: user.dojo?.name,
        dojo: undefined, // Remove nested dojo object
        status: user.membershipStatus,
        membershipId: user.membershipNumber,
    }));

    res.status(200).json({
        status: 'success',
        results: transformedUsers.length,
        data: {
            users: transformedUsers,
        },
    });
});

export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;

    // Authorization: students can only view themselves
    if (currentUser.role === 'STUDENT' && currentUser.id !== req.params.id) {
        return next(new AppError('You are not authorized to view this user', 403));
    }

    // Instructors can only view their own students or themselves
    if (currentUser.role === 'INSTRUCTOR' && currentUser.id !== req.params.id) {
        const targetUser = await prisma.user.findUnique({ where: { id: req.params.id }, select: { primaryInstructorId: true } });
        if (!targetUser || targetUser.primaryInstructorId !== currentUser.id) {
            return next(new AppError('You are not authorized to view this user', 403));
        }
    }

    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
            dojo: true,
            beltHistory: true,
            tournamentResults: true
        }
    });

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    // Strip passwordHash
    const { passwordHash, ...safeUser } = user as any;

    res.status(200).json({
        status: 'success',
        data: {
            user: safeUser,
        },
    });
});

// Lookup user by membership number (public-facing for future member lookup feature)
export const getUserByMembershipId = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { membershipId } = req.params;

    const user = await prisma.user.findFirst({
        where: { membershipNumber: membershipId.toUpperCase() },
        select: {
            id: true,
            name: true,
            membershipNumber: true,
            membershipStatus: true,
            currentBeltRank: true,
            role: true,
            profilePhotoUrl: true,
            city: true,
            state: true,
            dojo: { select: { name: true, city: true } },
            beltHistory: {
                orderBy: { promotionDate: 'desc' },
                select: {
                    newBelt: true,
                    promotionDate: true,
                }
            },
        },
    });

    if (!user) {
        return next(new AppError('No member found with that membership ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

// Generate Membership Number by role:
//   Admin:      KKFI-ADM-0001
//   Instructor: KKFI-INS-0001
//   Student:    KKFI-STD-00001
const getRolePrefix = (role: string) => {
    switch (role) {
        case 'ADMIN': return { prefix: 'KKFI-ADM-', pad: 4 };
        case 'INSTRUCTOR': return { prefix: 'KKFI-INS-', pad: 4 };
        default: return { prefix: 'KKFI-STD-', pad: 5 };
    }
};

const generateMembershipNumber = async (role: string) => {
    const { prefix, pad } = getRolePrefix(role);

    // Find the highest existing sequence for this role prefix
    const lastUser = await prisma.user.findFirst({
        where: {
            membershipNumber: { startsWith: prefix }
        },
        orderBy: { membershipNumber: 'desc' },
        select: { membershipNumber: true }
    });

    let nextSeq = 1;
    if (lastUser?.membershipNumber) {
        const seqStr = lastUser.membershipNumber.replace(prefix, '');
        const parsed = parseInt(seqStr, 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    return `${prefix}${nextSeq.toString().padStart(pad, '0')}`;
};

export const approveUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    // @ts-ignore
    const currentUser = req.user;

    const userToApprove = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToApprove) {
        return next(new AppError('User not found', 404));
    }

    // Instructor Approval
    if (currentUser.role === 'INSTRUCTOR') {
        if (userToApprove.primaryInstructorId !== currentUser.id) {
            return next(new AppError('You can only approve students assigned to you', 403));
        }

        if (userToApprove.isInstructorApproved) {
            return next(new AppError('Student is already approved by instructor', 400));
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                isInstructorApproved: true,
                instructorApprovedAt: new Date(),
                // Status remains PENDING until Admin approves
            }
        });

        // Notify Admin about Instructor Approval (non-blocking)
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (admin) {
            sendInstructorApprovalEmail(admin.email, userToApprove.name, currentUser.name)
                .catch(err => console.error('[APPROVE] Instructor approval email failed:', err?.message));
        }

        res.status(200).json({
            status: 'success',
            message: 'Student approved by instructor. Waiting for Admin confirmation.',
            data: {
                user: (() => { const { passwordHash: _p, ...safe } = updatedUser as any; return safe; })()
            }
        });
        return;
    }

    // Admin Approval
    if (currentUser.role === 'ADMIN') {
        // Idempotency guard: if already approved, return existing data
        if (userToApprove.membershipStatus === 'ACTIVE' && userToApprove.membershipNumber) {
            const { passwordHash: _p, ...safeApproved } = userToApprove as any;
            return res.status(200).json({
                status: 'success',
                message: 'User is already approved.',
                data: { user: safeApproved },
            });
        }

        // Use serializable transaction to prevent race conditions on membership number
        const updatedUser = await prisma.$transaction(async (tx) => {
            const membershipNumber = await (async () => {
                const { prefix, pad } = getRolePrefix(userToApprove.role);
                const lastUser = await tx.user.findFirst({
                    where: { membershipNumber: { startsWith: prefix } },
                    orderBy: { membershipNumber: 'desc' },
                    select: { membershipNumber: true },
                });
                let nextSeq = 1;
                if (lastUser?.membershipNumber) {
                    const seqStr = lastUser.membershipNumber.replace(prefix, '');
                    const parsed = parseInt(seqStr, 10);
                    if (!isNaN(parsed)) nextSeq = parsed + 1;
                }
                return `${prefix}${nextSeq.toString().padStart(pad, '0')}`;
            })();

            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);

            return tx.user.update({
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
        });

        // Send Email Notification (non-blocking)
        sendMembershipActiveEmail(updatedUser.email, updatedUser.name, updatedUser.membershipNumber!)
            .catch(err => console.error('[APPROVE] Membership active email failed:', err?.message));

        const { passwordHash: _ph2, ...safeApprovedUser } = updatedUser as any;

        res.status(200).json({
            status: 'success',
            data: {
                user: safeApprovedUser,
            },
        });
    } else {
        return next(new AppError('Not authorized to approve users', 403));
    }
});

export const rejectUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            membershipStatus: 'REJECTED',
        },
    });

    // Send Email Notification (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        sendRejectionEmail(user.email, user.name)
            .catch(err => console.error('[REJECT] Rejection email failed:', err?.message));
    }

    // Strip passwordHash
    const { passwordHash: _ph, ...safeRejectedUser } = updatedUser as any;

    res.status(200).json({
        status: 'success',
        data: {
            user: safeRejectedUser,
        },
    });
});

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;

    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    // For now, allow updating phone, city, address, bio/description, profilePhotoUrl, height, and weight
    const allowedFields = ['name', 'phone', 'countryCode', 'city', 'state', 'country', 'profilePhotoUrl', 'height', 'weight', 'fatherName', 'fatherPhone', 'dateOfBirth'];
    const filteredBody: any = {};
    Object.keys(req.body).forEach(el => {
        if (allowedFields.includes(el)) {
            // Convert height and weight to numbers
            if (el === 'height' || el === 'weight') {
                filteredBody[el] = req.body[el] ? parseFloat(req.body[el]) : null;
            // Convert date fields
            } else if (el === 'dateOfBirth') {
                filteredBody[el] = req.body[el] ? new Date(req.body[el]) : null;
            } else {
                filteredBody[el] = req.body[el];
            }
        }
    });

    // 3) Update user document
    const updatedUser = await prisma.user.update({
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

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    // Delete all related records in a transaction to avoid FK constraint errors
    await prisma.$transaction(async (tx) => {
        // Delete merch order items first (depends on merch orders)
        const merchOrders = await tx.merchOrder.findMany({ where: { userId: id }, select: { id: true } });
        if (merchOrders.length > 0) {
            await tx.merchOrderItem.deleteMany({ where: { orderId: { in: merchOrders.map(o => o.id) } } });
        }
        await tx.merchOrder.deleteMany({ where: { userId: id } });

        // Payments, notifications, training
        await tx.payment.deleteMany({ where: { userId: id } });
        await tx.notification.deleteMany({ where: { userId: id } });
        await tx.trainingSession.deleteMany({ where: { userId: id } });

        // Posts & recognition
        await tx.post.deleteMany({ where: { authorId: id } });
        await tx.monthlyRecognition.deleteMany({ where: { userId: id } });

        // Notes & profile views
        await tx.studentNote.deleteMany({ where: { OR: [{ studentId: id }, { createdBy: id }] } });
        await tx.profileView.deleteMany({ where: { OR: [{ studentId: id }, { viewedBy: id }] } });

        // Gallery & vouchers
        await tx.gallery.deleteMany({ where: { OR: [{ uploadedBy: id }, { approvedBy: id }] } });
        await tx.cashVoucher.deleteMany({ where: { OR: [{ createdBy: id }, { redeemedBy: id }] } });

        // Tournament related
        await tx.tournamentResult.deleteMany({ where: { userId: id } });
        await tx.match.deleteMany({ where: { OR: [{ fighterAId: id }, { fighterBId: id }, { winnerId: id }] } });

        // Event registrations (nullify approver first, then delete user's own)
        await tx.eventRegistration.updateMany({ where: { approvedBy: id }, data: { approvedBy: null } });
        await tx.eventRegistration.deleteMany({ where: { userId: id } });

        // Events created by user — remove notifications & registrations first
        const events = await tx.event.findMany({ where: { createdBy: id }, select: { id: true } });
        if (events.length > 0) {
            const eventIds = events.map(e => e.id);
            await tx.notification.deleteMany({ where: { relatedEventId: { in: eventIds } } });
            await tx.payment.deleteMany({ where: { eventId: { in: eventIds } } });
            await tx.eventRegistration.deleteMany({ where: { eventId: { in: eventIds } } });
            await tx.gallery.deleteMany({ where: { eventId: { in: eventIds } } });
            await tx.cashVoucher.deleteMany({ where: { specificEventId: { in: eventIds } } });
            // Delete bracket-related data
            const brackets = await tx.tournamentBracket.findMany({ where: { eventId: { in: eventIds } }, select: { id: true } });
            if (brackets.length > 0) {
                const bracketIds = brackets.map(b => b.id);
                await tx.match.deleteMany({ where: { bracketId: { in: bracketIds } } });
                await tx.tournamentResult.deleteMany({ where: { bracketId: { in: bracketIds } } });
                await tx.tournamentBracket.deleteMany({ where: { id: { in: bracketIds } } });
            }
            await tx.event.deleteMany({ where: { id: { in: eventIds } } });
        }

        // Belt related
        await tx.beltVerificationRequest.deleteMany({ where: { OR: [{ studentId: id }, { reviewedBy: id }] } });
        await tx.beltHistory.deleteMany({ where: { OR: [{ studentId: id }, { promotedBy: id }] } });

        // Unlink students referencing this user as instructor/approver
        await tx.user.updateMany({ where: { primaryInstructorId: id }, data: { primaryInstructorId: null } });
        await tx.user.updateMany({ where: { approvedBy: id }, data: { approvedBy: null } });

        // Finally delete the user
        await tx.user.delete({ where: { id } });
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, phone, countryCode, dojoId, currentBeltRank, membershipStatus, city, state, height, weight, fatherName, fatherPhone, dob } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
        return next(new AppError('Please provide name, email, password, and role', 400));
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
    }

    if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long', 400));
    }

    if (!['STUDENT', 'INSTRUCTOR'].includes(role)) {
        return next(new AppError('Role must be either STUDENT or INSTRUCTOR', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
        return next(new AppError('User with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user data based on role
    const userData: any = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        role,
        phone: phone || null,
        countryCode: countryCode || '+91',
        dateOfBirth: dob ? new Date(dob) : null,
        city: city || null,
        state: state || null,
        country: 'India',
        dojoId: dojoId || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        fatherName: fatherName || null,
        fatherPhone: fatherPhone || null,
    };

    // Auto-assign primaryInstructorId if a dojo is selected
    if (dojoId && role === 'STUDENT') {
        const dojoInstructor = await prisma.user.findFirst({
            where: {
                dojoId,
                role: 'INSTRUCTOR',
                membershipStatus: 'ACTIVE'
            },
            select: { id: true }
        });
        if (dojoInstructor) {
            userData.primaryInstructorId = dojoInstructor.id;
        }
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Role-specific defaults
    if (role === 'STUDENT') {
        const membershipNumber = await generateMembershipNumber(role);

        userData.membershipNumber = membershipNumber;
        userData.membershipStatus = membershipStatus || 'ACTIVE';
        userData.membershipStartDate = startDate;
        userData.membershipEndDate = endDate;
        userData.currentBeltRank = currentBeltRank || 'White';
        userData.isInstructorApproved = true; // Auto-approved by admin
        // @ts-ignore
        userData.approvedBy = req.user.id;
        userData.approvedAt = new Date();
    } else if (role === 'INSTRUCTOR') {
        const instrMembershipNumber = await generateMembershipNumber('INSTRUCTOR');
        userData.membershipNumber = instrMembershipNumber;
        userData.isInstructorApproved = true;
        userData.instructorApprovedAt = new Date();
        userData.membershipStatus = 'ACTIVE';
        userData.membershipStartDate = startDate;
        userData.membershipEndDate = endDate;
        userData.currentBeltRank = currentBeltRank || 'Black';
        // @ts-ignore
        userData.approvedBy = req.user.id;
        userData.approvedAt = new Date();
    }

    // Create user
    const newUser = await prisma.user.create({
        data: userData,
        include: {
            dojo: true
        }
    });

    // Send welcome email with login credentials (non-blocking)
    console.log(`[CREATE USER] Sending welcome email to ${newUser.email} (role: ${role}, membership: ${newUser.membershipNumber})`);
    sendAdminCreatedUserEmail(
        newUser.email,
        newUser.name,
        password,
        role,
        newUser.membershipNumber || ''
    ).then(() => {
        console.log(`[CREATE USER] ✅ Welcome email sent to ${newUser.email}`);
    }).catch(err => {
        console.error(`[CREATE USER] ❌ Email FAILED for ${newUser.email}:`, err?.message || err);
        if (err?.code) console.error(`[CREATE USER] Error code: ${err.code}`);
        if (err?.response) console.error(`[CREATE USER] SMTP response: ${err.response}`);
    });

    // Exclude sensitive fields from response
    const { passwordHash, ...safeUser } = newUser as any;

    res.status(201).json({
        status: 'success',
        message: `${role} created successfully. A welcome email with login credentials will be sent shortly.`,
        data: {
            user: safeUser
        }
    });
});

export const inviteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { name, email, phone } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return next(new AppError('User with this email already exists', 400));
    }

    // Generate a secure random password
    const randomPassword = crypto.randomBytes(12).toString('base64url').slice(0, 16) + '!A1';
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const newUser = await prisma.user.create({
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

    // Send Email Notification (non-blocking)
    sendRegistrationEmail(newUser.email, newUser.name)
        .catch(err => console.error('[INVITE] Registration email failed:', err?.message));

    // Strip passwordHash from response
    const { passwordHash: _, ...safeInvitedUser } = newUser as any;

    res.status(201).json({
        status: 'success',
        message: 'Invitation sent successfully',
        data: {
            user: safeInvitedUser
        }
    });
});
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Whitelist of fields an admin can update on a user
    const allowedFields = [
        'name', 'phone', 'countryCode', 'dateOfBirth', 'height', 'weight',
        'city', 'state', 'country', 'profilePhotoUrl', 'fatherName', 'fatherPhone',
        'dojoId', 'primaryInstructorId', 'currentBeltRank', 'role',
        'membershipStatus', 'membershipStartDate', 'membershipEndDate',
        'verificationStatus', 'isInstructorApproved'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            // Convert numeric fields
            if (field === 'height' || field === 'weight') {
                updateData[field] = req.body[field] ? parseFloat(req.body[field]) : null;
            // Convert date fields
            } else if (field === 'dateOfBirth' || field === 'membershipStartDate' || field === 'membershipEndDate') {
                updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
            } else {
                updateData[field] = req.body[field];
            }
        }
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
            },
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return next(new AppError('No user found with that ID', 404));
        }
        throw error;
    }
});

/**
 * Get comprehensive student profile with all related data
 */
export const getUserFullProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // @ts-ignore
    const currentUser = req.user;

    // Authorization: Admin can see all, Instructor can see their students, Student can see themselves
    const user = await prisma.user.findUnique({
        where: { id },
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
                select: {
                    id: true,
                    name: true,
                    currentBeltRank: true,
                }
            },
            beltHistory: {
                orderBy: {
                    promotionDate: 'desc'
                },
                include: {
                    promoter: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            },
            trainingSessions: {
                orderBy: {
                    date: 'desc'
                },
                take: 50 // Limit to last 50 sessions
            },
            tournamentResults: {
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    event: {
                        select: {
                            name: true,
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Authorization check
    if (currentUser.role === 'INSTRUCTOR') {
        if (user.primaryInstructorId !== currentUser.id && user.id !== currentUser.id) {
            return next(new AppError('You can only view profiles of your assigned students', 403));
        }
    } else if (currentUser.role === 'STUDENT') {
        if (user.id !== currentUser.id) {
            return next(new AppError('You can only view your own profile', 403));
        }
    }
    // Admin can view all profiles

    // Transform belt history to include promoter name
    const beltHistory = user.beltHistory.map((belt: any) => ({
        id: belt.id,
        oldBelt: belt.oldBelt,
        newBelt: belt.newBelt,
        promotionDate: belt.promotionDate,
        promotedBy: belt.promotedBy,
        promotedByName: belt.promoter?.name || 'Unknown',
        notes: belt.notes,
    }));

    // Transform tournament results to include tournament name
    const tournamentResults = user.tournamentResults.map((result: any) => ({
        id: result.id,
        tournamentName: result.event?.name || 'Unknown Tournament',
        categoryName: result.categoryName || 'N/A',
        finalRank: result.finalRank || 0,
        medal: result.medal,
        createdAt: result.createdAt,
    }));

    // Remove password from response
    const { password, ...userWithoutPassword } = user as any;

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                ...userWithoutPassword,
                beltHistory,
                tournamentResults,
            }
        }
    });
});

// ─── Public Instructor Profiles ────────────────────────────────────────
export const getPublicInstructors = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const instructors = await prisma.user.findMany({
        where: {
            role: 'INSTRUCTOR',
            isInstructorApproved: true,
            membershipStatus: 'ACTIVE',
        },
        select: {
            id: true,
            name: true,
            currentBeltRank: true,
            profilePhotoUrl: true,
            city: true,
            state: true,
            membershipNumber: true,
            createdAt: true,
            dojo: { select: { name: true, city: true } },
        },
        orderBy: { name: 'asc' },
    });

    res.status(200).json({
        status: 'success',
        data: { instructors },
    });
});

// Change password for logged-in user
export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return next(new AppError('Current and new password are required', 400));
    }
    if (newPassword.length < 8) {
        return next(new AppError('New password must be at least 8 characters', 400));
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(newPassword)) {
        return next(new AppError('New password must contain at least one special character', 400));
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
        return next(new AppError('Current password is incorrect', 401));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashedPassword } });
    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
});
