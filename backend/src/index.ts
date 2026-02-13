import dotenv from 'dotenv';
// Load env vars BEFORE any other imports so services (emailService, etc.)
// see SMTP_* and other config at module-load time.
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import runMigration from './runMigration';
import { verifySmtp } from './services/emailService';

const PORT = process.env.PORT || 10000;

const server = http.createServer(app);

// Socket.io setup
export const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join tournament room
    socket.on('join-tournament', (tournamentId: string) => {
        socket.join(`tournament-${tournamentId}`);
        console.log(`Socket ${socket.id} joined tournament-${tournamentId}`);
    });

    // Leave tournament room
    socket.on('leave-tournament', (tournamentId: string) => {
        socket.leave(`tournament-${tournamentId}`);
        console.log(`Socket ${socket.id} left tournament-${tournamentId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server FIRST so Render's health check passes immediately,
// then run migrations & SMTP check in background
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    // Run migration in background (non-blocking)
    runMigration()
        .then(() => console.log('✅ Background migration check done'))
        .catch((error) => console.error('❌ Migration error:', error));

    // Verify SMTP in background (non-blocking)
    verifySmtp().then(result => {
        console.log(`📧 SMTP startup check: ${result.success ? '✅ WORKING' : '❌ FAILED - ' + result.message}`);
    });
});
