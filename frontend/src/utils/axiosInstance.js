import axios from 'axios';

export const getApiUrl = () => {
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
        const token = localStorage.getItem('token');
        if (token) {
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
        const isColdStart = status === 502 || status === 503 || status === 504 || (!error.response && error.code === 'ERR_NETWORK');

        // Fallback to live Render backend if local port 5000 is unreachable
        if (config && config.baseURL && config.baseURL.includes('localhost:5000')) {
            config.baseURL = 'https://f-hms.onrender.com/api';
            return api.request(config);
        }

        if (config && isColdStart && (!config._retryCount || config._retryCount < 10)) {
            config._retryCount = (config._retryCount || 0) + 1;
            const backoffMs = Math.min(config._retryCount * 2500 + 2500, 14000);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return api.request(config);
        }

        return Promise.reject(error);
    }
);

export default api;
