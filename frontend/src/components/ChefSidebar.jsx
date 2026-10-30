import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    MonitorDot, ClipboardList, BookOpen, AlertTriangle, LogOut, ChefHat, Receipt,
    CalendarDays, CreditCard, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ChefSidebar = () => {
    const navigate = useNavigate();
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

    const kdsEnabled = restaurant?.restaurantConfig?.orderKitchen?.kdsEnabled !== false;
    const kotEnabled = restaurant?.restaurantConfig?.orderKitchen?.kotEnabled !== false;

    const kitchenItems = [];
    if (kdsEnabled) {
        kitchenItems.push({ name: 'Active KDS', path: '/chef', icon: MonitorDot });
    }
    if (kotEnabled) {
        kitchenItems.push({ name: 'Kitchen Tickets (KOT)', path: '/chef/kot', icon: Receipt });
    }
    if (!kdsEnabled && !kotEnabled) {
        kitchenItems.push({ name: 'Kitchen Ops (Inactive)', path: '/chef', icon: MonitorDot });
    }

    const navGroups = [
        {
            title: 'Kitchen Ops',
            items: kitchenItems
        },
        {
            title: 'Resources',
            items: [
                { name: 'Wastage & Restock', path: '/chef/inventory', icon: AlertTriangle },
            ]
        },
        {
            title: 'My Workspace',
            items: [
                { name: 'My Leave', path: '/chef/leave', icon: CalendarDays },
                { name: 'My Salary & Slips', path: '/chef/payroll', icon: CreditCard },
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
            "w-64 bg-[#1c130c] text-white border-r border-[#331f12] shadow-2xl h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-40",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="h-16 flex items-center px-5 border-b border-[#331f12] shrink-0">
                <div className="flex items-center gap-3">
                    {logoSrc && !logoError ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#4a2e1b] bg-[#29170c] flex items-center justify-center shrink-0">
                            <img 
                                src={logoSrc} 
                                alt="Logo" 
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-950 shrink-0">
                            <ChefHat className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-base font-bold text-white tracking-tight leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {restaurant && restaurant.name ? restaurant.name : 'FoodNest'}
                        </h1>
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mt-1">Kitchen Station</span>
                    </div>
                </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map((group, index) => (
                    <div key={index}>
                        <h2 className="px-3 mb-2 text-[10px] font-bold text-orange-300/60 uppercase tracking-widest">
                            {group.title}
                        </h2>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/chef'}
                                            className={({ isActive }) => clsx(
                                                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group",
                                                isActive 
                                                ? "bg-orange-500 text-white shadow-lg shadow-orange-950/50 font-semibold" 
                                                : "text-orange-200/70 hover:bg-[#291a10] hover:text-white"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon size={17} className={clsx("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-orange-300/60 group-hover:text-orange-200")} />
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
            </nav>

            {/* Footer Profile & Logout */}
            <div className="p-3 border-t border-[#331f12] shrink-0 bg-[#140c07]">
                <div className="px-3 py-2 mb-2 rounded-xl bg-[#26160d]/80 border border-[#3d2417]/60">
                    <p className="text-xs font-bold text-white truncate">{restaurant?.name || 'Kitchen Staff'}</p>
                    <p className="text-[10px] text-orange-400 font-medium">Head Chef Station</p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-orange-200/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm cursor-pointer"
                >
                    <LogOut size={17} />
                    <span>Exit Kitchen</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default ChefSidebar;
