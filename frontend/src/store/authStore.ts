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
    fatherName?: string;
    fatherPhone?: string;
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
    registerWithPayment: (data: any) => Promise<{ orderId: string; paymentId: string; amount: number; taxAmount: number; totalAmount: number; keyId: string }>;
    completeRegistration: (paymentData: any) => Promise<void>;
    registerWithVoucher: (data: any) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: false,
    isLoading: true,
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

    // Step 1: Create payment order for registration
    registerWithPayment: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/payments/registration/create-order', data);
            set({ isLoading: false });
            return response.data.data;
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to create payment order',
                isLoading: false
            });
            throw error;
        }
    },

    // Step 2: Verify payment and complete registration
    completeRegistration: async (paymentData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/payments/registration/verify', paymentData);
            const { token } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Payment verification failed',
                isLoading: false
            });
            throw error;
        }
    },

    // Register with cash voucher (no Razorpay)
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
