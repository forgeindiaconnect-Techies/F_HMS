import { NavLink, useLocation } from 'react-router-dom';
import { 
    Store, ShoppingBag, UserCheck, PackageSearch, FileText, Settings, LogOut, UtensilsCrossed, ChefHat, CalendarCheck, MessageSquare, DollarSign, PieChart
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const ManagerSidebar = () => {
    const { logout } = useAuth();
    const location = useLocation();

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
                { name: 'Live Orders', path: '/manager/orders', icon: ShoppingBag },
                { name: 'Kitchen Status', path: '/manager/kitchen', icon: ChefHat },
                { name: 'Staff Schedule', path: '/manager/staff', icon: UserCheck },
                { name: 'Branch Inventory', path: '/manager/inventory', icon: PackageSearch },
            ]
        },
        {
            title: 'Insights',
            items: [
                { name: 'Today\'s Sales', path: '/manager/sales', icon: DollarSign },
                { name: 'Branch Analytics', path: '/manager/analytics', icon: PieChart },
                { name: 'Daily Reports', path: '/manager/reports', icon: FileText },
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
        <aside className="w-64 bg-white shadow-xl h-screen sticky top-0 flex flex-col transition-all duration-300 z-20 overflow-hidden border-r border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 shrink-0">
                <div className="bg-green-500 text-white p-2 rounded-lg">
                    <UtensilsCrossed size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400 leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        RestoSys
                    </h1>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manager</span>
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
    );
};

export default ManagerSidebar;
