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

        return res.json({
            status: 'success',
            data: {
                adminExists: !!adminExists,
                setupAvailable: !adminExists && setupKeyConfigured,
                setupKeyConfigured,
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

export default router;
