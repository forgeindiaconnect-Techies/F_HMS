import { useState, useEffect } from 'react';
import { 
    Utensils, ArrowRight, Star, ChevronDown, CheckCircle2, 
    Monitor, QrCode, Boxes, Users, LineChart, Store, Calculator, CalendarDays, 
    PlayCircle, ChefHat, Clock, Globe, Plus, Minus, X, Sparkles, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Restaurant3DHero from '../../components/Restaurant3DHero';

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
                let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
                if (!API_URL.endsWith('/api')) API_URL += '/api';
                const res = await axios.get(`${API_URL}/restaurants`);
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
                let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
                if (!API_URL.endsWith('/api')) API_URL += '/api';
                const res = await axios.get(`${API_URL}/plans`);
                setPlans(res.data);
            } catch (error) {
                console.error("Failed to fetch public pricing plans", error);
                // Fallback default plans
                setPlans([
                    { _id: 'p1', name: 'Starter', monthlyPrice: 4999, yearlyPrice: 3999, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'] },
                    { _id: 'p2', name: 'Professional', monthlyPrice: 9999, yearlyPrice: 7999, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'] },
                    { _id: 'p3', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 15999, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', '24/7 Phone Support'] }
                ]);
            } finally {
                setPlansLoading(false);
            }
        };

        fetchRestaurants();
        fetchPlans();
    }, []);

    const coreFeatures = [
        { name: 'Multi Branch', icon: <Store size={28} />, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
        { name: 'POS Billing', icon: <Calculator size={28} />, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
        { name: 'QR Ordering', icon: <QrCode size={28} />, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' },
        { name: 'Inventory', icon: <Boxes size={28} />, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
        { name: 'Reservations', icon: <CalendarDays size={28} />, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50' },
        { name: 'Analytics', icon: <LineChart size={28} />, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50' },
        { name: 'Kitchen Display', icon: <Monitor size={28} />, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/50' },
        { name: 'Staff App', icon: <Users size={28} />, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50' }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 transition-colors">
            {/* SaaS Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm py-3.5 px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 text-white group-hover:scale-105 transition-transform shrink-0">
                            <Utensils size={18} className="sm:w-6 sm:h-6" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">RestaurantHub</h1>
                    </Link>
                    
                    <nav className="hidden md:flex gap-8 font-medium text-sm text-gray-600 dark:text-slate-300 relative items-center">
                        {/* Features Dropdown */}
                        <div className="relative group py-2">
                            <a 
                                href="#features" 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-gray-800 dark:text-slate-200 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Features <ChevronDown size={14} className="group-hover:rotate-180 transition-transform text-red-500" />
                            </a>

                            {/* Dropdown Menu Box */}
                            <div className="absolute top-full left-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <Link 
                                    to="/features/management" 
                                    className="flex items-center justify-between p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/40 hover:bg-red-100/70 dark:hover:bg-red-900/60 text-red-900 dark:text-red-200 font-bold transition-all group/item"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">📊</span>
                                        <span>Management</span>
                                    </div>
                                    <ArrowRight size={16} className="text-red-600 dark:text-red-400 group-hover/item:translate-x-1 transition-transform" />
                                </Link>
                                <Link 
                                    to="/features/details?module=orders" 
                                    className="flex items-center justify-between p-3.5 mt-1 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/60 text-cyan-900 dark:text-cyan-200 font-bold transition-all group/item-kds"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">🍳</span>
                                        <span>Kitchen Workflow (KDS)</span>
                                    </div>
                                    <ArrowRight size={16} className="text-cyan-600 dark:text-cyan-400 group-hover/item-kds:translate-x-1 transition-transform" />
                                </Link>
                                <Link 
                                    to="/features/details?module=intelligence" 
                                    className="flex items-center justify-between p-3.5 mt-1 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold transition-all group/item-pos"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">💳</span>
                                        <span>POS Billing</span>
                                    </div>
                                    <ArrowRight size={16} className="text-emerald-600 dark:text-emerald-400 group-hover/item-pos:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        <Link to="/3d-demo" className="hover:text-red-500 transition-colors flex items-center gap-1 font-bold text-red-500">
                            <Sparkles size={14} className="animate-pulse" /> 3D Demo
                        </Link>
                        <a href="#workflow" className="hover:text-red-500 transition-colors">Workflow</a>
                        <a href="#pricing" className="hover:text-red-500 transition-colors">Pricing</a>
                        <Link to="/contact" className="hover:text-red-500 transition-colors">Contact</Link>
                    </nav>

                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold shrink-0">
                        <Link to="/staff/login" className="text-gray-600 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white transition-colors whitespace-nowrap px-1">Log in</Link>
                        <Link to="/staff/register" className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap">
                            <span className="md:hidden">Sign Up</span>
                            <span className="hidden md:inline">Get Started Free</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto w-full px-4 pt-16 pb-24">
                
                {/* 1. Hero Banner */}
                <section id="demo" className="text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm shadow-sm">
                        <span className="flex items-center gap-2"><Star size={14} className="fill-red-600 dark:fill-red-400" /> Rated #1 POS System 2026</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white mb-6 leading-[1.1]">
                        The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Operating System</span> for Restaurants
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        Streamline your operations, boost your sales, and delight your customers with our all-in-one POS, inventory, and online ordering platform.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/staff/register" className="w-full sm:w-auto bg-red-500 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-2 group cursor-pointer">
                            Subscribe Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            to="/3d-demo" 
                            className="w-full sm:w-auto bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-800 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer group"
                        >
                            <PlayCircle size={22} className="text-red-500 group-hover:scale-110 transition-transform" /> 
                            <span>View Interactive 3D Demo</span>
                        </Link>
                    </div>
                </section>

                {/* 2. Trusted By Restaurants */}
                <section className="mb-24 border-y border-gray-100 dark:border-slate-800/80 py-8 bg-gray-50/50 dark:bg-slate-900/40 -mx-4 px-4">
                    <div className="max-w-[1200px] mx-auto text-center">
                        <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6">Trusted by 10,000+ Restaurants Worldwide</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-75 dark:opacity-90">
                            <div className="text-2xl font-black text-gray-800 dark:text-slate-200 flex items-center gap-2"><Utensils size={28}/> Pizza Hut</div>
                            <div className="text-2xl font-black text-gray-800 dark:text-slate-200 italic">Domino's</div>
                            <div className="text-2xl font-black text-gray-800 dark:text-slate-200">SUBWAY</div>
                            <div className="text-2xl font-black text-gray-800 dark:text-slate-200 font-serif">KFC</div>
                            <div className="text-2xl font-black text-gray-800 dark:text-slate-200">Burger King</div>
                        </div>
                    </div>
                </section>

                {/* About the Platform & Why Choose Us */}
                <div className="space-y-24 mb-24">
                    <section id="about" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[3rem] p-8 md:p-16 border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full font-bold text-xs uppercase tracking-wider">
                                About the Platform
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                One Unified Operating Ecosystem
                            </h2>
                            <p className="text-gray-600 dark:text-slate-300 font-medium text-lg leading-relaxed">
                                RestaurantHub functions as a centralized, high-performance SaaS infrastructure engineered to unify front-of-house hospitality and back-of-house kitchen workflows. 
                            </p>
                            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                By replacing fragmented systems with a real-time synchronized cloud database, our platform streamlines order routing, automates stock replenishment cycles, schedules customer table arrangements, and provides comprehensive revenue analytics. It's built to help you reduce overhead, eliminate coordination errors, and scale your restaurant branches seamlessly.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-red-100/20 dark:border-slate-800 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-red-500">99.9%</span>
                                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Real-time Uptime</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-red-100/20 dark:border-slate-800 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-orange-500">30%</span>
                                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Faster Prep Times</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-red-100/20 dark:border-slate-800 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-red-500">Zero</span>
                                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Hardware Lock-ins</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-red-100/20 dark:border-slate-800 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-orange-500">2x</span>
                                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">Order Accuracy</span>
                            </div>
                        </div>
                    </section>

                    {/* Why Choose Us */}
                    <section id="why-choose-us" className="text-center space-y-12">
                        <div className="space-y-4 max-w-3xl mx-auto">
                            <div className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-full font-bold text-xs uppercase tracking-wider">
                                Why Choose Us
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                Built to Scale Your Hospitality Business
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
                                Legacy systems slow you down and bleed profit. Here is why modern operators choose RestaurantHub.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center font-bold text-xl">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zero Setup Barriers</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Run the entire app ecosystem on standard iOS, Android, or desktop devices you already own. Completely avoid buying proprietary hardware terminals.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400 rounded-2xl flex items-center justify-center font-bold text-xl">
                                    2
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Real-Time Sync</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Orders sent from waiter tablets propagate instantly to the kitchen display screen (KDS) and POS billing, preventing order drops or billing disputes.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center font-bold text-xl">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">White-Labeled Ordering</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Provide customers with direct table reservation, takeaway scheduling, and digital payment web experiences, bypassing high third-party commissions.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Demo Customer View */}
                <section id="demo" className="mb-24">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-8">See how your restaurant will look to customers</h2>
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {restaurants.slice(0,6).map((restaurant, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => toast.success(`Storefront preview of "${restaurant.name}"`)}
                                    className="group cursor-pointer block hover:scale-105 transition-transform duration-200"
                                >
                                    <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 shadow-sm bg-slate-100 dark:bg-slate-900">
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
                                            className="w-full h-full object-cover" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute bottom-2 left-3 right-3 text-white">
                                            <h3 className="text-sm font-bold truncate">{restaurant.name}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Core Features */}
                <section id="features" className="mb-24">
                    <h2 className="text-3xl font-black text-center text-gray-900 dark:text-white mb-12">Everything you need in one platform</h2>
                    <div className="flex overflow-x-auto gap-4 pb-8 pt-2 no-scrollbar justify-start lg:justify-center">
                        {coreFeatures.map((feature, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 min-w-[110px] cursor-pointer group">
                                <div className={`w-20 h-20 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} transform group-hover:-translate-y-2 group-hover:shadow-lg transition-all duration-300`}>
                                    {feature.icon}
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white">{feature.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Kitchen Workflow */}
                <section id="workflow" className="mb-24 bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl border border-slate-800">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="text-center mb-16 relative z-10">
                        <h2 className="text-4xl font-black tracking-tight mb-6 text-white">Seamless Kitchen Workflow (KDS)</h2>
                        <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg">Digitize your kitchen. Route orders directly to the right stations and never miss a beat.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
                        <div className="space-y-8">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0"><ChefHat size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2 text-white">Color-Coded Tickets</h4>
                                    <p className="text-gray-400 font-medium leading-relaxed">Instantly know which orders are new, cooking, or delayed based on automated color coding. Stay ahead of the rush.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0"><Clock size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2 text-white">Prep Time Tracking</h4>
                                    <p className="text-gray-400 font-medium leading-relaxed">Monitor average prep times per dish and identify bottlenecks in your kitchen assembly line in real-time.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0"><Monitor size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2 text-white">Multi-Station Routing</h4>
                                    <p className="text-gray-400 font-medium leading-relaxed">Automatically send drinks to the bar and food to the grill station without printing physical tickets.</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Live KDS Card Display Mockup */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                                    <span className="font-black text-sm text-white uppercase tracking-wider">Kitchen Display Feed</span>
                                </div>
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">3 Active Orders</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="bg-slate-800/80 p-4 rounded-2xl border-l-4 border-red-500 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white text-sm">Table 04 • #ORD-9912</div>
                                        <div className="text-xs text-slate-400 mt-1">1x Truffle Pizza, 2x Fresh Lemonade</div>
                                    </div>
                                    <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2.5 py-1 rounded-lg">Cooking • 4m</span>
                                </div>
                                
                                <div className="bg-slate-800/80 p-4 rounded-2xl border-l-4 border-amber-500 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white text-sm">Table 09 • #ORD-9915</div>
                                        <div className="text-xs text-slate-400 mt-1">2x Wagyu Smash Burger, 1x Fries</div>
                                    </div>
                                    <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2.5 py-1 rounded-lg">Received • 1m</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile App Preview */}
                <section className="mb-24 flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-indigo-950/80 dark:to-slate-900 rounded-[3rem] p-8 md:p-16 text-slate-900 dark:text-white overflow-hidden shadow-xl border border-red-100 dark:border-slate-800">
                    <div className="flex-1 space-y-6 relative z-10">
                        <div className="inline-block px-4 py-2 bg-red-500/10 text-red-600 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-lg font-bold text-sm border border-red-500/20 dark:border-indigo-500/30">Native iOS & Android</div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Your Restaurant, in Their Pocket</h2>
                        <p className="text-lg text-slate-600 dark:text-indigo-200 font-medium">Launch your own branded mobile app. Increase customer loyalty, send push notifications, and drive repeat orders.</p>
                        <Link to="/explore" className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-xl mt-4 shadow-lg shadow-red-500/20 transition-colors">Learn More</Link>
                    </div>
                    <div className="flex-1 flex justify-center relative">
                        <div className="w-64 h-[500px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col z-10 transform rotate-[-5deg]">
                            <div className="h-6 w-32 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                            <div className="p-4 pt-8 bg-red-500 text-white font-black text-xl text-center">MyRestaurant</div>
                            <div className="flex-1 bg-slate-50 p-4">
                                <div className="w-full h-32 bg-slate-200 rounded-xl mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="mb-24 text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-12">Loved by owners and managers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Sarah Jenkins", role: "Owner, The Rustic Spoon", text: "Switching to RestaurantHub was the best decision. Our table turnover increased by 30% in the first month." },
                            { name: "David Chen", role: "Manager, Golden Dragon", text: "The Kitchen Display System completely eliminated lost tickets. The kitchen is so much quieter now." },
                            { name: "Maria Garcia", role: "Founder, Taco Fiesta", text: "Having our own online ordering site saved us thousands in third-party delivery fees. Highly recommend!" }
                        ].map((t, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm text-left relative">
                                <div className="text-yellow-400 flex gap-1 mb-6"><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/></div>
                                <p className="text-gray-700 dark:text-slate-300 font-medium mb-6 text-lg leading-relaxed">"{t.text}"</p>
                                <div>
                                    <div className="font-black text-gray-900 dark:text-white">{t.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Pricing Plans */}
                <section id="pricing" className="mb-24 pt-12 border-t border-gray-100 dark:border-slate-800">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-gray-500 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-8">No hidden fees, no long-term contracts. Choose the plan that fits your growth.</p>
                        
                        <div className="flex items-center justify-center gap-3">
                            <span className={`font-bold ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>Monthly</span>
                            <button 
                                onClick={() => setIsYearly(!isYearly)}
                                className="w-14 h-8 bg-red-500 rounded-full relative transition-colors duration-300 cursor-pointer"
                            >
                                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${isYearly ? 'left-7' : 'left-1'}`}></div>
                            </button>
                            <span className={`font-bold flex items-center gap-2 ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                                Yearly <span className="text-xs bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Save more</span>
                            </span>
                        </div>
                    </div>

                    {plansLoading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {(plans.length > 0 ? plans : [
                                { _id: 'p1', name: 'Starter', monthlyPrice: 4999, yearlyPrice: 3999, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'] },
                                { _id: 'p2', name: 'Professional', monthlyPrice: 9999, yearlyPrice: 7999, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'] },
                                { _id: 'p3', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 15999, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', '24/7 Support'] }
                            ]).map((plan, idx) => {
                                const isPopular = idx === 1;
                                const mPrice = plan.monthlyPrice || plan.price || 0;
                                const yPrice = plan.yearlyPrice || mPrice;
                                const price = isYearly ? yPrice : mPrice;
                                const savings = mPrice && yPrice && mPrice > yPrice
                                    ? Math.round((1 - yPrice / mPrice) * 100)
                                    : 0;
                                return (
                                    <div key={plan._id || idx} className={`p-8 rounded-3xl relative flex flex-col justify-between ${
                                        isPopular
                                            ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white border border-red-400 shadow-2xl transform md:-translate-y-4'
                                            : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white shadow-sm'
                                    }`}>
                                        {isPopular && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">Most Popular</div>
                                        )}
                                        <div>
                                            <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                                            <div className={`text-4xl font-black mb-1 ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                ₹{(price || 0).toLocaleString('en-IN')}
                                                <span className={`text-lg font-medium ${isPopular ? 'text-red-100' : 'text-gray-400 dark:text-slate-400'}`}>/mo</span>
                                            </div>
                                            {isYearly && savings > 0 && (
                                                <p className={`text-xs font-bold mb-6 ${isPopular ? 'text-yellow-200' : 'text-green-600 dark:text-green-400'}`}>
                                                    Save {savings}% vs monthly billing
                                                </p>
                                            )}
                                            {!isYearly && <p className={`text-xs mb-6 ${isPopular ? 'text-red-100' : 'text-gray-400 dark:text-slate-400'}`}>Billed monthly. Cancel anytime.</p>}
                                            <Link 
                                                to={`/staff/register?plan=${encodeURIComponent(plan.name)}&billing=${isYearly ? 'yearly' : 'monthly'}`}
                                                className={`w-full py-3 rounded-xl font-bold mb-8 flex justify-center items-center transition-colors ${
                                                    isPopular
                                                        ? 'bg-white text-red-600 hover:bg-gray-100 shadow-lg'
                                                        : 'border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-gray-900 dark:hover:border-white'
                                                }`}
                                            >
                                                Subscribe Now
                                            </Link>
                                            <div className="space-y-4">
                                                {(plan.features || []).map((f, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <CheckCircle2 size={18} className={isPopular ? 'text-white' : 'text-green-500 dark:text-green-400'} />
                                                        <span className={`font-medium text-sm ${isPopular ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>{f}</span>
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

                {/* FAQ */}
                <section id="faq" className="mb-24 max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { q: "How long does it take to set up?", a: "You can be fully up and running in less than 24 hours. Our automated menu import tool can pull your existing items instantly." },
                            { q: "Do I need to buy expensive hardware?", a: "No! RestaurantHub is cloud-based and runs on any standard iPad, Android tablet, smartphone, or Windows PC you already own." },
                            { q: "What happens if my internet goes down?", a: "Our POS includes an Offline Mode that allows you to continue taking orders and printing receipts. It auto-syncs the data the moment you're back online." }
                        ].map((faq, i) => (
                            <div key={i} className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left font-bold text-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                    {faq.q}
                                    {openFaq === i ? <Minus size={20} className="text-red-500 shrink-0"/> : <Plus size={20} className="text-gray-400 shrink-0"/>}
                                </button>
                                {openFaq === i && <div className="p-6 pt-0 text-gray-600 dark:text-slate-300 font-medium leading-relaxed border-t border-gray-100 dark:border-slate-800">{faq.a}</div>}
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-slate-900 dark:bg-slate-950 pt-16 pb-8 border-t border-slate-800">
                <div className="max-w-[1200px] mx-auto px-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-center md:text-left">
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col items-center md:items-start">
                            <div 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-85 transition-opacity"
                                title="Scroll to top"
                            >
                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white"><Utensils size={18} /></div>
                                <h2 className="text-2xl font-black text-white tracking-tight">RestaurantHub</h2>
                            </div>
                            <p className="text-slate-400 text-sm mb-6 max-w-sm leading-relaxed text-center md:text-left">
                                The all-in-one operating system for modern restaurants. POS, inventory, online ordering, and analytics all perfectly synced.
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="font-bold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-slate-400 text-center md:text-left">
                                <li><a href="#features" className="hover:text-red-400 transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-red-400 transition-colors">Pricing</a></li>
                                <li><a href="#why-choose-us" className="hover:text-red-400 transition-colors">Integrations</a></li>
                            </ul>
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="font-bold text-white mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-slate-400 text-center md:text-left">
                                <li><a href="#about" className="hover:text-red-400 transition-colors">About Us</a></li>
                                <li><Link to="/contact" className="hover:text-red-400 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm">© 2026 RestaurantHub Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Interactive 3D Restaurant Demo Modal */}
            {showDemoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative text-white space-y-6 overflow-hidden">
                        {/* Background Ambient Glow */}
                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                        <button 
                            onClick={() => setShowDemoModal(false)}
                            className="absolute top-4 right-4 p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer z-20 border border-slate-700/50"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3.5 relative z-10">
                            <div className="p-3.5 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-red-500/25">
                                <Sparkles size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    Interactive 3D Restaurant Simulator
                                    <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                        LIVE 3D VIEW
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Real-time Order Packet Transmission across POS, KDS & QR Ordering</p>
                            </div>
                        </div>

                        {/* 3D Isometric Simulation Arena */}
                        <div className="relative aspect-video sm:aspect-[16/9] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col items-center justify-between p-6 shadow-inner group">
                            
                            {/* 3D Grid Overlay */}
                            <div 
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                                    backgroundSize: '24px 24px'
                                }}
                            />

                            {/* Top Status Bar inside 3D Canvas */}
                            <div className="w-full flex justify-between items-center z-10">
                                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400 shadow-md">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    SYSTEM_STATUS: 3D_ONLINE (SYNC 60FPS)
                                </div>
                                <button
                                    onClick={() => {
                                        setDemoStep((prev) => (prev % 4) + 1);
                                    }}
                                    className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                >
                                    <Zap size={14} className="animate-bounce" /> Simulate Step {demoStep}/4
                                </button>
                            </div>

                            {/* 3D Isometric Interactive Stage */}
                            <div className="relative w-full flex-1 flex items-center justify-around my-2 z-10">
                                
                                {/* Node 1: Customer QR Phone */}
                                <div className={`relative flex flex-col items-center transition-all duration-500 transform ${demoStep === 1 ? 'scale-110 -translate-y-2' : 'scale-95 opacity-80'}`}>
                                    <div className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl p-2 bg-gradient-to-b from-slate-800 to-slate-900 border-2 shadow-2xl flex flex-col justify-between items-center transform transition-all ${demoStep === 1 ? 'border-red-500 shadow-red-500/30 ring-4 ring-red-500/20' : 'border-slate-700'}`}>
                                        <div className="w-full bg-slate-950 rounded-lg p-1.5 flex flex-col items-center gap-1">
                                            <QrCode size={18} className="text-red-400 animate-pulse" />
                                            <span className="text-[8px] font-black text-slate-300">Table #04</span>
                                        </div>
                                        <div className="w-full bg-red-500/20 border border-red-500/30 rounded-md py-1 text-center text-[9px] font-bold text-red-400">
                                            Order Sent
                                        </div>
                                    </div>
                                    <span className="mt-2 text-xs font-bold text-slate-300">1. Customer QR</span>
                                </div>

                                {/* Beam Line 1 -> 2 */}
                                <div className="relative flex-1 max-w-[60px] sm:max-w-[100px] h-1 bg-slate-800 overflow-hidden rounded-full">
                                    <div className={`h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700 ${demoStep >= 2 ? 'w-full' : 'w-0'}`} />
                                </div>

                                {/* Node 2: Central POS Hub */}
                                <div className={`relative flex flex-col items-center transition-all duration-500 transform ${demoStep === 2 ? 'scale-110 -translate-y-2' : 'scale-95 opacity-80'}`}>
                                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 flex flex-col items-center justify-center p-3 shadow-2xl transition-all ${demoStep === 2 ? 'border-orange-500 shadow-orange-500/40 ring-4 ring-orange-500/20' : 'border-slate-700'}`}>
                                        <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 mb-1">
                                            <Store size={24} className="animate-spin" style={{ animationDuration: '8s' }} />
                                        </div>
                                        <span className="text-[9px] font-extrabold text-slate-200">POS Core Hub</span>
                                    </div>
                                    <span className="mt-2 text-xs font-bold text-slate-300">2. Realtime POS</span>
                                </div>

                                {/* Beam Line 2 -> 3 */}
                                <div className="relative flex-1 max-w-[60px] sm:max-w-[100px] h-1 bg-slate-800 overflow-hidden rounded-full">
                                    <div className={`h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-700 ${demoStep >= 3 ? 'w-full' : 'w-0'}`} />
                                </div>

                                {/* Node 3: Kitchen Display (KDS) */}
                                <div className={`relative flex flex-col items-center transition-all duration-500 transform ${demoStep === 3 ? 'scale-110 -translate-y-2' : 'scale-95 opacity-80'}`}>
                                    <div className={`w-24 h-20 sm:w-28 sm:h-24 rounded-2xl bg-slate-900 border-2 flex flex-col items-center justify-center p-2.5 shadow-2xl transition-all ${demoStep === 3 ? 'border-emerald-500 shadow-emerald-500/40 ring-4 ring-emerald-500/20' : 'border-slate-700'}`}>
                                        <div className="w-full bg-slate-950 rounded-lg p-1.5 flex justify-between items-center mb-1">
                                            <ChefHat size={16} className="text-emerald-400" />
                                            <span className="text-[8px] font-mono text-emerald-400 font-bold">KDS KITCHEN</span>
                                        </div>
                                        <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded py-0.5 text-center text-[8px] font-bold text-emerald-300">
                                            🍳 Preparing...
                                        </div>
                                    </div>
                                    <span className="mt-2 text-xs font-bold text-slate-300">3. Kitchen KDS</span>
                                </div>
                            </div>

                            {/* Interactive Step Description */}
                            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center z-10">
                                <p className="text-xs text-slate-300 font-medium">
                                    {demoStep === 1 && "📱 Customer scans table QR code -> Selects items -> Places order instantly."}
                                    {demoStep === 2 && "📡 Central POS receives instant order payload -> Generates KOT & updates inventory."}
                                    {demoStep === 3 && "👨‍🍳 Kitchen Display Screen (KDS) rings audio alert -> Chef marks items as Preparing/Ready."}
                                    {demoStep === 4 && "🛵 Order is dispatched to customer table or delivery partner in real-time."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(stepNum => (
                                    <button
                                        key={stepNum}
                                        onClick={() => setDemoStep(stepNum)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            demoStep === stepNum 
                                            ? 'bg-red-500 text-white shadow-md' 
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        Step {stepNum}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto justify-end">
                                <button 
                                    onClick={() => setShowDemoModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Close Preview
                                </button>
                                <Link 
                                    to="/explore"
                                    onClick={() => setShowDemoModal(false)}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-red-500/25 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    Explore Live App <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
