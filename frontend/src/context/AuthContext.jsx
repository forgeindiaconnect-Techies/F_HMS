import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const api = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('restosys_staff_user'));
    } catch (e) {
        localStorage.removeItem('restosys_staff_user');
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
        if (config && (!config._retryCount || config._retryCount < 10)) {
            const status = error.response ? error.response.status : 0;
            if (status === 502 || status === 503 || status === 504 || !error.response || error.code === 'ERR_NETWORK') {
                config._retryCount = (config._retryCount || 0) + 1;
                console.log(`[Render Server Cold-Start] Retrying request (${status || 'Network Error'}). Attempt ${config._retryCount}/10...`);
                await new Promise((resolve) => setTimeout(resolve, 2000));
                return api(config);
            }
        }
        if (error.response && error.response.status === 401) {
            const path = window.location.pathname;
            const isLoginRoute = path === '/login' || path === '/register' || path === '/delivery/login' || path === '/customer/login' || path === '/staff/login';
            
            if (!isLoginRoute) {
                localStorage.removeItem('restosys_staff_user');
                if (path.startsWith('/delivery')) {
                    window.location.href = '/delivery/login';
                } else {
                    window.location.href = '/staff/login';
                }
            }
        }
        if (error.response && error.response.status === 402) {
            if (window.location.pathname !== '/admin/billing') {
                window.location.href = '/admin/billing';
            }
        }
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRestaurant = useCallback(async (currentUser = user) => {
        if (!currentUser || currentUser.role === 'SuperAdmin' || currentUser.role === 'DeliveryPartner') {
            setRestaurant(null);
            return null;
        }
        try {
            const res = await api.get('/restaurants/mine');
            if (res.data) {
                setRestaurant(res.data);
                if (currentUser && !currentUser.restaurantId && res.data._id) {
                    const updatedUser = { ...currentUser, restaurantId: res.data._id, branchId: currentUser.branchId || res.data.mainBranchId };
                    setUser(updatedUser);
                    localStorage.setItem('restosys_staff_user', JSON.stringify(updatedUser));
                }
            } else {
                setRestaurant(null);
            }
            return res.data;
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.requiresVerification) {
                const partialRest = { verificationStatus: error.response.data.verificationStatus };
                setRestaurant(partialRest);
                return partialRest;
            }
            console.error('Failed to fetch restaurant in context:', error);
            return null;
        }
    }, [user]);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('restosys_staff_user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    await fetchRestaurant(parsedUser);
                } catch (e) {
                    localStorage.removeItem('restosys_staff_user');
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    // Auto-refresh restaurant subscription data every 30s and on window focus
    useEffect(() => {
        if (!user || user.role === 'SuperAdmin' || user.role === 'DeliveryPartner') return;

        const refresh = () => fetchRestaurant(user);
        window.addEventListener('focus', refresh);
        const interval = setInterval(refresh, 30000);

        return () => {
            window.removeEventListener('focus', refresh);
            clearInterval(interval);
        };
    }, [user, fetchRestaurant]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password, loginType: 'staff' });
            setUser(data);
            localStorage.setItem('restosys_staff_user', JSON.stringify(data));
            await fetchRestaurant(data);
            return { success: true, data };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Login failed';
            if (!error.response || error.response.status !== 401) {
                console.error('Login error:', errorMsg);
            }
            return { success: false, message: errorMsg };
        }
    };

    const register = async (name, email, password, phoneNumber, roleName, loginType = 'staff', restaurantName, plan, billingCycle) => {
        try {
            const { data } = await api.post('/auth/register', { 
                name, email, password, phoneNumber, roleName, loginType, restaurantName, plan, billingCycle 
            });
            setUser(data);
            localStorage.setItem('restosys_staff_user', JSON.stringify(data));
            await fetchRestaurant(data);
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
        const isDelivery = user?.role === 'DeliveryPartner' || window.location.pathname.startsWith('/delivery');
        setUser(null);
        setRestaurant(null);
        localStorage.removeItem('restosys_staff_user');
        window.location.href = isDelivery ? '/delivery/login' : '/staff/login';
    };

    return (
        <AuthContext.Provider value={{ user, setUser, restaurant, fetchRestaurant, login, register, logout, loading, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
