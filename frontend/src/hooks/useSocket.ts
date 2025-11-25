"use client";

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useSocket = (namespace?: string) => {
    const socketRef = useRef<Socket | null>(null);
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

    const emit = (eventName: string, data: any) => {
        if (socketRef.current) {
            socketRef.current.emit(eventName, data);
        }
    };

    const on = (eventName: string, callback: (data: any) => void) => {
        if (socketRef.current) {
            socketRef.current.on(eventName, callback);
        }
    };

    const off = (eventName: string) => {
        if (socketRef.current) {
            socketRef.current.off(eventName);
        }
    };

    return { socket: socketRef.current, emit, on, off };
};
