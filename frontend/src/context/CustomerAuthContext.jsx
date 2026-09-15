import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/axiosInstance';

const CustomerAuthContext = createContext();

export const useCustomerAuth = () => useContext(CustomerAuthContext);

const api = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('restosys_customer_user'));
    } catch (e) {
        localStorage.removeItem('restosys_customer_user');
    }
    if (user && user.token) {
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${user.token}`);
        } else {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${user.token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response ? error.response.status : 0;
        
        // Cold-start spin-up status codes (502, 503, 504, or network drops during boot)
        const isColdStart = status === 502 || status === 503 || status === 504 || (!error.response && error.code === 'ERR_NETWORK');
        
        if (config && isColdStart && (!config._retryCount || config._retryCount < 8)) {
            config._retryCount = (config._retryCount || 0) + 1;
            // Exponential backoff: 3s, 6s, 9s, 12s... to let Render boot without triggering rate limits
            const backoffMs = config._retryCount * 3000;
            console.log(`[Render Cold-Start] Retrying in ${backoffMs/1000}s (attempt ${config._retryCount}/8)...`);

            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return api.request(config);
        }

        if (error.response && error.response.status === 401) {
            localStorage.removeItem('restosys_customer_user');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/customer/login') {
                window.location.href = '/customer/login';
            }
        }
        return Promise.reject(error);
    }
);

export const CustomerAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('restosys_customer_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('restosys_customer_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password, loginType: 'customer' });
            setUser(data);
            localStorage.setItem('restosys_customer_user', JSON.stringify(data));
            return { success: true, data };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Login failed';
            if (!error.response || error.response.status !== 401) {
                console.error('Login error:', errorMsg);
            }
            return { success: false, message: errorMsg };
        }
    };

    const register = async (name, email, password, roleName, phoneNumber) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, phoneNumber, roleName: 'Customer', loginType: 'customer' });
            setUser(data);
            localStorage.setItem('restosys_customer_user', JSON.stringify(data));
            localStorage.removeItem('restosys_cart');
            localStorage.removeItem('restosys_wishlist');
            localStorage.removeItem('customerWalletBalance');
            localStorage.removeItem('customerReservations');
            return { success: true, data };
        } catch (error) {
            console.error('Register error:', error.response?.data || error.message);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        localStorage.removeItem('restosys_customer_user');
        localStorage.removeItem('restosys_cart');
        localStorage.removeItem('restosys_wishlist');
        localStorage.removeItem('customerWalletBalance');
        localStorage.removeItem('customerReservations');
        window.location.href = '/customer/login';
    };

    return (
        <CustomerAuthContext.Provider value={{ user, login, register, logout, loading, api }}>
            {!loading && children}
        </CustomerAuthContext.Provider>
    );
};
