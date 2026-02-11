import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
// @ts-ignore - Type definitions issue in production build
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/authRoutes';
import userRouter from './routes/userRoutes';
import dojoRouter from './routes/dojoRoutes';
import beltRouter from './routes/beltRoutes';
import eventRouter from './routes/eventRoutes';
import tournamentRouter from './routes/tournamentRoutes';
import matchRouter from './routes/matchRoutes';
import resultRouter from './routes/resultRoutes';
import trainingRouter from './routes/trainingRoutes';
import contentRouter from './routes/contentRoutes';
import uploadRouter from './routes/uploadRoutes';
import postRouter from './routes/postRoutes';
import recognitionRouter from './routes/recognitionRoutes';
import setupRouter from './routes/setupRoutes';
import noteRouter from './routes/noteRoutes';
import galleryRouter from './routes/galleryRoutes';
import announceRouter from './routes/announceRoutes';
import paymentRouter from './routes/paymentRoutes';
import merchRouter from './routes/merchRoutes';
import { sendRenewalReminders } from './services/renewalReminderService';
import { globalErrorHandler } from './utils/errorHandler';

const app = express();

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://kyokushin-karate-india.vercel.app',
];

// Security Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development, restrict in production if needed
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs (increased for testing)
    message: 'Too many authentication attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
app.use('/api/setup', setupRouter);  // Admin setup (one-time use)
app.use('/api/auth', authRouter);  // No rate limit for testing
app.use('/api/users', userRouter);
app.use('/api/dojos', dojoRouter);
app.use('/api/belts', beltRouter);
app.use('/api/events', eventRouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api/matches', matchRouter);
app.use('/api/results', resultRouter);
app.use('/api/training', trainingRouter);
app.use('/api/content', contentRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/posts', postRouter);
app.use('/api/recognitions', recognitionRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/announcements', announceRouter);
app.use('/api/payments', paymentRouter);  // Payment & UPI integration
app.use('/api/merch', merchRouter);  // Merchandise store
app.use('/api', noteRouter);  // Notes and profile views

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../src/uploads')));

// Health Check (root + /health for Render deploy health check)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'KKFI API', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Cron Endpoint: Renewal Reminders ────────────────────────────────
// Hit this daily via external cron (e.g. cron-job.org, Render cron, etc.)
// Protected by a simple secret to prevent abuse
app.get('/api/cron/renewal-reminders', async (req, res) => {
    const secret = req.query.secret || req.headers['x-cron-secret'];
    if (secret !== (process.env.CRON_SECRET || 'kkfi-cron-secret-2024')) {
        return res.status(401).json({ status: 'fail', message: 'Invalid cron secret' });
    }
    try {
        const result = await sendRenewalReminders();
        res.status(200).json({ status: 'success', data: result });
    } catch (err) {
        console.error('[CRON] Renewal reminder error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to send reminders' });
    }
});

// ─── Daily Timer: Auto send renewal reminders ────────────────────────
// Runs once every 24 hours while the server is up
let _reminderInterval: NodeJS.Timeout | null = null;
function startRenewalReminderScheduler() {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    // Run once on startup (delayed 60s to let things settle)
    setTimeout(() => {
        sendRenewalReminders().catch(err => console.error('[CRON] Auto reminder error:', err));
    }, 60_000);
    // Then run every 24 hours
    _reminderInterval = setInterval(() => {
        sendRenewalReminders().catch(err => console.error('[CRON] Auto reminder error:', err));
    }, TWENTY_FOUR_HOURS);
}
startRenewalReminderScheduler();

// Global Error Handler
app.use(globalErrorHandler);

export default app;
