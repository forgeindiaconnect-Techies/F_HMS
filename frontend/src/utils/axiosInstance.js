import axios from 'axios';

export const getApiUrl = () => {
    let url = import.meta.env.VITE_API_URL;
    if (url && (url.includes('ERR_NAME_NOT_RESOLVED') || url.includes('f-hms.onrender.com'))) {
        url = 'https://f-hms-7hbi.onrender.com/api';
    }
    if (url) {
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.endsWith('/api')) url += '/api';
        return url;
    }
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
        return 'https://f-hms-7hbi.onrender.com/api';
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

// Response interceptor to handle automatic retries for Render cold-starts (503 / Network Error)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config || config._retryCount >= 15) {
            return Promise.reject(error);
        }

        const status = error.response ? error.response.status : 0;
        // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout or ERR_NETWORK / CORS during spin-up
        if (status === 502 || status === 503 || status === 504 || !error.response || error.code === 'ERR_NETWORK') {
            config._retryCount = (config._retryCount || 0) + 1;
            console.log(`Render server spinning up (${status || 'Network Error'}). Retrying in 2.5s... (attempt ${config._retryCount}/15)`);
            await new Promise((resolve) => setTimeout(resolve, 2500));
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;
