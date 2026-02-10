import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';

const router = Router();

/**
 * ONE-TIME ADMIN SETUP ENDPOINT
 * POST /api/setup/admin
 * 
 * This endpoint creates the initial admin user for production.
 * It can only be used ONCE and requires a secret key.
 * 
 * Security Features:
 * 1. Requires ADMIN_SETUP_KEY environment variable
 * 2. Only works if NO admin users exist
 * 3. Can only be called once successfully
 */
router.post('/admin', async (req, res) => {
    try {
        const { setupKey, email, password, name, phone, city, state } = req.body;

        // 1. Validate setup key
        const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY;

        if (!ADMIN_SETUP_KEY) {
            return res.status(503).json({
                status: 'error',
                message: 'Admin setup is not configured. Please set ADMIN_SETUP_KEY environment variable.'
            });
        }

        if (setupKey !== ADMIN_SETUP_KEY) {
            return res.status(403).json({
                status: 'error',
                message: 'Invalid setup key. Access denied.'
            });
        }

        // 2. Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (existingAdmin) {
            return res.status(409).json({
                status: 'error',
                message: 'Admin user already exists. This endpoint can only be used once.'
            });
        }

        // 3. Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: email, password, and name are required.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format.'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters long.'
            });
        }

        // 4. Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'A user with this email already exists.'
            });
        }

        // 5. Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // 6. Create admin user
        const adminUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'ADMIN',
                membershipStatus: 'ACTIVE',
                phone: phone || null,
                city: city || null,
                state: state || null,
                country: 'India',
                isInstructorApproved: true,
                approvedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                membershipStatus: true,
                createdAt: true,
            }
        });

        // 7. Log the creation (for audit purposes)
        console.log(`[ADMIN SETUP] Admin user created successfully: ${adminUser.email} at ${new Date().toISOString()}`);

        return res.status(201).json({
            status: 'success',
            message: 'Admin user created successfully. This endpoint is now disabled.',
            data: {
                user: adminUser
            }
        });

    } catch (error: any) {
        console.error('[ADMIN SETUP ERROR]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create admin user.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Health check endpoint to verify if admin setup is needed
 * GET /api/setup/status
 */
router.get('/status', async (req, res) => {
    try {
        const adminExists = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        const setupKeyConfigured = !!process.env.ADMIN_SETUP_KEY;
        const inviteKeyConfigured = !!process.env.INSTRUCTOR_INVITE_KEY;

        return res.json({
            status: 'success',
            data: {
                adminExists: !!adminExists,
                setupAvailable: !adminExists && setupKeyConfigured,
                setupKeyConfigured,
                instructorOnboardingAvailable: inviteKeyConfigured,
            }
        });
    } catch (error) {
        console.error('[SETUP STATUS ERROR]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to check setup status.'
        });
    }
});

/**
 * INSTRUCTOR ONBOARDING ENDPOINT
 * POST /api/setup/onboard
 *
 * Allows an instructor with a secret invite code to register themselves,
 * their dojo, and their students in one request.
 *
 * Security: Requires INSTRUCTOR_INVITE_KEY env variable.
 *
 * Request Body:
 * {
 *   inviteCode: string,                    // Must match INSTRUCTOR_INVITE_KEY
 *   instructor: {                           // Instructor personal details
 *     email, password, name, phone?,
 *     countryCode?, dateOfBirth?, height?, weight?,
 *     city?, state?, country?,
 *     currentBeltRank?, fatherName?, fatherPhone?
 *   },
 *   dojo: {                                 // New dojo to create
 *     name, dojoCode, city, state?,
 *     country?, address?, contactEmail?, contactPhone?
 *   },
 *   students?: [{                           // Array of students
 *     email, password?, name, phone?, countryCode?,
 *     dateOfBirth?, height?, weight?,
 *     city?, state?, country?,
 *     currentBeltRank?, fatherName?, fatherPhone?
 *   }]
 * }
 */
router.post('/onboard', async (req, res) => {
    try {
        const { inviteCode, instructor, dojo, students } = req.body;

        // 1. Validate invite code
        const INSTRUCTOR_INVITE_KEY = process.env.INSTRUCTOR_INVITE_KEY;
        if (!INSTRUCTOR_INVITE_KEY) {
            return res.status(503).json({
                status: 'error',
                message: 'Instructor onboarding is not configured. INSTRUCTOR_INVITE_KEY not set.'
            });
        }
        if (inviteCode !== INSTRUCTOR_INVITE_KEY) {
            return res.status(403).json({
                status: 'error',
                message: 'Invalid invite code. Access denied.'
            });
        }

        // 2. Validate required instructor fields
        if (!instructor || !instructor.email || !instructor.password || !instructor.name) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required instructor fields: email, password, and name.'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(instructor.email)) {
            return res.status(400).json({ status: 'error', message: 'Invalid instructor email format.' });
        }
        if (instructor.password.length < 8) {
            return res.status(400).json({ status: 'error', message: 'Instructor password must be at least 8 characters.' });
        }

        // 3. Validate required dojo fields
        if (!dojo || !dojo.name || !dojo.dojoCode || !dojo.city) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required dojo fields: name, dojoCode, and city.'
            });
        }

        // 4. Check for existing dojo code or instructor email
        const existingDojo = await prisma.dojo.findUnique({ where: { dojoCode: dojo.dojoCode } });
        if (existingDojo) {
            return res.status(409).json({
                status: 'error',
                message: `A dojo with code "${dojo.dojoCode}" already exists.`
            });
        }

        const existingInstructor = await prisma.user.findUnique({ where: { email: instructor.email } });
        if (existingInstructor) {
            return res.status(409).json({
                status: 'error',
                message: `A user with email "${instructor.email}" already exists.`
            });
        }

        // 5. Validate student emails (no duplicates, no existing)
        const studentList = Array.isArray(students) ? students : [];
        const allEmails = [instructor.email, ...studentList.map((s: any) => s.email)];
        const uniqueEmails = new Set(allEmails);
        if (uniqueEmails.size !== allEmails.length) {
            return res.status(400).json({ status: 'error', message: 'Duplicate emails found in request.' });
        }

        if (studentList.length > 0) {
            const existingStudents = await prisma.user.findMany({
                where: { email: { in: studentList.map((s: any) => s.email) } },
                select: { email: true }
            });
            if (existingStudents.length > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: `These student emails already exist: ${existingStudents.map(s => s.email).join(', ')}`
                });
            }
        }

        // 6. Run everything in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Dojo
            const newDojo = await tx.dojo.create({
                data: {
                    name: dojo.name,
                    dojoCode: dojo.dojoCode.toUpperCase(),
                    city: dojo.city,
                    state: dojo.state || null,
                    country: dojo.country || 'India',
                    address: dojo.address || null,
                    contactEmail: dojo.contactEmail || instructor.email,
                    contactPhone: dojo.contactPhone || instructor.phone || null,
                }
            });

            // Create Instructor
            const instructorHash = await bcrypt.hash(instructor.password, 12);
            const dob = instructor.dateOfBirth ? new Date(instructor.dateOfBirth) : null;

            // Generate membership number for instructor
            const year = new Date().getFullYear();
            const cityCode = dojo.dojoCode.toUpperCase();
            const memberCount = await tx.user.count();
            const memberNumber = `KKI-${year}-${cityCode}-${String(memberCount + 1).padStart(5, '0')}`;

            const newInstructor = await tx.user.create({
                data: {
                    email: instructor.email,
                    passwordHash: instructorHash,
                    name: instructor.name,
                    role: 'INSTRUCTOR',
                    phone: instructor.phone || null,
                    countryCode: instructor.countryCode || '+91',
                    dateOfBirth: dob,
                    height: instructor.height ? parseFloat(instructor.height) : null,
                    weight: instructor.weight ? parseFloat(instructor.weight) : null,
                    city: instructor.city || dojo.city,
                    state: instructor.state || dojo.state || null,
                    country: instructor.country || 'India',
                    currentBeltRank: instructor.currentBeltRank || 'Black',
                    fatherName: instructor.fatherName || null,
                    fatherPhone: instructor.fatherPhone || null,
                    dojoId: newDojo.id,
                    membershipNumber: memberNumber,
                    membershipStatus: 'ACTIVE',
                    membershipStartDate: new Date(),
                    membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    isInstructorApproved: true,
                    instructorApprovedAt: new Date(),
                    approvedAt: new Date(),
                }
            });

            // Create Students
            const createdStudents = [];
            for (let i = 0; i < studentList.length; i++) {
                const s = studentList[i];
                if (!s.email || !s.name) continue; // skip invalid entries

                const studentHash = await bcrypt.hash(s.password || 'changeme123', 12);
                const sDob = s.dateOfBirth ? new Date(s.dateOfBirth) : null;
                const sCount = memberCount + 2 + i;
                const sMemberNumber = `KKI-${year}-${cityCode}-${String(sCount).padStart(5, '0')}`;

                const student = await tx.user.create({
                    data: {
                        email: s.email,
                        passwordHash: studentHash,
                        name: s.name,
                        role: 'STUDENT',
                        phone: s.phone || null,
                        countryCode: s.countryCode || '+91',
                        dateOfBirth: sDob,
                        height: s.height ? parseFloat(s.height) : null,
                        weight: s.weight ? parseFloat(s.weight) : null,
                        city: s.city || dojo.city,
                        state: s.state || dojo.state || null,
                        country: s.country || 'India',
                        currentBeltRank: s.currentBeltRank || 'White',
                        fatherName: s.fatherName || null,
                        fatherPhone: s.fatherPhone || null,
                        dojoId: newDojo.id,
                        primaryInstructorId: newInstructor.id,
                        membershipNumber: sMemberNumber,
                        membershipStatus: 'ACTIVE',
                        membershipStartDate: new Date(),
                        membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        approvedAt: new Date(),
                    }
                });

                // Create belt history entry if belt is not White
                if (s.currentBeltRank && s.currentBeltRank !== 'White') {
                    await tx.beltHistory.create({
                        data: {
                            studentId: student.id,
                            oldBelt: 'White',
                            newBelt: s.currentBeltRank,
                            promotedBy: newInstructor.id,
                            notes: 'Initial belt rank set during onboarding',
                        }
                    });
                }

                createdStudents.push({
                    id: student.id,
                    email: student.email,
                    name: student.name,
                    beltRank: student.currentBeltRank,
                    membershipNumber: student.membershipNumber,
                    tempPassword: s.password ? undefined : 'changeme123', // only show if we used default
                });
            }

            return { dojo: newDojo, instructor: newInstructor, students: createdStudents };
        });

        console.log(`[ONBOARD] Instructor "${result.instructor.name}" onboarded with dojo "${result.dojo.name}" and ${result.students.length} students.`);

        return res.status(201).json({
            status: 'success',
            message: `Onboarding complete. Created dojo, instructor, and ${result.students.length} student(s).`,
            data: {
                dojo: {
                    id: result.dojo.id,
                    name: result.dojo.name,
                    dojoCode: result.dojo.dojoCode,
                    city: result.dojo.city,
                },
                instructor: {
                    id: result.instructor.id,
                    email: result.instructor.email,
                    name: result.instructor.name,
                    membershipNumber: result.instructor.membershipNumber,
                },
                students: result.students,
            }
        });

    } catch (error: any) {
        console.error('[ONBOARD ERROR]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Instructor onboarding failed.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
