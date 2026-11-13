import axios from 'axios';

export const getApiUrl = () => {
    // If local port 5000 was tested and found unreachable, use the cloud backend immediately without delay
    if (typeof window !== 'undefined' && window.__localPort5000Down) {
        return 'https://f-hms.onrender.com/api';
    }

    // If running in browser on localhost or local network, use local backend port 5000
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        // Support local WiFi / LAN IP (e.g. 192.168.x.x)
        if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
            return `http://${host}:5000/api`;
        }
    }

    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        let envUrl = import.meta.env.VITE_API_URL.trim();
        if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
        if (!envUrl.endsWith('/api')) envUrl += '/api';
        if (envUrl.includes('f-hms-1') || envUrl.includes('backend-ochre')) {
            return 'https://f-hms.onrender.com/api';
        }
        return envUrl;
    }

    // Default to deployed backend URL for seamless connectivity across web & mobile apps
    return 'https://f-hms.onrender.com/api';
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

// Response interceptor to handle automatic retries for Render cold-starts (503 / Network Error)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response ? error.response.status : 0;
        const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));
        const isNetworkDown = !error.response || error.code === 'ERR_NETWORK' || isTimeout;
        const isColdStart = status === 502 || status === 503 || status === 504 || isNetworkDown;

        // Fallback to live backend if local/LAN port 5000 is down or timed out, NEVER on 401/400/404
        const isLocalTarget = config?.baseURL && (
            config.baseURL.includes(':5000') || 
            config.baseURL.includes('localhost') || 
            config.baseURL.includes('127.0.0.1') || 
            config.baseURL.includes('192.168.') || 
            config.baseURL.includes('10.') || 
            config.baseURL.includes('172.')
        );

        const isDeadRender = config?.baseURL && (config.baseURL.includes('f-hms-1') || config.baseURL.includes('backend-ochre'));
        if (config && !config._fallbackTried && (isDeadRender || (isNetworkDown && isLocalTarget))) {
            if (typeof window !== 'undefined' && isLocalTarget) {
                window.__localPort5000Down = true;
            }
            config._fallbackTried = true;
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
