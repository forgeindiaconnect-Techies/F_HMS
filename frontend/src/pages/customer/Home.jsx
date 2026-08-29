import { useState, useEffect } from 'react';
import { 
    Utensils, ArrowRight, Star, ChevronDown, CheckCircle2, 
    Monitor, QrCode, Boxes, Users, LineChart, Store, Calculator, CalendarDays, 
    PlayCircle, ChefHat, Clock, Globe, Plus, Minus, X, Sparkles, Zap, Shield, Flame,
    ShoppingBag, ShoppingCart, ChevronRight, ChevronLeft, Smartphone, Receipt, Menu as MenuIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const Home = () => {
    // Dummy data fallback for instant zero-delay rendering
    const dummyRestaurants = [
        { _id: 'demo1', name: 'Pizza Palace', rating: 4.8, time: '20-25', tags: 'Italian, Fast Food', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo2', name: 'Burger Hub', rating: 4.5, time: '15-20', tags: 'American, Beverages', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo3', name: 'South Indian Cafe', rating: 4.9, time: '10-15', tags: 'South Indian, Breakfast', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo4', name: 'Chinese Bowl', rating: 4.2, time: '25-30', tags: 'Chinese, Asian', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo5', name: 'BBQ Nation', rating: 4.7, time: '30-40', tags: 'BBQ, Non-Veg', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo6', name: 'Juice Corner', rating: 4.6, time: '5-10', tags: 'Beverages, Healthy', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
    ];

    const defaultPlans = [
        { _id: 'p1', name: 'Basic', monthlyPrice: 1, yearlyPrice: 390, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'] },
        { _id: 'p2', name: 'Pro', monthlyPrice: 2, yearlyPrice: 990, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'] },
        { _id: 'p3', name: 'Enterprise', monthlyPrice: 3, yearlyPrice: 2490, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', '24/7 Support'] }
    ];

    const [restaurants, setRestaurants] = useState(dummyRestaurants);
    const [plans, setPlans] = useState(defaultPlans);
    const [loading, setLoading] = useState(false);
    const [plansLoading, setPlansLoading] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [demoStep, setDemoStep] = useState(1);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);

    // Interactive Workflow Carousel State
    const [workflowTab, setWorkflowTab] = useState('customer'); // 'customer' | 'restaurant'
    const [customerStep, setCustomerStep] = useState(0);
    const [restaurantStep, setRestaurantStep] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get('/restaurants');
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    let realRest = res.data.filter(r => r.subscription?.status === 'Active' && r.isActive !== false);
                    let combined = [...realRest];
                    if (combined.length < 6) {
                        combined.push(...dummyRestaurants.slice(0, 6 - combined.length));
                    }
                    setRestaurants(combined);
                }
            } catch (error) {
                // Keep dummy default
            } finally {
                setLoading(false);
            }
        };

        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans');
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setPlans(res.data);
                }
            } catch (error) {
                // Keep default plans
            } finally {
                setPlansLoading(false);
            }
        };

        fetchRestaurants();
        fetchPlans();
        document.documentElement.classList.remove('dark');
    }, []);

    // Auto-advance workflow carousel cards every 4.5 seconds
    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(() => {
            if (workflowTab === 'customer') {
                setCustomerStep(prev => (prev + 1) % 4);
            } else {
                setRestaurantStep(prev => (prev + 1) % 4);
            }
        }, 4500);
        return () => clearInterval(timer);
    }, [workflowTab, isAutoPlaying]);

    const coreFeatures = [
        { name: 'Multi Branch', icon: <Store size={24} />, color: 'text-[#FF2D55]' },
        { name: 'POS Billing', icon: <Calculator size={24} />, color: 'text-[#FF6A00]' },
        { name: 'QR Ordering', icon: <QrCode size={24} />, color: 'text-amber-400' },
        { name: 'Inventory', icon: <Boxes size={24} />, color: 'text-emerald-400' },
        { name: 'Reservations', icon: <CalendarDays size={24} />, color: 'text-cyan-400' },
        { name: 'Analytics', icon: <LineChart size={24} />, color: 'text-indigo-400' },
        { name: 'Kitchen Display', icon: <Monitor size={24} />, color: 'text-purple-400' },
        { name: 'Staff App', icon: <Users size={24} />, color: 'text-rose-400' }
    ];

    return (
        <div className="w-full min-h-screen bg-white text-slate-900 font-sans selection:bg-[#FF2D55] selection:text-white relative overflow-x-hidden transition-colors duration-300">
            
            {/* Sticky Glassmorphism Navbar - Light Theme with Mobile Responsiveness */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 py-3 sm:py-4 px-4 sm:px-8 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF2D55]/25 text-white group-hover:scale-105 transition-transform shrink-0">
                            <Utensils size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-[#FF2D55] transition-colors">
                            Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00]">Hub</span>
                        </h1>
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-8 font-bold text-sm text-slate-700 items-center">
                        <div className="relative group py-2">
                            <a href="#features" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all cursor-pointer">
                                Features <ChevronDown size={14} className="group-hover:rotate-180 transition-transform text-[#FF2D55]" />
                            </a>

                            <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <Link to="/features/management" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#FF2D55]/10 text-slate-900 font-bold transition-all group/item">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">📊</span>
                                        <span>Management</span>
                                    </div>
                                    <ArrowRight size={16} className="text-[#FF2D55] group-hover/item:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/features/details?module=orders" className="flex items-center justify-between p-3 mt-1 rounded-xl bg-slate-50 hover:bg-[#FF6A00]/10 text-slate-900 font-bold transition-all group/item-kds">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">🍳</span>
                                        <span>Kitchen Workflow</span>
                                    </div>
                                    <ArrowRight size={16} className="text-[#FF6A00] group-hover/item-kds:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/features/details?module=intelligence" className="flex items-center justify-between p-3 mt-1 rounded-xl bg-slate-50 hover:bg-emerald-500/10 text-slate-900 font-bold transition-all group/item-pos">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">💳</span>
                                        <span>POS Billing</span>
                                    </div>
                                    <ArrowRight size={16} className="text-emerald-600 group-hover/item-pos:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        <a href="#workflow" className="text-slate-700 hover:text-slate-950 transition-colors">Workflow</a>
                        <a href="#pricing" className="text-slate-700 hover:text-slate-950 transition-colors">Pricing</a>
                        <Link to="/contact" className="text-slate-700 hover:text-slate-950 transition-colors">Contact</Link>
                    </nav>

                    {/* Right CTA Actions & Mobile Toggle */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold shrink-0">
                        <Link 
                            to="/menu" 
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        >
                            <ShoppingBag size={16} className="sm:w-4 sm:h-4" />
                            <span>Order Now</span>
                        </Link>

                        <Link to="/customer/login" className="hidden xs:inline-block text-slate-700 hover:text-slate-950 transition-colors px-2.5 py-1.5 sm:px-3 rounded-xl hover:bg-slate-100">
                            Log In
                        </Link>

                        <Link 
                            to="/register" 
                            className="hidden lg:flex bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-[#FF2D55]/25 hover:scale-[1.03] active:scale-95 transition-all focus:outline-none"
                        >
                            Get Started Free
                        </Link>

                        {/* Mobile Hamburger Menu Toggle Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation Menu"
                            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 bg-slate-100 dark:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Slide-Down Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-3 pt-3 border-t border-slate-200/80 space-y-2 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
                        {/* Features Accordion Dropdown */}
                        <div className="space-y-1">
                            <button
                                onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-800 font-extrabold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span>✨</span> Features & Modules
                                </span>
                                <ChevronDown size={16} className={`text-[#FF2D55] transition-transform duration-200 ${mobileFeaturesOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {mobileFeaturesOpen && (
                                <div className="pl-4 pr-2 py-2 space-y-1.5 border-l-2 border-[#FF2D55]/30 ml-3 bg-slate-50/80 rounded-r-xl">
                                    <Link 
                                        to="/features/management" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-[#FF2D55]/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">📊 Management Suite</span>
                                        <ChevronRight size={14} className="text-[#FF2D55]" />
                                    </Link>
                                    <Link 
                                        to="/features/details?module=orders" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-[#FF6A00]/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">🍳 Kitchen Workflow (KDS)</span>
                                        <ChevronRight size={14} className="text-[#FF6A00]" />
                                    </Link>
                                    <Link 
                                        to="/features/details?module=intelligence" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-emerald-500/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">💳 POS Billing & Intelligence</span>
                                        <ChevronRight size={14} className="text-emerald-500" />
                                    </Link>
                                    <Link 
                                        to="/features/details?module=orders&feature=1" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-rose-500/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">📱 Smart QR Digital Menu</span>
                                        <ChevronRight size={14} className="text-rose-500" />
                                    </Link>
                                    <Link 
                                        to="/features/details?module=staff" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-blue-500/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">👥 Staff & Account Delegation</span>
                                        <ChevronRight size={14} className="text-blue-500" />
                                    </Link>
                                    <Link 
                                        to="/features/details?module=manager" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-amber-500/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">🏬 Branch Manager Dashboard</span>
                                        <ChevronRight size={14} className="text-amber-500" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        <a 
                            href="#workflow" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                        >
                            Workflow
                        </a>
                        <a 
                            href="#pricing" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                        >
                            Pricing
                        </a>
                        <Link 
                            to="/contact" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                        >
                            Contact
                        </Link>
                        
                        <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
                            <Link 
                                to="/customer/login" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-800 font-extrabold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Log In
                            </Link>
                            <Link 
                                to="/staff/register" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] text-white font-black text-sm shadow-md transition-colors"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                )}
            </header>


            {/* Hero Section */}
            <section id="demo" className="min-h-[92vh] sm:min-h-screen flex flex-col justify-center items-center text-center px-4 py-20 sm:py-28 relative z-10 overflow-hidden bg-slate-950">
                
                {/* Ambient Background Gradient & Glow Effects */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2D55]/15 rounded-full blur-[140px]" />
                    <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#FF6A00]/15 rounded-full blur-[120px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-[#090d20] to-[#050816]" />
                </div>



                <div className="flex flex-col items-center justify-center my-auto relative z-10 max-w-4xl mx-auto pt-4">
                    {/* Small Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#050816]/70 border border-white/[0.15] text-[#FF2D55] font-extrabold text-xs sm:text-sm mb-6 shadow-2xl backdrop-blur-md drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                        <Star size={14} className="fill-[#FF2D55] text-[#FF2D55]" />
                        <span>Rated #1 Restaurant POS Platform 2026</span>
                    </div>

                    {/* Large Heading */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.12] mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                        The Ultimate <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] via-[#FF551C] to-[#FF6A00]">
                            Operating System
                        </span> <br className="hidden sm:inline" />
                        for Restaurants
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base sm:text-lg text-slate-200 font-semibold max-w-2xl leading-relaxed mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                        Streamline your restaurant operations, increase revenue, manage inventory, and delight customers with our all-in-one Restaurant POS platform.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none">
                        <Link 
                            to="/staff/register" 
                            className="w-full sm:w-auto bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-[#FF2D55]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
                        >
                            Subscribe Now 
                            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Main Content Body - Pure White Background */}
            <main className="w-full bg-white py-16 space-y-24 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-24">
                    
                    {/* Top Feature Cards Bar */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-start gap-4 text-left hover:-translate-y-1 hover:border-[#FF2D55]/40 transition-all duration-300 group cursor-pointer">
                            <div className="p-3 bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                <Calculator size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">POS Management</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">Manage orders, billing, and tables effortlessly.</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-start gap-4 text-left hover:-translate-y-1 hover:border-[#FF6A00]/40 transition-all duration-300 group cursor-pointer">
                            <div className="p-3 bg-[#FF6A00]/10 border border-[#FF6A00]/20 text-[#FF6A00] rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                <Boxes size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">Smart Inventory</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">Track ingredients in real-time and reduce waste.</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-start gap-4 text-left hover:-translate-y-1 hover:border-[#FF2D55]/40 transition-all duration-300 group cursor-pointer">
                            <div className="p-3 bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                <LineChart size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">Boost Revenue</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">Increase sales with analytics and customer insights.</p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-[20px] shadow-sm flex items-start gap-4 text-left hover:-translate-y-1 hover:border-[#FF6A00]/40 transition-all duration-300 group cursor-pointer">
                            <div className="p-3 bg-[#FF6A00]/10 border border-[#FF6A00]/20 text-[#FF6A00] rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                <QrCode size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">Dine-In QR Ordering</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">Let guests order and pay directly from their phone.</p>
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Platform Summary Grid - Pure Light Theme */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 sm:p-12 rounded-[24px] border border-slate-200 shadow-sm">
                        <div className="space-y-6 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] rounded-full font-extrabold text-xs uppercase tracking-wider">
                                <Shield size={14} /> Enterprise SaaS Architecture
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                One Unified Operating Ecosystem
                            </h2>
                            <p className="text-slate-700 font-medium text-lg leading-relaxed">
                                RestaurantHub functions as a centralized, high-performance SaaS infrastructure engineered to unify front-of-house hospitality and back-of-house kitchen workflows. 
                            </p>
                            <p className="text-slate-600 font-medium text-sm leading-relaxed">
                                By replacing fragmented legacy terminals with a real-time cloud database, our platform synchronizes order routing, stock replenishment cycles, table arrangements, and revenue analytics across all branches simultaneously.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                                <span className="text-4xl font-black text-[#FF2D55]">99.9%</span>
                                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Real-time Uptime</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                                <span className="text-4xl font-black text-[#FF6A00]">30%</span>
                                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Faster Kitchen Prep</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                                <span className="text-4xl font-black text-amber-500">Zero</span>
                                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Proprietary Lock-ins</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                                <span className="text-4xl font-black text-emerald-600">2x</span>
                                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Order Precision</span>
                            </div>
                        </div>
                    </section>

                {/* Full Platform Capabilities Grid */}
                <section id="features" className="space-y-12">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] font-bold text-xs uppercase tracking-wider">
                            <Flame size={14} /> Full Platform Capability
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Everything You Need in One Unified Stack</h2>
                        <p className="text-slate-600 font-medium text-sm sm:text-base">No third-party add-ons required. Designed to eliminate operational friction.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {coreFeatures.map((feature, idx) => (
                            <div 
                                key={idx} 
                                className="bg-white p-5 rounded-[20px] border border-slate-200 hover:border-[#FF2D55]/40 shadow-sm transition-all flex flex-col items-center gap-3 text-center group cursor-pointer"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-950 transition-colors">{feature.name}</span>
                            </div>
                        ))}
                    </div>
                </section>



                {/* Complete End-to-End Workflow Section (Customer Side & Restaurant Side) */}
                <section id="workflow" className="rounded-[24px] p-6 sm:p-12 bg-white border border-slate-200 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF2D55]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF6A00]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="text-center mb-10 relative z-10 max-w-3xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] font-black text-xs uppercase tracking-wider">
                            <Sparkles size={14} /> Unified Platform Experience
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                            Interactive Platform Workflows
                        </h2>
                        <p className="text-slate-600 font-medium text-base sm:text-lg">
                            Experience seamless operations from both the customer ordering perspective and the restaurant management side.
                        </p>
                    </div>

                    {/* Dual Mode Tab Selector */}
                    <div className="flex justify-center mb-10 relative z-10">
                        <div className="inline-flex p-1.5 bg-slate-100 border border-slate-200 rounded-2xl gap-2 shadow-inner">
                            <button
                                onClick={() => { setWorkflowTab('customer'); setCustomerStep(0); }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                                    workflowTab === 'customer' 
                                        ? 'bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] text-white shadow-lg shadow-[#FF2D55]/25 scale-[1.02]' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                <Smartphone size={18} />
                                <span>📱 Customer Ordering Experience</span>
                            </button>
                            <button
                                onClick={() => { setWorkflowTab('restaurant'); setRestaurantStep(0); }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                                    workflowTab === 'restaurant' 
                                        ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/25 scale-[1.02]' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                <ChefHat size={18} />
                                <span>👨‍🍳 Restaurant Partner & Staff Ops</span>
                            </button>
                        </div>
                    </div>

                    {/* Carousel Content Container */}
                    {workflowTab === 'customer' ? (
                        /* Customer Workflow Carousel */
                        <div className="relative z-10 space-y-8" onMouseEnter={() => setIsAutoPlaying(false)} onMouseLeave={() => setIsAutoPlaying(true)}>
                            {/* Step Indicator Pills - 5 Step Flow (Online App & Table QR) */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-w-5xl mx-auto">
                                {[
                                    { step: 0, title: '01. Discover & Menu', icon: <Store size={15} /> },
                                    { step: 1, title: '02. Cart & Custom Add-ons', icon: <ShoppingBag size={15} /> },
                                    { step: 2, title: '03. Checkout & UPI Pay', icon: <Receipt size={15} /> },
                                    { step: 3, title: '04. Live Cook & Delivery Track', icon: <Clock size={15} /> },
                                    { step: 4, title: '05. E-Receipt & Reorder', icon: <CheckCircle2 size={15} /> },
                                ].map((item) => (
                                    <button
                                        key={item.step}
                                        onClick={() => setCustomerStep(item.step)}
                                        className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                            customerStep === item.step
                                                ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-md shadow-[#FF2D55]/30 scale-[1.02]'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="truncate">{item.title}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Carousel Card Container */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-50 border border-slate-200 rounded-[20px] p-6 sm:p-10 shadow-lg">
                                {/* Left Explanation Card */}
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] font-black text-xs rounded-full">
                                        STEP 0{customerStep + 1} OF 05 • CUSTOMER ORDERING WORKFLOW
                                    </div>
                                    
                                    {customerStep === 0 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">1. Discover Restaurants & Explore Digital Menu</h3>
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                                Customers can order from home via our Web Portal (<code className="text-[#FF2D55] bg-red-50 px-1.5 py-0.5 rounded font-mono text-xs">/explore</code> or <code className="text-[#FF2D55] bg-red-50 px-1.5 py-0.5 rounded font-mono text-xs">/menu</code>) for delivery/takeaway, or scan the Table QR code inside a restaurant.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Online Food Delivery & Takeaway Web Portal</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Table QR Ordering with zero app installation</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Filter dishes by Veg, Non-Veg, Ratings & Chef Specials</li>
                                            </ul>
                                        </div>
                                    )}

                                    {customerStep === 1 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">2. Customize Dishes & Build Table Basket</h3>
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                                Select items from the restaurant menu, customize spice levels, choose extra toppings/addons, and add special instructions for the chef.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Interactive dish options & allergen badges</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Real-time subtotal & discount calculation</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Add custom notes for the kitchen staff</li>
                                            </ul>
                                        </div>
                                    )}

                                    {customerStep === 2 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">3. Direct Checkout & Instant UPI QR Payment</h3>
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                                Choose Delivery Address, Pickup, or Table Dine-In. Pay instantly using the interactive UPI QR Scanner code or Cash on Delivery.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Multiple modes: Delivery, Pickup & Table Dine-In</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> UPI QR Scanner code & instant mock payment flow</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Instant order token generation</li>
                                            </ul>
                                        </div>
                                    )}

                                    {customerStep === 3 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">4. Live Order Progress & Kitchen KDS Tracking</h3>
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                                Customers monitor real-time order status live: <b className="text-slate-900">Order Confirmed ➔ Cooking ➔ Ready ➔ Delivered</b> with live preparation timers.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Real-time status sync with Kitchen KDS screen</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Live estimated cook countdown (~ 8 mins)</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Live Delivery Driver status for home orders</li>
                                            </ul>
                                        </div>
                                    )}

                                    {customerStep === 4 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">5. Order History, E-Receipts & 1-Click Reorder</h3>
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                                                Access full order history under Customer Profile (<code className="text-[#FF2D55] bg-red-50 px-1.5 py-0.5 rounded font-mono text-xs">/profile/orders</code>), download official tax invoice PDFs, and reorder favorite meals in 1 click!
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-700">
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Customer Order History & Tax Invoices</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> 1-Click Fast Reorder for frequent dishes</li>
                                                <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={16} /> Rate dishes & leave feedback for the chef</li>
                                            </ul>
                                        </div>
                                    )}

                                    {/* Carousel Navigation Controls */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => setCustomerStep(prev => (prev === 0 ? 4 : prev - 1))}
                                            className="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-sm cursor-pointer"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            {[0, 1, 2, 3, 4].map(dot => (
                                                <button
                                                    key={dot}
                                                    onClick={() => setCustomerStep(dot)}
                                                    className={`h-2.5 rounded-full transition-all cursor-pointer ${customerStep === dot ? 'w-8 bg-[#FF2D55]' : 'w-2.5 bg-slate-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCustomerStep(prev => (prev === 4 ? 0 : prev + 1))}
                                            className="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-sm cursor-pointer"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        <span className="text-xs font-bold text-slate-500 ml-auto">Auto-sliding (Hover to pause)</span>
                                    </div>
                                </div>

                                {/* Right Interactive Mockup Container */}
                                <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-md relative overflow-hidden">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                                            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Customer App View</span>
                                        </div>
                                        <span className="text-xs bg-red-50 text-[#FF2D55] px-2.5 py-1 rounded-full font-bold border border-red-100">Live Demo</span>
                                    </div>

                                    {customerStep === 0 && (
                                        <div className="space-y-4">
                                            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#FF2D55] rounded-xl flex items-center justify-center font-black text-white">RH</div>
                                                    <div>
                                                        <div className="font-bold text-sm">Customer Online Food Portal</div>
                                                        <div className="text-xs text-slate-400">Order Online or Scan Table QR</div>
                                                    </div>
                                                </div>
                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30">Explore Menu</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <div className="font-bold text-xs text-slate-900">🍕 Pizza Palace</div>
                                                    <div className="text-xs text-[#FF2D55] font-black mt-1">4.8 ★ • 20 mins</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <div className="font-bold text-xs text-slate-900">🍔 Burger Hub</div>
                                                    <div className="text-xs text-[#FF2D55] font-black mt-1">4.5 ★ • 15 mins</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {customerStep === 1 && (
                                        <div className="space-y-3">
                                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={18} className="text-emerald-600" />
                                                    <span className="font-bold text-xs text-emerald-900">Item Added to Online Cart</span>
                                                </div>
                                                <span className="text-xs font-black text-emerald-700">₹898</span>
                                            </div>
                                            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-slate-800">
                                                    <span>1x Truffle Pizza (Extra Cheese)</span>
                                                    <span>₹499</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-slate-800">
                                                    <span>1x Wagyu Burger (Medium Rare)</span>
                                                    <span>₹399</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm text-[#FF2D55]">
                                                    <span>Total Payable</span>
                                                    <span>₹898</span>
                                                </div>
                                            </div>
                                            <button className="w-full bg-[#FF2D55] text-white py-2.5 rounded-xl font-bold text-xs shadow-md">Proceed to Checkout</button>
                                        </div>
                                    )}

                                    {customerStep === 2 && (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs">
                                                <div>
                                                    <div className="font-bold">Select Order Type</div>
                                                    <div className="text-slate-400">Home Delivery / Pickup / Table</div>
                                                </div>
                                                <span className="text-emerald-400 font-bold">Delivery Selected</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                                                <div className="font-bold text-xs text-slate-900">Instant UPI Payment QR</div>
                                                <div className="text-[11px] text-slate-500">Scan QR Code or Click Confirm to Pay</div>
                                                <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 mt-1">
                                                    <QrCode size={40} className="text-slate-900" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {customerStep === 3 && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold text-amber-800">Chef is preparing your food!</div>
                                                    <div className="text-xs text-amber-600 mt-0.5">Estimated Prep Time: ~ 6 mins</div>
                                                </div>
                                                <span className="text-xs bg-amber-500 text-white font-black px-3 py-1 rounded-full animate-pulse">Cooking</span>
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                    <span className="font-bold text-slate-800">Order Confirmed by Restaurant</span>
                                                    <span className="ml-auto text-slate-400">10:42 AM</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                                                    <span className="font-bold text-amber-900">Station 1: Kitchen Prep Active</span>
                                                    <span className="ml-auto text-amber-700 font-bold">10:44 AM</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {customerStep === 4 && (
                                        <div className="space-y-3">
                                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                                                <div className="text-sm font-black text-emerald-900">🎉 Order Delivered & Completed!</div>
                                                <div className="text-xs text-emerald-700 font-medium">Order saved in your Customer History (/profile/orders)</div>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                                <div>
                                                    <div className="font-bold text-slate-900">Invoice #INV-2026-9912</div>
                                                    <div className="text-slate-500">Official GST PDF Receipt</div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <span className="bg-[#FF2D55] text-white font-bold px-2.5 py-1 rounded-lg text-[11px]">Reorder</span>
                                                    <span className="bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]">Download</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Restaurant Partner Workflow Carousel */
                        <div className="relative z-10 space-y-8" onMouseEnter={() => setIsAutoPlaying(false)} onMouseLeave={() => setIsAutoPlaying(true)}>
                            {/* Step Indicator Pills */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
                                {[
                                    { step: 0, title: '01. POS & QR Billing', icon: <Calculator size={16} /> },
                                    { step: 1, title: '02. KDS Kitchen Routing', icon: <ChefHat size={16} /> },
                                    { step: 2, title: '03. Auto Inventory Stock', icon: <Boxes size={16} /> },
                                    { step: 3, title: '04. Executive Analytics', icon: <LineChart size={16} /> },
                                ].map((item) => (
                                    <button
                                        key={item.step}
                                        onClick={() => setRestaurantStep(item.step)}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                                            restaurantStep === item.step
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/30'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.title}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Carousel Card Container */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-900 text-white rounded-[20px] p-6 sm:p-10 shadow-2xl">
                                {/* Left Explanation Card */}
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-[#FF6A00] font-black text-xs rounded-full">
                                        STEP 0{restaurantStep + 1} OF 04 • RESTAURANT OPERATIONS
                                    </div>

                                    {restaurantStep === 0 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-white">1. Smart Multi-Terminal POS & Billing</h3>
                                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                                Unified cashier billing console handling Dine-in table bills, Takeaway orders, and incoming table QR submissions in real-time with zero lag.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Quick split-billing, discounts & custom GST taxes</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Offline order fallback & thermal receipt printing</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Staff Role permissions for Cashiers, Waiters & Managers</li>
                                            </ul>
                                        </div>
                                    )}

                                    {restaurantStep === 1 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-white">2. Color-Coded Kitchen Display System (KDS)</h3>
                                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                                Orders instantly dispatch to paperless kitchen displays. Drinks route to the bar display, while hot meals route to the main line chef terminal.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Color timers: Green (1m) ➔ Orange (5m) ➔ Red Alert (10m)</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> One-touch bump tickets when food plating is complete</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Eliminates lost paper tickets and kitchen confusion</li>
                                            </ul>
                                        </div>
                                    )}

                                    {restaurantStep === 2 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-white">3. Automated Ingredient Inventory Deductions</h3>
                                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                                Every dish sold automatically deducts exact raw ingredient quantities (g, ml, pcs) from your stock inventory based on recipe formulas.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Automated Low-Stock notifications for suppliers</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Multi-branch central kitchen stock transfer logs</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Waste management & variance auditing</li>
                                            </ul>
                                        </div>
                                    )}

                                    {restaurantStep === 3 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <h3 className="text-2xl sm:text-3xl font-black text-white">4. Executive BI Analytics & Multi-Branch Control</h3>
                                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                                Owners and Super Admins get real-time revenue stats, profit margins, peak hour heatmaps, dish popularity metrics, and franchise control.
                                            </p>
                                            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-300">
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Real-time sales, tax reports & profit margins</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Staff attendance, waiter sales leaderboard & commission</li>
                                                <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Centralized franchise catalog & global pricing rules</li>
                                            </ul>
                                        </div>
                                    )}

                                    {/* Carousel Navigation Controls */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                                        <button
                                            onClick={() => setRestaurantStep(prev => (prev === 0 ? 3 : prev - 1))}
                                            className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors shadow-sm cursor-pointer"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            {[0, 1, 2, 3].map(dot => (
                                                <button
                                                    key={dot}
                                                    onClick={() => setRestaurantStep(dot)}
                                                    className={`h-2.5 rounded-full transition-all cursor-pointer ${restaurantStep === dot ? 'w-8 bg-[#FF6A00]' : 'w-2.5 bg-slate-700'}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setRestaurantStep(prev => (prev === 3 ? 0 : prev + 1))}
                                            className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors shadow-sm cursor-pointer"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        <span className="text-xs font-bold text-slate-400 ml-auto">Auto-sliding (Hover to pause)</span>
                                    </div>
                                </div>

                                {/* Right Interactive Mockup Container */}
                                <div className="bg-slate-800 border border-slate-700 rounded-[20px] p-6 shadow-md relative overflow-hidden">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-700 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#FF6A00] animate-ping" />
                                            <span className="font-extrabold text-xs text-white uppercase tracking-wider">Staff POS Console</span>
                                        </div>
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">Online</span>
                                    </div>

                                    {restaurantStep === 0 && (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                                                <div>
                                                    <div className="font-bold text-white">Table #04 Bill • Cashier Screen</div>
                                                    <div className="text-slate-400">2 Items • Dine-In</div>
                                                </div>
                                                <span className="text-emerald-400 font-black text-sm">₹898</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs">Print Thermal Receipt</button>
                                                <button className="bg-[#FF2D55] hover:bg-[#E0264A] text-white font-bold py-2 rounded-lg text-xs">Split Bill 50/50</button>
                                            </div>
                                        </div>
                                    )}

                                    {restaurantStep === 1 && (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-slate-900 border-l-4 border-[#FF2D55] rounded-xl flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-xs text-white">KDS Station 1 • Grill Line</div>
                                                    <div className="text-[11px] text-slate-400">Table 04: 1x Truffle Pizza</div>
                                                </div>
                                                <span className="text-xs bg-[#FF2D55]/20 text-[#FF2D55] font-bold px-2 py-1 rounded">Cooking (4m)</span>
                                            </div>
                                            <div className="p-3 bg-slate-900 border-l-4 border-[#FF6A00] rounded-xl flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-xs text-white">KDS Station 2 • Bar Display</div>
                                                    <div className="text-[11px] text-slate-400">Table 09: 2x Fresh Mojito</div>
                                                </div>
                                                <span className="text-xs bg-[#FF6A00]/20 text-[#FF6A00] font-bold px-2 py-1 rounded">New (1m)</span>
                                            </div>
                                        </div>
                                    )}

                                    {restaurantStep === 2 && (
                                        <div className="space-y-3 text-xs">
                                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center">
                                                <span>Mozzarella Cheese (Kg)</span>
                                                <span className="text-emerald-400 font-bold">14.5 Kg Remaining</span>
                                            </div>
                                            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl flex justify-between items-center text-red-200">
                                                <span>Tomato Sauce (Liters)</span>
                                                <span className="font-black text-red-400">2.1 L (Low Stock Alert!)</span>
                                            </div>
                                        </div>
                                    )}

                                    {restaurantStep === 3 && (
                                        <div className="space-y-3">
                                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs text-slate-400">Today's Total Gross Sales</div>
                                                    <div className="text-xl font-black text-emerald-400 mt-0.5">₹48,250.00</div>
                                                </div>
                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">+24.5% vs Yesterday</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-slate-300">Total Orders: <b className="text-white">142</b></div>
                                                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 text-slate-300">Avg Bill: <b className="text-white">₹340</b></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Customer Storefront Demo Section */}
                <section className="space-y-8">
                    <div className="flex flex-col items-start gap-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Restaurant Storefronts</h2>
                        <p className="text-slate-600 text-sm font-medium">Preview how your brand appears on our customer ordering web app</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF2D55]" /></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {restaurants
                                .filter((restaurant, index, self) => 
                                    index === self.findIndex((r) => r.name?.toLowerCase().trim() === restaurant.name?.toLowerCase().trim())
                                )
                                .slice(0, 6)
                                .map((restaurant, idx) => {
                                    const rawPath = (restaurant.logo && restaurant.logo !== 'undefined') 
                                        ? restaurant.logo 
                                        : (restaurant.img && restaurant.img !== 'undefined') 
                                            ? restaurant.img 
                                            : null;
                                            
                                    let imageSrc = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=500&auto=format&fit=crop";
                                    if (rawPath) {
                                        if (rawPath.startsWith('http') || rawPath.startsWith('data:')) {
                                            imageSrc = rawPath;
                                        } else {
                                            const apiOrigin = new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin;
                                            imageSrc = `${apiOrigin}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
                                        }
                                    }

                                    return (
                                        <Link 
                                            key={restaurant._id || idx} 
                                            to={`/restaurant/${restaurant._id}`}
                                            className="group cursor-pointer block hover:-translate-y-1.5 transition-transform duration-200"
                                        >
                                            <div className="relative rounded-[20px] overflow-hidden aspect-square mb-2.5 shadow-md bg-white border border-slate-200">
                                                <img 
                                                    src={imageSrc} 
                                                    alt={restaurant.name} 
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=500&auto=format&fit=crop";
                                                    }}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                                    <h3 className="text-xs font-black truncate">{restaurant.name}</h3>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                        </div>
                    )}
                </section>

                {/* Pricing Plans Section */}
                <section id="pricing" className="space-y-12">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Transparent, Predictable Pricing</h2>
                        <p className="text-slate-600 font-medium text-base sm:text-lg">Zero hidden fees, zero commission markups. Upgrade or downgrade anytime.</p>
                        
                        <div className="inline-flex items-center justify-center gap-3 p-1.5 rounded-full bg-slate-100 border border-slate-200 mt-4">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${!isYearly ? 'bg-[#FF2D55] text-white shadow-md' : 'text-slate-600 hover:text-slate-950'}`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${isYearly ? 'bg-[#FF2D55] text-white shadow-md' : 'text-slate-600 hover:text-slate-950'}`}
                            >
                                Yearly Billing
                                <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    {plansLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF2D55]" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
                            {(plans.length > 0 ? plans : [
                                { _id: 'p1', name: 'Starter', monthlyPrice: 4999, yearlyPrice: 3999, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'] },
                                { _id: 'p2', name: 'Professional', monthlyPrice: 9999, yearlyPrice: 7999, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'] },
                                { _id: 'p3', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 15999, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', '24/7 Support'] }
                            ]).map((plan, idx) => {
                                const isPopular = idx === 1;
                                const mPrice = plan.monthlyPrice || plan.price || 0;
                                const yPrice = plan.yearlyPrice || mPrice;
                                const price = isYearly ? yPrice : mPrice;
                                return (
                                    <div 
                                        key={plan._id || idx} 
                                        className={`p-8 rounded-[20px] relative flex flex-col justify-between transition-all duration-300 ${
                                            isPopular
                                                ? 'bg-gradient-to-b from-[#FF2D55]/5 to-transparent border-2 border-[#FF2D55] shadow-2xl shadow-[#FF2D55]/10 transform md:-translate-y-4'
                                                : 'bg-white border border-slate-200 shadow-md hover:border-slate-300'
                                        }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                                                Most Popular
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                            <div className="text-4xl font-black text-slate-900 mb-2">
                                                ₹{(price || 0).toLocaleString('en-IN')}
                                                <span className="text-base font-medium text-slate-500">/mo</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-6 font-semibold">
                                                {isYearly ? 'Billed annually. Includes all core updates.' : 'Billed monthly. Cancel anytime.'}
                                            </p>

                                            <Link 
                                                to={`/staff/register?plan=${encodeURIComponent(plan.name)}&billing=${isYearly ? 'yearly' : 'monthly'}`}
                                                className={`w-full py-3.5 rounded-xl font-extrabold text-sm mb-8 flex justify-center items-center transition-all ${
                                                    isPopular
                                                        ? 'bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] text-white hover:opacity-90 shadow-lg shadow-[#FF2D55]/30'
                                                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                Subscribe Now
                                            </Link>

                                            <div className="space-y-3.5">
                                                {(plan.features || []).map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <CheckCircle2 size={18} className="text-[#FF2D55] shrink-0" />
                                                        <span className="font-medium text-xs text-slate-700">{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* FAQ Section */}
                <section id="faq" className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
                        <p className="text-slate-600 text-sm font-medium">Clear answers to help you get onboarded seamlessly.</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { q: "How long does it take to set up?", a: "You can be fully operational in less than 24 hours. Our automated menu importer parses your items instantly." },
                            { q: "Do I need proprietary hardware terminals?", a: "No. RestaurantHub is cloud-native and runs smoothly on standard iPads, Android tablets, smartphones, or Windows PCs." },
                            { q: "What happens if internet connectivity drops?", a: "Our POS includes an offline sync engine that continues accepting orders and printing receipts locally, syncing back to the cloud automatically when reconnected." }
                        ].map((faq, i) => (
                            <div key={i} className="border border-slate-200 rounded-[20px] overflow-hidden bg-white shadow-sm">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                                    className="w-full flex items-center justify-between p-5 text-left font-bold text-base text-slate-900 hover:bg-slate-50 transition-colors"
                                >
                                    {faq.q}
                                    {openFaq === i ? <Minus size={18} className="text-[#FF2D55] shrink-0"/> : <Plus size={18} className="text-slate-500 shrink-0"/>}
                                </button>
                                {openFaq === i && (
                                    <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                </div>
            </main>

            {/* Footer - Light Theme */}
            <footer className="border-t border-slate-200 bg-white py-16 relative z-10">
                <div className="w-full px-4 sm:px-6 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <div 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="flex items-center gap-3 cursor-pointer"
                            >
                                <div className="w-9 h-9 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center text-white shadow-md">
                                    <Utensils size={18} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">RestaurantHub</h2>
                            </div>
                            <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
                                The all-in-one operating system for modern hospitality. POS billing, inventory management, digital ordering, and KDS workflows perfectly synchronized.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><a href="#features" className="hover:text-[#FF2D55] transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-[#FF2D55] transition-colors">Pricing</a></li>
                                <li><a href="#workflow" className="hover:text-[#FF2D55] transition-colors">Kitchen KDS</a></li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><a href="#about" className="hover:text-[#FF2D55] transition-colors">About Platform</a></li>
                                <li><Link to="/contact" className="hover:text-[#FF2D55] transition-colors">Support & Contact</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">

                        <p>© 2026 RestaurantHub Inc. All rights reserved.</p>
                        <p className="flex items-center gap-4">
                            <span>Terms of Service</span>
                            <span>Privacy Policy</span>
                        </p>
                    </div>
                </div>
            </footer>

            {/* Interactive 3D Demo Modal */}
            {showDemoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050816]/90 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-[#050816] border border-white/[0.12] rounded-[20px] p-5 sm:p-7 max-w-4xl w-full shadow-2xl relative text-white space-y-6 my-auto overflow-hidden">
                        
                        <button 
                            onClick={() => setShowDemoModal(false)}
                            className="absolute top-4 right-4 p-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-full text-[#94A3B8] hover:text-white transition-all cursor-pointer z-20 border border-white/[0.1]"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3.5 relative z-10">
                            <div className="p-2.5 bg-gradient-to-br from-[#FF2D55] to-[#FF6A00] text-white rounded-xl shadow-lg shadow-[#FF2D55]/25">
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                                    Interactive 3D Restaurant Simulator
                                    <span className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-[#FF2D55]/20 text-[#FF2D55] border border-[#FF2D55]/30">
                                        LIVE 3D VIEW
                                    </span>
                                </h3>
                                <p className="text-xs text-[#94A3B8] font-medium">Real-time Order Packet Transmission across POS, KDS &amp; QR Ordering</p>
                            </div>
                        </div>

                        {/* Interactive WebGL 3D Scene */}
                        <div className="relative w-full z-10">
                            <Restaurant3DHero 
                                className="relative w-full h-[280px] sm:h-[420px] rounded-2xl overflow-hidden bg-slate-900/10 border border-white/[0.08] shadow-2xl flex items-center justify-center" 
                            />
                        </div>

                        <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-center z-10">
                            <p className="text-xs text-slate-300 font-medium">
                                🖱️ Drag or 📱 swipe to rotate the 3D model. Watch order packets sync live across the system.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



export default Home;


