import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    Calculator, Receipt, LogOut, Split, ArrowLeftRight, Tag, Coins, Undo2, Landmark, History 
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
        const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-7hbi.onrender.com/api';
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
            "w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col h-screen fixed inset-y-0 left-0 md:sticky md:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Logo area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
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
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
                            <Calculator className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {restaurant && restaurant.name ? restaurant.name : 'RestoSys'}
                        </h1>
                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mt-1">Billing</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                {menuGroups.map((group) => (
                    <div key={group.title}>
                        <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 mb-3 px-3 uppercase tracking-wider">
                            {group.title}
                        </h2>
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/cashier' || item.path === '/'}
                                            className={({ isActive }) => clsx(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm",
                                                isActive 
                                                ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold" 
                                                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 font-medium"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon size={18} className={clsx("transition-transform group-hover:scale-110", "shrink-0", isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-slate-500")} />
                                                    <span>{item.name}</span>
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

            {/* Logout section */}
            <div className="p-4 border-t border-gray-50 dark:border-slate-800">
                <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                >
                    <LogOut size={18} className="text-gray-400 dark:text-slate-500 group-hover:text-red-500 transition-colors" />
                    <span>Close Register</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default CashierSidebar;
