import { create } from 'zustand';
import api from '@/lib/api';
import { getToken, getRefreshToken, setTokens, clearTokens, setRememberedEmail } from '@/lib/tokenStorage';

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

    login: (credentials: any, rememberMe?: boolean) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    fetchUser: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
    updateProfile: (data: any) => Promise<void>;
}

// Read token synchronously so first render already knows auth state
const _initialToken = getToken();

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: _initialToken,
    isAuthenticated: !!_initialToken, // Optimistic: treat token presence as authenticated
    isLoading: !!_initialToken, // Only loading if we need to verify a token
    error: null,
    _hasCheckedAuth: false,

    login: async (credentials, rememberMe = true) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, refreshToken } = response.data;
            const { user } = response.data.data;

            setTokens(token, refreshToken, rememberMe);
            setRememberedEmail(rememberMe ? credentials.email : null);
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

            setTokens(token, refreshToken, true);
            set({ token, user, isAuthenticated: true, isLoading: false, _hasCheckedAuth: true });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Registration failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        const rt = getRefreshToken();
        // Best-effort revoke on backend
        if (rt) api.post('/auth/logout', { refreshToken: rt }).catch(() => {});
        clearTokens();
        set({ user: null, token: null, isAuthenticated: false, _hasCheckedAuth: false });
    },

    checkAuth: async () => {
        // Prevent duplicate inflight calls
        if (get()._hasCheckedAuth) return;
        set({ _hasCheckedAuth: true });

        const token = getToken();
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        // Use an AbortController so we can time out a slow /auth/me call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await api.get('/auth/me', { signal: controller.signal });
            clearTimeout(timeoutId);
            set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            clearTimeout(timeoutId);
            // If aborted (timeout) or network error, let user retry
            if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                console.error('checkAuth timed out');
                set({ isLoading: false, isAuthenticated: false, _hasCheckedAuth: false });
                return;
            }
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
            clearTokens();
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },

    /** Force-fetch latest user data from the API (no guard). */
    fetchUser: async () => {
        const token = getToken();
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
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;
        try {
            const resp = await api.post('/auth/refresh', { refreshToken });
            const { token: newToken, refreshToken: newRT } = resp.data;
            setTokens(newToken, newRT);
            set({ token: newToken });
            return true;
        } catch {
            clearTokens();
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
