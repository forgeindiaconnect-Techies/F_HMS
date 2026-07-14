import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

let API_URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_URL_BASE.endsWith('/')) API_URL_BASE = API_URL_BASE.slice(0, -1);
if (!API_URL_BASE.endsWith('/api')) API_URL_BASE += '/api';

const api = axios.create({
    baseURL: API_URL_BASE,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('restosys_staff_user'));
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
            localStorage.removeItem('restosys_staff_user');
            if (window.location.pathname !== '/staff/login' && window.location.pathname !== '/staff/register') {
                window.location.href = '/staff/login';
            }
        }
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('restosys_staff_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password, loginType: 'staff' });
            setUser(data);
            localStorage.setItem('restosys_staff_user', JSON.stringify(data));
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

    const register = async (name, email, password, roleName, loginType = 'staff', restaurantName, plan, billingCycle) => {
        try {
            const { data } = await api.post('/auth/register', { 
                name, email, password, roleName, loginType, restaurantName, plan, billingCycle 
            });
            setUser(data);
            localStorage.setItem('restosys_staff_user', JSON.stringify(data));
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
        localStorage.removeItem('restosys_staff_user');
        window.location.href = '/staff/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
