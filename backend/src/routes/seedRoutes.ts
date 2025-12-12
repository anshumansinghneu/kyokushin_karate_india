import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

// DANGER: Only for initial setup - remove after seeding!
router.post('/reset-and-seed', async (req, res) => {
    try {
        // Check for admin secret key
        const secret = req.headers['x-admin-secret'];
        if (secret !== process.env.JWT_SECRET) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        console.log('🌱 Starting database reset and seed...');

        // Run seed
        const { stdout, stderr } = await execAsync('npm run seed');

        console.log('✅ Seed completed:', stdout);

        res.json({
            success: true,
            message: 'Database reseeded successfully',
            output: stdout
        });
    } catch (error: any) {
        console.error('❌ Seed error:', error);
        res.status(500).json({
            error: 'Failed to seed database',
            details: error.message
        });
    }
});

export default router;
