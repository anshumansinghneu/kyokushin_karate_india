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
    _hasCheckedAuth: boolean; // prevents duplicate checkAuth calls

    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    registerWithVoucher: (data: any) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    fetchUser: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
    updateProfile: (data: any) => Promise<void>;
}

// Read token synchronously so first render already knows auth state
const _initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: _initialToken,
    isAuthenticated: !!_initialToken, // Optimistic: treat token presence as authenticated
    isLoading: !!_initialToken, // Only loading if we need to verify a token
    error: null,
    _hasCheckedAuth: false,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, refreshToken } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            set({ token, user, isAuthenticated: true, isLoading: false, _hasCheckedAuth: true });
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
            const { token, refreshToken } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            set({ token, user, isAuthenticated: true, isLoading: false, _hasCheckedAuth: true });
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
            const { token, refreshToken } = response.data;
            const { user } = response.data.data;

            localStorage.setItem('token', token);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            set({ token, user, isAuthenticated: true, isLoading: false, _hasCheckedAuth: true });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Voucher redemption failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        const rt = localStorage.getItem('refreshToken');
        // Best-effort revoke on backend
        if (rt) api.post('/auth/logout', { refreshToken: rt }).catch(() => {});
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, _hasCheckedAuth: false });
    },

    checkAuth: async () => {
        // Prevent duplicate inflight calls
        if (get()._hasCheckedAuth) return;
        set({ _hasCheckedAuth: true });

        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        try {
            const response = await api.get('/auth/me');
            set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            // If 401, try refresh before giving up
            if (error.response?.status === 401) {
                const refreshed = await get().refreshSession();
                if (refreshed) {
                    try {
                        const retryResp = await api.get('/auth/me');
                        set({ user: retryResp.data.data.user, isAuthenticated: true, isLoading: false });
                        return;
                    } catch {
                        // fall through to logout
                    }
                }
            }
            console.error('checkAuth failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },

    /** Force-fetch latest user data from the API (no guard). */
    fetchUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await api.get('/auth/me');
            set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('fetchUser failed:', error);
        }
    },

    /** Attempt to refresh the access token using the stored refresh token. */
    refreshSession: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;
        try {
            const resp = await api.post('/auth/refresh', { refreshToken });
            const { token: newToken, refreshToken: newRT } = resp.data;
            localStorage.setItem('token', newToken);
            if (newRT) localStorage.setItem('refreshToken', newRT);
            set({ token: newToken });
            return true;
        } catch {
            localStorage.removeItem('refreshToken');
            return false;
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
