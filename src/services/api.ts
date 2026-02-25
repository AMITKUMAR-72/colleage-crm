import axios from 'axios';

// Set this to true to force Mock Data even if backend is online
const STANDALONE_DEMO = false;

// Use same-origin requests so Next.js rewrites can proxy to backend without CORS issues in browser.
// If needed, override with NEXT_PUBLIC_API_BASE_URL (e.g. in production deployments).
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            let token = localStorage.getItem('token');
            if (token && token.trim().length > 0 && token !== 'undefined' && token !== 'null') {
                token = token.replace(/^"(.*)"$/, '$1'); // Remove any surrounding quotes
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Fix: Remove Content-Type for GET/DELETE to prevent 500 errors on some backends
        if (config.method?.toLowerCase() === 'get' || config.method?.toLowerCase() === 'delete') {
            delete config.headers['Content-Type'];
        }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        // Automatically unwrap the standard Api_Response wrapper if present
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            const keys = Object.keys(response.data);
            // Unwrap if it looks like a standard backend wrapper or if 'data' contains a Page object ('content' key)
            if (
                keys.length <= 3 || // Very simple wrapper
                'timeStamp' in response.data ||
                'error' in response.data ||
                'message' in response.data ||
                'status' in response.data ||
                Array.isArray(response.data.data) ||
                (response.data.data && typeof response.data.data === 'object' && 'content' in response.data.data)
            ) {
                return {
                    ...response,
                    data: response.data.data
                };
            }
        }
        return response;
    },
    async (error) => {
        // Fallback to Demo Mode on connection refused or 404/500 if enabled
        if (STANDALONE_DEMO && (!error.response || error.response.status >= 500)) {
            console.warn("Backend offline or error - Switching to Standalone Demo Mode");
            // Here we could return static mock data based on the URL
            // For now, we'll let the services handle the actual mock data logic 
            // but we suppress the fatal error UX where possible
        }

        if (error.response?.status === 401) {
            const isAuthEndpoint = error.config?.url?.includes('/auth/');
            if (typeof window !== 'undefined' && !isAuthEndpoint) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
