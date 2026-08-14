import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    MonitorDot, ClipboardList, BookOpen, AlertTriangle, LogOut, ChefHat
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
        const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms.onrender.com/api';
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
            title: 'Kitchen Ops',
            items: [
                { name: 'Active KDS', path: '/chef', icon: MonitorDot },
            ]
        },
        {
            title: 'Resources',
            items: [
                { name: 'Wastage & Restock', path: '/chef/inventory', icon: AlertTriangle },
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
            "w-64 bg-white dark:bg-[#1e2330] shadow-xl h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-40 border-r border-gray-100 dark:border-[#2a3040]",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-[#2a3040] flex items-center gap-3 shrink-0">
                {logoSrc && !logoError ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-[#2a3040] bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0">
                        <img 
                            src={logoSrc} 
                            alt="Logo" 
                            onError={() => setLogoError(true)}
                            className="w-full h-full object-cover" 
                        />
                    </div>
                ) : (
                    <div className="bg-orange-500 text-white p-2 rounded-lg shrink-0">
                        <ChefHat size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {restaurant && restaurant.name ? restaurant.name : 'RestoSys'}
                    </h1>
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mt-0.5">Kitchen</span>
                </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
                {navGroups.map((group, index) => (
                    <div key={index} className="mb-6">
                        <h3 className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.path === '/chef'}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm",
                                            isActive 
                                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold" 
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a3040] hover:text-gray-900 dark:hover:text-white font-medium"
                                        )}
                                    >
                                        <Icon size={18} className={clsx("transition-transform group-hover:scale-110", "shrink-0")} />
                                        <span>{item.name}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Logout */}
            <div className="p-4 border-t border-gray-100 dark:border-[#2a3040] shrink-0 bg-gray-50 dark:bg-[#1a1e2a]">
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-bold">
                    <LogOut size={18} />
                    <span>Exit Kitchen</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default ChefSidebar;
