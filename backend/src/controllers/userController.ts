import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendInstructorApprovalEmail, sendMembershipActiveEmail, sendRejectionEmail, sendRegistrationEmail } from '../services/emailService';

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

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// Generate Membership Number: KKI-[YEAR]-[DOJO_CODE]-[SEQUENCE]
const generateMembershipNumber = async (dojoId: string) => {
    const dojo = await prisma.dojo.findUnique({ where: { id: dojoId } });
    if (!dojo) throw new AppError('Dojo not found', 404);

    const year = new Date().getFullYear();
    const dojoCode = dojo.dojoCode;

    // Count existing members in this dojo for this year to generate sequence
    // This is a simplified sequence generation. In production, might need a separate counter table to avoid race conditions.
    const count = await prisma.user.count({
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

        // Notify Admin about Instructor Approval
        // In a real app, we'd fetch Admin email. For now, mock it.
        await sendInstructorApprovalEmail('admin@kyokushin.com', userToApprove.name, currentUser.name);

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
        const membershipNumber = await generateMembershipNumber(userToApprove.dojoId!);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        const updatedUser = await prisma.user.update({
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
        await sendMembershipActiveEmail(updatedUser.email, updatedUser.name, membershipNumber);

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
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

    // Send Email Notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        await sendRejectionEmail(user.email, user.name);
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
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
    const allowedFields = ['phone', 'city', 'address', 'description', 'profilePhotoUrl', 'height', 'weight'];
    const filteredBody: any = {};
    Object.keys(req.body).forEach(el => {
        if (allowedFields.includes(el)) {
            // Convert height and weight to numbers
            if (el === 'height' || el === 'weight') {
                filteredBody[el] = req.body[el] ? parseFloat(req.body[el]) : null;
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

    await prisma.user.delete({
        where: { id }
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, phone, countryCode, dojoId, currentBeltRank, membershipStatus, city, state, height, weight, fatherName, fatherPhone } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
        return next(new AppError('Please provide name, email, password, and role', 400));
    }

    if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long', 400));
    }

    if (!['STUDENT', 'INSTRUCTOR'].includes(role)) {
        return next(new AppError('Role must be either STUDENT or INSTRUCTOR', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return next(new AppError('User with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user data based on role
    const userData: any = {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        phone: phone || null,
        countryCode: countryCode || '+91',
        city: city || null,
        state: state || null,
        country: 'India',
        dojoId: dojoId || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        fatherName: fatherName || null,
        fatherPhone: fatherPhone || null,
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
    } else if (role === 'INSTRUCTOR') {
        userData.isInstructorApproved = true;
        userData.instructorApprovedAt = new Date();
        userData.membershipStatus = 'ACTIVE';
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

    res.status(201).json({
        status: 'success',
        message: `${role} created successfully`,
        data: {
            user: newUser
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

    // In a real app, we would generate a random password and email it.
    // For now, we'll set a default password 'welcome123'
    const hashedPassword = await bcrypt.hash('welcome123', 12);

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

    // Send Email Notification (Invite)
    // Re-using Registration Email or creating a specific Invite one.
    // For now, let's use sendRegistrationEmail as a placeholder or create a new one.
    // Let's use sendRegistrationEmail for simplicity as it welcomes them.
    await sendRegistrationEmail(newUser.email, newUser.name);

    res.status(201).json({
        status: 'success',
        message: 'Invitation sent successfully',
        data: {
            user: newUser
        }
    });
});
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Filter out fields that shouldn't be updated directly if needed,
    // but for Admin, we generally trust them.
    // However, password updates should still go through a specific route or be hashed if allowed here.
    // For now, let's exclude password from this general update to be safe.
    const { password, passwordConfirm, ...dataToUpdate } = req.body;

    const updatedUser = await prisma.user.update({
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
