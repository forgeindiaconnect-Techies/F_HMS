import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    Store, ShoppingBag, UserCheck, PackageSearch, FileText, Settings, LogOut, UtensilsCrossed, ChefHat, CalendarCheck, MessageSquare, DollarSign, PieChart, QrCode
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const ManagerSidebar = () => {
    const { logout, restaurant } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, []);

    const navGroups = [
        {
            title: 'Overview',
            items: [
                { name: 'Dashboard', path: '/manager', icon: Store },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Kitchen Status', path: '/manager/kitchen', icon: ChefHat },
                { name: 'Staff Schedule', path: '/manager/staff', icon: UserCheck },
                { name: 'Branch Inventory', path: '/manager/inventory', icon: PackageSearch },
                { name: 'Branch Tables', path: '/manager/tables', icon: QrCode },
            ]
        },
        {
            title: 'Insights',
            items: [
                { name: 'Today\'s Sales', path: '/manager/sales', icon: DollarSign },
                { name: 'Branch Analytics', path: '/manager/analytics', icon: PieChart },
            ]
        },
        {
            title: 'System',
            items: [
                { name: 'Settings', path: '/manager/settings', icon: Settings },
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
            "w-64 bg-white shadow-xl h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-40 border-r border-gray-100",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 shrink-0">
                {restaurant && restaurant.logo ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                        <img 
                            src={restaurant.logo.startsWith('http') ? restaurant.logo : `${new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin}${restaurant.logo}`} 
                            alt="Logo" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                ) : (
                    <div className="bg-green-500 text-white p-2 rounded-lg shrink-0">
                        <UtensilsCrossed size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400 leading-none truncate max-w-[140px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {restaurant && restaurant.name ? restaurant.name : 'RestoSys'}
                    </h1>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">Manager</span>
                </div>
            </div>
            
            {/* Scrollable Navigation */}
            <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
                {navGroups.map((group, index) => (
                    <div key={index} className="mb-6">
                        <h3 className="px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.path === '/manager'}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm",
                                            isActive 
                                            ? "bg-green-50 text-green-700 font-bold shadow-sm" 
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
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
            <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
                <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-bold"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default ManagerSidebar;
