import axios from 'axios';

export const getApiUrl = () => {
    // If running in browser on localhost or local network, always use local backend port 5000
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5000/api';
    }

    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        let envUrl = import.meta.env.VITE_API_URL.trim();
        if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
        if (!envUrl.endsWith('/api')) envUrl += '/api';
        return envUrl;
    }

    // Default to deployed Render backend URL for seamless connectivity across web & mobile apps
    return 'https://f-hms.onrender.com/api';
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

        // Fallback to live Render backend ONLY if local port 5000 is completely down/unreachable, NEVER on 401/400/404
        if (config && isNetworkDown && config.baseURL && config.baseURL.includes('localhost:5000')) {
            config.baseURL = 'https://f-hms.onrender.com/api';
            return api.request(config);
        }

        if (config && isColdStart && (!config._retryCount || config._retryCount < 5)) {
            config._retryCount = (config._retryCount || 0) + 1;
            const backoffMs = Math.min(config._retryCount * 2000 + 1000, 10000);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return api.request(config);
        }

        return Promise.reject(error);
    }
);

export default api;
