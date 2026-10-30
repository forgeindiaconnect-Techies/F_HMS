import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutGrid, ClipboardList, Clock, CheckSquare, LogOut, Utensils, Settings,
    Flame, ChefHat, UserCheck, TrendingUp, Bell, Star, CalendarDays, CreditCard, ChevronRight
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

    const tipsEnabled = restaurant?.restaurantConfig?.waiterTips?.enabled !== false;

    const navGroups = [
        {
            title: 'Floor Operations',
            items: [
                { name: 'Waiter Desk Overview', path: '/waiter', icon: LayoutGrid },
                { name: 'Priority Action Center', path: '/waiter/priority-actions', icon: Flame, badge: 'Urgent', badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
                { name: 'Interactive Floor Plan', path: '/waiter/floor-plan', icon: Utensils },
                { name: 'Active Orders', path: '/waiter/orders', icon: ClipboardList },
            ]
        },
        {
            title: 'Kitchen & Service',
            items: [
                { name: 'Kitchen Live Tracker', path: '/waiter/kitchen-tracker', icon: ChefHat, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
                { name: 'Food Ready / Pending', path: '/waiter/pending', icon: Clock, badge: 'Hot', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
                { name: 'Completed Serves', path: '/waiter/completed', icon: CheckSquare },
            ]
        },
        {
            title: 'Shift & Performance',
            items: [
                { name: 'Today\'s Tasks', path: '/waiter/tasks', icon: CheckSquare },
                { name: tipsEnabled ? 'Performance & Tips' : 'Shift Performance', path: '/waiter/performance', icon: TrendingUp },
                { name: 'Shift Status & Clock-In', path: '/waiter/shift-status', icon: UserCheck },
            ]
        },
        {
            title: 'My Workspace',
            items: [
                { name: 'My Leave', path: '/waiter/leave', icon: CalendarDays },
                { name: 'My Salary & Slips', path: '/waiter/payroll', icon: CreditCard },
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
            "w-64 bg-[#061e1c] text-white border-r border-[#0d3632] shadow-2xl h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-40",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="h-16 flex items-center px-5 border-b border-[#0d3632] shrink-0">
                <div className="flex items-center gap-3">
                    {logoSrc && !logoError ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#144743] bg-[#0c2e2b] flex items-center justify-center shrink-0">
                            <img 
                                src={logoSrc} 
                                alt="Logo" 
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-950 shrink-0">
                            <Utensils className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-base font-bold text-white tracking-tight leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {restaurant && restaurant.name ? restaurant.name : 'FoodNest'}
                        </h1>
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block mt-1">Floor Desk</span>
                    </div>
                </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map((group, index) => (
                    <div key={index}>
                        <h2 className="px-3 mb-2 text-[10px] font-bold text-teal-300/60 uppercase tracking-widest">
                            {group.title}
                        </h2>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.path === '/waiter' 
                                    ? location.pathname === '/waiter' 
                                    : location.pathname === item.path;

                                return (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/waiter'}
                                            className={clsx(
                                                "relative flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all text-sm group",
                                                isActive 
                                                ? "bg-teal-600 text-white shadow-lg shadow-teal-950/50 font-semibold" 
                                                : "text-teal-200/70 hover:bg-[#0c2e2b] hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <Icon size={17} className={clsx("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-teal-300/60 group-hover:text-teal-200")} />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                                {item.badge && (
                                                    <span className={clsx("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0", isActive ? "bg-white/20 text-white" : item.badgeColor)}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {isActive && <ChevronRight size={14} className="opacity-80" />}
                                            </div>
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer Profile & Logout */}
            <div className="p-3 border-t border-[#0d3632] shrink-0 bg-[#041514]">
                <div className="px-3 py-2 mb-2 rounded-xl bg-[#0c2e2b]/80 border border-[#144743]/60">
                    <p className="text-xs font-bold text-white truncate">{restaurant?.name || 'Floor Staff'}</p>
                    <p className="text-[10px] text-teal-400 font-medium">Service & Order Desk</p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-teal-200/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm cursor-pointer"
                >
                    <LogOut size={17} />
                    <span>End Shift</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default WaiterSidebar;
