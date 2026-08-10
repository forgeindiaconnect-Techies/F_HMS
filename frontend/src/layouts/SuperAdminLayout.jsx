import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Store, CreditCard, Percent, TrendingUp, 
    Users, MessageSquare, SlidersHorizontal, Settings, BarChart3, 
    Bell, ShieldCheck, LogOut, User, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SuperAdminLayout = () => {
    const { logout, user, api } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);

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
            const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds for live notifications
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

    // Dynamically filter navigation links based on user role
    const getNavigation = () => {
        const fullNavigation = [
            { name: 'Overview', href: '/super-admin', icon: LayoutDashboard, roles: ['SuperAdmin'] },
            { name: 'Restaurants', href: '/super-admin/restaurants', icon: Store, roles: ['SuperAdmin'] },
            { name: 'Plans', href: '/super-admin/plans', icon: CreditCard, roles: ['SuperAdmin'] },
            { name: 'Commissions', href: '/super-admin/commissions', icon: Percent, roles: ['SuperAdmin'] },
            { name: 'Revenue Analytics', href: '/super-admin/revenue', icon: TrendingUp, roles: ['SuperAdmin'] },
            { name: 'Users', href: '/super-admin/users', icon: Users, roles: ['SuperAdmin'] },
            { name: 'Support Tickets', href: '/super-admin/support', icon: MessageSquare, roles: ['SuperAdmin', 'SupportAgent'] },
            { name: 'Features', href: '/super-admin/features', icon: SlidersHorizontal, roles: ['SuperAdmin'] },
            { name: 'System Settings', href: '/super-admin/settings', icon: Settings, roles: ['SuperAdmin'] },
            { name: 'Reports & Analytics', href: '/super-admin/reports', icon: BarChart3, roles: ['SuperAdmin'] },
            { name: 'Notifications', href: '/super-admin/notifications', icon: Bell, roles: ['SuperAdmin'] },
            { name: 'Verifications', href: '/super-admin/verifications', icon: ShieldCheck, roles: ['SuperAdmin'] },
        ];
        return fullNavigation.filter(item => item.roles.includes(user?.role));
    };

    const navigation = getNavigation();

    return (
        <div className="flex h-screen bg-gray-50 relative">
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden" 
                    onClick={() => setIsOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <div className={`w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 md:sticky md:top-0 h-screen transition-transform duration-300 z-40 border-r border-slate-800 ${
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}>
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold font-sans tracking-tight">RestaurantHub<span className="text-blue-500">SaaS</span></h1>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Super Admin</p>
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                                    isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                
                <div className="p-4 border-t border-slate-800">
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsOpen(!isOpen)} 
                            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 font-sans capitalize">
                            {location.pathname.split('/').pop().replace('-', ' ') || 'Overview'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all relative"
                                title="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>
                            
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                                    <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="font-bold text-gray-900 text-sm">System Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                {unreadCount} New
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="px-5 py-8 text-center text-gray-400 text-xs font-medium">
                                                No new signups or system alerts.
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n._id} 
                                                    onClick={() => {
                                                        setActiveNotification(n);
                                                        if (!n.read) handleMarkAsRead(n._id);
                                                        setShowDropdown(false);
                                                    }}
                                                    className={`px-5 py-3.5 transition-colors flex flex-col gap-1 text-left cursor-pointer hover:bg-gray-50 ${
                                                        !n.read ? 'bg-blue-50/10' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className="font-bold text-gray-900 text-xs leading-normal">
                                                            {n.title}
                                                        </span>
                                                        {!n.read && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead(n._id);
                                                                }}
                                                                className="text-[10px] text-blue-600 hover:text-blue-700 font-bold shrink-0"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500 text-[11px] leading-relaxed">
                                                        {n.desc}
                                                    </p>
                                                    <span className="text-[9px] text-gray-400 mt-1">
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer group">
                            <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                                <p className="text-sm font-bold text-gray-900 capitalize">{user?.name || 'Super Admin'}</p>
                                <p className="text-xs font-medium text-blue-600 capitalize">System Admin</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200 group-hover:bg-blue-200 transition-colors">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>

            {/* Active Notification Details Modal */}
            {activeNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setActiveNotification(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">System Notification</h3>
                            <button onClick={() => setActiveNotification(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-left">
                            <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/30">
                                <h4 className="text-base font-bold text-blue-800">{activeNotification.title}</h4>
                                <p className="text-xs text-gray-400 mt-1">{new Date(activeNotification.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                    {activeNotification.desc}
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveNotification(null)}
                                className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm shadow-sm"
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
