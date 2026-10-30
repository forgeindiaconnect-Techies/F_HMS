import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Store, Users, UtensilsCrossed, Settings, LogOut, 
    Activity, UserCheck, Key, ListTree, PackageSearch, Truck, Heart, 
    CalendarCheck, ShoppingBag, CreditCard, Tag, FileText, PieChart, 
    Bell, ReceiptText, Lock, QrCode, MessageSquare, HelpCircle, Volume2, LifeBuoy,
    Network, ChefHat, Receipt, TrendingUp, DollarSign, Clock, Sparkles, Sliders,
    CalendarDays, FileSpreadsheet, MessageSquareQuote, ChevronRight
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
    { path: '/admin/support',          minPlan: 'Enterprise', feature: 'Customer Care & Priority Support' },
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
        const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
        try {
            const origin = new URL(apiBase).origin;
            return `${origin}${restaurant.logo.startsWith('/') ? '' : '/'}${restaurant.logo}`;
        } catch (e) {
            return restaurant.logo;
        }
    };
    const logoSrc = getLogoUrl();
    
    const isCustomBilling = restaurant?.billingConfig?.isCustomBillingActive === true;
    const customModules = restaurant?.billingConfig?.modules || {};

    const rawNavGroups = [
        {
            title: 'Overview & Earnings',
            items: [
                { name: 'Business Overview', path: '/admin', icon: LayoutDashboard },
                { name: 'Daily Earnings', path: '/admin/daily-earnings', icon: Clock, moduleKey: 'salesReports' },
                { name: 'Profit & Loss', path: '/admin/profit-loss', icon: TrendingUp, moduleKey: 'salesReports' },
                { name: 'Sales Analytics', path: '/admin/analytics', icon: PieChart, moduleKey: 'salesReports' },
            ]
        },
        {
            title: 'Finance & Bills',
            items: [
                { name: 'Expenses', path: '/admin/expenses', icon: DollarSign, moduleKey: 'salesReports' },
                { name: 'Rent & Bills', path: '/admin/expenses?tab=bills', icon: ReceiptText, moduleKey: 'salesReports' },
                { name: 'Payroll & Salary', path: '/admin/staff?tab=payroll', icon: CreditCard, moduleKey: 'staffManagement' },
                { name: 'Payroll Reports', path: '/admin/staff?tab=reports', icon: FileSpreadsheet, moduleKey: 'staffManagement' },
                { name: 'Waiter Tips & Gratuity', path: '/admin/tips', icon: Heart, moduleKey: 'salesReports' },
                { name: 'Financial Reports', path: '/admin/reports', icon: FileText, moduleKey: 'salesReports' },
            ]
        },
        {
            title: 'Management & Materials',
            items: [
                { name: 'Billing Management', path: '/admin/billing-management', icon: Receipt, moduleKey: 'posBilling' },
                { name: 'Material Management', path: '/admin/inventory', icon: PackageSearch, moduleKey: 'inventoryManagement' },
                { name: 'Staff Management', path: '/admin/staff', icon: UserCheck, moduleKey: 'staffManagement' },
                { name: 'Leave Management', path: '/admin/staff?tab=leaves', icon: CalendarDays, moduleKey: 'staffManagement' },
                { name: 'Branch Management', path: '/admin/branches', icon: Store, moduleKey: 'staffManagement' },
                { name: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed, moduleKey: 'menuManagement' },
                { name: 'Customer Management', path: '/admin/customers', icon: Users, moduleKey: 'customerManagement' },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Order Management', path: '/admin/orders', icon: ShoppingBag, moduleKey: 'dineInTakeawayOrders' },
                { name: 'Table Management', path: '/admin/tables', icon: QrCode, moduleKey: 'tableManagement' },
                { name: 'QR Digital Menu', path: '/admin/tables?tab=qr', icon: QrCode, moduleKey: 'tableManagement' },
                { name: 'Reservation Management', path: '/admin/reservations', icon: CalendarCheck, moduleKey: 'tableManagement' },
                { name: 'Offers & Promotions', path: '/admin/offers', icon: Tag, moduleKey: 'discounts' },
                { name: 'Delivery Management', path: '/admin/delivery', icon: Truck, moduleKey: 'dineInTakeawayOrders' },
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
            ]
        },
        {
            title: 'SaaS Portal',
            items: [
                { name: 'SaaS Subscription', path: '/admin/billing', icon: CreditCard },
            ]
        },
        {
            title: 'Reports & Config',
            items: [
                { name: 'Setup Wizard', path: '/admin/setup-wizard', icon: Sparkles },
                { name: 'My Testimonial', path: '/admin/my-testimonial', icon: MessageSquareQuote },
                { name: 'Restaurant Settings', path: '/admin/settings?tab=operations', icon: Sliders },
                { name: 'General Settings', path: '/admin/settings', icon: Settings },
                { name: 'Reports', path: '/admin/reports', icon: FileText, moduleKey: 'salesReports' },
                { name: 'Notifications', path: '/admin/notifications', icon: Bell },
                { name: 'Verification', path: '/admin/verification', icon: FileText },
            ]
        }
    ];

    const navGroups = rawNavGroups.map(group => {
        if (!isCustomBilling) return group;
        const filteredItems = group.items.filter(item => {
            if (!item.moduleKey) return true;
            return customModules[item.moduleKey] !== false;
        });
        return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);

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
            "w-64 bg-[#062419] text-white shadow-2xl h-screen fixed inset-y-0 left-0 md:sticky md:top-0 flex flex-col transition-transform duration-300 z-40 border-r border-[#0d3b2b]",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Header */}
            <div className="p-5 border-b border-[#0d3b2b] flex items-center gap-3 shrink-0">
                {logoSrc && !logoError ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#144d38] bg-[#093323] flex items-center justify-center shrink-0">
                        <img 
                            src={logoSrc} 
                            alt="Logo" 
                            onError={() => setLogoError(true)}
                            className="w-full h-full object-cover" 
                        />
                    </div>
                ) : (
                    <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0 shadow-md shadow-emerald-950">
                        <UtensilsCrossed size={22} />
                    </div>
                )}
                <div className="flex flex-col truncate">
                    <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[150px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {restaurant && restaurant.name ? restaurant.name : 'FoodNest'}<span className="text-emerald-400">Hub</span>
                    </h1>
                    {isCustomBilling ? (
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-[#0c402e] px-1.5 py-0.5 rounded border border-[#175c43] w-fit mt-0.5 truncate max-w-[140px]">
                            Custom • {restaurant?.billingConfig?.outletFormat || 'Setup'}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Restaurant Admin</span>
                    )}
                </div>
            </div>
            
            {/* Scrollable Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map((group, index) => (
                    <div key={index} className="mb-5">
                        <h3 className="px-3 mb-2 text-[10px] font-bold text-emerald-300/60 uppercase tracking-widest" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {group.title}
                        </h3>
                        <div className="space-y-0.5">
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
                                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm text-emerald-200/40 hover:bg-[#0b3827] hover:text-emerald-100 font-medium cursor-pointer"
                                            title={`Requires ${lock.minPlan} Plan`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={17} className="shrink-0 opacity-60" />
                                                <span>{item.name}</span>
                                            </div>
                                            <Lock size={14} className="text-emerald-400/50 shrink-0" />
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
                                    if (item.name === 'Payroll & Salary') {
                                        return location.pathname === '/admin/staff' && location.search === '?tab=payroll';
                                    }
                                    if (item.name === 'Staff Management') {
                                        return location.pathname === '/admin/staff' && location.search !== '?tab=payroll';
                                    }
                                    if (item.name === 'Rent & Bills') {
                                        return location.pathname === '/admin/expenses' && location.search === '?tab=bills';
                                    }
                                    if (item.name === 'Expenses') {
                                        return location.pathname === '/admin/expenses' && (location.search === '' || location.search === '?tab=expenses');
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
                                            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm group",
                                            isActive 
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 font-semibold" 
                                            : "text-emerald-100/70 hover:bg-[#0b3827] hover:text-white"
                                        )}
                                    >
                                        <Icon size={17} className={clsx("transition-transform group-hover:scale-110 shrink-0", isActive ? "text-white" : "text-emerald-300/60 group-hover:text-emerald-200")} />
                                        <span className="truncate">{item.name}</span>
                                        {isActive && <ChevronRight size={14} className="ml-auto shrink-0 opacity-80" />}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-[#0d3b2b] shrink-0 bg-[#041a12]">
                <div className="px-3 py-2 mb-2 rounded-xl bg-[#093323]/80 border border-[#124532]/60">
                    <p className="text-xs font-bold text-white truncate">{restaurant?.name || 'Restaurant Admin'}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Platform Restaurant</p>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-medium text-emerald-200/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm cursor-pointer"
                >
                    <LogOut size={17} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
        </>
    );
};

export default Sidebar;
