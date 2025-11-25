import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
// @ts-ignore - Type definitions issue in production build
import morgan from 'morgan';

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
import { globalErrorHandler } from './utils/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
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

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../src/uploads')));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
