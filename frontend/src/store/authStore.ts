import { create } from 'zustand';
import api from '@/lib/api';
import { getToken, getRefreshToken, setTokens, clearTokens, setRememberedEmail } from '@/lib/tokenStorage';

/** An event registration as included by GET /auth/me (`include: { event: true }`). */
export interface UserRegistration {
    id: string;
    eventId?: string;
    status?: string;
    registeredAt?: string;
    event?: { id: string; name: string; [key: string]: unknown };
    [key: string]: unknown;
}

/** A tournament result as included by GET /auth/me (`include: { event: true }`). */
export interface UserTournamentResult {
    id: string;
    eventId?: string;
    categoryName?: string;
    finalRank?: number;
    medal?: string | null;
    event: { id: string; name: string; [key: string]: unknown };
    [key: string]: unknown;
}

export interface User {
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
    /** Dojos an instructor teaches at besides (or instead of) their home dojo. */
    teachingDojos?: { id: string; name: string; city?: string }[];
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
    createdAt?: string;
    membershipStartDate?: string;
    membershipEndDate?: string;
    beltHistory?: Array<{ id?: string; newBelt?: string; oldBelt?: string | null; promotionDate?: string }>;
    registrations?: UserRegistration[];
    tournamentResults?: UserTournamentResult[];
}

/**
 * Request body for /auth/register and /users/updateMe. Callers build these
 * from form state of varying shapes, so any object is accepted (an interface
 * without an index signature would not satisfy Record<string, unknown>).
 */
export type AuthPayload = object;

export interface LoginCredentials {
    email: string;
    password: string;
}

/** Shape of an axios-style error, narrowed from `unknown` in catch blocks. */
interface ApiErrorLike {
    name?: string;
    code?: string;
    response?: { status?: number; data?: { message?: string } };
}

const asApiError = (error: unknown): ApiErrorLike | undefined =>
    (typeof error === 'object' && error !== null ? (error as ApiErrorLike) : undefined);

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    _hasCheckedAuth: boolean; // prevents duplicate checkAuth calls

    login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
    register: (data: AuthPayload) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    fetchUser: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
    updateProfile: (data: AuthPayload) => Promise<void>;
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
        } catch (error: unknown) {
            set({
                error: asApiError(error)?.response?.data?.message || 'Login failed',
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
        } catch (error: unknown) {
            set({
                error: asApiError(error)?.response?.data?.message || 'Registration failed',
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
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            // If aborted (timeout) or network error, let user retry
            const apiError = asApiError(error);
            if (apiError?.name === 'CanceledError' || apiError?.code === 'ERR_CANCELED') {
                console.error('checkAuth timed out');
                set({ isLoading: false, isAuthenticated: false, _hasCheckedAuth: false });
                return;
            }
            // If 401, try refresh before giving up
            if (apiError?.response?.status === 401) {
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

    updateProfile: async (data: AuthPayload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch('/users/updateMe', data);
            set({ user: response.data.data.user, isLoading: false });
        } catch (error: unknown) {
            set({
                error: asApiError(error)?.response?.data?.message || 'Profile update failed',
                isLoading: false
            });
            throw error;
        }
    },
}));
