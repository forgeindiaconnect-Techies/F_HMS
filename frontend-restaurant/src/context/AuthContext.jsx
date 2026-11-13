import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/axiosInstance';
import { evaluateClientSubscriptionFreeze } from '../utils/subscriptionClient';

const defaultAuthContext = {
    user: null,
    setUser: () => {},
    restaurant: null,
    setRestaurant: () => {},
    subscriptionState: null,
    fetchRestaurant: async () => null,
    plans: [],
    fetchPlans: async () => [],
    login: async () => ({ success: false, message: 'Initializing authentication...' }),
    register: async () => ({ success: false, message: 'Initializing authentication...' }),
    logout: async () => {},
    loading: false,
    api: null,
};

const AuthContext = createContext(defaultAuthContext);

export const useAuth = () => {
    const context = useContext(AuthContext);
    return context || defaultAuthContext;
};

const api = axios.create({
    baseURL: getApiUrl(),
    timeout: 30000,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    let token = null;
    try {
        const user = JSON.parse(localStorage.getItem('restosys_staff_user'));
        if (user?.token) token = user.token;
    } catch (e) {
        localStorage.removeItem('restosys_staff_user');
    }
    if (!token) {
        token = localStorage.getItem('token');
    }
    if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${token}`);
        } else {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

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
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return api.request(config);
        }
        if (error.response && error.response.status === 401) {
            const path = window.location.pathname;
            const isLoginRoute = path === '/login' || path === '/register' || path === '/delivery/login' || path === '/customer/login' || path === '/staff/login';
            const isAuthEndpoint = config && config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/verify-otp') || config.url.includes('/auth/send-otp'));

            if (!isLoginRoute && !isAuthEndpoint) {
                localStorage.removeItem('restosys_staff_user');
                if (path.startsWith('/delivery')) {
                    window.location.href = '/delivery/login';
                } else {
                    window.location.href = '/login';
                }
            }
        }
        if (error.response && (error.response.status === 402 || (error.response.status === 403 && error.response.data?.isFrozen))) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('subscription-frozen', { detail: error.response.data }));
            }
        }
        return Promise.reject(error);
    }
);

// Fast in-memory + sessionStorage GET cache & in-flight deduplication so sidebar/section switches render immediately
const SESSION_CACHE_KEY = 'restosys_api_cache_v1';
const _apiGetCache = new Map();
const _apiInFlight = new Map();
const API_CACHE_TTL_MS = 30000;

try {
    const rawSession = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (rawSession) {
        const parsed = JSON.parse(rawSession);
        Object.entries(parsed).forEach(([k, v]) => {
            if (v && (Date.now() - v.ts) < API_CACHE_TTL_MS) {
                _apiGetCache.set(k, { res: { data: v.data, status: 200 }, ts: v.ts });
            }
        });
    }
} catch (_) {}

const persistCacheEntry = (key, data) => {
    try {
        const serialized = JSON.stringify(data);
        if (serialized.length > 60000) return; // Skip huge payloads
        const existing = JSON.parse(sessionStorage.getItem(SESSION_CACHE_KEY) || '{}');
        const keys = Object.keys(existing);
        if (keys.length > 25) delete existing[keys[0]];
        existing[key] = { data, ts: Date.now() };
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(existing));
    } catch (_) {}
};

export const clearApiGetCache = () => {
    _apiGetCache.clear();
    _apiInFlight.clear();
    try { sessionStorage.removeItem(SESSION_CACHE_KEY); } catch (_) {}
};

const _rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
    const skipCache = config?.noCache || String(url).includes('/notifications') || String(url).includes('/auth/');
    if (skipCache) return _rawGet(url, config);

    const tokenKey = localStorage.getItem('token') || 'anon';
    const key = `${tokenKey.slice(-12)}:${url}:${JSON.stringify(config?.params || {})}`;
    const cached = _apiGetCache.get(key);
    if (cached && (Date.now() - cached.ts) < API_CACHE_TTL_MS) {
        return Promise.resolve(cached.res);
    }
    if (_apiInFlight.has(key)) {
        return _apiInFlight.get(key);
    }
    const reqPromise = _rawGet(url, config)
        .then((res) => {
            _apiGetCache.set(key, { res, ts: Date.now() });
            persistCacheEntry(key, res.data);
            return res;
        })
        .finally(() => {
            _apiInFlight.delete(key);
        });
    _apiInFlight.set(key, reqPromise);
    return reqPromise;
};

['post', 'put', 'patch', 'delete'].forEach((method) => {
    const _rawMethod = api[method].bind(api);
    api[method] = (...args) => {
        const url = String(args[0] || '');
        if (!url.includes('/reports/generate')) {
            clearApiGetCache();
        }
        return _rawMethod(...args);
    };
});

const isStaffPortalPath = (path) => {
    return (
        path.startsWith('/admin') ||
        path.startsWith('/staff') ||
        path.startsWith('/kitchen') ||
        path.startsWith('/pos') ||
        path.startsWith('/owner') ||
        path.startsWith('/waiter') ||
        path.startsWith('/chef') ||
        path.startsWith('/cashier') ||
        path.startsWith('/manager') ||
        path.startsWith('/delivery')
    );
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('restosys_staff_user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            localStorage.removeItem('restosys_staff_user');
            return null;
        }
    });
    const [restaurant, setRestaurant] = useState(() => {
        try {
            const cached = localStorage.getItem('restosys_restaurant');
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState(() => {
        try {
            const cached = sessionStorage.getItem('restosys_plans_cache');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });

    const fetchPlans = useCallback(async (force = false) => {
        if (!force && plans.length > 0) return plans;
        if (window.__restosysPlansPromise && !force) return window.__restosysPlansPromise;
        window.__restosysPlansPromise = api.get('/plans')
            .then(res => {
                const list = res.data || [];
                setPlans(list);
                try { sessionStorage.setItem('restosys_plans_cache', JSON.stringify(list)); } catch (e) { }
                return list;
            })
            .catch(() => plans)
            .finally(() => { window.__restosysPlansPromise = null; });
        return window.__restosysPlansPromise;
    }, [plans.length]);

    useEffect(() => {
        if (user && !['Customer', 'SuperAdmin', 'SupportAgent'].includes(user.role)) {
            fetchPlans();
        }
    }, [user, fetchPlans]);

    const fetchRestaurant = useCallback(async (currentUser = user) => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isStaffRoute = isStaffPortalPath(path);

        if (!isStaffRoute || !currentUser || ['Customer', 'SuperAdmin', 'SupportAgent'].includes(currentUser.role)) {
            setRestaurant(null);
            return null;
        }
        try {
            const res = await api.get('/restaurants/mine');
            if (res.data) {
                setRestaurant(res.data);
                try { localStorage.setItem('restosys_restaurant', JSON.stringify(res.data)); } catch (e) { }
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
                    setLoading(false);
                    // Refresh restaurant in background without blocking initial UI render on cold starts
                    fetchRestaurant(parsedUser).catch(() => { });
                    return;
                } catch (e) {
                    localStorage.removeItem('restosys_staff_user');
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    // Auto-refresh restaurant subscription data every 30s, on window focus, on server 402/403 freeze event, and live via WS
    useEffect(() => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isStaffRoute = isStaffPortalPath(path);

        if (!isStaffRoute || !user || ['Customer', 'SuperAdmin', 'SupportAgent'].includes(user.role)) return;

        const refresh = () => fetchRestaurant(user);
        window.addEventListener('focus', refresh);
        window.addEventListener('subscription-frozen', refresh);
        const interval = setInterval(refresh, 30000);

        let ws = null;
        let reconnectTimer = null;
        let isUnmounted = false;

        const connectSubWS = () => {
            if (isUnmounted || !user?.restaurantId) return;
            try {
                const wsURL = getApiUrl().replace(/^http/, 'ws').replace(/\/api$/, '');
                ws = new WebSocket(wsURL);
                ws.onopen = () => {
                    const cleanRestId = typeof user.restaurantId === 'object' ? (user.restaurantId._id || user.restaurantId.id) : user.restaurantId;
                    ws.send(JSON.stringify({
                        type: 'register',
                        token: user.token || localStorage.getItem('token') || undefined,
                        restaurantId: cleanRestId,
                        role: user.role,
                    }));
                };
                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === 'subscription_updated' && msg.data?.subscription) {
                            setRestaurant((prev) => {
                                if (!prev) return prev;
                                const updated = { ...prev, subscription: { ...(prev.subscription || {}), ...msg.data.subscription } };
                                try { localStorage.setItem('restosys_restaurant', JSON.stringify(updated)); } catch (_) { }
                                return updated;
                            });
                            fetchRestaurant(user);
                        }
                    } catch (_) { }
                };
                ws.onclose = () => {
                    if (!isUnmounted) {
                        reconnectTimer = setTimeout(connectSubWS, 8000);
                    }
                };
            } catch (_) { }
        };

        connectSubWS();

        return () => {
            isUnmounted = true;
            window.removeEventListener('focus', refresh);
            window.removeEventListener('subscription-frozen', refresh);
            clearInterval(interval);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
    }, [user, fetchRestaurant]);

    const subscriptionState = useMemo(() => evaluateClientSubscriptionFreeze(user, restaurant), [user, restaurant]);

    const clearAllStaleState = () => {
        setUser(null);
        setRestaurant(null);
        localStorage.removeItem('restosys_staff_user');
        localStorage.removeItem('token');
        try { localStorage.removeItem('restosys_restaurant'); } catch (e) { }
        // Clear all cached local data keys to prevent cross-restaurant data leakage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('restosys_') || key.startsWith('cart_') || key.startsWith('table_')) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.clear();
    };

    const login = async (email, password) => {
        try {
            clearAllStaleState();
            let res;
            const currentBase = (api.defaults?.baseURL || getApiUrl());
            const isLocal = currentBase.includes('localhost') || currentBase.includes(':5000') || currentBase.includes('127.0.0.1');

            // If localhost target is known down or unreachable, bypass directly to cloud without waiting
            if (isLocal && typeof window !== 'undefined' && window.__localPort5000Down) {
                res = await axios.post('https://f-hms.onrender.com/api/auth/login', {
                    email,
                    password,
                    loginType: 'staff'
                }, {
                    timeout: 25000,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                try {
                    // Fail fast on local port 5000 in 1500ms so we failover to cloud in 1.5s instead of 35s!
                    const targetTimeout = isLocal ? 1500 : 25000;
                    res = await api.post('/auth/login', { email, password, loginType: 'staff' }, { timeout: targetTimeout });
                } catch (localErr) {
                    const isNetErr = !localErr.response || localErr.code === 'ERR_NETWORK' || localErr.code === 'ECONNABORTED';
                    if (isNetErr) {
                        if (typeof window !== 'undefined' && isLocal) {
                            window.__localPort5000Down = true;
                        }
                        res = await axios.post('https://f-hms.onrender.com/api/auth/login', {
                            email,
                            password,
                            loginType: 'staff'
                        }, {
                            timeout: 30000,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } else {
                        throw localErr;
                    }
                }
            }

            const data = res.data;
            setUser(data);
            localStorage.setItem('restosys_staff_user', JSON.stringify(data));
            if (data?.token) {
                localStorage.setItem('token', data.token);
            }
            if (data?.restaurant) {
                setRestaurant(data.restaurant);
                try { localStorage.setItem('restosys_restaurant', JSON.stringify(data.restaurant)); } catch (e) { }
                fetchRestaurant(data).catch(() => { });
            } else {
                fetchRestaurant(data).catch(() => { });
            }
            return { success: true, data };
        } catch (error) {
            const errorMsg = error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Login request timed out while waiting for cloud server to wake up. Please click Login again.' : (error.message || 'Login failed'));
            if (!error.response || error.response.status !== 401) {
                console.error('Login error:', errorMsg);
            }
            return { success: false, message: errorMsg };
        }
    };

    const register = async (name, email, password, phoneNumber, roleName, loginType = 'staff', restaurantName, plan, billingCycle) => {
        try {
            clearAllStaleState();
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
        const isDelivery = user?.role === 'DeliveryPartner' || window.location.pathname.startsWith('/delivery');
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        clearAllStaleState();
        window.location.href = isDelivery ? '/delivery/login' : '/staff/login';
    };

    return (
        <AuthContext.Provider value={{ user, setUser, restaurant, subscriptionState, fetchRestaurant, plans, fetchPlans, login, register, logout, loading, api }}>
            {loading ? (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFAF8] dark:bg-slate-950 text-slate-800 dark:text-white gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-[#FF5A1F] animate-spin" />
                    <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Loading FoodNest...</span>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
