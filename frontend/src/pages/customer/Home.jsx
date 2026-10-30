import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    UtensilsCrossed, ArrowRight, Star, CheckCircle2, 
    ShieldCheck, Headphones, Zap, ShoppingCart, 
    Utensils, Users, Boxes, BarChart3, Settings as SettingsIcon,
    Play, ChevronRight, Check, Sparkles, Phone, Award,
    Clock, Shield, Heart, Store, ChevronDown, IndianRupee,
    UserPlus, TrendingUp, Plus, CheckCircle, RefreshCw
} from 'lucide-react';
import api from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

// Static / fallback configuration for features & statistics matching screenshot
const STATISTICS = [
    {
        value: "500+",
        label: "Happy Restaurants",
        icon: UtensilsCrossed,
        bgColor: "bg-orange-50",
        iconColor: "text-[#FF5A1F]"
    },
    {
        value: "50,000+",
        label: "Daily Orders",
        icon: Users,
        bgColor: "bg-orange-50",
        iconColor: "text-[#FF5A1F]"
    },
    {
        value: "99%",
        label: "Uptime Guarantee",
        icon: Star,
        bgColor: "bg-orange-50",
        iconColor: "text-[#FF5A1F]"
    },
    {
        value: "24/7",
        label: "Customer Support",
        icon: Headphones,
        bgColor: "bg-orange-50",
        iconColor: "text-[#FF5A1F]"
    }
];

const FEATURES = [
    {
        id: "order-management",
        title: "Order Management",
        badge: "Live POS & Kitchen",
        description: "View, accept, and manage orders in real-time across all channels.",
        fullDescription: "Streamline dine-in, takeaway, tabletop QR and online delivery orders into a unified live order processing queue. Minimize wait times with instant KOT routing straight to kitchen displays.",
        icon: ShoppingCart,
        iconBg: "bg-orange-50",
        iconColor: "text-[#FF5A1F]",
        link: "/pos/billing",
        capabilities: [
            "Real-time multichannel order sync (Dine-in, Takeaway, Online)",
            "Automated Kitchen Order Ticket (KOT) thermal printing & routing",
            "Live status tracking: Placed, Preparing, Ready, Delivered",
            "Color-coded order priority timers & delay alerts"
        ],
        previewMetric: "3 Sec Checkout • 0% Order Lag"
    },
    {
        id: "menu-management",
        title: "Menu Management",
        badge: "Dynamic Digital Menu",
        description: "Update your menu, prices and availability anytime.",
        icon: Utensils,
        iconBg: "bg-orange-50",
        iconColor: "text-[#FF5A1F]",
        link: "/pos/menu",
        fullDescription: "Centralized digital catalog for dishes, item categories, price tiers, and variations. Toggle item availability in one click so customers never order 86'd sold-out food.",
        capabilities: [
            "Instant 1-click 86 item sold-out toggle across menus",
            "Multi-variant pricing (Regular, Large, combos, spice levels)",
            "Category tagging, allergens & dietary tags (Veg / Non-Veg)",
            "Happy hour dynamic pricing & scheduled discounts"
        ],
        previewMetric: "Instant Sync across QR & POS"
    },
    {
        id: "staff-role-management",
        title: "Staff & Role Management",
        badge: "Permission Control",
        description: "Manage your kitchen, waiters, cashiers and delivery partners.",
        icon: Users,
        iconBg: "bg-orange-50",
        iconColor: "text-[#FF5A1F]",
        link: "/features/management",
        fullDescription: "Role-based access permissions tailored for restaurant workflows. Provide dedicated views for Managers, Chefs, Cashiers, Waiters, and Riders while safeguarding business data.",
        capabilities: [
            "Dedicated interfaces for Waiters, Chefs, Cashiers & Delivery Riders",
            "Manager security PIN protection for voids, reprints & big discounts",
            "Staff shift attendance clocks & payroll performance tracking",
            "Role-based permission toggles for sensitive financial screens"
        ],
        previewMetric: "5 Roles • Zero Unauthorized Access"
    },
    {
        id: "inventory-tracking",
        title: "Inventory Tracking",
        badge: "Recipe Auto-Depletion",
        description: "Keep track of stock and avoid running out of essentials.",
        icon: Boxes,
        iconBg: "bg-orange-50",
        iconColor: "text-[#FF5A1F]",
        link: "/pos/inventory",
        fullDescription: "Track ingredient stock levels down to the gram. Automatically deplete raw materials whenever dishes are ordered and receive automated low-stock reorder warnings.",
        capabilities: [
            "Recipe-level ingredient deduction on order punch",
            "Automated low-stock alerts before dinner rush",
            "Vendor purchase orders (PO) and goods receipt logs",
            "Stock variance audit & kitchen spillage tracking"
        ],
        previewMetric: "28% Food Waste Cut • Gram Precision"
    },
    {
        id: "reports-analytics",
        title: "Reports & Analytics",
        badge: "Executive Insights",
        description: "Get detailed sales, order and performance reports.",
        icon: BarChart3,
        iconBg: "bg-orange-50",
        iconColor: "text-[#FF5A1F]",
        link: "/pos/reporting",
        fullDescription: "Deep business intelligence into peak sales hours, top revenue-generating menu items, table turnaround velocities, and profit margins to drive growth.",
        capabilities: [
            "Daily, weekly & monthly gross vs net revenue reports",
            "Average Order Value (AOV) and customer spend heatmaps",
            "Top-selling dishes by volume and profitability margins",
            "Exportable CSV, Excel, and tax GST financial statements"
        ],
        previewMetric: "Live Financial Health & Profit Score"
    },
    {
        id: "restaurant-settings",
        title: "Restaurant Settings",
        badge: "Store Configuration",
        description: "Configure your restaurant and business preferences.",
        icon: SettingsIcon,
        iconBg: "bg-orange-50",
        iconColor: "text-[#FF5A1F]",
        link: "/features/management",
        fullDescription: "Tailor FoodNest to your restaurant format. Manage multiple branch outlets, customize tax rules (GST/VAT), set service charge rates, and connect thermal printers.",
        capabilities: [
            "Multi-branch restaurant profile & operational hours",
            "Custom 5% GST, VAT, and service charge rule configuration",
            "Thermal receipt printing header, footer & QR branding",
            "Table layout grid mapping & floor plan designer"
        ],
        previewMetric: "100% Configurable & Scalable"
    }
];

const HOW_IT_WORKS_STEPS = [
    {
        step: 1,
        title: "Sign Up",
        desc: "Create your account and add your restaurant.",
        icon: UserPlus
    },
    {
        step: 2,
        title: "Set Up",
        desc: "Configure menu, staff, branches and settings.",
        icon: SettingsIcon
    },
    {
        step: 3,
        title: "Start Managing",
        desc: "Handle orders, inventory and daily operations.",
        icon: Store
    },
    {
        step: 4,
        title: "Grow",
        desc: "Track performance and take your business further.",
        icon: TrendingUp
    }
];



const DEFAULT_PLANS = [
    { _id: 'p1', name: 'Basic', monthlyPrice: 49, yearlyPrice: 39, features: ['1 Restaurant Branch', 'Basic POS Billing & KOT', 'QR Code Dine-In Ordering', 'Real-time Stock Tracking', 'Email & Chat Support'] },
    { _id: 'p2', name: 'Pro', monthlyPrice: 99, yearlyPrice: 79, features: ['Up to 3 Branches', 'Kitchen Display System (KDS)', 'Dine-In + Delivery Integration', 'Advanced Revenue Analytics', 'Automated Low-Stock Alerts', '24/7 Priority Support'] },
    { _id: 'p3', name: 'Enterprise', monthlyPrice: 199, yearlyPrice: 159, features: ['Unlimited Branches', 'Custom API & Webhooks', 'Dedicated Account Manager', 'Multi-Currency & Custom Tax Rules', 'SLA 99.9% Uptime Guarantee', '24/7 Phone & On-Site Support'] }
];

