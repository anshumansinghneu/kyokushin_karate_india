"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

// Use the base backend URL (without /api) for Socket.IO connections
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const useSocket = (namespace?: string) => {
    const socketRef = useRef<Socket | null>(null);
    // Mirrors socketRef for render: refs must not be read during render.
    const [socket, setSocket] = useState<Socket | null>(null);
    const { token } = useAuthStore();

    useEffect(() => {
        if (!token) return;

        const url = namespace ? `${SOCKET_URL}/${namespace}` : SOCKET_URL;

        socketRef.current = io(url, {
            auth: {
                token
            },
            transports: ['websocket'],
            autoConnect: true
        });
        setSocket(socketRef.current);

        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current?.id);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token, namespace]);

    const emit = (eventName: string, data: unknown) => {
        if (socketRef.current) {
            socketRef.current.emit(eventName, data);
        }
    };

    const on = <T = unknown>(eventName: string, callback: (data: T) => void) => {
        if (socketRef.current) {
            socketRef.current.on(eventName, callback);
        }
    };

    const off = (eventName: string) => {
        if (socketRef.current) {
            socketRef.current.off(eventName);
        }
    };

    return { socket, emit, on, off };
};
