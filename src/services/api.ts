import axios from 'axios';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Set this to true to force Mock Data even if backend is online
const STANDALONE_DEMO = false;

// Use direct backend URL to bypass proxy
// If needed, override with NEXT_PUBLIC_API_BASE_URL (e.g. in production deployments).
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://apis.rafunirp.com';

// Global in-flight request counter — incremented before each request, decremented after
let _pendingCount = 0;
const _listeners = new Set<(n: number) => void>();

function setPendingCount(n: number) {
    _pendingCount = n < 0 ? 0 : n;
    _listeners.forEach(fn => fn(_pendingCount));
}

/** Returns current number of in-flight API requests */
export function getGlobalLoadingCount() { return _pendingCount; }

/** Hook: returns true whenever there is at least one API request in flight */
export function useGlobalLoading() {
    const [loading, setLoading] = useState(_pendingCount > 0);
    useEffect(() => {
        const listener = (n: number) => setLoading(n > 0);
        _listeners.add(listener);
        return () => { _listeners.delete(listener); };
    }, []);
    return loading;
}

// Methods that mutate data — we show success toasts for these
const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Endpoints whose toast messages should be suppressed (silent auth flows)
const SILENT_URLS = ['/auth/login', '/auth/refresh'];

const api = axios.create({
    baseURL: API_BASE_URL,
    // NOTE: Do NOT set Content-Type here — it would be sent on GET/DELETE too,
    // causing a 500 on backends that reject GET requests with a Content-Type header.
    // We set it manually in the request interceptor only for mutation methods.
});

api.interceptors.request.use(
    (config) => {
        setPendingCount(_pendingCount + 1);
        if (typeof window !== 'undefined') {
            let token = localStorage.getItem('token');
            if (token && token.trim().length > 0 && token !== 'undefined' && token !== 'null') {
                token = token.replace(/^\"(.*)\"$/, '$1'); // Remove any surrounding quotes
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Only set Content-Type for requests that actually send a body.
        // GET and DELETE must NOT have Content-Type — many backends return 500 if they see it.
        const method = config.method?.toLowerCase();
        if (method === 'post' || method === 'put' || method === 'patch') {
            config.headers['Content-Type'] = 'application/json';
        } else {
            // Explicitly delete in case Axios added it from somewhere else
            delete config.headers['Content-Type'];
            delete (config.headers as any)['content-type'];
        }

        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        setPendingCount(_pendingCount - 1);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        setPendingCount(_pendingCount - 1);

        // ── Global Success Toast ──────────────────────────────────────────────
        const method = response.config?.method?.toLowerCase() ?? '';
        const url = response.config?.url ?? '';
        const isSilent = SILENT_URLS.some(s => url.includes(s));
        const isMutation = MUTATION_METHODS.has(method);

        if (isMutation && !isSilent) {
            // Extract a readable message from the backend response (before unwrap)
            const raw = response.data;
            const message: string | undefined =
                raw?.message ||
                raw?.data?.message ||
                (typeof raw === 'string' && raw.length > 0 && raw.length < 120 ? raw : undefined);

            if (message) {
                toast.success(message, {
                    duration: 2000,
                    id: `api-ok-${url}`,
                    style: {
                        fontWeight: '700',
                        fontSize: '13px',
                    },
                });
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        // Automatically unwrap the standard Api_Response wrapper if present
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            const keys = Object.keys(response.data);
            if (
                keys.length <= 3 ||
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
        setPendingCount(_pendingCount - 1);

        // ── Global Error Toast ────────────────────────────────────────────────
        if (error.response) {
            const status: number = error.response.status;
            const url: string = error.config?.url ?? '';
            const isSilent = SILENT_URLS.some(s => url.includes(s));

            if (!isSilent) {
                const data = error.response.data;
                const serverMessage: string =
                    data?.message ||
                    data?.error ||
                    data?.detail ||
                    (typeof data === 'string' && data.length < 200 ? data : '');

                const fallback =
                    status === 400 ? 'Bad request — please check your input.' :
                        status === 401 ? 'Unauthorized — please log in again.' :
                            status === 403 ? 'Access denied — you don\'t have permission.' :
                                status === 404 ? 'Resource not found.' :
                                    status === 409 ? 'Conflict — this record may already exist.' :
                                        status >= 500 ? 'Server error — please try again later.' :
                                            'Something went wrong.';

                toast.error(serverMessage || fallback, {
                    duration: 2000,
                    id: `api-err-${url}-${status}`,
                    style: {
                        fontWeight: '700',
                        fontSize: '13px',
                    },
                });
            }
        } else if (error.request) {
            // Network error — no response received at all
            toast.error('Network error — could not reach the server.', {
                duration: 2000,
                id: 'api-network-err',
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        if (STANDALONE_DEMO && (!error.response || error.response.status >= 500)) {
            console.warn("Backend offline or error - Switching to Standalone Demo Mode");
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
