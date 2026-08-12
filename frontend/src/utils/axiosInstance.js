import axios from 'axios';

export const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL;
    if (url && (url.includes('f-hms') || url.includes('ERR_NAME_NOT_RESOLVED'))) {
        url = 'https://rms-backend.onrender.com/api';
    }
    if (url) {
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.endsWith('/api')) url += '/api';
        return url;
    }
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
        return 'https://rms-backend.onrender.com/api';
    }
    const isLocalIp = hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
    if (isLocalIp) {
        return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
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

// Response interceptor to handle automatic retries for Render cold-starts
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config || config._retryCount >= 6) {
            return Promise.reject(error);
        }

        const status = error.response ? error.response.status : 0;
        if (status === 502 || status === 503 || !error.response || error.code === 'ERR_NETWORK') {
            config._retryCount = (config._retryCount || 0) + 1;
            console.log(`Render backend waking up (${status || 'Network Error'}). Retrying in 3s... (attempt ${config._retryCount}/6)`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;