const Home = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [isYearly, setIsYearly] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [activeFeatureModal, setActiveFeatureModal] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');

    // Dynamic Testimonials from DB
    const [testimonials, setTestimonials] = useState([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(true);
    const [showAllTestimonialsModal, setShowAllTestimonialsModal] = useState(false);

    // Interactive Real-Time Working Laptop Dashboard State
    const [laptopTab, setLaptopTab] = useState('Dashboard');
    const [laptopTimeRange, setLaptopTimeRange] = useState('Weekly');
    const [laptopOrders, setLaptopOrders] = useState([
        { id: 1, name: 'Chicken Biryani', price: 240, qty: 1, status: 'Prep', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=60&auto=format&fit=crop' },
        { id: 2, name: 'Pizza', price: 350, qty: 1, status: 'OK', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=60&auto=format&fit=crop' },
        { id: 3, name: 'Fried Rice', price: 180, qty: 1, status: 'OK', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=60&auto=format&fit=crop' },
    ]);
    const [laptopMetrics, setLaptopMetrics] = useState({
        totalOrders: 248,
        todayRevenue: 12480,
        activeStaff: 8
    });
    const [laptopMenuItems, setLaptopMenuItems] = useState([
        { id: 1, name: 'Butter Chicken', category: 'Main Course', price: 320, available: true },
        { id: 2, name: 'Paneer Butter Masala', category: 'Main Course', price: 280, available: true },
        { id: 3, name: 'Garlic Naan', category: 'Breads', price: 60, available: true },
        { id: 4, name: 'Cold Coffee Frappe', category: 'Beverages', price: 140, available: false },
    ]);
    const [laptopInventoryItems, setLaptopInventoryItems] = useState([
        { id: 1, item: 'Basmati Rice', stock: '48 kg', status: 'In Stock' },
        { id: 2, item: 'Cooking Butter', stock: '4.5 kg', status: 'Low Stock' },
        { id: 3, item: 'Fresh Cream', stock: '12 L', status: 'In Stock' },
        { id: 4, item: 'Whole Spices', stock: '1.2 kg', status: 'Reorder' },
    ]);

    const toggleOrderStatus = (id) => {
        setLaptopOrders(prev => prev.map(o => {
            if (o.id === id) {
                const nextStatus = o.status === 'Prep' ? 'OK' : (o.status === 'OK' ? 'Ready' : 'Prep');
                return { ...o, status: nextStatus };
            }
            return o;
        }));
    };

    const toggleMenuAvailability = (id) => {
        setLaptopMenuItems(prev => prev.map(m => m.id === id ? { ...m, available: !m.available } : m));
    };

    const addSampleOrder = () => {
        const sampleDishes = [
            { name: 'Paneer Tikka Roll', price: 220, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=60&auto=format&fit=crop' },
            { name: 'Tandoori Roti', price: 40, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=60&auto=format&fit=crop' },
            { name: 'Masala Chai', price: 50, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=60&auto=format&fit=crop' }
        ];
        const randomDish = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];
        const newOrder = {
            id: Date.now(),
            name: randomDish.name,
            price: randomDish.price,
            qty: 1,
            status: 'Prep',
            img: randomDish.img
        };
        setLaptopOrders(prev => [newOrder, ...prev.slice(0, 3)]);
        setLaptopMetrics(prev => ({
            ...prev,
            totalOrders: prev.totalOrders + 1,
            todayRevenue: prev.todayRevenue + randomDish.price
        }));
    };

    // Force Light Mode on Restaurant Landing Page to match reference screenshot design
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    // Fetch live approved testimonials from backend
    useEffect(() => {
        let isMounted = true;
        const fetchTestimonials = async () => {
            try {
                setTestimonialsLoading(true);
                const res = await api.get('/testimonials/public', { timeout: 4000 });
                if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
                    setTestimonials(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load testimonials:', err);
            } finally {
                if (isMounted) setTestimonialsLoading(false);
            }
        };
        fetchTestimonials();
        return () => { isMounted = false; };
    }, []);

    // Fetch dynamic pricing plans from Super Admin if available
    useEffect(() => {
        let isMounted = true;
        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans', { timeout: 3500 });
                if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setPlans(res.data);
                }
            } catch {
                // Keep default plans fallback
            }
        };
        fetchPlans();
        return () => { isMounted = false; };
    }, []);

    const scrollToSection = (id) => {
        setActiveSection(id);
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF9] text-slate-800 font-sans selection:bg-[#FF5A1F] selection:text-white relative overflow-x-hidden">

            {/* ========================================================================= */}
            {/* 1. TOP NAVBAR (STICKY, LOGO, NAV LINKS, LOGIN, ORANGE GET STARTED)        */}
            {/* ========================================================================= */}
            <header className="sticky top-0 z-50 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-orange-100/60 transition-all">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
                    
                    {/* Brand Logo matching reference */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
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

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                        <button 
                            onClick={() => scrollToSection('home')}
                            className={`transition-colors cursor-pointer ${activeSection === 'home' ? 'text-[#FF5A1F] font-bold' : 'hover:text-slate-900'}`}
                        >
                            Home
                        </button>
                        <button 
                            onClick={() => scrollToSection('features')}
                            className={`transition-colors cursor-pointer ${activeSection === 'features' ? 'text-[#FF5A1F] font-bold' : 'hover:text-slate-900'}`}
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => scrollToSection('pricing')}
                            className={`transition-colors cursor-pointer ${activeSection === 'pricing' ? 'text-[#FF5A1F] font-bold' : 'hover:text-slate-900'}`}
                        >
                            Pricing
                        </button>
                        <Link 
                            to="/about"
                            className="transition-colors hover:text-slate-900"
                        >
                            About
                        </Link>
                        <Link 
                            to="/contact"
                            className="transition-colors hover:text-slate-900"
                        >
                            Contact
                        </Link>
                    </nav>

                    {/* Right Action Buttons */}
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

                    {/* Mobile Hamburger Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <Link
                            to="/login"
                            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 rounded-lg"
                        >
                            Login
                        </Link>
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-slate-700 hover:text-slate-950 rounded-lg"
                            aria-label="Toggle navigation"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#FFFDF9] border-b border-orange-100 px-6 py-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <button 
                            onClick={() => scrollToSection('home')}
                            className="block w-full text-left py-2 text-sm font-bold text-slate-700"
                        >
                            Home
                        </button>
                        <button 
                            onClick={() => scrollToSection('features')}
                            className="block w-full text-left py-2 text-sm font-bold text-slate-700"
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => scrollToSection('pricing')}
                            className="block w-full text-left py-2 text-sm font-bold text-slate-700"
                        >
                            Pricing
                        </button>
                        <Link 
                            to="/about"
                            className="block w-full text-left py-2 text-sm font-bold text-slate-700"
                        >
                            About
                        </Link>
                        <Link 
                            to="/contact"
                            className="block w-full text-left py-2 text-sm font-bold text-slate-700"
                        >
                            Contact
                        </Link>
                        <div className="pt-2 flex flex-col gap-2">
                            <Link
                                to="/register"
                                className="w-full text-center py-2.5 bg-[#FF5A1F] text-white font-bold rounded-xl text-sm"
                            >
                                Get Started Free →
                            </Link>
                        </div>
                    </div>
                )}
            </header>


            {/* ========================================================================= */}
            {/* 2. HERO SECTION: EXACT RECREATION OF REFERENCE IMAGE                      */}
            {/* ========================================================================= */}
            <section id="home" className="relative pt-6 pb-14 sm:pt-10 sm:pb-20 bg-gradient-to-r from-[#FFFDF9] via-[#FFF9F2] to-[#FFF5EC] z-20">
                {/* Subtle warm cream background ambient glows */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-100/35 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="absolute top-10 right-0 w-[600px] h-[600px] bg-[#FFEEDB]/40 rounded-full blur-3xl pointer-events-none -z-10" />

                {/* Subtle natural green leaves decorative floating element in background center-left */}
                <div className="absolute top-14 left-[46%] opacity-75 pointer-events-none hidden xl:block select-none z-0">
                    <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-12 filter drop-shadow-xs">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                    </svg>
                </div>

                {/* TOP-RIGHT DECORATION: "Hot & Fresh Always!" handwritten accent */}
                <div className="absolute top-6 right-8 sm:right-16 hidden lg:flex items-center gap-1.5 z-20 pointer-events-none select-none">
                    <span className="font-serif italic font-bold text-xs sm:text-sm text-[#8B4513] tracking-tight">
                        Hot &amp; Fresh Always!
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-45">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                </div>

                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                        
                        {/* ================================================================= */}
                        {/* LEFT COLUMN: ~43% WIDTH (Col 5 / 12 on lg/xl)                      */}
                        {/* ================================================================= */}
                        <div className="lg:col-span-5 xl:col-span-5 space-y-4 sm:space-y-5 text-left pr-0 lg:pr-2 z-10">
                            
                            {/* Orange handwritten-style label */}
                            <p className="text-sm sm:text-[15px] font-serif italic font-bold text-[#FF5A0A] tracking-wide">
                                For Restaurant Owners
                            </p>

                            {/* Large bold dark navy headline across exactly TWO lines */}
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[44px] 2xl:text-[48px] font-black text-[#142B45] tracking-tight leading-[1.12]">
                                <span className="block whitespace-nowrap">Manage Your Restaurant</span>
                                <span className="block whitespace-nowrap">
                                    <span>Smarter, </span>
                                    <span className="text-[#FF5A0A]">Not Harder</span>
                                </span>
                            </h1>

                            {/* Supporting description with compact line spacing & muted blue-grey */}
                            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                                FoodNest gives you everything you need to run your restaurant smoothly — from order management to staff control, inventory, reports and more. All in one powerful platform.
                            </p>

                            {/* CTA BUTTONS: Orange Filled & Outlined Watch Demo */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <Link
                                    to="/register"
                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#FF5A0A] hover:bg-[#E04F08] text-white font-bold rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all text-xs sm:text-sm flex items-center gap-2 group"
                                >
                                    <span>Get Started Free</span>
                                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => setShowDemoModal(true)}
                                    className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-orange-50/50 border border-orange-200 text-[#142B45] hover:text-[#FF5A0A] font-bold rounded-xl transition-all text-xs sm:text-sm flex items-center gap-2 shadow-2xs cursor-pointer group"
                                >
                                    <div className="w-5 h-5 rounded-full bg-orange-100/80 text-[#FF5A0A] flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Play size={9} fill="currentColor" className="ml-0.5" />
                                    </div>
                                    <span>Watch Demo</span>
                                </button>
                            </div>

                            {/* BENEFITS ROW: 3 compact horizontal items in one row */}
                            <div className="pt-3 sm:pt-4 grid grid-cols-3 gap-2 sm:gap-3 border-t border-orange-100/70">
                                
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFEADB] text-[#FF5A0A] flex items-center justify-center shrink-0">
                                        <ShieldCheck size={15} strokeWidth={2.4} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] sm:text-xs font-bold text-[#142B45] leading-tight truncate">Secure &amp; Reliable</h4>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">Your data is safe with us</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFEADB] text-[#FF5A0A] flex items-center justify-center shrink-0">
                                        <Headphones size={15} strokeWidth={2.4} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] sm:text-xs font-bold text-[#142B45] leading-tight truncate">24/7 Support</h4>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">We're always here</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFEADB] text-[#FF5A0A] flex items-center justify-center shrink-0">
                                        <Zap size={15} strokeWidth={2.4} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] sm:text-xs font-bold text-[#142B45] leading-tight truncate">Easy to Use</h4>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">No technical skills needed</p>
                                    </div>
                                </div>

                            </div>

                        </div>

                        {/* ================================================================= */}
                        {/* RIGHT COLUMN: ~57% WIDTH (Col 7 / 12 on lg/xl)                      */}
                        {/* HP LAPTOP MOCKUP & VERTICAL RECTANGULAR REDMI PHONE MOCKUP          */}
                        {/* ================================================================= */}
                        <div className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-center lg:justify-start pt-3 pb-8 sm:pb-12 pl-4 sm:pl-8 lg:pl-10">

                            {/* Leaves accent floating behind laptop on the left side matching reference */}
                            <div className="absolute top-8 -left-6 sm:-left-10 pointer-events-none select-none z-0 hidden lg:block opacity-85">
                                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-45">
                                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                                </svg>
                            </div>

                            {/* SQUARE-SHAPED HP LAPTOP STRUCTURE (Reduced width from right to left for balanced square aspect ratio) */}
                            <div className="relative w-full max-w-[460px] sm:max-w-[490px] lg:max-w-[520px] xl:max-w-[540px] z-10 drop-shadow-2xl">
                                
                                {/* HP Laptop Display Lid / Bezel */}
                                <div className="bg-[#1E242E] rounded-t-xl sm:rounded-t-2xl p-2 sm:p-2.5 pb-2 shadow-2xl border border-slate-700/80 ring-1 ring-black/40">
                                    
                                    {/* Top slim bezel webcam & microphone indicators */}
                                    <div className="flex items-center justify-center gap-2 pb-1.5">
                                        <span className="w-1 h-1 rounded-full bg-slate-600 block" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0E1520] ring-1 ring-slate-600 block" />
                                        <span className="w-1 h-1 rounded-full bg-slate-600 block" />
                                    </div>
                                    
                                    {/* Laptop Inner Screen */}
                                    <div className="bg-white rounded-md overflow-hidden text-left flex border border-slate-200 shadow-inner">
                                        
                                        {/* Left Dark Sidebar matching screenshot with working interactive tabs */}
                                        <div className="w-26 sm:w-32 bg-[#111927] text-slate-300 p-2 sm:p-2.5 flex flex-col justify-between shrink-0 select-none z-10">
                                            <div className="space-y-2">
                                                {/* Brand Header */}
                                                <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
                                                    <div className="w-4 h-4 rounded bg-[#FF5A0A] text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                                                        F
                                                    </div>
                                                    <span className="text-[10px] font-extrabold text-white tracking-tight">FoodNest</span>
                                                </div>

                                                {/* Navigation items - Clickable working tabs, all visible */}
                                                <div className="space-y-1 text-[8.5px] font-medium">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setLaptopTab('Dashboard')}
                                                        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                                                            laptopTab === 'Dashboard' 
                                                                ? 'bg-[#FF5A0A] text-white font-bold shadow-xs' 
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                        }`}
                                                    >
                                                        <BarChart3 size={11} className="shrink-0" />
                                                        <span>Dashboard</span>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setLaptopTab('Orders')}
                                                        className={`w-full text-left flex items-center justify-between px-2 py-1 rounded-md transition-all cursor-pointer ${
                                                            laptopTab === 'Orders' 
                                                                ? 'bg-[#FF5A0A] text-white font-bold shadow-xs' 
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            <ShoppingCart size={11} className="shrink-0" />
                                                            <span>Orders</span>
                                                        </span>
                                                        <span className="text-[7px] bg-orange-500/30 text-orange-200 px-1 rounded-full font-bold">
                                                            {laptopOrders.length}
                                                        </span>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setLaptopTab('Menu')}
                                                        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                                                            laptopTab === 'Menu' 
                                                                ? 'bg-[#FF5A0A] text-white font-bold shadow-xs' 
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                        }`}
                                                    >
                                                        <Utensils size={11} className="shrink-0" />
                                                        <span>Menu</span>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setLaptopTab('Inventory')}
                                                        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                                                            laptopTab === 'Inventory' 
                                                                ? 'bg-[#FF5A0A] text-white font-bold shadow-xs' 
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                        }`}
                                                    >
                                                        <Boxes size={11} className="shrink-0" />
                                                        <span>Inventory</span>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setLaptopTab('Staff')}
                                                        className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                                                            laptopTab === 'Staff' 
                                                                ? 'bg-[#FF5A0A] text-white font-bold shadow-xs' 
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                        }`}
                                                    >
                                                        <Users size={11} className="shrink-0" />
                                                        <span>Staff</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[7px] text-slate-400 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span>Live POS</span>
                                                </span>
                                                <span className="text-slate-500 font-mono">v3.4</span>
                                            </div>
                                        </div>

                                        {/* Main White Workspace */}
                                        <div className="flex-1 bg-[#F9FAFB] p-2 sm:p-2.5 space-y-2 min-w-0 overflow-hidden">
                                            
                                            {/* Top bar with Dashboard title and User Restaurant profile matching screenshot */}
                                            <div className="flex items-center justify-between pb-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="text-xs sm:text-[13px] font-extrabold text-[#111927] leading-tight">
                                                        {laptopTab}
                                                    </h3>
                                                    {laptopTab === 'Dashboard' && (
                                                        <span className="text-[7px] font-black uppercase tracking-wider bg-orange-100 text-[#FF5A0A] px-1 py-0.5 rounded">
                                                            Live
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button 
                                                        type="button"
                                                        onClick={addSampleOrder}
                                                        title="Simulate incoming order"
                                                        className="px-1.5 py-0.5 text-[7px] font-bold bg-[#FF5A0A] hover:bg-[#E04812] text-white rounded transition-colors flex items-center gap-0.5 shadow-xs cursor-pointer"
                                                    >
                                                        <Plus size={8} /> New Order
                                                    </button>
                                                    <div className="w-4 h-4 rounded-full bg-orange-100 text-[#FF5A0A] font-bold text-[8px] flex items-center justify-center ring-1 ring-orange-300">
                                                        FH
                                                    </div>
                                                    <div className="text-right leading-none hidden sm:block">
                                                        <span className="text-[8px] font-bold text-slate-800 block">The Food Hub</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* TAB 1: DASHBOARD VIEW (Exact match to reference image, now live & reactive) */}
                                            {laptopTab === 'Dashboard' && (
                                                <>
                                                    {/* 3 Metrics Cards */}
                                                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                                                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-xs flex items-center justify-between">
                                                            <div>
                                                                <span className="text-[7px] text-slate-400 font-medium block">Total Orders</span>
                                                                <span className="text-xs sm:text-[12px] font-black text-[#111927] block">{laptopMetrics.totalOrders}</span>
                                                                <span className="text-[6.5px] text-emerald-600 font-bold block mt-0.5">↑ 18%</span>
                                                            </div>
                                                            <div className="w-4.5 h-4.5 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                <ShoppingCart size={8} />
                                                            </div>
                                                        </div>
                                                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-xs flex items-center justify-between">
                                                            <div>
                                                                <span className="text-[7px] text-slate-400 font-medium block">Today's Revenue</span>
                                                                <span className="text-xs sm:text-[12px] font-black text-[#FF5A0A] block">₹{laptopMetrics.todayRevenue.toLocaleString('en-IN')}</span>
                                                                <span className="text-[6.5px] text-emerald-600 font-bold block mt-0.5">↑ 24%</span>
                                                            </div>
                                                            <div className="w-4.5 h-4.5 rounded-full bg-orange-50 flex items-center justify-center text-[#FF5A0A]">
                                                                <IndianRupee size={8} />
                                                            </div>
                                                        </div>
                                                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-xs flex items-center justify-between">
                                                            <div>
                                                                <span className="text-[7px] text-slate-400 font-medium block">Active Staff</span>
                                                                <span className="text-xs sm:text-[12px] font-black text-[#111927] block">{laptopMetrics.activeStaff}</span>
                                                                <span className="text-[6.5px] text-emerald-600 font-bold block mt-0.5">● On Duty</span>
                                                            </div>
                                                            <div className="w-4.5 h-4.5 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                <Users size={8} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Chart & Recent Orders Split */}
                                                    <div className="grid grid-cols-12 gap-1.5 pt-0.5">
                                                        
                                                        {/* Sales Overview Area/Line Chart with working time toggle */}
                                                        <div className="col-span-7 bg-white p-1.5 sm:p-2 rounded-lg border border-slate-100 shadow-xs flex flex-col justify-between">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[8px] font-bold text-[#111927]">Sales Overview</span>
                                                                <div className="flex gap-1 text-[6.5px]">
                                                                    <button 
                                                                        onClick={() => setLaptopTimeRange('Weekly')}
                                                                        className={`px-1 py-0.5 rounded cursor-pointer ${laptopTimeRange === 'Weekly' ? 'bg-orange-100 text-[#FF5A0A] font-bold' : 'text-slate-400'}`}
                                                                    >
                                                                        Weekly
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setLaptopTimeRange('Daily')}
                                                                        className={`px-1 py-0.5 rounded cursor-pointer ${laptopTimeRange === 'Daily' ? 'bg-orange-100 text-[#FF5A0A] font-bold' : 'text-slate-400'}`}
                                                                    >
                                                                        Daily
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="h-16 sm:h-18 w-full relative">
                                                                <svg viewBox="0 0 100 45" className="w-full h-full overflow-visible">
                                                                    <defs>
                                                                        <linearGradient id="heroSalesGradClean" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="0%" stopColor="#FF5A0A" stopOpacity="0.30" />
                                                                            <stop offset="100%" stopColor="#FF5A0A" stopOpacity="0.02" />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    {laptopTimeRange === 'Weekly' ? (
                                                                        <>
                                                                            <path d="M0,35 Q15,26 30,30 T60,18 T85,22 T100,10 L100,45 L0,45 Z" fill="url(#heroSalesGradClean)" />
                                                                            <path d="M0,35 Q15,26 30,30 T60,18 T85,22 T100,10" fill="none" stroke="#FF5A0A" strokeWidth="2" strokeLinecap="round" />
                                                                            <circle cx="30" cy="30" r="1.8" fill="#FF5A0A" />
                                                                            <circle cx="60" cy="18" r="1.8" fill="#FF5A0A" />
                                                                            <circle cx="100" cy="10" r="1.8" fill="#FF5A0A" />
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <path d="M0,28 Q20,38 40,20 T70,12 T100,16 L100,45 L0,45 Z" fill="url(#heroSalesGradClean)" />
                                                                            <path d="M0,28 Q20,38 40,20 T70,12 T100,16" fill="none" stroke="#FF5A0A" strokeWidth="2" strokeLinecap="round" />
                                                                            <circle cx="40" cy="20" r="1.8" fill="#FF5A0A" />
                                                                            <circle cx="70" cy="12" r="1.8" fill="#FF5A0A" />
                                                                            <circle cx="100" cy="16" r="1.8" fill="#FF5A0A" />
                                                                        </>
                                                                    )}
                                                                </svg>
                                                            </div>
                                                            <div className="flex justify-between text-[6.5px] text-slate-400 font-medium px-0.5">
                                                                {laptopTimeRange === 'Weekly' ? (
                                                                    <><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></>
                                                                ) : (
                                                                    <><span>10 AM</span><span>1 PM</span><span>4 PM</span><span>7 PM</span><span>10 PM</span></>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Recent Orders with toggleable status chips */}
                                                        <div className="col-span-5 bg-white p-1.5 sm:p-2 rounded-lg border border-slate-100 shadow-xs space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[8px] font-bold text-[#111927] block">Recent Orders</span>
                                                                <span className="text-[6px] text-slate-400">Tap status to update</span>
                                                            </div>
                                                            <div className="space-y-1 text-[7px]">
                                                                {laptopOrders.map(order => (
                                                                    <div key={order.id} className="flex items-center justify-between gap-1 p-0.5 rounded hover:bg-slate-50 transition-colors">
                                                                        <div className="flex items-center gap-1 min-w-0">
                                                                            <img 
                                                                                src={order.img} 
                                                                                alt={order.name} 
                                                                                className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                                                            />
                                                                            <div className="min-w-0">
                                                                                <p className="font-bold text-slate-800 leading-none truncate max-w-[55px] sm:max-w-[70px]">{order.name}</p>
                                                                                <p className="text-[6px] text-slate-400">{order.qty} x ₹{order.price}</p>
                                                                            </div>
                                                                        </div>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => toggleOrderStatus(order.id)}
                                                                            className={`text-[6px] font-bold px-1 py-0.5 rounded shrink-0 cursor-pointer transition-all ${
                                                                                order.status === 'Prep' 
                                                                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                                                                    : order.status === 'OK' 
                                                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                            }`}
                                                                        >
                                                                            {order.status}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>
                                                </>
                                            )}

                                            {/* TAB 2: ORDERS MANAGEMENT VIEW */}
                                            {laptopTab === 'Orders' && (
                                                <div className="bg-white rounded-lg border border-slate-100 p-2 space-y-2 h-[120px] overflow-y-auto">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                        <span className="text-[8px] font-bold text-slate-700">Live Kitchen Queue</span>
                                                        <span className="text-[7px] text-slate-400">{laptopOrders.length} active orders</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {laptopOrders.map(order => (
                                                            <div key={order.id} className="flex items-center justify-between text-[7px] p-1 bg-slate-50 rounded border border-slate-100">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                                                    <div>
                                                                        <span className="font-bold text-slate-800 block">{order.name}</span>
                                                                        <span className="text-[6.5px] text-slate-400">Token #{order.id.toString().slice(-3)} • Table T-{order.id % 5 + 1}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-slate-900">₹{order.price}</span>
                                                                    <button 
                                                                        onClick={() => toggleOrderStatus(order.id)}
                                                                        className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[6px] cursor-pointer"
                                                                    >
                                                                        {order.status === 'Prep' ? 'Mark Ready' : 'Completed'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 3: MENU MANAGEMENT VIEW */}
                                            {laptopTab === 'Menu' && (
                                                <div className="bg-white rounded-lg border border-slate-100 p-2 space-y-1.5 h-[120px] overflow-y-auto">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                        <span className="text-[8px] font-bold text-slate-700">Catalog & Availability</span>
                                                        <span className="text-[7px] text-slate-400">Click to 86 / In-Stock</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {laptopMenuItems.map(m => (
                                                            <div key={m.id} className="flex items-center justify-between text-[7px] p-1 rounded hover:bg-slate-50 border border-slate-100">
                                                                <div>
                                                                    <span className="font-bold text-slate-800 block">{m.name}</span>
                                                                    <span className="text-[6.5px] text-slate-400">{m.category} • ₹{m.price}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleMenuAvailability(m.id)}
                                                                    className={`px-1.5 py-0.5 rounded text-[6.5px] font-bold cursor-pointer transition-colors ${
                                                                        m.available 
                                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                                            : 'bg-rose-100 text-rose-800'
                                                                    }`}
                                                                >
                                                                    {m.available ? 'In Stock' : 'Sold Out (86)'}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 4: INVENTORY VIEW */}
                                            {laptopTab === 'Inventory' && (
                                                <div className="bg-white rounded-lg border border-slate-100 p-2 space-y-1.5 h-[120px] overflow-y-auto">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                        <span className="text-[8px] font-bold text-slate-700">Stock &amp; Wastage Ledger</span>
                                                        <span className="text-[7px] text-emerald-600 font-bold">Auto Recipe Sync</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {laptopInventoryItems.map(item => (
                                                            <div key={item.id} className="flex items-center justify-between text-[7px] p-1 bg-slate-50/70 rounded border border-slate-100">
                                                                <div>
                                                                    <span className="font-bold text-slate-800">{item.item}</span>
                                                                    <span className="text-[6.5px] text-slate-400 block">Remaining: {item.stock}</span>
                                                                </div>
                                                                <span className={`px-1.5 py-0.5 rounded text-[6.5px] font-bold ${
                                                                    item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 5: STAFF VIEW */}
                                            {laptopTab === 'Staff' && (
                                                <div className="bg-white rounded-lg border border-slate-100 p-2 space-y-1.5 h-[120px] overflow-y-auto">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                        <span className="text-[8px] font-bold text-slate-700">Staff Shift Status</span>
                                                        <span className="text-[7px] text-emerald-600 font-bold">8 On Duty</span>
                                                    </div>
                                                    <div className="space-y-1 text-[7px]">
                                                        <div className="flex items-center justify-between p-1 bg-slate-50 rounded">
                                                            <span className="font-bold text-slate-800">Sarah Jenkins (Manager)</span>
                                                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded text-[6px]">Active Shift</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-1 bg-slate-50 rounded">
                                                            <span className="font-bold text-slate-800">Rajesh Sharma (Head Chef)</span>
                                                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded text-[6px]">KDS Station 1</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-1 bg-slate-50 rounded">
                                                            <span className="font-bold text-slate-800">Aarav Patel (Cashier / POS)</span>
                                                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded text-[6px]">Till Drawer Open</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                    </div>

                                    {/* HP-style bottom bezel logo area */}
                                    <div className="flex items-center justify-center pt-1 pb-0.5">
                                        <span className="text-[7px] font-serif font-black tracking-widest text-slate-500 uppercase">HP</span>
                                    </div>

                                </div>

                                {/* HP Clean Metallic Base with Display Hinge & Center Opening Notch */}
                                <div className="relative mx-auto w-[103%] left-[-1.5%]">
                                    <div className="h-3 sm:h-3.5 bg-gradient-to-b from-[#C4C8D0] via-[#DCE0E6] to-[#9EA4B0] rounded-b-md shadow-xl border-t border-slate-300 flex items-center justify-center">
                                        <div className="w-16 h-1 bg-slate-400/90 rounded-sm" />
                                    </div>
                                    <div className="h-2 w-[98%] mx-auto bg-slate-900/35 rounded-b-md blur-[2px]" />
                                </div>

                            </div>

                            {/* VERTICAL RECTANGULAR REDMI-STYLE PHONE MOCKUP (Positioned to the left so all laptop sidebar buttons remain completely visible) */}
                            <div className="absolute -bottom-8 sm:-bottom-10 lg:-bottom-12 -left-10 sm:-left-14 lg:-left-20 xl:-left-24 w-32 sm:w-36 lg:w-38 bg-[#11161F] p-2 rounded-[22px] shadow-2xl border border-slate-600/90 z-20 ring-1 ring-black/50">
                                
                                {/* Redmi front punch-hole camera centered at top */}
                                <div className="flex items-center justify-center pb-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-black ring-1 ring-slate-700 block" />
                                </div>
                                
                                <div className="bg-white rounded-[16px] p-2.5 text-left space-y-2 shadow-inner">
                                    
                                    {/* Mobile App Header with FoodNest & user icon */}
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded bg-[#FF5A0A] text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                                                F
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 tracking-tight">FoodNest</span>
                                        </div>
                                        <img 
                                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" 
                                            alt="User" 
                                            className="w-4 h-4 rounded-full object-cover ring-1 ring-orange-300"
                                        />
                                    </div>

                                    {/* Mobile Order Items with Thumbnails matching screenshot */}
                                    <div className="space-y-1.5 text-[8px]">
                                        <div className="p-1.5 rounded-lg bg-orange-50/60 border border-orange-100/70 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <img 
                                                    src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=60&auto=format&fit=crop" 
                                                    alt="Biryani" 
                                                    className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-slate-800 leading-tight truncate">Chicken Biryani</p>
                                                    <p className="text-slate-400 text-[7px]">Qty: 1 • ₹240</p>
                                                </div>
                                            </div>
                                            <span className="text-[6.5px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                                                Preparing
                                            </span>
                                        </div>

                                        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <img 
                                                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=60&auto=format&fit=crop" 
                                                    alt="Pizza" 
                                                    className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-slate-800 leading-tight truncate">Margherita Pizza</p>
                                                    <p className="text-slate-400 text-[7px]">Qty: 1 • ₹350</p>
                                                </div>
                                            </div>
                                            <span className="text-[6.5px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                                                Confirmed
                                            </span>
                                        </div>

                                        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <img 
                                                    src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=60&auto=format&fit=crop" 
                                                    alt="Fried Rice" 
                                                    className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-slate-800 leading-tight truncate">Veg Fried Rice</p>
                                                    <p className="text-slate-400 text-[7px]">Qty: 1 • ₹180</p>
                                                </div>
                                            </div>
                                            <span className="text-[6.5px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                                                Confirmed
                                            </span>
                                        </div>

                                        {/* Additional item showing extended height */}
                                        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <img 
                                                    src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=60&auto=format&fit=crop" 
                                                    alt="Burger" 
                                                    className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-slate-800 leading-tight truncate">Paneer Tikka Roll</p>
                                                    <p className="text-slate-400 text-[7px]">Qty: 2 • ₹260</p>
                                                </div>
                                            </div>
                                            <span className="text-[6.5px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                                                Delivered
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile Bottom Footer */}
                                    <div className="pt-1.5 text-center border-t border-slate-100 flex items-center justify-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                        <span className="text-[8px] font-bold text-[#FF5A0A]">
                                            4 Active Orders
                                        </span>
                                    </div>

                                </div>

                                {/* Redmi slim bottom bezel bar */}
                                <div className="h-1.5 flex items-center justify-center pt-1">
                                    <span className="w-10 h-0.5 bg-slate-700/80 rounded-full" />
                                </div>
                            </div>

                            {/* CUSTOMER LANDING PAGE HERO FOOD IMAGE BLENDING WITH RIGHT SIDE OF LAPTOP */}
                            <div className="absolute -top-10 -right-10 sm:-right-16 lg:-right-24 xl:-right-32 w-72 sm:w-88 lg:w-[440px] xl:w-[480px] h-[340px] sm:h-[390px] lg:h-[440px] pointer-events-none select-none z-0 hidden md:block">
                                <div 
                                    className="w-full h-full relative overflow-hidden"
                                    style={{
                                        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 60%), radial-gradient(circle at 75% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.6) 80%, transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,1) 60%), radial-gradient(circle at 75% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.6) 80%, transparent 100%)',
                                        maskComposite: 'intersect',
                                        WebkitMaskComposite: 'source-in'
                                    }}
                                >
                                    <img 
                                        src="/images/food/biryani-hero-platter.jpg" 
                                        alt="Customer Hero Food Scene"
                                        className="w-full h-full object-cover object-[center_right] filter drop-shadow-2xl brightness-[1.02] contrast-[1.03]"
                                        loading="eager"
                                        onError={(e) => {
                                            e.target.src = "/images/food/burger.jpg";
                                        }}
                                    />
                                    {/* Soft Left Edge Warm Feathering into the Laptop Edge */}
                                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FFF9F2] via-[#FFF9F2]/70 to-transparent pointer-events-none" />
                                    {/* Soft Bottom Edge Warm Feathering */}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FFF5EC] to-transparent pointer-events-none" />
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* 3. STATISTICS STRIP: 4 HORIZONTAL STAT CARDS WITH CIRCULAR ICONS          */}
            {/* ========================================================================= */}
            <section className="py-10 bg-white border-y border-orange-100/70 shadow-xs">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="flex flex-wrap items-center justify-start gap-8 sm:gap-12 md:gap-16">
                        {STATISTICS.map((stat, idx) => {
                            const IconComponent = stat.icon;
                            return (
                                <div key={idx} className="flex items-center gap-4 text-left group">
                                    <div className={`w-12 h-12 rounded-full ${stat.bgColor} ${stat.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs`}>
                                        <IconComponent size={22} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                                            {stat.value}
                                        </span>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-500">
                                            {stat.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* 4. FEATURES SECTION: "Powerful Features for Restaurant Owners"             */}
            {/* ========================================================================= */}
            <section id="features" className="py-8 sm:py-12 bg-[#FFFDF9]">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                        
                        {/* Left Column: Heading, description, Explore All Features button */}
                        <div className="lg:col-span-4 space-y-4 text-left sticky top-24">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full inline-block">
                                Everything You Need
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Powerful Features for Restaurant Owners
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                                Take full control of your restaurant with our easy-to-use dashboard and smart tools designed to eliminate operational chaos.
                            </p>
                            <div className="pt-2">
                                <Link
                                    to="/features/management"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-orange-50 border border-orange-200/90 text-[#FF5A1F] font-bold text-sm rounded-xl transition-all shadow-xs group"
                                >
                                    <span>Explore All Features</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Grid: 6 Rounded Feature Cards with full interactive details */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {FEATURES.map((feature) => {
                                const IconComponent = feature.icon;
                                return (
                                    <div 
                                        key={feature.id}
                                        onClick={() => setActiveFeatureModal(feature)}
                                        className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-200 text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-11 h-11 rounded-xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#FF5A1F] group-hover:text-white transition-all duration-200 shadow-xs`}>
                                                <IconComponent size={22} strokeWidth={2.2} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#FF5A1F] transition-colors truncate">
                                                        {feature.title}
                                                    </h3>
                                                    {feature.badge && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5A1F] border border-orange-100 shrink-0">
                                                            {feature.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bottom Action Hint */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-[#FF5A1F] transition-colors">
                                            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {feature.previewMetric || "Click for details"}
                                            </span>
                                            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                <span>View Details</span>
                                                <ArrowRight size={13} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* 5. HOW IT WORKS: RESTAURANT OWNER CHEF PHOTO + 4 STEPS                     */}
            {/* ========================================================================= */}
            <section id="how-it-works" className="py-10 sm:py-14 bg-[#F4F9F6] border-t border-emerald-100/40">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        
                        {/* Left: Chef / Restaurant Owner Photograph with organic warm background and "Grow Your Business" badge */}
                        <div className="lg:col-span-5 xl:col-span-4 relative flex items-center justify-center lg:justify-start">
                            
                            <div className="relative w-64 sm:w-72 lg:w-80 h-72 sm:h-80 lg:h-92">
                                
                                {/* Organic soft peach/apricot decorative blob behind chef matching reference */}
                                <div className="absolute inset-0 bg-[#FBE8DC] rounded-[52%_48%_60%_40%/45%_55%_45%_55%] transform -rotate-3 scale-95 opacity-90 transition-transform" />

                                {/* Chef / Restaurant Owner AI Image with matching organic curved frame */}
                                <div className="relative w-full h-full rounded-[48%_52%_55%_45%/50%_48%_52%_50%] overflow-hidden shadow-xl border-4 border-white">
                                    <img 
                                        src="/restaurant_owner_chef.jpg" 
                                        alt="Smiling Restaurant Owner and Executive Chef"
                                        className="w-full h-full object-cover object-top scale-105"
                                        onError={(e) => {
                                            e.target.src = "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=600&auto=format&fit=crop";
                                        }}
                                    />
                                </div>

                                {/* "Grow Your Business" Handwritten Style Badge with Curved Green Arrow */}
                                <div className="absolute -top-3 -right-6 sm:-right-8 pointer-events-none select-none text-left">
                                    <div className="text-[15px] sm:text-[17px] font-bold text-[#2D6A4F] tracking-tight leading-tight font-sans">
                                        Grow Your
                                    </div>
                                    <div className="text-[17px] sm:text-[19px] font-extrabold text-[#2D6A4F] font-sans -mt-0.5">
                                        Business
                                    </div>
                                    {/* Hand-drawn curved arrow pointing down toward the chef */}
                                    <div className="mt-1 pl-2">
                                        <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="transform -rotate-12">
                                            <path 
                                                d="M28 6 C 24 16, 14 18, 12 30" 
                                                stroke="#2D6A4F" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                                fill="none"
                                            />
                                            <path 
                                                d="M8 24 L 12 31 L 18 27" 
                                                stroke="#2D6A4F" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                fill="none"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {/* Floating green leaves accent at bottom right */}
                                <div className="absolute -bottom-2 -right-2 text-[#40916C] pointer-events-none drop-shadow-sm">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                                    </svg>
                                </div>

                            </div>

                        </div>

                        {/* Right: Section Heading + 4 Horizontal Steps with Connecting Arrows */}
                        <div className="lg:col-span-7 xl:col-span-8 text-left space-y-5">
                            
                            {/* Heading Area matching reference */}
                            <div className="space-y-1.5">
                                <span className="text-xs sm:text-sm font-bold text-[#FF5A1F] tracking-wide inline-block">
                                    Simple Process
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#112233] tracking-tight leading-tight">
                                    How It Works?
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                                    Get started in minutes and start managing your restaurant like a pro.
                                </p>
                            </div>

                            {/* 4 Steps Row with standalone circular icons & connecting arrows */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-3">
                                {HOW_IT_WORKS_STEPS.map((step, idx) => {
                                    const IconComponent = step.icon;
                                    const isLast = idx === HOW_IT_WORKS_STEPS.length - 1;

                                    return (
                                        <div key={idx} className="relative flex flex-col items-start group">
                                            
                                            {/* Circular Icon with connecting arrow */}
                                            <div className="w-full flex items-center justify-between mb-3.5">
                                                {/* Standalone Circular Icon with warm pale peach background & crisp white border */}
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] rounded-full bg-[#FFEDE3] border-[3px] border-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                                                    <IconComponent 
                                                        className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF5A1F]" 
                                                        strokeWidth={2} 
                                                    />
                                                </div>

                                                {/* Right-pointing arrow connecting to next step */}
                                                {!isLast && (
                                                    <div className="hidden md:flex flex-1 items-center justify-center px-1 text-slate-400">
                                                        <svg 
                                                            className="w-4 h-4 sm:w-5 sm:h-5" 
                                                            fill="none" 
                                                            viewBox="0 0 24 24" 
                                                            stroke="currentColor" 
                                                            strokeWidth={1.75}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step Title & Description matching reference font weight & sizing */}
                                            <div className="text-left space-y-1">
                                                <h3 className="text-sm sm:text-[15px] font-extrabold text-[#112233] tracking-tight leading-snug">
                                                    {step.title}
                                                </h3>
                                                <p className="text-[11px] sm:text-xs text-slate-500 font-normal leading-relaxed">
                                                    {step.desc}
                                                </p>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>

                        </div>

                    </div>

                </div>
            </section>

            {/* ========================================================================= */}
            {/* 6. TESTIMONIALS: "What Restaurant Owners Say" (Dynamic Database-Connected) */}
            {/* ========================================================================= */}
            <section className="py-8 sm:py-12 bg-[#FFFDF9]">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12">
                    
                    {/* Centered Heading Area */}
                    <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5 relative">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                            What Restaurant Owners Say
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            Real stories from real restaurant owners who trust FoodNest.
                        </p>
                        {testimonials.length > 3 && (
                            <div className="pt-1">
                                <button 
                                    onClick={() => setShowAllTestimonialsModal(true)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A1F] hover:text-[#E04812] group cursor-pointer"
                                >
                                    <span>View All Testimonials ({testimonials.length})</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {testimonialsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((sk) => (
                                <div key={sk} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs animate-pulse space-y-4">
                                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                                    <div className="h-3 bg-slate-200 rounded w-full" />
                                    <div className="h-3 bg-slate-200 rounded w-4/6" />
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200" />
                                            <div className="space-y-1.5">
                                                <div className="h-3 bg-slate-200 rounded w-20" />
                                                <div className="h-2.5 bg-slate-200 rounded w-28" />
                                            </div>
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : testimonials.length === 0 ? (
                        /* Clean Empty State */
                        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/80 max-w-lg mx-auto shadow-xs space-y-3">
                            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF5A1F] flex items-center justify-center mx-auto">
                                <Star size={24} fill="#FF5A1F" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">No Published Reviews Yet</h3>
                            <p className="text-xs text-slate-500">
                                Restaurant owners can share their experience from their authenticated partner dashboard.
                            </p>
                            <Link 
                                to="/login" 
                                className="inline-block px-4 py-2 text-xs font-bold bg-[#FF5A1F] text-white rounded-xl shadow-xs hover:bg-[#E04812] transition-colors"
                            >
                                Owner Login &rarr;
                            </Link>
                        </div>
                    ) : (
                        /* 3 Horizontal Cards in one row on desktop starting from left side */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {testimonials.slice(0, 3).map((item) => {
                                const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
                                let origin = '';
                                try { origin = new URL(apiBase).origin; } catch (_) {}
                                const avatarSrc = item.avatar 
                                    ? (item.avatar.startsWith('http') || item.avatar.startsWith('data:') ? item.avatar : `${origin}${item.avatar.startsWith('/') ? '' : '/'}${item.avatar}`)
                                    : null;

                                return (
                                    <div 
                                        key={item._id}
                                        className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-4"
                                    >
                                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                                            "{item.quote}"
                                        </p>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {avatarSrc ? (
                                                    <img 
                                                        src={avatarSrc} 
                                                        alt={item.ownerName}
                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-bold text-sm border border-orange-200">
                                                        {item.ownerName ? item.ownerName.trim().charAt(0).toUpperCase() : 'O'}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                                                        {item.ownerName}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 font-medium">
                                                        {item.restaurantName}{item.location ? `, ${item.location}` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Star Rating (#FF5A0A) */}
                                            <div className="flex text-[#FF5A0A]">
                                                {[...Array(item.rating || 5)].map((_, i) => (
                                                    <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </section>

            {/* View All Testimonials Modal */}
            {showAllTestimonialsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">
                                    All Restaurant Owner Stories
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Verified testimonials from FoodNest platform partner restaurants
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAllTestimonialsModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            {testimonials.map((item) => {
                                const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
                                let origin = '';
                                try { origin = new URL(apiBase).origin; } catch (_) {}
                                const avatarSrc = item.avatar 
                                    ? (item.avatar.startsWith('http') || item.avatar.startsWith('data:') ? item.avatar : `${origin}${item.avatar.startsWith('/') ? '' : '/'}${item.avatar}`)
                                    : null;

                                return (
                                    <div 
                                        key={item._id}
                                        className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 text-left flex flex-col justify-between space-y-3"
                                    >
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                                            "{item.quote}"
                                        </p>

                                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {avatarSrc ? (
                                                    <img 
                                                        src={avatarSrc} 
                                                        alt={item.ownerName}
                                                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-bold text-xs border border-orange-200">
                                                        {item.ownerName ? item.ownerName.trim().charAt(0).toUpperCase() : 'O'}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-900">
                                                        {item.ownerName}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500">
                                                        {item.restaurantName}, {item.location}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex text-[#FF5A0A]">
                                                {[...Array(item.rating || 5)].map((_, i) => (
                                                    <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}


            {/* ========================================================================= */}
            {/* 7. PRICING SECTION: INTEGRATED FROM SYSTEM DATABASE                       */}
            {/* ========================================================================= */}
            <section id="pricing" className="pt-8 pb-3 sm:pt-12 sm:pb-4 bg-white border-t border-orange-100/70">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col items-center">
                    
                    <div className="text-center max-w-2xl mb-8 space-y-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full inline-block">
                            Transparent Pricing
                        </span>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                            Plans Designed for Every Scale
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">
                            Choose the plan that fits your kitchen. Upgrade or cancel anytime.
                        </p>

                        {/* Monthly / Yearly Toggle */}
                        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold mt-1">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${!isYearly ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${isYearly ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                            >
                                Yearly <span className="text-[#FF5A1F] text-[10px] font-extrabold">(Save 20%)</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mx-auto">
                        {plans.map((plan, idx) => {
                            const isPro = plan.name.toLowerCase().includes('pro');
                            const price = isYearly ? (plan.yearlyPrice || Math.round(plan.monthlyPrice * 0.8)) : plan.monthlyPrice;

                            return (
                                <div
                                    key={plan._id || idx}
                                    className={`rounded-2xl p-6 sm:p-7 text-left flex flex-col justify-between transition-all ${
                                        isPro 
                                            ? 'bg-gradient-to-b from-orange-50/50 to-white border-2 border-[#FF5A1F] shadow-xl relative' 
                                            : 'bg-white border border-slate-200 shadow-xs hover:shadow-md'
                                    }`}
                                >
                                    {isPro && (
                                        <div className="absolute -top-3.5 left-8 bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider shadow-sm">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                {plan.name === 'Basic' ? 'Single Outlet' : plan.name === 'Pro' ? 'Growing Restaurants' : 'Multi-branch Enterprise'}
                                            </p>
                                        </div>

                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl sm:text-4xl font-black text-slate-900">₹{price}</span>
                                            <span className="text-xs text-slate-500 font-bold">/month</span>
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                            {(plan.features || []).map((feat, fIdx) => (
                                                <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                                    <Check size={14} className="text-[#FF5A1F] shrink-0 mt-0.5" strokeWidth={2.5} />
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Link
                                            to={`/register?plan=${encodeURIComponent(plan.name)}`}
                                            className={`w-full py-2.5 rounded-xl font-bold text-xs text-center block transition-all shadow-xs ${
                                                isPro
                                                    ? 'bg-[#FF5A1F] hover:bg-[#E04812] text-white shadow-orange-500/25'
                                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                            }`}
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </section>


            {/* ========================================================================= */}
            {/* 8. FINAL CTA BANNER: WIDE PALE ORANGE BANNER WITH BIRYANI DISH ON LEFT    */}
            {/* ========================================================================= */}
            <section id="contact" className="pt-2 pb-8 sm:pt-3 sm:pb-12 bg-white">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12">
                    
                    <div className="relative rounded-3xl bg-gradient-to-r from-[#FFF0E8] via-[#FFEADB] to-[#FFF3EB] border border-orange-200/80 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden">
                        
                        {/* Food Photography Plate on Left */}
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl shrink-0">
                                <img 
                                    src="/assets/images/dish-biryani-hero.jpg" 
                                    alt="Biryani Special Platter"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop";
                                    }}
                                />
                            </div>

                            {/* Headline & supporting text */}
                            <div className="text-left">
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                    Ready to Take Your Restaurant to the Next Level?
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                                    Join thousands of restaurant owners who trust FoodNest.
                                </p>
                            </div>
                        </div>

                        {/* Orange Get Started Free Button */}
                        <div className="shrink-0 w-full sm:w-auto">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#FF5A1F] hover:bg-[#E04812] text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all text-sm group"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </div>

                </div>
            </section>


            {/* ========================================================================= */}
            {/* 9. FOOTER: DARK NAVY #0D1527, BRAND, QUICK LINKS, SUPPORT, SOCIAL, APPS   */}
            {/* ========================================================================= */}
            <footer className="bg-[#0D1527] text-slate-400 pt-14 pb-8 border-t border-slate-800">
                <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-left">
                        
                        {/* Brand Column */}
                        <div className="space-y-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center">
                                    <UtensilsCrossed size={20} />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xl font-black text-white tracking-tight leading-none">
                                        Food<span className="text-[#FF5A1F]">Nest</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        Restaurant Management System
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                                All-in-one cloud restaurant operating system for POS billing, kitchen display, table QR ordering and inventory control.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">
                                Quick Links
                            </h4>
                            <ul className="space-y-2 text-xs font-medium">
                                <li>
                                    <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer">
                                        Home
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
                                        Features
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors cursor-pointer">
                                        Pricing
                                    </button>
                                </li>
                                <li>
                                    <Link to="/about" className="hover:text-white transition-colors">
                                        About Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">
                                Support
                            </h4>
                            <ul className="space-y-2 text-xs font-medium">
                                <li>
                                    <Link to="/contact" className="hover:text-white transition-colors">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer text-left">
                                        How It Works
                                    </button>
                                </li>
                                <li>
                                    <Link to="/contact" className="hover:text-white transition-colors">
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Follow Us & App Badges matching reference */}
                        <div className="space-y-4">

                            {/* App Download Badges matching reference */}
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                                    Download Our App
                                </span>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                                        <div className="text-white">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-1.61-.43 2.015 2.015 0 0 1-.5-1.42V3.664c0-.53.18-1.04.5-1.42.41-.49 1.01-.64 1.609-.43zm11.233 11.233l2.42 2.42-12.75 7.36 10.33-9.78zm0-2.094L4.512 1.173l12.75 7.36-2.42 2.42zm1.484 1.047l3.66-2.11c.71-.41 1.01-1.25.7-1.99-.21-.49-.69-.82-1.23-.82-.24 0-.49.07-.7.19l-4.14 2.39 1.71 2.34zm0 0l-1.71 2.34 4.14 2.39c.21.12.46.19.7.19.54 0 1.02-.33 1.23-.82.31-.74.01-1.58-.7-1.99l-3.66-2.11z"/></svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[8px] text-slate-400 uppercase leading-none">Get it on</p>
                                            <p className="text-[11px] font-bold text-white leading-tight">Google Play</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                                        <div className="text-white">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.73-0.93 2.76 1.01.08 2.02-.51 2.64-1.26z"/></svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[8px] text-slate-400 uppercase leading-none">Download on the</p>
                                            <p className="text-[11px] font-bold text-white leading-tight">App Store</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Row: Copyright + Better Food. Bigger Dreams. Tagline */}
                    <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
                        <p>© 2026 FoodNest. All rights reserved.</p>
                        <p className="text-slate-400 font-semibold tracking-wide">
                            Better Food. Bigger Dreams.
                        </p>
                    </div>

                </div>
            </footer>


            {/* ========================================================================= */}
            {/* WATCH DEMO INTERACTIVE MODAL (Zero broken interactions)                   */}
            {/* ========================================================================= */}
            {showDemoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-left border border-slate-200">
                        <button
                            onClick={() => setShowDemoModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">FoodNest Platform Walkthrough</h3>
                                <p className="text-xs text-slate-500 font-medium">Live POS, Orders &amp; Inventory Management in Action</p>
                            </div>
                        </div>

                        {/* Video Player Fallback Container */}
                        <div className="aspect-video w-full rounded-xl bg-slate-900 overflow-hidden relative shadow-inner">
                            <video 
                                controls 
                                autoPlay 
                                className="w-full h-full object-cover"
                                poster="/assets/images/dish-biryani-hero.jpg"
                            >
                                <source src="/cinematic-food-demo.mp4" type="video/mp4" />
                                <source src="/demo-video.mp4" type="video/mp4" />
                                Your browser does not support video playback.
                            </video>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Ready to set up your restaurant in under 10 minutes?
                            </span>
                            <Link
                                to="/register"
                                className="px-5 py-2.5 bg-[#FF5A1F] text-white font-bold rounded-xl text-xs hover:bg-[#E04812] transition-colors"
                            >
                                Start Free Trial →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* INTERACTIVE FEATURE DETAILS MODAL                                         */}
            {/* ========================================================================= */}
            {activeFeatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-left border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setActiveFeatureModal(null)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
                                {(() => {
                                    const IconComp = activeFeatureModal.icon;
                                    return <IconComp size={28} strokeWidth={2.2} />;
                                })()}
                            </div>
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF5A1F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 inline-block mb-1">
                                    {activeFeatureModal.badge || "Core System Feature"}
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {activeFeatureModal.title}
                                </h3>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                            {activeFeatureModal.fullDescription || activeFeatureModal.description}
                        </p>

                        {/* Capabilities List */}
                        {activeFeatureModal.capabilities && (
                            <div className="space-y-3 mb-6 bg-[#FFFDF9] p-4 sm:p-5 rounded-2xl border border-orange-100/70">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                    Key Capabilities Included:
                                </h4>
                                <div className="space-y-2">
                                    {activeFeatureModal.capabilities.map((cap, cIdx) => (
                                        <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{cap}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer action buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <Link
                                to={activeFeatureModal.link || "/pos/billing"}
                                className="w-full sm:flex-1 py-3 px-5 bg-[#FF5A1F] hover:bg-[#E04F08] text-white text-center font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Open Live Module Page</span>
                                <ArrowRight size={15} />
                            </Link>
                            <Link
                                to="/register"
                                className="w-full sm:w-auto py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white text-center font-bold text-xs sm:text-sm rounded-xl transition-all"
                            >
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Home;
