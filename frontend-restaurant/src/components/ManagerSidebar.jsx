import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    Store, ShoppingBag, UserCheck, PackageSearch, FileText, Settings, LogOut, UtensilsCrossed, ChefHat, MessageSquare, DollarSign, PieChart, QrCode, Truck, Bell, Receipt,
    CalendarDays, CreditCard, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const ManagerSidebar = () => {
    const { logout, restaurant } = useAuth();
    const location = useLocation();
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

    const navGroups = [
        {
            title: 'Overview & Orders',
            items: [
                { name: 'Branch Overview', path: '/manager', icon: Store },
                { name: 'Daily Orders', path: '/manager/orders', icon: ShoppingBag },
                { name: 'Table Status', path: '/manager/tables', icon: QrCode },
            ]
        },
        {
            title: 'Kitchen & Ops',
            items: [
                { name: 'Kitchen Status', path: '/manager/kitchen', icon: ChefHat },
                { name: 'Delivery Dispatch', path: '/manager/delivery', icon: Truck },
            ]
        },
        {
            title: 'Management',
            items: [
                { name: 'Billing Management', path: '/manager/billing-management', icon: Receipt },
                { name: 'Staff Monitoring', path: '/manager/staff', icon: UserCheck },
                { name: 'Leave Requests', path: '/manager/staff?tab=leaves', icon: CalendarDays },
                { name: 'Branch Payroll', path: '/manager/staff?tab=payroll', icon: CreditCard },
                { name: 'Inventory Status', path: '/manager/inventory', icon: PackageSearch },
                { name: 'Expense Tracking', path: '/manager/expenses', icon: DollarSign },
            ]
        },
        {
            title: 'Feedback & Analytics',
            items: [
                { name: 'Customer Feedback', path: '/manager/feedback', icon: MessageSquare },
                { name: 'Branch Analytics', path: '/manager/analytics', icon: PieChart },
                { name: 'Reports', path: '/manager/reports', icon: FileText },
            ]
        },
        {
            title: 'System',
            items: [
                { name: 'Notifications', path: '/manager/notifications', icon: Bell },
                { name: 'Settings', path: '/manager/settings', icon: Settings },
            ]
        }
    ];

    return (
        <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 md:hidden" 
                onClick={() => setIsOpen(false)}
            />
        )}
        <aside className={clsx(
            "w-72 sm:w-64 bg-[#0d122b] text-white shadow-2xl h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-50 border-r border-[#1a224a]",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="p-5 border-b border-[#1a224a] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {logoSrc && !logoError ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#273269] bg-[#141b3d] flex items-center justify-center shrink-0">
                            <img 
                                src={logoSrc} 
                                alt="Logo" 
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    ) : (
                        <div className="bg-indigo-600 text-white p-2 rounded-xl shrink-0 shadow-md shadow-indigo-950">
                            <UtensilsCrossed size={22} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {restaurant && restaurant.name ? restaurant.name : 'FoodNest'}<span className="text-indigo-400">Mgr</span>
                        </h1>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mt-0.5">Branch Manager</span>
                    </div>
                </div>

                {/* Mobile Close Button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-1.5 text-indigo-300 hover:text-white rounded-lg hover:bg-[#1a224a] transition-colors shrink-0 cursor-pointer"
                    aria-label="Close Sidebar"
                >
                    ✕
                </button>
            </div>
            
            {/* Scrollable Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map((group, index) => (
                    <div key={index} className="mb-5">
                        <h3 className="px-3 mb-2 text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {group.title}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.path === '/manager'}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) => clsx(
                                            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group",
                                            isActive 
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 font-semibold" 
                                            : "text-indigo-200/70 hover:bg-[#151c42] hover:text-white"
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Icon size={17} className={clsx("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-indigo-300/60 group-hover:text-indigo-200")} />
                                                <span className="truncate">{item.name}</span>
                                                {isActive && <ChevronRight size={14} className="ml-auto shrink-0 opacity-80" />}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-[#1a224a] shrink-0 bg-[#080b1c]">
                <div className="px-3 py-2 mb-2 rounded-xl bg-[#141b3d]/80 border border-[#232d61]/60">
                    <p className="text-xs font-bold text-white truncate">{restaurant?.name || 'Branch Manager'}</p>
                    <p className="text-[10px] text-indigo-400 font-medium">Branch Operations</p>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-indigo-200/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm cursor-pointer"
                >
                    <LogOut size={17} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default ManagerSidebar;
