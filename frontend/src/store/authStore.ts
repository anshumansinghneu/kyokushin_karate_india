import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
    dojoId?: string;
    dojo?: {
        id: string;
        name: string;
        city: string;
        state: string;
    };
    phone?: string;
    countryCode?: string;
    city?: string;
    state?: string;
    address?: string;
    description?: string;
    profilePhotoUrl?: string;
    currentBeltRank?: string;
    height?: number;
    weight?: number;
    membershipNumber?: string;
    membershipStatus?: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'SUSPENDED';
    experienceYears?: number;
    experienceMonths?: number;
    fatherName?: string;
    fatherPhone?: string;
    verificationStatus?: 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
    dob?: string;
    registrations?: any[];
    tournamentResults?: any[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    registerWithVoucher: (data: any) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
}

// Read token synchronously so first render already knows auth state
const _initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: _initialToken,
    isAuthenticated: !!_initialToken, // Optimistic: treat token presence as authenticated
    isLoading: !!_initialToken, // Only loading if we need to verify a token
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', credentials);
            const { token } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', data);
            const { token } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Registration failed',
                isLoading: false
            });
            throw error;
        }
    },

    // Register with cash voucher
    registerWithVoucher: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/vouchers/redeem/registration', data);
            const { token } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Voucher redemption failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false });
            return;
        }

        try {
            const response = await api.get('/auth/me');
            set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('checkAuth failed:', error);
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },

    updateProfile: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch('/users/updateMe', data);
            set({ user: response.data.data.user, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Profile update failed',
                isLoading: false
            });
            throw error;
        }
    },
}));
