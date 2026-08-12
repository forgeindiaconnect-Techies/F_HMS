import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Store, CreditCard, Percent, TrendingUp, 
    Users, MessageSquare, SlidersHorizontal, Settings, BarChart3, 
    Bell, ShieldCheck, LogOut, User, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SuperAdminLayout = () => {
    const { logout, user, api } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);

    // Close sidebar & dropdown on route change
    useEffect(() => {
        setIsOpen(false);
        setShowDropdown(false);
    }, [location.pathname]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (showDropdown && !e.target.closest('[data-notif-trigger]') && !e.target.closest('[data-notif-dropdown]')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showDropdown]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/super-admin/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (api) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [api]);

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/super-admin/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getNavigation = () => {
        const fullNavigation = [
            { name: 'Overview',            href: '/super-admin',               icon: LayoutDashboard, roles: ['SuperAdmin'] },
            { name: 'Restaurants',         href: '/super-admin/restaurants',   icon: Store,           roles: ['SuperAdmin'] },
            { name: 'Plans',               href: '/super-admin/plans',         icon: CreditCard,      roles: ['SuperAdmin'] },
            { name: 'Commissions',         href: '/super-admin/commissions',   icon: Percent,         roles: ['SuperAdmin'] },
            { name: 'Revenue Analytics',   href: '/super-admin/revenue',       icon: TrendingUp,      roles: ['SuperAdmin'] },
            { name: 'Users',               href: '/super-admin/users',         icon: Users,           roles: ['SuperAdmin'] },
            { name: 'Support Tickets',     href: '/super-admin/support',       icon: MessageSquare,   roles: ['SuperAdmin', 'SupportAgent'] },
            { name: 'Features',            href: '/super-admin/features',      icon: SlidersHorizontal, roles: ['SuperAdmin'] },
            { name: 'System Settings',     href: '/super-admin/settings',      icon: Settings,        roles: ['SuperAdmin'] },
            { name: 'Reports & Analytics', href: '/super-admin/reports',       icon: BarChart3,       roles: ['SuperAdmin'] },
            { name: 'Notifications',       href: '/super-admin/notifications', icon: Bell,            roles: ['SuperAdmin'] },
            { name: 'Verifications',       href: '/super-admin/verifications', icon: ShieldCheck,     roles: ['SuperAdmin'] },
        ];
        return fullNavigation.filter(item => item.roles.includes(user?.role));
    };

    const navigation = getNavigation();

    // Build a nice page title from the URL
    const getPageTitle = () => {
        const segments = location.pathname.replace('/super-admin', '').split('/').filter(Boolean);
        if (segments.length === 0) return 'Overview';
        return segments[segments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* ── Mobile Overlay ─────────────────────────────────── */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 md:hidden" 
                    onClick={() => setIsOpen(false)}
                />
            )}
            
            {/* ── Sidebar ─────────────────────────────────────────── */}
            <aside className={`
                w-64 shrink-0 bg-slate-900 text-white flex flex-col
                fixed inset-y-0 left-0 z-40
                md:relative md:translate-x-0
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
                    <h1 className="text-lg font-bold tracking-tight truncate">
                        RestaurantHub<span className="text-blue-400">SaaS</span>
                    </h1>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Super Admin
                    </p>
                    <div className="space-y-0.5">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href || 
                                (item.href !== '/super-admin' && location.pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group ${
                                        isActive 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <Icon size={17} className="shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                    {isActive && <ChevronRight size={14} className="ml-auto shrink-0 opacity-60" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
                
                {/* Sidebar Footer */}
                <div className="p-3 border-t border-slate-800 shrink-0">
                    <div className="px-3 py-2 mb-2 rounded-xl bg-slate-800/60">
                        <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Admin'}</p>
                        <p className="text-[10px] text-blue-400 font-medium">System Administrator</p>
                    </div>
                    <button 
                        onClick={logout} 
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
                    >
                        <LogOut size={17} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* ── Header ─────────────────────────────────────── */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
                    
                    {/* Left: Hamburger + Page Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button 
                            onClick={() => setIsOpen(!isOpen)} 
                            className="md:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                            aria-label="Toggle menu"
                        >
                            <Menu size={22} />
                        </button>
                        <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 capitalize truncate">
                            {getPageTitle()}
                        </h2>
                    </div>

                    {/* Right: Notifications + Avatar */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        
                        {/* Notifications Bell */}
                        <div className="relative">
                            <button 
                                data-notif-trigger="true"
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
                                aria-label="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </button>
                            
                            {/* Notification Dropdown */}
                            {showDropdown && (
                                <div 
                                    data-notif-dropdown="true"
                                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                    style={{ maxWidth: 'calc(100vw - 2rem)' }}
                                >
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/60 dark:bg-slate-800/60">
                                        <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">System Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                {unreadCount} New
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-400 dark:text-slate-500 text-xs font-medium">
                                                No notifications yet.
                                            </div>
                                        ) : (
                                            notifications.slice(0, 10).map(n => (
                                                <div 
                                                    key={n._id} 
                                                    onClick={() => {
                                                        setActiveNotification(n);
                                                        if (!n.read) handleMarkAsRead(n._id);
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`px-4 py-3 transition-colors flex flex-col gap-0.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${
                                                        !n.read ? 'bg-blue-50/30 dark:bg-blue-950/30 border-l-2 border-blue-400' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className="font-bold text-gray-900 dark:text-slate-100 text-xs leading-normal line-clamp-1">
                                                            {n.title}
                                                        </span>
                                                        {!n.read && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead(n._id);
                                                                }}
                                                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold shrink-0"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                                                        {n.desc}
                                                    </p>
                                                    <span className="text-[10px] text-gray-300 dark:text-slate-500 mt-0.5">
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <Link 
                                        to="/super-admin/notifications"
                                        className="block text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-3 border-t border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        View All Notifications →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* User Avatar */}
                        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 dark:border-slate-800">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-none">{user?.name || 'Admin'}</p>
                                <p className="text-[10px] font-semibold text-blue-500 mt-0.5">System Admin</p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* ── Page Content ─────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    <Outlet />
                </main>
            </div>

            {/* ── Notification Detail Modal ─────────────────────── */}
            {activeNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" 
                        onClick={() => setActiveNotification(null)} 
                    />
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-base">System Notification</h3>
                            <button 
                                onClick={() => setActiveNotification(null)} 
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-800">{activeNotification.title}</h4>
                                <p className="text-xs text-gray-400 mt-1">{new Date(activeNotification.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                    {activeNotification.desc}
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveNotification(null)}
                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminLayout;
