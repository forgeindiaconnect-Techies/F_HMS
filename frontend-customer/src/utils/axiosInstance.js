import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const getApiUrl = () => {
    // 1. Check custom localStorage override first (useful for manual setting or testing on physical devices)
    if (typeof window !== 'undefined' && window.localStorage) {
        const customUrl = window.localStorage.getItem('foodnest_api_url');
        if (customUrl) return customUrl;
    }

    // 2. In browser environments on localhost or local network, connect directly to local backend on port 5000
    if (typeof window !== 'undefined' && window.location && !Capacitor.isNativePlatform()) {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return `http://${host}:5000/api`;
        }
        if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
            return `http://${host}:5000/api`;
        }
    }

    // 3. When deployed (e.g. on Vercel) or on native app, use VITE_API_URL
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        let envUrl = import.meta.env.VITE_API_URL.trim();
        if (envUrl) {
            if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
            if (!envUrl.endsWith('/api')) envUrl += '/api';
            return envUrl;
        }
    }

    // 4. Default fallback for local development / native apps
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getApiUrl(),
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach Bearer token from localStorage
api.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('token');
        if (!token) {
            try {
                const staffUser = JSON.parse(localStorage.getItem('restosys_staff_user'));
                if (staffUser?.token) token = staffUser.token;
            } catch (e) {}
        }
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

// Response interceptor to handle automatic retries for cold-starts (502 / 503 / 504 / Network Error)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response ? error.response.status : 0;
        const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));
        const isNetworkDown = !error.response || error.code === 'ERR_NETWORK' || isTimeout;
        const isColdStart = status === 502 || status === 503 || status === 504 || isNetworkDown;

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
