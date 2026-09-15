import axios from 'axios';

export const getApiUrl = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return `http://${hostname}:5000/api`;
    }
    // Return relative path on Vercel production to utilize Vercel reverse proxy (vercel.json) and avoid browser CORS preflight failures
    return '/api';
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

        if (config && isColdStart && (!config._retryCount || config._retryCount < 12)) {
            config._retryCount = (config._retryCount || 0) + 1;
            const backoffMs = 4500;
            console.log(`Render server spinning up (${status || 'Network Error'}). Retrying in 4.5s... (attempt ${config._retryCount}/12)`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return api.request(config);
        }

        return Promise.reject(error);
    }
);

export default api;
