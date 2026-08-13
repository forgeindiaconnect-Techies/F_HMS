import { useState, useEffect } from 'react';
import { 
    Utensils, ArrowRight, Star, ChevronDown, CheckCircle2, 
    Monitor, QrCode, Boxes, Users, LineChart, Store, Calculator, CalendarDays, 
    PlayCircle, ChefHat, Clock, Globe, Plus, Minus, X, Sparkles, Zap, Shield, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const Home = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(true);
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [demoStep, setDemoStep] = useState(1);

    // Dummy data fallback
    const dummyRestaurants = [
        { _id: 'demo1', name: 'Pizza Palace', rating: 4.8, time: '20-25', tags: 'Italian, Fast Food', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo2', name: 'Burger Hub', rating: 4.5, time: '15-20', tags: 'American, Beverages', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo3', name: 'South Indian Cafe', rating: 4.9, time: '10-15', tags: 'South Indian, Breakfast', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo4', name: 'Chinese Bowl', rating: 4.2, time: '25-30', tags: 'Chinese, Asian', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo5', name: 'BBQ Nation', rating: 4.7, time: '30-40', tags: 'BBQ, Non-Veg', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
        { _id: 'demo6', name: 'Juice Corner', rating: 4.6, time: '5-10', tags: 'Beverages, Healthy', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
    ];

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get('/restaurants');
                let realRest = res.data.filter(r => r.subscription?.status === 'Active' && r.isActive !== false);
                let combined = [...realRest];
                if (combined.length < 6) {
                    combined.push(...dummyRestaurants.slice(0, 6 - combined.length));
                }
                setRestaurants(combined);
            } catch (error) {
                console.error("Failed to load restaurants", error);
                setRestaurants(dummyRestaurants);
            } finally {
                setLoading(false);
            }
        };

        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans');
                setPlans(res.data);
            } catch (error) {
                console.error("Failed to fetch public pricing plans", error);
                setPlans([
                    { _id: 'p1', name: 'Starter', monthlyPrice: 4999, yearlyPrice: 3999, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'] },
                    { _id: 'p2', name: 'Professional', monthlyPrice: 9999, yearlyPrice: 7999, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'] },
                    { _id: 'p3', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 15999, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', '24/7 Support'] }
                ]);
            } finally {
                setPlansLoading(false);
            }
        };

        fetchRestaurants();
        fetchPlans();
    }, []);

    const coreFeatures = [
        { name: 'Multi Branch', icon: <Store size={26} />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        { name: 'POS Billing', icon: <Calculator size={26} />, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        { name: 'QR Ordering', icon: <QrCode size={26} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        { name: 'Inventory', icon: <Boxes size={26} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        { name: 'Reservations', icon: <CalendarDays size={26} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
        { name: 'Analytics', icon: <LineChart size={26} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
        { name: 'Kitchen Display', icon: <Monitor size={26} />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        { name: 'Staff App', icon: <Users size={26} />, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
    ];

    return (
        <div className="min-h-screen bg-[#050816] text-slate-100 font-sans selection:bg-red-500 selection:text-white relative overflow-x-hidden">
            
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-red-600/15 via-orange-600/10 to-transparent blur-[140px] pointer-events-none z-0" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-red-900/10 blur-[160px] pointer-events-none z-0" />

            {/* Glassmorphism Header */}
            <header className="sticky top-0 z-50 bg-[#050816]/75 backdrop-blur-xl border-b border-white/[0.08] py-4 px-4 sm:px-8 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 text-white group-hover:scale-105 transition-transform">
                            <Utensils size={20} />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-red-400 transition-colors">
                            Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Hub</span>
                        </h1>
                    </Link>
                    
                    <nav className="hidden md:flex gap-8 font-semibold text-sm text-slate-300 items-center">
                        <div className="relative group py-2">
                            <a href="#features" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer">
                                Features <ChevronDown size={14} className="group-hover:rotate-180 transition-transform text-red-500" />
                            </a>

                            <div className="absolute top-full left-0 w-64 bg-[#0A0F1F] rounded-2xl shadow-2xl border border-white/[0.1] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <Link to="/features/management" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-red-500/10 text-white font-bold transition-all group/item">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">📊</span>
                                        <span>Management</span>
                                    </div>
                                    <ArrowRight size={16} className="text-red-400 group-hover/item:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/features/details?module=orders" className="flex items-center justify-between p-3 mt-1 rounded-xl bg-white/[0.03] hover:bg-orange-500/10 text-white font-bold transition-all group/item-kds">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">🍳</span>
                                        <span>Kitchen Workflow</span>
                                    </div>
                                    <ArrowRight size={16} className="text-orange-400 group-hover/item-kds:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/features/details?module=intelligence" className="flex items-center justify-between p-3 mt-1 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 text-white font-bold transition-all group/item-pos">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">💳</span>
                                        <span>POS Billing</span>
                                    </div>
                                    <ArrowRight size={16} className="text-emerald-400 group-hover/item-pos:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        <Link to="/3d-demo" className="hover:text-red-400 transition-colors flex items-center gap-1.5 font-bold text-red-400">
                            <Sparkles size={14} className="animate-pulse" /> 3D Demo
                        </Link>
                        <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </nav>

                    <div className="flex items-center gap-4 text-xs sm:text-sm font-bold shrink-0">
                        <Link to="/staff/login" className="text-slate-300 hover:text-white transition-colors px-2 py-1">Log in</Link>
                        <Link to="/staff/register" className="relative group overflow-hidden rounded-xl p-[1px] font-extrabold focus:outline-none">
                            <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-xl group-hover:opacity-100 transition-opacity" />
                            <span className="relative block px-5 py-2.5 bg-[#050816] rounded-[11px] text-white group-hover:bg-transparent transition-colors">
                                Get Started Free
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 1. Full Screen Hero Section with Neon Arc Overlay */}
            <section id="demo" className="min-h-[calc(100vh-80px)] flex flex-col justify-between items-center text-center px-4 pt-12 pb-16 relative z-10 overflow-hidden">
                
                {/* Neon Red Curved Wave / Arc SVG in background */}
                <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
                    <svg className="w-full h-full opacity-60" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-100 450 C 350 250, 1090 250, 1540 450" stroke="url(#red-neon-grad)" strokeWidth="3" />
                        <path d="M-100 470 C 350 270, 1090 270, 1540 470" stroke="url(#red-neon-glow)" strokeWidth="20" opacity="0.3" />
                        <defs>
                            <linearGradient id="red-neon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FF1E1E" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="#FF3B3B" stopOpacity="1" />
                                <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="red-neon-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FF1E1E" stopOpacity="0" />
                                <stop offset="50%" stopColor="#FF3B3B" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="flex flex-col items-center justify-center my-auto relative z-10 max-w-5xl mx-auto pt-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 font-bold text-xs sm:text-sm mb-8 shadow-2xl backdrop-blur-md">
                        <Star size={14} className="fill-red-500 text-red-500" />
                        <span>Rated #1 POS System 2026</span>
                    </div>

                    {/* Hero Title - Exact Match to Screenshot */}
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.08] mb-8">
                        The Ultimate <span className="text-[#FF4D30]">Operating</span> <br />
                        <span className="text-[#FF5722]">System</span> for Restaurants
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed mb-10">
                        Streamline your operations, boost your sales, and delight your customers with our all-in-one POS, inventory, and online ordering platform.
                    </p>

                    {/* CTA Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-md sm:max-w-none">
                        <Link 
                            to="/staff/register" 
                            className="w-full sm:w-auto bg-[#EE2737] hover:bg-[#D61E2E] text-white font-black text-lg px-9 py-4 rounded-2xl shadow-2xl shadow-red-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                        >
                            Subscribe Now 
                            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                        </Link>

                        <button 
                            onClick={() => setShowDemoModal(true)}
                            className="w-full sm:w-auto bg-[#070B18]/80 hover:bg-white/[0.06] text-white border border-white/[0.15] font-black text-lg px-8 py-4 rounded-2xl shadow-lg hover:border-white/[0.3] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                        >
                            <PlayCircle size={22} className="text-red-400 group-hover:scale-110 transition-transform" /> 
                            <span>View Interactive 3D Demo</span>
                        </button>
                    </div>
                </div>

                {/* 4 Feature Columns Banner below Hero (Matches Screenshot) */}
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 z-10">
                    <div className="bg-[#080D1D]/90 border border-white/[0.08] p-5 rounded-2xl flex items-start gap-4 text-left backdrop-blur-md">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl shrink-0">
                            <Calculator size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm mb-1">All-in-One POS</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Manage orders, payments, and tables seamlessly.</p>
                        </div>
                    </div>

                    <div className="bg-[#080D1D]/90 border border-white/[0.08] p-5 rounded-2xl flex items-start gap-4 text-left backdrop-blur-md">
                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl shrink-0">
                            <Boxes size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm mb-1">Smart Inventory</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Track stock in real-time and reduce waste.</p>
                        </div>
                    </div>

                    <div className="bg-[#080D1D]/90 border border-white/[0.08] p-5 rounded-2xl flex items-start gap-4 text-left backdrop-blur-md">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0">
                            <LineChart size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm mb-1">Boost Sales</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Optimize operations and increase profitability.</p>
                        </div>
                    </div>

                    <div className="bg-[#080D1D]/90 border border-white/[0.08] p-5 rounded-2xl flex items-start gap-4 text-left backdrop-blur-md">
                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl shrink-0">
                            <Users size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm mb-1">Happy Customers</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Fast service, accurate orders, and better experience.</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* 2. Trusted By Brands Ribbon */}
            <section className="py-12 border-y border-white/[0.08] bg-[#0A0F1F]/60 backdrop-blur-md relative z-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Trusted by 10,000+ Hospitality Leaders Worldwide</p>
                    <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-80">
                        <div className="text-2xl font-black text-slate-300 flex items-center gap-2 tracking-tight"><Utensils size={26} className="text-red-500" /> Pizza Hut</div>
                        <div className="text-2xl font-black text-slate-300 italic tracking-wider">Domino's</div>
                        <div className="text-2xl font-black text-slate-300 tracking-widest">SUBWAY</div>
                        <div className="text-2xl font-black text-slate-300 font-serif">KFC</div>
                        <div className="text-2xl font-black text-slate-300 tracking-tight">Burger King</div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 py-24 space-y-32 relative z-10">

                {/* About Platform & Architecture */}
                <section id="about" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-[#0A0F1F] to-[#080C19] border border-white/[0.08] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-extrabold text-xs uppercase tracking-wider">
                            <Shield size={14} /> Enterprise SaaS Architecture
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                            One Unified Operating Ecosystem
                        </h2>
                        <p className="text-slate-300 font-medium text-lg leading-relaxed">
                            RestaurantHub functions as a centralized, high-performance SaaS infrastructure engineered to unify front-of-house hospitality and back-of-house kitchen workflows. 
                        </p>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">
                            By replacing fragmented legacy terminals with a real-time cloud database, our platform synchronizes order routing, stock replenishment cycles, table arrangements, and revenue analytics across all branches simultaneously.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-[#050816] p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between h-40">
                            <span className="text-4xl font-black text-red-400">99.9%</span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Real-time Uptime</span>
                        </div>
                        <div className="bg-[#050816] p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between h-40">
                            <span className="text-4xl font-black text-orange-400">30%</span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Faster Kitchen Prep</span>
                        </div>
                        <div className="bg-[#050816] p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between h-40">
                            <span className="text-4xl font-black text-amber-400">Zero</span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Proprietary Lock-ins</span>
                        </div>
                        <div className="bg-[#050816] p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between h-40">
                            <span className="text-4xl font-black text-emerald-400">2x</span>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order Precision</span>
                        </div>
                    </div>
                </section>

                {/* Core Feature Grid */}
                <section id="features" className="space-y-12">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider">
                            <Flame size={14} /> Full Platform Capability
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Everything You Need in One Unified Stack</h2>
                        <p className="text-slate-400 font-medium text-base sm:text-lg">No third-party add-ons required. Designed to eliminate operational friction.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {coreFeatures.map((feature, idx) => (
                            <div 
                                key={idx} 
                                className="bg-[#0A0F1F] p-5 rounded-2xl border border-white/[0.08] hover:border-red-500/40 hover:bg-[#0E152B] transition-all flex flex-col items-center gap-3 text-center group cursor-pointer"
                            >
                                <div className={`w-14 h-14 rounded-xl ${feature.bg} border flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{feature.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Why Choose Us */}
                <section id="why-choose-us" className="space-y-12 text-center">
                    <div className="space-y-4 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-xs uppercase tracking-wider">
                            Why Modern Operators Switch
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Built to Scale Hospitality Chains</h2>
                        <p className="text-slate-400 font-medium text-base sm:text-lg">Legacy hardware terminals are slow and bleed profit. Here is why modern brands standardise on RestaurantHub.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-[#0A0F1F] p-8 rounded-3xl border border-white/[0.08] shadow-xl text-left space-y-4 hover:border-red-500/30 transition-colors">
                            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center font-black text-lg">1</div>
                            <h3 className="text-xl font-bold text-white">Zero Hardware Barriers</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Deploy across standard iPads, Android tablets, smartphones, or desktop PCs you already own. Completely avoid proprietary terminal lock-in.
                            </p>
                        </div>

                        <div className="bg-[#0A0F1F] p-8 rounded-3xl border border-white/[0.08] shadow-xl text-left space-y-4 hover:border-orange-500/30 transition-colors">
                            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center font-black text-lg">2</div>
                            <h3 className="text-xl font-bold text-white">Sub-Second Realtime Sync</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Orders fired from waiter tablets propagate instantly to the kitchen display screen (KDS) and POS billing, preventing lost items or delayed preparation.
                            </p>
                        </div>

                        <div className="bg-[#0A0F1F] p-8 rounded-3xl border border-white/[0.08] shadow-xl text-left space-y-4 hover:border-amber-500/30 transition-colors">
                            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-black text-lg">3</div>
                            <h3 className="text-xl font-bold text-white">Direct Customer Ordering</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Provide guests with branded QR ordering, table reservations, and digital payments directly, bypassing high third-party aggregator commissions.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Kitchen KDS Showcase */}
                <section id="workflow" className="rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-[#0A0F1F] via-[#0D1429] to-[#080C19] border border-white/[0.08] shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="text-center mb-16 relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">Interactive Kitchen Workflow (KDS)</h2>
                        <p className="text-slate-400 font-medium text-lg">Digitize your kitchen line. Route orders directly to specific stations without paper tickets.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
                        <div className="space-y-8">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shrink-0"><ChefHat size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl text-white mb-1">Color-Coded Station Tickets</h4>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Orders dynamically change colors based on preparation timers to keep kitchen staff synchronized during peak rush hours.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shrink-0"><Clock size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl text-white mb-1">Preparation Time Analytics</h4>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Track precise prep durations per dish and resolve operational bottlenecks with real-time station metrics.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0"><Monitor size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl text-white mb-1">Multi-Station Auto Routing</h4>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Automatically dispatch drink orders to the bar terminal and hot food items directly to the grill display.</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive KDS Card Display */}
                        <div className="bg-[#050816] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                                    <span className="font-black text-xs text-white uppercase tracking-wider">KDS Live Feed</span>
                                </div>
                                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">3 Active Tickets</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="bg-[#0A0F1F] p-4 rounded-xl border-l-4 border-red-500 flex justify-between items-center border border-white/[0.05]">
                                    <div>
                                        <div className="font-bold text-white text-sm">Table 04 • #ORD-9912</div>
                                        <div className="text-xs text-slate-400 mt-1">1x Truffle Pizza, 2x Fresh Lemonade</div>
                                    </div>
                                    <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2.5 py-1 rounded-lg">Cooking • 4m</span>
                                </div>
                                
                                <div className="bg-[#0A0F1F] p-4 rounded-xl border-l-4 border-orange-500 flex justify-between items-center border border-white/[0.05]">
                                    <div>
                                        <div className="font-bold text-white text-sm">Table 09 • #ORD-9915</div>
                                        <div className="text-xs text-slate-400 mt-1">2x Wagyu Smash Burger, 1x Fries</div>
                                    </div>
                                    <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2.5 py-1 rounded-lg">Received • 1m</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Customer Storefront Demo Section */}
                <section className="space-y-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Active Restaurant Storefronts</h2>
                            <p className="text-slate-400 text-sm font-medium mt-1">Preview how your brand appears on our customer ordering web app</p>
                        </div>
                        <Link to="/explore" className="text-xs font-extrabold text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl transition-all">
                            View All Brands <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" /></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {restaurants.slice(0, 6).map((restaurant, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => toast.success(`Storefront preview of "${restaurant.name}"`)}
                                    className="group cursor-pointer block hover:-translate-y-1.5 transition-transform duration-200"
                                >
                                    <div className="relative rounded-2xl overflow-hidden aspect-square mb-2.5 shadow-xl bg-[#0A0F1F] border border-white/[0.08]">
                                        <img 
                                            src={
                                                restaurant.img 
                                                    ? restaurant.img 
                                                    : restaurant.logo 
                                                        ? (restaurant.logo.startsWith('http') 
                                                            ? restaurant.logo 
                                                            : `${new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin}${restaurant.logo}`)
                                                        : "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                                            } 
                                            alt={restaurant.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                            <h3 className="text-xs font-black truncate">{restaurant.name}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Pricing Plans Section */}
                <section id="pricing" className="space-y-12">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Transparent, Predictable Pricing</h2>
                        <p className="text-slate-400 font-medium text-base sm:text-lg">Zero hidden fees, zero commission markups. Upgrade or downgrade anytime.</p>
                        
                        <div className="inline-flex items-center justify-center gap-3 p-1.5 rounded-full bg-[#0A0F1F] border border-white/[0.08] mt-4">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${!isYearly ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${isYearly ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Yearly Billing
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    {plansLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" /></div>
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
                                        className={`p-8 rounded-3xl relative flex flex-col justify-between transition-all duration-300 ${
                                            isPopular
                                                ? 'bg-gradient-to-b from-[#141B33] to-[#0A0F1F] border-2 border-red-500 shadow-2xl shadow-red-500/20 transform md:-translate-y-4'
                                                : 'bg-[#0A0F1F] border border-white/[0.08] shadow-xl hover:border-white/[0.18]'
                                        }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                                                Most Popular
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                            <div className="text-4xl font-black text-white mb-2">
                                                ₹{(price || 0).toLocaleString('en-IN')}
                                                <span className="text-base font-medium text-slate-400">/mo</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-6 font-semibold">
                                                {isYearly ? 'Billed annually. Includes all core updates.' : 'Billed monthly. Cancel anytime.'}
                                            </p>

                                            <Link 
                                                to={`/staff/register?plan=${encodeURIComponent(plan.name)}&billing=${isYearly ? 'yearly' : 'monthly'}`}
                                                className={`w-full py-3.5 rounded-xl font-extrabold text-sm mb-8 flex justify-center items-center transition-all ${
                                                    isPopular
                                                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/30'
                                                        : 'bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1]'
                                                }`}
                                            >
                                                Subscribe Now
                                            </Link>

                                            <div className="space-y-3.5">
                                                {(plan.features || []).map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <CheckCircle2 size={18} className="text-red-400 shrink-0" />
                                                        <span className="font-medium text-xs text-slate-300">{f}</span>
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
                <section id="faq" className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
                        <p className="text-slate-400 text-sm font-medium">Clear answers to help you get onboarded seamlessly.</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { q: "How long does it take to set up?", a: "You can be fully operational in less than 24 hours. Our automated menu importer parses your items instantly." },
                            { q: "Do I need proprietary hardware terminals?", a: "No. RestaurantHub is cloud-native and runs smoothly on standard iPads, Android tablets, smartphones, or Windows PCs." },
                            { q: "What happens if internet connectivity drops?", a: "Our POS includes an offline sync engine that continues accepting orders and printing receipts locally, syncing back to the cloud automatically when reconnected." }
                        ].map((faq, i) => (
                            <div key={i} className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#0A0F1F]">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                                    className="w-full flex items-center justify-between p-5 text-left font-bold text-base text-white hover:bg-white/[0.02] transition-colors"
                                >
                                    {faq.q}
                                    {openFaq === i ? <Minus size={18} className="text-red-400 shrink-0"/> : <Plus size={18} className="text-slate-400 shrink-0"/>}
                                </button>
                                {openFaq === i && (
                                    <div className="p-5 pt-0 text-slate-300 text-sm leading-relaxed border-t border-white/[0.05]">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* Continuous Full-Width Dark Footer */}
            <footer className="border-t border-white/[0.08] bg-[#030611] py-16 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <div 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="flex items-center gap-3 cursor-pointer"
                            >
                                <div className="w-9 h-9 bg-gradient-to-tr from-red-600 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md">
                                    <Utensils size={18} />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">RestaurantHub</h2>
                            </div>
                            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                                The all-in-one operating system for modern hospitality. POS billing, inventory management, digital ordering, and KDS workflows perfectly synchronized.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#features" className="hover:text-red-400 transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-red-400 transition-colors">Pricing</a></li>
                                <li><a href="#workflow" className="hover:text-red-400 transition-colors">Kitchen KDS</a></li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#about" className="hover:text-red-400 transition-colors">About Platform</a></li>
                                <li><Link to="/contact" className="hover:text-red-400 transition-colors">Support & Contact</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030611]/85 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-[#0A0F1F] border border-white/[0.12] rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative text-white space-y-6 overflow-hidden">
                        
                        <button 
                            onClick={() => setShowDemoModal(false)}
                            className="absolute top-4 right-4 p-2.5 bg-white/[0.05] hover:bg-white/[0.1] rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-20 border border-white/[0.1]"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3.5 relative z-10">
                            <div className="p-3 bg-gradient-to-br from-red-600 to-orange-500 text-white rounded-2xl shadow-lg shadow-red-500/25">
                                <Sparkles size={26} />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    Interactive 3D Restaurant Simulator
                                    <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                        LIVE 3D VIEW
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Real-time Order Packet Transmission across POS, KDS & QR Ordering</p>
                            </div>
                        </div>

                        {/* 3D Simulation Stage */}
                        <div className="relative aspect-video sm:aspect-[16/9] bg-[#050816] rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col items-center justify-between p-6 shadow-inner">
                            <div className="w-full flex justify-between items-center z-10">
                                <div className="flex items-center gap-2 bg-[#0A0F1F] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400 shadow-md">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    SYSTEM_STATUS: 3D_ONLINE (SYNC 60FPS)
                                </div>
                                <button
                                    onClick={() => setDemoStep((prev) => (prev % 4) + 1)}
                                    className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                >
                                    <Zap size={14} className="animate-bounce" /> Step {demoStep}/4
                                </button>
                            </div>

                            <div className="relative w-full flex-1 flex items-center justify-around my-2 z-10">
                                <div className={`relative flex flex-col items-center transition-all duration-500 transform ${demoStep === 1 ? 'scale-110 -translate-y-2' : 'scale-95 opacity-80'}`}>
                                    <div className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl p-2 bg-[#0A0F1F] border-2 flex flex-col justify-between items-center transition-all ${demoStep === 1 ? 'border-red-500 shadow-red-500/40 ring-4 ring-red-500/20' : 'border-white/[0.1]'}`}>
                                        <div className="w-full bg-[#050816] rounded-lg p-1.5 flex flex-col items-center gap-1">
                                            <QrCode size={18} className="text-red-400 animate-pulse" />
                                            <span className="text-[8px] font-black text-slate-300">Table #04</span>
                                        </div>
                                        <div className="w-full bg-red-500/20 border border-red-500/30 rounded py-1 text-center text-[9px] font-bold text-red-400">
                                            Order Fired
                                        </div>
                                    </div>
                                    <span className="mt-2 text-xs font-bold text-slate-300">1. Customer QR</span>
                                </div>

                                <div className="relative flex-1 max-w-[60px] sm:max-w-[100px] h-1 bg-white/[0.08] overflow-hidden rounded-full">
                                    <div className={`h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700 ${demoStep >= 2 ? 'w-full' : 'w-0'}`} />
                                </div>

                                <div className={`relative flex flex-col items-center transition-all duration-500 transform ${demoStep === 2 ? 'scale-110 -translate-y-2' : 'scale-95 opacity-80'}`}>
                                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0A0F1F] border-2 flex flex-col items-center justify-center p-3 transition-all ${demoStep === 2 ? 'border-orange-500 shadow-orange-500/40 ring-4 ring-orange-500/20' : 'border-white/[0.1]'}`}>
                                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 mb-1">
                                            <Store size={22} className="animate-spin" style={{ animationDuration: '8s' }} />
                                        </div>
                                        <span className="text-[9px] font-extrabold text-slate-200">POS Hub</span>
                                    </div>
                                    <span className="mt-2 text-xs font-bold text-slate-300">2. Realtime POS</span>
                                </div>

                                <div className="relative flex-1 max-w-[60px] sm:max-w-[100px] h-1 bg-white/[0.08] overflow-hidden rounded-full">
                                    <div className={`h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-700 ${demoStep >= 3 ? 'w-full' : 'w-0'}`} />
                                </div>

                                <div className={`relative flex flex-col items-center transition-all duration-500 transform ${demoStep === 3 ? 'scale-110 -translate-y-2' : 'scale-95 opacity-80'}`}>
                                    <div className={`w-24 h-20 sm:w-28 sm:h-24 rounded-2xl bg-[#0A0F1F] border-2 flex flex-col items-center justify-center p-2.5 transition-all ${demoStep === 3 ? 'border-emerald-500 shadow-emerald-500/40 ring-4 ring-emerald-500/20' : 'border-white/[0.1]'}`}>
                                        <div className="w-full bg-[#050816] rounded-lg p-1.5 flex justify-between items-center mb-1">
                                            <ChefHat size={16} className="text-emerald-400" />
                                            <span className="text-[8px] font-mono text-emerald-400 font-bold">KDS</span>
                                        </div>
                                        <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded py-0.5 text-center text-[8px] font-bold text-emerald-300">
                                            🍳 Preparing
                                        </div>
                                    </div>
                                    <span className="mt-2 text-xs font-bold text-slate-300">3. Kitchen KDS</span>
                                </div>
                            </div>

                            <div className="w-full bg-[#0A0F1F] border border-white/[0.08] rounded-xl p-3 text-center z-10">
                                <p className="text-xs text-slate-300 font-medium">
                                    {demoStep === 1 && "📱 Guest scans QR code -> Chooses items -> Submits order directly."}
                                    {demoStep === 2 && "📡 POS receives instant packet -> Updates inventory & generates ticket."}
                                    {demoStep === 3 && "👨‍🍳 KDS display rings kitchen chime -> Chef begins preparation."}
                                    {demoStep === 4 && "🛵 Order status updates live for staff & customer."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
