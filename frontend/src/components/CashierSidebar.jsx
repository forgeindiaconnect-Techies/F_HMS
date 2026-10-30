import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    Calculator, Receipt, LogOut, Split, ArrowLeftRight, Tag, Coins, Undo2, Landmark, History, Settings,
    CalendarDays, CreditCard, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const CashierSidebar = () => {
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

    const menuGroups = [
        {
            title: 'POINT OF SALE',
            items: [
                { name: 'POS Billing', icon: Calculator, path: '/cashier/billing' },
                { name: 'Generate Invoices', icon: Receipt, path: '/cashier/invoices' },
                { name: 'Split Bill', icon: Split, path: '/cashier/split' },
                { name: 'Merge Bill', icon: ArrowLeftRight, path: '/cashier/merge' },
                { name: 'Apply Discounts', icon: Tag, path: '/cashier/discounts' },
                { name: 'Payment Collection', icon: Coins, path: '/cashier/collection' },
                { name: 'Refund Management', icon: Undo2, path: '/cashier/refunds' },
                { name: 'Daily Cash Summary', icon: Landmark, path: '/cashier/summary' },
                { name: 'Transaction History', icon: History, path: '/cashier/history' },
                { name: 'POS Settings', icon: Settings, path: '/cashier/settings' },
            ]
        },
        {
            title: 'MY WORKSPACE',
            items: [
                { name: 'My Leave', icon: CalendarDays, path: '/cashier/leave' },
                { name: 'My Salary & Slips', icon: CreditCard, path: '/cashier/payroll' },
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
            "w-64 bg-[#1a0b2e] text-white border-r border-[#2d154d] flex flex-col h-screen fixed inset-y-0 left-0 md:sticky md:top-0 shadow-2xl z-40 transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Logo area */}
            <div className="h-16 flex items-center px-5 border-b border-[#2d154d] shrink-0">
                <div className="flex items-center gap-3">
                    {logoSrc && !logoError ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#3e1d69] bg-[#220e3d] flex items-center justify-center shrink-0">
                            <img 
                                src={logoSrc} 
                                alt="Logo" 
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-950 shrink-0">
                            <Calculator className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-base font-bold text-white tracking-tight leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {restaurant && restaurant.name ? restaurant.name : 'FoodNest'}<span className="text-purple-400">POS</span>
                        </h1>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">Cashier Desk</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {menuGroups.map((group) => (
                    <div key={group.title}>
                        <h2 className="text-[10px] font-bold text-purple-300/60 mb-2 px-3 uppercase tracking-widest">
                            {group.title}
                        </h2>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/cashier' || item.path === '/'}
                                            className={({ isActive }) => clsx(
                                                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group",
                                                isActive 
                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-950/50 font-semibold" 
                                                : "text-purple-200/70 hover:bg-[#250f42] hover:text-white"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon size={17} className={clsx("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-purple-300/60 group-hover:text-purple-200")} />
                                                    <span className="truncate">{item.name}</span>
                                                    {isActive && <ChevronRight size={14} className="ml-auto shrink-0 opacity-80" />}
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-[#2d154d] shrink-0 bg-[#120721]">
                <div className="px-3 py-2 mb-2 rounded-xl bg-[#220e3d]/80 border border-[#37195e]/60">
                    <p className="text-xs font-bold text-white truncate">{restaurant?.name || 'Cashier Counter'}</p>
                    <p className="text-[10px] text-purple-400 font-medium">Billing & Register</p>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-purple-200/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm cursor-pointer"
                >
                    <LogOut size={17} />
                    <span>Close Register</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default CashierSidebar;
