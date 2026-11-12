import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const getApiUrl = () => {
    // Check custom localStorage override first (useful for manual setting or testing on real devices)
    if (typeof window !== 'undefined' && window.localStorage) {
        const customUrl = window.localStorage.getItem('foodnest_api_url');
        if (customUrl) return customUrl;
    }

    // If running in desktop/local browser (NOT native Capacitor Android/iOS), use local backend port 5000
    if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
    }

    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        let envUrl = import.meta.env.VITE_API_URL.trim();
        if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
        if (!envUrl.endsWith('/api')) envUrl += '/api';
        // If native platform and envUrl is localhost, use Render backend instead of localhost
        if (Capacitor.isNativePlatform() && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
            return 'https://f-hms-1.onrender.com/api';
        }
        return envUrl;
    }

    // Default to the live Render backend URL for Capacitor Native Android and production deployments
    return 'https://f-hms-1.onrender.com/api';
};

const api = axios.create({
    baseURL: getApiUrl(),
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

// Response interceptor to handle automatic retries for Render cold-starts (503 / Network Error)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response ? error.response.status : 0;
        const isNetworkDown = !error.response || error.code === 'ERR_NETWORK';
        const isColdStart = status === 502 || status === 503 || status === 504 || isNetworkDown;

        // Fallback to live Render backend if local/LAN port 5000 is unreachable
        if (config && isNetworkDown && config.baseURL && (config.baseURL.includes('5000') || config.baseURL.includes('localhost') || config.baseURL.includes('192.168.'))) {
            config.baseURL = 'https://f-hms-1.onrender.com/api';
            return api.request(config);
        }

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
