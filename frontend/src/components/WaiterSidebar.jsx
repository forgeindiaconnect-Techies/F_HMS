import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutGrid, ClipboardList, Clock, CheckSquare, LogOut, Utensils, Settings,
    Flame, ChefHat, UserCheck, TrendingUp, Bell, Star
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const WaiterSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, restaurant } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        setLogoError(false);
    }, [restaurant?.logo]);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, []);

    const getLogoUrl = () => {
        if (!restaurant?.logo) return null;
        if (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:')) {
            return restaurant.logo;
        }
        const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
        try {
            const origin = new URL(apiBase).origin;
            return `${origin}${restaurant.logo.startsWith('/') ? '' : '/'}${restaurant.logo}`;
        } catch (e) {
            return restaurant.logo;
        }
    };
    const logoSrc = getLogoUrl();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navGroups = [
        {
            title: 'Floor Operations',
            items: [
                { name: 'Waiter Desk Overview', path: '/waiter', icon: LayoutGrid },
                { name: 'Priority Action Center', path: '/waiter/priority-actions', icon: Flame, badge: 'Urgent', badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' },
                { name: 'Interactive Floor Plan', path: '/waiter/floor-plan', icon: Utensils },
                { name: 'Active Orders', path: '/waiter/orders', icon: ClipboardList },
            ]
        },
        {
            title: 'Kitchen & Service',
            items: [
                { name: 'Kitchen Live Tracker', path: '/waiter/kitchen-tracker', icon: ChefHat, badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' },
                { name: 'Food Ready / Pending', path: '/waiter/pending', icon: Clock, badge: 'Hot', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' },
                { name: 'Completed Serves', path: '/waiter/completed', icon: CheckSquare },
            ]
        },
        {
            title: 'Shift & Performance',
            items: [
                { name: 'Today\'s Tasks', path: '/waiter/tasks', icon: CheckSquare },
                { name: 'Performance & Tips', path: '/waiter/performance', icon: TrendingUp },
                { name: 'Shift Status & Clock-In', path: '/waiter/shift-status', icon: UserCheck },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { name: 'Dashboard Settings', path: '/waiter/settings', icon: Settings },
            ]
        }
    ];

    return (
        <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden" 
                onClick={() => setIsOpen(false)}
            />
        )}
        <aside className={clsx(
            "w-64 bg-white dark:bg-slate-900 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)] h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-40 border-r border-gray-100 dark:border-slate-800",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
                {logoSrc && !logoError ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <img 
                            src={logoSrc} 
                            alt="Logo" 
                            onError={() => setLogoError(true)}
                            className="w-full h-full object-cover" 
                        />
                    </div>
                ) : (
                    <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm shrink-0">
                        <Utensils size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {restaurant && restaurant.name ? restaurant.name : 'RestoSys'}
                    </h1>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">Floor Desk</span>
                </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
                {navGroups.map((group, index) => (
                    <div key={index} className="mb-6">
                        <h3 className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.path === '/waiter' 
                                    ? location.pathname === '/waiter' 
                                    : location.pathname === item.path;

                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.path === '/waiter'}
                                        className={clsx(
                                            "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm",
                                            isActive 
                                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold" 
                                            : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 font-medium"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <Icon size={18} className={clsx("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500")} />
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                        {item.badge && (
                                            <span className={clsx("text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ml-1", item.badgeColor)}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Logout */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-bold">
                    <LogOut size={18} />
                    <span>End Shift</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default WaiterSidebar;

