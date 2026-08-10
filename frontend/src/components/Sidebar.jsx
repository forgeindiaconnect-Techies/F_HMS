import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Store, Users, UtensilsCrossed, Settings, LogOut, 
    Activity, UserCheck, Key, ListTree, PackageSearch, Truck, Heart, 
    CalendarCheck, ShoppingBag, CreditCard, Tag, FileText, PieChart, 
    Bell, ReceiptText, Lock, QrCode, MessageSquare, HelpCircle, Volume2, LifeBuoy,
    Network, ChefHat
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Same config as DashboardLayout — single source of truth for plan gating
const ROUTE_PLAN_REQUIREMENTS = [
    // Pro features
    { path: '/admin/analytics',    minPlan: 'Pro',        feature: 'Sales Analytics' },
    { path: '/admin/inventory',    minPlan: 'Pro',        feature: 'Inventory Management' },
    { path: '/admin/suppliers',    minPlan: 'Pro',        feature: 'Vendor Management' },
    { path: '/admin/reservations', minPlan: 'Pro',        feature: 'Reservation Management' },
    { path: '/admin/offers',       minPlan: 'Pro',        feature: 'Coupons & Promotions' },
    { path: '/admin/delivery',     minPlan: 'Pro',        feature: 'Delivery Management' },

    // Enterprise features
    { path: '/admin/franchise',        minPlan: 'Enterprise', feature: 'Franchise Management' },
    { path: '/admin/central-kitchen',  minPlan: 'Enterprise', feature: 'Central Kitchen Ops' },
    { path: '/admin/developer-config', minPlan: 'Enterprise', feature: 'Developer APIs & White Label' },
    { path: '/admin/audit-logs',       minPlan: 'Enterprise', feature: 'Security Audit Logs' },
    { path: '/admin/bi',               minPlan: 'Enterprise', feature: 'Business Intelligence Console' },
    // NOTE: /admin/support is available to ALL plans — no gating
];
const PLAN_ORDER = { Basic: 0, Starter: 0, Pro: 1, Professional: 1, Enterprise: 2 };
const planMeetsRequirement = (current, min) =>
    (PLAN_ORDER[current] ?? 0) >= (PLAN_ORDER[min] ?? 99);
const getItemLock = (path, plan, status) => {
    const rule = ROUTE_PLAN_REQUIREMENTS.find(r => path.startsWith(r.path));
    if (!rule) return null;
    if (status !== 'Active' || !planMeetsRequirement(plan, rule.minPlan)) {
        return rule;
    }
    return null;
};

const Sidebar = () => {
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

    const plan = restaurant?.subscription?.plan || 'Basic';
    // Default to 'Active' so features aren't locked if subscription status isn't set yet
    const status = restaurant?.subscription?.status || 'Active';
    const isEnterprise = plan === 'Enterprise' && status === 'Active';
    
    const getLogoUrl = () => {
        if (!restaurant?.logo) return null;
        if (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:')) {
            return restaurant.logo;
        }
        const apiBase = import.meta.env.VITE_API_URL || 'https://rms-backend.onrender.com/api';
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
            title: 'Overview',
            items: [
                { name: 'Business Overview', path: '/admin', icon: LayoutDashboard },
                { name: 'Sales Analytics', path: '/admin/analytics', icon: PieChart },
            ]
        },
        {
            title: 'Management',
            items: [
                { name: 'Branch Management', path: '/admin/branches', icon: Store },
                { name: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed },
                { name: 'Inventory Management', path: '/admin/inventory', icon: PackageSearch },
                { name: 'Staff Management', path: '/admin/staff', icon: UserCheck },
                { name: 'Customer Management', path: '/admin/customers', icon: Users },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Order Management', path: '/admin/orders', icon: ShoppingBag },
                { name: 'Table Management', path: '/admin/tables', icon: QrCode },
                { name: 'QR Digital Menu', path: '/admin/tables?tab=qr', icon: QrCode },
                { name: 'Reservation Management', path: '/admin/reservations', icon: CalendarCheck },
                { name: 'Offers & Promotions', path: '/admin/offers', icon: Tag },
                { name: 'Delivery Management', path: '/admin/delivery', icon: Truck },
            ]
        },
        {
            title: 'Enterprise Suite',
            items: [
                { name: 'Franchise Management', path: '/admin/franchise', icon: Network },
                { name: 'Central Kitchen Ops', path: '/admin/central-kitchen', icon: ChefHat },
                { name: 'Developer Config', path: '/admin/developer-config', icon: Key },
                { name: 'Audit Logs', path: '/admin/audit-logs', icon: ReceiptText },
                { name: 'BI Console', path: '/admin/bi', icon: Activity },
            ]
        },
        {
            title: 'Customer Care',
            items: [
                { name: 'Support Dashboard', path: '/admin/support', icon: LayoutDashboard },
                { name: 'Support Tickets', path: '/admin/support/tickets', icon: MessageSquare },
                { name: 'Create Ticket', path: '/admin/support/tickets/create', icon: LifeBuoy },
                { name: 'Knowledge Base', path: '/admin/support/knowledge-base', icon: HelpCircle },
                { name: 'Announcements', path: '/admin/support/announcements', icon: Volume2 },
            ]
        },
        {
            title: 'Reports & Config',
            items: [
                { name: 'Reports', path: '/admin/reports', icon: FileText },
                { name: 'Settings', path: '/admin/settings', icon: Settings },
                { name: 'Notifications', path: '/admin/notifications', icon: Bell },
                { name: 'Verification', path: '/admin/verification', icon: FileText },
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
                {logoSrc && !logoError ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                        <img 
                            src={logoSrc} 
                            alt="Logo" 
                            onError={() => setLogoError(true)}
                            className="w-full h-full object-cover" 
                        />
                    </div>
                ) : (
                    <div className="bg-green-500 text-white p-2 rounded-lg shrink-0">
                        <UtensilsCrossed size={24} />
                    </div>
                )}
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400 truncate max-w-[150px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {restaurant && restaurant.name ? restaurant.name : 'RestoSys'}
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
                                
                                const lock = getItemLock(item.path, plan, status);

                                if (lock) {
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => {
                                                toast.error(`${lock.feature} requires the ${lock.minPlan} Plan or above. Please upgrade your subscription.`);
                                                navigate('/admin/billing');
                                            }}
                                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 font-medium"
                                            title={`Requires ${lock.minPlan} Plan`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={18} className="shrink-0 opacity-70" />
                                                <span>{item.name}</span>
                                            </div>
                                            <Lock size={14} className="text-gray-400 shrink-0" />
                                        </button>
                                    );
                                }

                                const checkActive = () => {
                                    if (item.name === 'Table Management') {
                                        return location.pathname === '/admin/tables' && location.search !== '?tab=qr';
                                    }
                                    if (item.name === 'QR Digital Menu') {
                                        return location.pathname === '/admin/tables' && location.search === '?tab=qr';
                                    }
                                    if (item.path === '/admin') {
                                        return location.pathname === '/admin';
                                    }
                                    if (item.path === '/admin/support') {
                                        return location.pathname === '/admin/support';
                                    }
                                    if (item.path === '/admin/support/tickets') {
                                        return location.pathname.startsWith('/admin/support/tickets') && 
                                               location.pathname !== '/admin/support/tickets/create';
                                    }
                                    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                };
                                const isActive = checkActive();

                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        className={clsx(
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
