import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Utensils, ChevronDown, ChevronRight, X, Menu as MenuIcon, ShoppingBag,
    Receipt, Package, ShoppingCart, BarChart3, BookOpen, Users, Truck, Monitor,
    ChefHat, QrCode, Store, Boxes, LineChart, Building2, Flame, Clock, Sparkles
} from 'lucide-react';

const POS_MENU_ITEMS = [
    {
        name: 'Billing',
        path: '/pos/billing',
        icon: Receipt,
        badge: 'Tax & POS',
        desc: 'Quick POS bills, tax invoices & settlements'
    },
    {
        name: 'Inventory',
        path: '/pos/inventory',
        icon: Package,
        badge: 'Live Stock',
        desc: 'Raw materials, stock alerts & recipes'
    },
    {
        name: 'Online Ordering',
        path: '/pos/online-ordering',
        icon: ShoppingCart,
        badge: '0% Comm.',
        desc: 'Customer digital menu & instant ordering'
    },
    {
        name: 'Reporting',
        path: '/pos/reporting',
        icon: BarChart3,
        badge: 'P&L Analytics',
        desc: 'Sales reports, audit summaries & trends'
    },
    {
        name: 'Menu',
        path: '/pos/menu',
        icon: BookOpen,
        badge: 'Catalog',
        desc: 'Categories, variants, prices & modifiers'
    },
    {
        name: 'CRM',
        path: '/pos/crm',
        icon: Users,
        badge: 'Guest Profiles',
        desc: 'Customer loyalty, spends & contact history'
    },
    {
        name: 'Purchase Manager',
        path: '/pos/purchase-manager',
        icon: Truck,
        badge: 'Vendors',
        desc: 'Supplier procurement, POs & stock replenishment'
    },
    {
        name: 'Offline POS',
        path: '/pos/offline-pos',
        icon: Monitor,
        badge: 'Sync Ready',
        desc: 'Counter cashier terminal with offline continuity'
    }
];

const ADDONS_MENU_ITEMS = [
    {
        name: 'Kitchen Display System (KDS)',
        path: '/features/details?module=orders',
        icon: ChefHat,
        desc: 'Live kitchen queue routing & cooking timers'
    },
    {
        name: 'Digital QR Table Menu',
        path: '/pos/online-ordering',
        icon: QrCode,
        desc: 'Contactless tabletop ordering & instant payment'
    },
    {
        name: 'Franchise HQ Command',
        path: '/outlet-types/multi-outlet-chains',
        icon: Store,
        desc: 'Multi-outlet consolidated management & royalties'
    },
    {
        name: 'Central Kitchen Ops',
        path: '/pos/inventory',
        icon: Boxes,
        desc: 'Bulk batch prep, indent requests & store transit'
    },
    {
        name: 'Executive BI Analytics',
        path: '/pos/reporting',
        icon: LineChart,
        desc: 'Cross-outlet profitability & sales forecasting'
    },
    {
        name: 'Delivery Dispatch',
        path: '/pos/online-ordering',
        icon: Truck,
        desc: 'Rider dispatch, geofencing & tracking'
    }
];

const OUTLET_TYPES_ITEMS = [
    {
        name: 'Fine Dining & Bars',
        path: '/outlet-types/fine-dining',
        icon: Utensils,
        desc: 'Floor plans, table courses & captain billing'
    },
    {
        name: 'Quick Service (QSR)',
        path: '/outlet-types/quick-service',
        icon: Clock,
        desc: 'High-speed counter queues, tokens & takeaway'
    },
    {
        name: 'Cafes & Bakeries',
        path: '/outlet-types/cafes-bakeries',
        icon: Sparkles,
        desc: 'Quick modifiers, beverage sizing & combos'
    },
    {
        name: 'Cloud & Dark Kitchens',
        path: '/outlet-types/cloud-kitchens',
        icon: Flame,
        desc: 'Multi-brand digital storefronts & order management'
    },
    {
        name: 'Multi-Outlet Chains',
        path: '/outlet-types/multi-outlet-chains',
        icon: Building2,
        desc: 'Centralized menus, inventory transfers & reporting'
    }
];

const WebsiteNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Dropdown States
    const [isPosOpen, setIsPosOpen] = useState(false);
    const [isAddonsOpen, setIsAddonsOpen] = useState(false);
    const [isOutletsOpen, setIsOutletsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Mobile Accordion States
    const [mobilePosOpen, setMobilePosOpen] = useState(false);
    const [mobileAddonsOpen, setMobileAddonsOpen] = useState(false);
    const [mobileOutletsOpen, setMobileOutletsOpen] = useState(false);

    // Refs for click outside
    const posRef = useRef(null);
    const addonsRef = useRef(null);
    const outletsRef = useRef(null);

    // Close dropdowns on outside click or escape
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (posRef.current && !posRef.current.contains(event.target)) {
                setIsPosOpen(false);
            }
            if (addonsRef.current && !addonsRef.current.contains(event.target)) {
                setIsAddonsOpen(false);
            }
            if (outletsRef.current && !outletsRef.current.contains(event.target)) {
                setIsOutletsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsPosOpen(false);
                setIsAddonsOpen(false);
                setIsOutletsOpen(false);
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Close all menus when location changes
    useEffect(() => {
        setIsPosOpen(false);
        setIsAddonsOpen(false);
        setIsOutletsOpen(false);
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Handle Pricing Link
    const handlePricingClick = (e) => {
        setIsPosOpen(false);
        setIsAddonsOpen(false);
        setIsOutletsOpen(false);
        setMobileMenuOpen(false);

        if (location.pathname === '/') {
            e.preventDefault();
            const elem = document.getElementById('pricing');
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/#pricing');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 py-3 sm:py-4 px-4 sm:px-8 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                {/* Brand Logo */}
                <Link 
                    to="/" 
                    onClick={() => {
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0"
                >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF2D55]/25 text-white group-hover:scale-105 transition-transform shrink-0">
                        <Utensils size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-[#FF2D55] transition-colors">
                        Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00]">Hub</span>
                    </h1>
                </Link>

                {/* Desktop Navigation Bar */}
                <nav className="hidden md:flex items-center gap-1 lg:gap-2 font-bold text-sm text-slate-700">
                    
                    {/* 1. POS ▼ Dropdown */}
                    <div className="relative" ref={posRef}>
                        <button
                            type="button"
                            aria-expanded={isPosOpen}
                            aria-haspopup="true"
                            onClick={() => {
                                setIsPosOpen(prev => !prev);
                                setIsAddonsOpen(false);
                                setIsOutletsOpen(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsPosOpen(prev => !prev);
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
                                isPosOpen 
                                    ? 'text-[#FF2D55] bg-[#FFF1F1]' 
                                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100/80'
                            }`}
                        >
                            <span>POS</span>
                            <ChevronDown 
                                size={14} 
                                className={`transition-transform duration-200 ${isPosOpen ? 'rotate-180 text-[#FF2D55]' : 'text-slate-500'}`} 
                            />
                        </button>

                        {/* POS Dropdown Menu (Strictly Matching Specification) */}
                        {isPosOpen && (
                            <div 
                                role="menu"
                                aria-label="POS Navigation Menu"
                                className="absolute top-full left-0 mt-2 w-[380px] bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
                            >
                                <div className="px-3 pt-1.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        POS Modules
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#FF2D55] border border-rose-100">
                                        8 Core Solutions
                                    </span>
                                </div>
                                <div className="py-1 space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto">
                                    {POS_MENU_ITEMS.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            role="menuitem"
                                            tabIndex={0}
                                            onClick={() => setIsPosOpen(false)}
                                            className="group flex items-center justify-between px-3 h-[60px] rounded-xl text-[#0A192F] hover:bg-[#FFF1F1] transition-all duration-150 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-white group-hover:text-[#FF2D55] group-hover:border-[#FF2D55]/30 group-hover:scale-105 transition-all shrink-0 shadow-xs">
                                                    <item.icon size={20} strokeWidth={2.2} />
                                                </div>
                                                <div className="truncate text-left">
                                                    <span className="text-[15px] font-bold block leading-tight tracking-tight text-[#0A192F] group-hover:text-[#FF2D55] transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-600 block truncate">
                                                        {item.desc}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight 
                                                size={16} 
                                                className="text-slate-300 group-hover:text-[#FF2D55] group-hover:translate-x-1 transition-all shrink-0 ml-2" 
                                            />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Add-ons ▼ Dropdown */}
                    <div className="relative" ref={addonsRef}>
                        <button
                            type="button"
                            aria-expanded={isAddonsOpen}
                            aria-haspopup="true"
                            onClick={() => {
                                setIsAddonsOpen(prev => !prev);
                                setIsPosOpen(false);
                                setIsOutletsOpen(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
                                isAddonsOpen 
                                    ? 'text-[#FF2D55] bg-[#FFF1F1]' 
                                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100/80'
                            }`}
                        >
                            <span>Add-ons</span>
                            <ChevronDown 
                                size={14} 
                                className={`transition-transform duration-200 ${isAddonsOpen ? 'rotate-180 text-[#FF2D55]' : 'text-slate-500'}`} 
                            />
                        </button>

                        {isAddonsOpen && (
                            <div 
                                role="menu"
                                aria-label="Add-ons Navigation Menu"
                                className="absolute top-full left-0 mt-2 w-[360px] bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
                            >
                                <div className="px-3 pt-1.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Operational Add-ons
                                    </span>
                                </div>
                                <div className="py-1 space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto">
                                    {ADDONS_MENU_ITEMS.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            role="menuitem"
                                            tabIndex={0}
                                            onClick={() => setIsAddonsOpen(false)}
                                            className="group flex items-center justify-between px-3 h-[58px] rounded-xl text-[#0A192F] hover:bg-[#FFF1F1] transition-all duration-150 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-white group-hover:text-[#FF2D55] group-hover:border-[#FF2D55]/30 group-hover:scale-105 transition-all shrink-0">
                                                    <item.icon size={18} strokeWidth={2.2} />
                                                </div>
                                                <div className="truncate text-left">
                                                    <span className="text-[14px] font-bold block leading-tight text-[#0A192F] group-hover:text-[#FF2D55] transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-600 block truncate">
                                                        {item.desc}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-[#FF2D55] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Outlet Types ▼ Dropdown */}
                    <div className="relative" ref={outletsRef}>
                        <button
                            type="button"
                            aria-expanded={isOutletsOpen}
                            aria-haspopup="true"
                            onClick={() => {
                                setIsOutletsOpen(prev => !prev);
                                setIsPosOpen(false);
                                setIsAddonsOpen(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
                                isOutletsOpen 
                                    ? 'text-[#FF2D55] bg-[#FFF1F1]' 
                                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100/80'
                            }`}
                        >
                            <span>Outlet Types</span>
                            <ChevronDown 
                                size={14} 
                                className={`transition-transform duration-200 ${isOutletsOpen ? 'rotate-180 text-[#FF2D55]' : 'text-slate-500'}`} 
                            />
                        </button>

                        {isOutletsOpen && (
                            <div 
                                role="menu"
                                aria-label="Outlet Types Navigation Menu"
                                className="absolute top-full left-0 mt-2 w-[360px] bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
                            >
                                <div className="px-3 pt-1.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        Restaurant Formats
                                    </span>
                                </div>
                                <div className="py-1 space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto">
                                    {OUTLET_TYPES_ITEMS.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            role="menuitem"
                                            tabIndex={0}
                                            onClick={() => setIsOutletsOpen(false)}
                                            className="group flex items-center justify-between px-3 h-[58px] rounded-xl text-[#0A192F] hover:bg-[#FFF1F1] transition-all duration-150 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-white group-hover:text-[#FF2D55] group-hover:border-[#FF2D55]/30 group-hover:scale-105 transition-all shrink-0">
                                                    <item.icon size={18} strokeWidth={2.2} />
                                                </div>
                                                <div className="truncate text-left">
                                                    <span className="text-[14px] font-bold block leading-tight text-[#0A192F] group-hover:text-[#FF2D55] transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-600 block truncate">
                                                        {item.desc}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-[#FF2D55] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Pricing Link */}
                    <a 
                        href="#pricing"
                        onClick={handlePricingClick}
                        className="px-3 py-2 rounded-xl text-slate-800 hover:text-slate-950 hover:bg-slate-100/80 transition-colors cursor-pointer"
                    >
                        Pricing
                    </a>

                </nav>

                {/* Right CTA Actions & Mobile Toggle */}
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold shrink-0">
                    <Link 
                        to="/menu" 
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:scale-[1.02] active:scale-95"
                    >
                        <ShoppingBag size={16} className="sm:w-4 sm:h-4" />
                        <span>Order Now</span>
                    </Link>

                    <Link 
                        to="/staff/login" 
                        className="hidden xs:inline-block text-slate-700 hover:text-slate-950 transition-colors px-2.5 py-1.5 sm:px-3 rounded-xl hover:bg-slate-100"
                    >
                        Log In
                    </Link>

                    <Link 
                        to="/staff/register" 
                        className="hidden lg:flex bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-[#FF2D55]/25 transition-all focus:outline-none hover:scale-[1.02] active:scale-95"
                    >
                        Get Started Free
                    </Link>

                    {/* Mobile Hamburger Menu Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label="Toggle Navigation Menu"
                        aria-expanded={mobileMenuOpen}
                        className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu Accordion */}
            {mobileMenuOpen && (
                <div className="md:hidden mt-3 pt-3 border-t border-slate-200/80 space-y-2 bg-white rounded-2xl p-4 shadow-2xl max-h-[calc(100vh-90px)] overflow-y-auto">
                    
                    {/* Mobile POS Accordion */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setMobilePosOpen(prev => !prev)}
                            className="w-full flex items-center justify-between p-3 text-slate-900 font-extrabold text-sm hover:bg-slate-100/70 transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#FF2D55]"></span>
                                <span>POS Modules</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-[#FF2D55]">8</span>
                            </span>
                            <ChevronDown size={16} className={`text-[#FF2D55] transition-transform duration-200 ${mobilePosOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {mobilePosOpen && (
                            <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                                {POS_MENU_ITEMS.map((item) => (
                                    <Link 
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 hover:text-[#FF2D55] hover:bg-[#FFF1F1] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                                <item.icon size={16} />
                                            </div>
                                            <div className="truncate">
                                                <span className="font-bold text-xs block text-[#0A192F]">{item.name}</span>
                                                <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile Add-ons Accordion */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setMobileAddonsOpen(prev => !prev)}
                            className="w-full flex items-center justify-between p-3 text-slate-900 font-extrabold text-sm hover:bg-slate-100/70 transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                <span>Add-ons</span>
                            </span>
                            <ChevronDown size={16} className={`text-orange-500 transition-transform duration-200 ${mobileAddonsOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {mobileAddonsOpen && (
                            <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                                {ADDONS_MENU_ITEMS.map((item) => (
                                    <Link 
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 hover:text-[#FF2D55] hover:bg-[#FFF1F1] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="font-bold text-xs text-[#0A192F] truncate">{item.name}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile Outlet Types Accordion */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setMobileOutletsOpen(prev => !prev)}
                            className="w-full flex items-center justify-between p-3 text-slate-900 font-extrabold text-sm hover:bg-slate-100/70 transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span>Outlet Types</span>
                            </span>
                            <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${mobileOutletsOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {mobileOutletsOpen && (
                            <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                                {OUTLET_TYPES_ITEMS.map((item) => (
                                    <Link 
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 hover:text-[#FF2D55] hover:bg-[#FFF1F1] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="font-bold text-xs text-[#0A192F] truncate">{item.name}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile Pricing Link */}
                    <a 
                        href="#pricing"
                        onClick={handlePricingClick}
                        className="block px-3 py-2.5 rounded-xl text-slate-800 font-extrabold text-sm hover:bg-slate-100 transition-colors"
                    >
                        Pricing Plans
                    </a>

                    {/* Mobile Auth CTAs */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        <Link 
                            to="/staff/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-2.5 text-center font-bold text-sm text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Log In to Dashboard
                        </Link>
                        <Link 
                            to="/staff/register"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-2.5 text-center font-bold text-sm text-white bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] rounded-xl shadow-md transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>

                </div>
            )}
        </header>
    );
};

export default WebsiteNavbar;
