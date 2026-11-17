import axios from 'axios';

export const PROD_API_URL = 'https://backend-ochre-five-29.vercel.app/api';

export const getApiUrl = () => {
    // 1. Check custom localStorage override first
    if (typeof window !== 'undefined' && window.localStorage) {
        const customUrl = window.localStorage.getItem('restosys_api_url') || window.localStorage.getItem('foodnest_api_url');
        if (customUrl) return customUrl;

        // If developer explicitly opted into local port 5000 backend:
        if (window.localStorage.getItem('use_local_backend') === 'true') {
            const host = window.location.hostname || 'localhost';
            return `http://${host}:5000/api`;
        }
    }

    // 2. When deployed with VITE_API_URL
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        let envUrl = String(import.meta.env.VITE_API_URL).trim();
        if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
            if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
            if (!envUrl.endsWith('/api')) envUrl += '/api';
            return envUrl;
        }
    }

    // 3. Default fast direct connection to live production cloud API
    return PROD_API_URL;
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

        // If local backend on port 5000 is not reachable, failover to production API
        if (config && (isNetworkDown || isTimeout)) {
            const currentBase = config.baseURL || '';
            if (currentBase.includes(':5000') || currentBase.includes('localhost') || currentBase.includes('127.0.0.1')) {
                console.warn('Local port 5000 is unreachable, automatically switching to production API:', PROD_API_URL);
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
            const backoffMs = Math.min(config._retryCount * 2000 + 1000, 8000);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return api.request(config);
        }

        return Promise.reject(error);
    }
);

export default api;
