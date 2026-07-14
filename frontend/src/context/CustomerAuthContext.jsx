import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CustomerAuthContext = createContext();

export const useCustomerAuth = () => useContext(CustomerAuthContext);

let API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_URL_BASE.endsWith('/')) API_URL_BASE = API_URL_BASE.slice(0, -1);
if (!API_URL_BASE.endsWith('/api')) API_URL_BASE += '/api';

const api = axios.create({
    baseURL: API_URL_BASE,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('restosys_customer_user'));
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
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('restosys_customer_user');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
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
            setUser(JSON.parse(storedUser));
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
            // Only log actual network errors, not standard 401 unauthorized errors
            if (!error.response || error.response.status !== 401) {
                console.error('Login error:', errorMsg);
            }
            return { success: false, message: errorMsg };
        }
    };

    const register = async (name, email, password, roleName) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, roleName: 'Customer', loginType: 'customer' });
            setUser(data);
            localStorage.setItem('restosys_customer_user', JSON.stringify(data));
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
        window.location.href = '/login';
    };

    return (
        <CustomerAuthContext.Provider value={{ user, login, register, logout, loading, api }}>
            {!loading && children}
        </CustomerAuthContext.Provider>
    );
};
