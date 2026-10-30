import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    UtensilsCrossed, Utensils, ChevronDown, ChevronRight, X, Menu as MenuIcon, ShoppingBag,
    Receipt, Package, ShoppingCart, BarChart3, BookOpen, Users, Truck, Monitor,
    ChefHat, QrCode, Store, Boxes, LineChart, Building2, Flame, Clock, Sparkles, ArrowRight
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
            <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
                
                {/* Brand Logo matching FoodNest Restaurant Landing Page */}
                <Link 
                    to="/" 
                    onClick={() => {
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
                        <UtensilsCrossed size={22} strokeWidth={2.2} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                            Food<span className="text-[#FF5A1F]">Nest</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                            Restaurant Management System
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation Links matching Restaurant Landing Page exactly */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                    <Link 
                        to="/"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Home
                    </Link>
                    <a 
                        href="/#features"
                        onClick={(e) => {
                            if (location.pathname === '/') {
                                e.preventDefault();
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Features
                    </a>
                    <a 
                        href="/#pricing"
                        onClick={(e) => {
                            if (location.pathname === '/') {
                                e.preventDefault();
                                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Pricing
                    </a>
                    <Link 
                        to="/about"
                        className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        About
                    </Link>
                    <Link 
                        to="/contact"
                        className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Contact
                    </Link>
                </nav>

                {/* Right Action Buttons matching Restaurant Landing Page exactly */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex items-center gap-3">
                        <Link
                            to="/login"
                            className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-950 rounded-xl transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="px-5 py-2.5 text-sm font-bold bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 group"
                        >
                            <span>Get Started</span>
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

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

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden mt-3 pt-3 border-t border-slate-200/80 space-y-2 bg-white rounded-2xl p-4 shadow-2xl max-h-[calc(100vh-90px)] overflow-y-auto">
                    <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-slate-800 hover:text-[#FF5A1F] hover:bg-orange-50 rounded-xl transition-colors"
                    >
                        Home
                    </Link>
                    <a
                        href="/#features"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-slate-800 hover:text-[#FF5A1F] hover:bg-orange-50 rounded-xl transition-colors"
                    >
                        Features
                    </a>
                    <a
                        href="/#pricing"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-slate-800 hover:text-[#FF5A1F] hover:bg-orange-50 rounded-xl transition-colors"
                    >
                        Pricing
                    </a>
                    <Link
                        to="/about"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-slate-800 hover:text-[#FF5A1F] hover:bg-orange-50 rounded-xl transition-colors"
                    >
                        About
                    </Link>
                    <Link
                        to="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-slate-800 hover:text-[#FF5A1F] hover:bg-orange-50 rounded-xl transition-colors"
                    >
                        Contact
                    </Link>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-2.5 text-center font-bold text-sm text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full py-2.5 text-center font-bold text-sm text-white bg-[#FF5A1F] hover:bg-[#E04812] rounded-xl shadow-md transition-all"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default WebsiteNavbar;
