import dotenv from 'dotenv';
// Load env vars BEFORE any other imports so services (emailService, etc.)
// see SMTP_* and other config at module-load time.
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import runMigration from './runMigration';

const PORT = process.env.PORT || 5000;

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

// Run migration before starting server
runMigration().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to run migration:', error);
    // Start server anyway
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
// Trigger redeploy
