import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Store, Users, UtensilsCrossed, Settings, LogOut, 
    Activity, UserCheck, Key, ListTree, PackageSearch, Truck, Heart, 
    CalendarCheck, ShoppingBag, CreditCard, Tag, FileText, PieChart, 
    Bell, ReceiptText
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
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
                { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
                { name: 'Activity Logs', path: '/admin/activity', icon: Activity },
            ]
        },
        {
            title: 'Organization',
            items: [
                { name: 'Branches', path: '/admin/branches', icon: Store },
            ]
        },
        {
            title: 'People',
            items: [
                { name: 'Customers', path: '/admin/customers', icon: Heart },
                { name: 'Staff', path: '/admin/staff', icon: UserCheck },
                { name: 'Users', path: '/admin/users', icon: Users },
                { name: 'Roles', path: '/admin/roles', icon: Key },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Reservations', path: '/admin/reservations', icon: CalendarCheck },
                { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
            ]
        },
        {
            title: 'Kitchen & Catalog',
            items: [
                { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
                { name: 'Categories', path: '/admin/categories', icon: ListTree },
                { name: 'Inventory', path: '/admin/inventory', icon: PackageSearch },
                { name: 'Suppliers', path: '/admin/suppliers', icon: Truck },
            ]
        },
        {
            title: 'Finance & Marketing',
            items: [
                { name: 'Payments', path: '/admin/payments', icon: CreditCard },
                { name: 'Offers & Coupons', path: '/admin/offers', icon: Tag },
                { name: 'Taxes', path: '/admin/taxes', icon: ReceiptText },
            ]
        },
        {
            title: 'Insights',
            items: [
                { name: 'Reports', path: '/admin/reports', icon: FileText },
                { name: 'Analytics', path: '/admin/analytics', icon: PieChart },
            ]
        },
        {
            title: 'System',
            items: [
                { name: 'Settings', path: '/admin/settings', icon: Settings },
                { name: 'Notifications', path: '/admin/notifications', icon: Bell },
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
                <div className="bg-green-500 text-white p-2 rounded-lg">
                    <UtensilsCrossed size={24} />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    RestoSys
                </h1>
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
                                        end={item.path === '/admin'}
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

export default Sidebar;
