import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { getToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [3000, 6000, 10000]; // 3s, 6s, 10s — gives Render ~19s to wake up

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── 401 interceptor with silent token refresh ──────────────
let _isRefreshing = false;
let _refreshQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
    _refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    _refreshQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        // ── Retry logic for cold starts / network errors ──
        // Retry on: network error (no response), 502, 503, 521 (Render cold start)
        const retryableStatus = error.response?.status && [502, 503, 521].includes(error.response.status);
        const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
        const retryCount = originalRequest?._retryCount || 0;

        if ((retryableStatus || isNetworkError) && retryCount < MAX_RETRIES && originalRequest) {
            originalRequest._retryCount = retryCount + 1;
            const delay = RETRY_DELAYS[retryCount] || 10000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return api(originalRequest);
        }

        // Skip refresh for auth endpoints to avoid infinite loops
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register') ||
            originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
            const refreshToken = getRefreshToken();

            if (refreshToken) {
                if (_isRefreshing) {
                    // Another refresh is in flight — queue this request
                    return new Promise((resolve, reject) => {
                        _refreshQueue.push({ resolve, reject });
                    }).then((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    });
                }

                originalRequest._retry = true;
                _isRefreshing = true;

                try {
                    const resp = await axios.post(
                        `${api.defaults.baseURL}/auth/refresh`,
                        { refreshToken },
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                    const { token: newToken, refreshToken: newRT } = resp.data;
                    setTokens(newToken, newRT);

                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshErr) {
                    processQueue(refreshErr, null);
                    // Refresh failed — clear everything and redirect
                    clearTokens();
                    if (typeof window !== 'undefined' &&
                        !window.location.pathname.includes('/login') &&
                        !window.location.pathname.includes('/register')) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshErr);
                } finally {
                    _isRefreshing = false;
                }
            }

            // No refresh token — hard redirect
            clearTokens();
            if (typeof window !== 'undefined' &&
                !window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
