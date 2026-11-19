import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const PROD_API_URL = 'https://f-hms-mb86.onrender.com/api';

/**
 * Checks whether the current runtime is a local development environment:
 * localhost, 127.0.0.1, 0.0.0.0, or local LAN IP addresses (192.168.x, 10.x, etc.)
 */
export const isLocalEnvironment = (hostname = '') => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
        return true;
    }
    if (!hostname && typeof window !== 'undefined' && window.location) {
        hostname = window.location.hostname;
    }
    const host = String(hostname || '').toLowerCase();
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('172.16.') ||
        host.startsWith('172.17.') ||
        host.startsWith('172.18.') ||
        host.startsWith('172.19.') ||
        host.startsWith('172.20.') ||
        host.startsWith('172.21.') ||
        host.startsWith('172.22.') ||
        host.startsWith('172.23.') ||
        host.startsWith('172.24.') ||
        host.startsWith('172.25.') ||
        host.startsWith('172.26.') ||
        host.startsWith('172.27.') ||
        host.startsWith('172.28.') ||
        host.startsWith('172.29.') ||
        host.startsWith('172.30.') ||
        host.startsWith('172.31.') ||
        host.endsWith('.local')
    );
};

export const getApiUrl = () => {
    // 1. Local Development (localhost / 127.0.0.1 / local LAN)
    // Strictly routes to local port 5000 backend; NEVER connects or fails over to cloud/Render/Vercel
    if (isLocalEnvironment()) {
        if (typeof window !== 'undefined') {
            try {
                if (window.sessionStorage) {
                    sessionStorage.removeItem('foodnest_api_failover');
                }
                if (window.localStorage) {
                    localStorage.removeItem('foodnest_api_failover');
                    localStorage.removeItem('use_cloud_backend');
                    const customUrl = window.localStorage.getItem('foodnest_api_url') || window.localStorage.getItem('restosys_api_url');
                    if (customUrl && (customUrl.includes('vercel.app') || customUrl.includes('onrender.com'))) {
                        localStorage.removeItem('foodnest_api_url');
                        localStorage.removeItem('restosys_api_url');
                    }
                }
            } catch (_) {}
        }

        if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== '0.0.0.0') {
            return `http://${window.location.hostname}:5000/api`;
        }
        return 'http://localhost:5000/api';
    }

    // 2. Custom override if explicitly configured for self-hosted non-cloud server
    if (typeof window !== 'undefined' && window.localStorage) {
        const customUrl = window.localStorage.getItem('foodnest_api_url') || window.localStorage.getItem('restosys_api_url');
        if (customUrl) return customUrl;
    }

    // 3. Deployed production cloud environment with VITE_API_URL
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        let envUrl = String(import.meta.env.VITE_API_URL).trim();
        if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
            if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
            if (!envUrl.endsWith('/api')) envUrl += '/api';
            return envUrl;
        }
    }

    // 4. Default fast direct connection to live production cloud API
    return PROD_API_URL;
};

const api = axios.create({
    baseURL: getApiUrl(),
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach Bearer token and ensure baseURL matches current dev/prod environment
api.interceptors.request.use(
    (config) => {
        config.baseURL = getApiUrl();
        let token = localStorage.getItem('token');
        if (!token) {
            try {
                const custUser = JSON.parse(localStorage.getItem('restosys_customer_user'));
                if (custUser?.token) token = custUser.token;
            } catch (e) {}
        }

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle automatic failover and cold-start retries
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response ? error.response.status : 0;
        const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));
        const isNetworkDown = !error.response || error.code === 'ERR_NETWORK' || isTimeout;
        const isColdStart = status === 502 || status === 503 || status === 504 || isNetworkDown;
        const isLocal = isLocalEnvironment();

        // Failover to production API ONLY when deployed on cloud and NEVER on local development!
        if (config && !isLocal && (isNetworkDown || isTimeout)) {
            const currentBase = config.baseURL || '';
            if (currentBase !== PROD_API_URL) {
                console.warn('Backend is unreachable or timed out, automatically switching to production API:', PROD_API_URL);
                config.baseURL = PROD_API_URL;
                if (typeof window !== 'undefined' && window.sessionStorage) {
                    window.sessionStorage.setItem('foodnest_api_failover', PROD_API_URL);
                }
                return axios(config);
            }
        }

        // Exponential backoff retry on cold start (up to 3 retries) against the configured backend URL
        if (config && isColdStart && (!config._retryCount || config._retryCount < 3)) {
            config._retryCount = (config._retryCount || 0) + 1;
            const backoffMs = Math.min(config._retryCount * 1500 + 1000, 5000);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return api.request(config);
        }

        return Promise.reject(error);
    }
);

export default api;
