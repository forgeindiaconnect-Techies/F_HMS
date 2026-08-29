import { useState, useEffect } from 'react';
import { 
    Utensils, ArrowRight, Star, ChevronDown, CheckCircle2, 
    Monitor, QrCode, Boxes, Users, LineChart, Store, Calculator, CalendarDays, 
    PlayCircle, ChefHat, Clock, Globe, Plus, Minus, X, Sparkles, Zap, Shield, Flame,
    ShoppingBag, ShoppingCart, ChevronRight, ChevronLeft, Smartphone, Receipt, Menu as MenuIcon,
    Award, TrendingUp, Compass, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import Interactive3DRestaurantExperience from '../../components/Interactive3DRestaurantExperience';

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
            
            {/* Sticky Glassmorphism Navbar */}
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

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation Menu"
                            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 bg-slate-100 dark:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
                        </button>
                    </div>
                </div>
            </header>


            {/* ========================================================================= */}
            {/* ULTRA-ATTRACTIVE STATE-OF-THE-ART HERO SECTION */}
            {/* ========================================================================= */}
            <section id="demo" className="relative min-h-[95vh] lg:min-h-[105vh] flex flex-col justify-between items-center text-center px-4 pt-16 pb-20 overflow-hidden bg-slate-950 text-white select-none">
                
                {/* 1. Ambient Dynamic Lighting & Glowing Orbs */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[650px] bg-gradient-to-b from-[#FF2D55]/20 via-[#FF6A00]/15 to-transparent rounded-full blur-[160px]" />
                    <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-[#00d4ff]/10 rounded-full blur-[140px]" />
                    <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-[#FF2D55]/15 rounded-full blur-[150px]" />
                    
                    {/* Animated Geometric Tech Grid Pattern Overlay */}
                    <div 
                        className="absolute inset-0 opacity-[0.12]" 
                        style={{ 
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
                            backgroundSize: '36px 36px' 
                        }} 
                    />
                    
                    {/* Dark Vignette Bottom Gradient Fade */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950" />
                </div>

                {/* 2. Main Hero Content Header */}
                <div className="relative z-20 max-w-5xl mx-auto flex flex-col items-center pt-4 sm:pt-8 space-y-6 sm:space-y-8">
                    
                    {/* Top Glowing Badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 text-white font-extrabold text-xs sm:text-sm shadow-2xl backdrop-blur-xl hover:border-[#FF2D55]/60 transition-all cursor-default group">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2D55] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF2D55]"></span>
                        </span>
                        <span className="text-amber-400 font-black">NEXT-GEN 3D POS PLATFORM</span>
                        <span className="hidden xs:inline text-slate-400">•</span>
                        <span className="hidden xs:inline text-slate-300">Rated #1 Restaurant System 2026</span>
                        <Sparkles size={15} className="text-amber-400 group-hover:rotate-45 transition-transform" />
                    </div>

                    {/* Grand Title Heading */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] max-w-5xl">
                        The Interactive <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] via-[#FF6A00] to-[#00d4ff] animate-pulse">
                            3D Operating System
                        </span> <br className="hidden sm:inline" />
                        for Modern Restaurants
                    </h1>

                    {/* Subtitle Paragraph */}
                    <p className="text-sm sm:text-base md:text-lg text-slate-300 font-semibold max-w-3xl leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] px-2">
                        Streamline dine-in ordering, kitchen workflow, staff app dispatch, and smart POS billing with an immersive scroll-driven 3D real-time restaurant engine.
                    </p>

                    {/* High-Converting Call to Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md sm:max-w-none pt-2">
                        <Link 
                            to="/staff/register" 
                            className="w-full sm:w-auto bg-gradient-to-r from-[#FF2D55] via-[#FF551C] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-black text-sm sm:text-base px-8 py-4 rounded-2xl shadow-[0_0_35px_rgba(255,45,85,0.4)] hover:shadow-[0_0_50px_rgba(255,45,85,0.6)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Zap size={18} className="fill-white" />
                            <span>Start 14-Day Free Trial</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                        </Link>

                        <Link 
                            to="/3d-demo" 
                            className="w-full sm:w-auto bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base px-7 py-4 rounded-2xl border border-slate-700/90 shadow-2xl backdrop-blur-xl hover:border-amber-400/60 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
                        >
                            <Sparkles size={18} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                            <span>Full 3D Showcase Mode</span>
                        </Link>
                    </div>

                    {/* Micro-Trust Benefits Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <CheckCircle2 size={15} className="text-emerald-400" /> No Credit Card Required
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <CheckCircle2 size={15} className="text-emerald-400" /> 2-Minute Instant Setup
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <CheckCircle2 size={15} className="text-emerald-400" /> 10,000+ Active Outlets
                        </span>
                    </div>

                    {/* Live Metric Stats Cards Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl pt-4">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3.5 sm:p-4 rounded-2xl text-center shadow-xl">
                            <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] block">
                                0.2 Sec
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400">KDS Kitchen Speed</span>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3.5 sm:p-4 rounded-2xl text-center shadow-xl">
                            <span className="text-lg sm:text-2xl font-black text-emerald-400 block">
                                +35% Higher
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Table Turnover</span>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3.5 sm:p-4 rounded-2xl text-center shadow-xl">
                            <span className="text-lg sm:text-2xl font-black text-amber-400 block">
                                100% Live
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400">3D Working Avatars</span>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3.5 sm:p-4 rounded-2xl text-center shadow-xl">
                            <span className="text-lg sm:text-2xl font-black text-cyan-400 block">
                                4.9 ★ Rating
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Trusted by Owners</span>
                        </div>
                    </div>
                </div>

                {/* 3. Immersive 3D Experience WebGL Window Frame Container */}
                <div className="w-full max-w-7xl mx-auto mt-10 sm:mt-14 relative z-20">
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[2.8rem] p-2 sm:p-3.5 shadow-[0_0_90px_rgba(255,45,85,0.22)] relative overflow-hidden group">
                        
                        {/* Mac-Style Window Control Header Bar */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80 rounded-t-[2.2rem]">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block"></span>
                                <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block"></span>
                                <span className="text-xs font-mono font-bold text-slate-400 ml-2 hidden xs:inline">
                                    Interactive 3D Restaurant Engine v3.0
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                <span>60 FPS WebGL Engine Active</span>
                            </div>
                        </div>

                        {/* Embedded 3D Component */}
                        <Interactive3DRestaurantExperience height="h-[600px] sm:h-[680px] lg:h-[750px]" />
                    </div>
                </div>

                {/* 4. Trusted Restaurant Brands Social Proof Marquee Banner */}
                <div className="w-full max-w-6xl mx-auto mt-12 sm:mt-16 pt-8 border-t border-slate-800/80 relative z-20">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-6 text-center">
                        POWERING 10,000+ TOP RESTAURANTS & CLOUD KITCHENS WORLDWIDE
                    </span>

                    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
                        {['Pizza Palace', 'Burger Hub', 'BBQ Nation', 'Mainland China', 'Cafe Coffee Day', 'Taco Bell', 'Haldirams'].map((brand, idx) => (
                            <span key={idx} className="text-sm sm:text-base font-black tracking-tight text-slate-400 hover:text-white transition-colors cursor-default">
                                {brand}
                            </span>
                        ))}
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
                                <Users size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">Staff Coordination</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">Empower staff with roles, KDS, and shift tracking.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Home;
