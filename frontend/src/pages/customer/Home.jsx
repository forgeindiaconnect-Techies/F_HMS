import { useState, useEffect } from 'react';
import { 
    Search, MapPin, Star, ChevronDown, User, ShoppingBag, Clock, Percent, 
    Store, Calculator, QrCode, Boxes, CalendarDays, LineChart, Monitor, Users, 
    Smartphone, BookOpen, ShoppingCart, ChefHat, Utensils, CreditCard, ArrowRight, 
    ShieldCheck, Lock, Database, FileText, Globe, CheckCircle2, PlayCircle, Plus, 
    Minus, Mail, Phone, Map, Shield 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Home = () => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);
    const [showContact, setShowContact] = useState(false);

    // Dummy data for the landing page grid (just in case they need to see demo restaurants)
    const dummyRestaurants = [
        { _id: 'demo1', name: 'Pizza Palace', rating: 4.8, time: '20-25', tags: 'Italian, Pizzas, Fast Food', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo2', name: 'Burger Hub', rating: 4.5, time: '15-20', tags: 'American, Burgers, Beverages', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo3', name: 'South Indian Cafe', rating: 4.9, time: '10-15', tags: 'South Indian, Breakfast', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo4', name: 'Chinese Bowl', rating: 4.2, time: '25-30', tags: 'Chinese, Asian, Noodles', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo5', name: 'BBQ Nation', rating: 4.7, time: '30-40', tags: 'BBQ, Grilled, Non-Veg', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
        { _id: 'demo6', name: 'Juice Corner', rating: 4.6, time: '5-10', tags: 'Beverages, Healthy, Shakes', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
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
                setTimeout(() => setLoading(false), 500);
            }
        };
        fetchRestaurants();
    }, []);

    // Core SaaS Features
    const coreFeatures = [
        { name: 'Multi Branch', icon: <Store size={28} />, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'POS Billing', icon: <Calculator size={28} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'QR Ordering', icon: <QrCode size={28} />, color: 'text-purple-500', bg: 'bg-purple-50' },
        { name: 'Inventory', icon: <Boxes size={28} />, color: 'text-amber-500', bg: 'bg-amber-50' },
        { name: 'Reservations', icon: <CalendarDays size={28} />, color: 'text-rose-500', bg: 'bg-rose-50' },
        { name: 'Analytics', icon: <LineChart size={28} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { name: 'Kitchen Display', icon: <Monitor size={28} />, color: 'text-cyan-500', bg: 'bg-cyan-50' },
        { name: 'Staff App', icon: <Users size={28} />, color: 'text-orange-500', bg: 'bg-orange-50' }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
            {/* SaaS Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm py-4 px-4 lg:px-8">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 text-white">
                            <Utensils size={24} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">RestaurantHub</h1>
                    </div>
                    
                    <nav className="hidden md:flex gap-8 font-medium text-sm text-gray-600">
                        <a href="#features" className="hover:text-red-500 transition-colors">Features</a>
                        <a href="#workflow" className="hover:text-red-500 transition-colors">Workflow</a>
                        <a href="#pricing" className="hover:text-red-500 transition-colors">Pricing</a>
                    </nav>

                    <div className="flex items-center gap-3 md:gap-4 text-sm font-bold">
                        <Link to="/staff/login" className="text-gray-600 hover:text-gray-900 transition-colors">Log in</Link>
                        <Link to="/staff/register" className="bg-gray-900 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all active:scale-95">
                            <span className="md:hidden">Sign Up</span>
                            <span className="hidden md:inline">Get Started Free</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto w-full px-4 pt-16 pb-24">
                
                {/* 1. Hero Banner */}
                <section className="text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 font-bold text-sm shadow-sm">
                        <span className="flex items-center gap-2"><Star size={14} className="fill-red-600" /> Rated #1 POS System 2026</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 mb-6 leading-[1.1]">
                        The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Operating System</span> for Restaurants
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        Streamline your operations, boost your sales, and delight your customers with our all-in-one POS, inventory, and online ordering platform.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/staff/register" className="w-full sm:w-auto bg-red-500 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-2 group">
                            Subscribe Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#demo" className="w-full sm:w-auto bg-white text-gray-800 border border-gray-200 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center gap-2">
                            <PlayCircle size={20} className="text-gray-400" /> View Demo
                        </a>
                    </div>
                </section>

                {/* 2. Trusted By Restaurants */}
                <section className="mb-24 border-y border-gray-100 py-8 bg-gray-50/50 -mx-4 px-4">
                    <div className="max-w-[1200px] mx-auto text-center">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Trusted by 10,000+ Restaurants Worldwide</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
                            <div className="text-2xl font-black text-gray-800 flex items-center gap-2"><Utensils size={28}/> Pizza Hut</div>
                            <div className="text-2xl font-black text-gray-800 italic">Domino's</div>
                            <div className="text-2xl font-black text-gray-800">SUBWAY</div>
                            <div className="text-2xl font-black text-gray-800 font-serif">KFC</div>
                            <div className="text-2xl font-black text-gray-800">Burger King</div>
                        </div>
                    </div>
                </section>

                {/* About the Platform (Abstract) & Why Choose Us */}
                <div className="space-y-24 mb-24">
                    {/* About the Platform (Abstract) */}
                    <section id="about" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-gradient-to-br from-red-50 to-orange-50/20 rounded-[3rem] p-8 md:p-16 border border-red-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full font-bold text-xs uppercase tracking-wider">
                                About the Platform
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                One Unified Operating Ecosystem
                            </h2>
                            <p className="text-gray-600 font-medium text-lg leading-relaxed">
                                RestaurantHub functions as a centralized, high-performance SaaS infrastructure engineered to unify front-of-house hospitality and back-of-house kitchen workflows. 
                            </p>
                            <p className="text-gray-500 font-medium text-sm leading-relaxed">
                                By replacing fragmented systems with a real-time synchronized cloud database, our platform streamlines order routing, automates stock replenishment cycles, schedules customer table arrangements, and provides comprehensive revenue analytics. It's built to help you reduce overhead, eliminate coordination errors, and scale your restaurant branches seamlessly.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100/10 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-red-500">99.9%</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Real-time Uptime</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100/10 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-orange-500">30%</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Faster Prep Times</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100/10 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-red-500">Zero</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hardware Lock-ins</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100/10 flex flex-col justify-between h-36">
                                <span className="text-3xl font-black text-orange-500">2x</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Order Accuracy</span>
                            </div>
                        </div>
                    </section>

                    {/* Why Choose Us */}
                    <section id="why-choose-us" className="text-center space-y-12">
                        <div className="space-y-4 max-w-3xl mx-auto">
                            <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full font-bold text-xs uppercase tracking-wider">
                                Why Choose Us
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                                Built to Scale Your Hospitality Business
                            </h2>
                            <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                                Legacy systems slow you down and bleed profit. Here is why modern operators choose RestaurantHub.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center font-bold text-xl">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Zero Setup Barriers</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                    Run the entire app ecosystem on standard iOS, Android, or desktop devices you already own. Completely avoid buying proprietary hardware terminals.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center font-bold text-xl">
                                    2
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Real-Time Sync</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                    Orders sent from waiter tablets propagate instantly to the kitchen display screen (KDS) and POS billing, preventing order drops or billing disputes.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left space-y-4">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center font-bold text-xl">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">White-Labeled Ordering</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                    Provide customers with direct table reservation, takeaway scheduling, and digital payment web experiences, bypassing high third-party commissions.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Optional: Demo Customer View (Grid) */}
                <section id="demo" className="mb-24">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">See how your restaurant will look to customers</h2>
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {restaurants.slice(0,6).map((restaurant, idx) => (
                                <div key={idx} className="group cursor-pointer block hover:scale-105 transition-transform duration-200">
                                    <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 shadow-sm">
                                        <img src={restaurant.img || restaurant.logo || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"} alt={restaurant.name} className="w-full h-full object-cover" />
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

                {/* 3. Core Features */}
                <section id="features" className="mb-24">
                    <h2 className="text-3xl font-black text-center mb-12">Everything you need in one platform</h2>
                    <div className="flex overflow-x-auto gap-4 pb-8 pt-2 no-scrollbar justify-start lg:justify-center">
                        {coreFeatures.map((feature, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 min-w-[110px] cursor-pointer group">
                                <div className={`w-20 h-20 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} transform group-hover:-translate-y-2 group-hover:shadow-lg transition-all duration-300`}>
                                    {feature.icon}
                                </div>
                                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">{feature.name}</span>
                            </div>
                        ))}
                    </div>
                </section>



                {/* 5. Order Types */}
                <section className="mb-24 text-center">
                    <h2 className="text-3xl font-black tracking-tight mb-4">Manage every channel effortlessly</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-12">Whether customers dine in, take out, or order online, everything flows into one centralized dashboard.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Dine-In */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow group text-left">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Utensils size={28} /></div>
                            <h3 className="text-xl font-black mb-3">Dine-In Management</h3>
                            <p className="text-gray-500 font-medium text-sm">Visual floor plans, table status tracking, and split billing capabilities built right in.</p>
                        </div>
                        {/* Takeaway */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow group text-left">
                            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><ShoppingBag size={28} /></div>
                            <h3 className="text-xl font-black mb-3">Takeaway & Pickup</h3>
                            <p className="text-gray-500 font-medium text-sm">Scheduled pickups, auto-notifications for customers, and dedicated bagging workflows.</p>
                        </div>
                        {/* Delivery */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow group text-left">
                            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Globe size={28} /></div>
                            <h3 className="text-xl font-black mb-3">Online Delivery</h3>
                            <p className="text-gray-500 font-medium text-sm">Your own white-labeled ordering website to skip 30% third-party commission fees.</p>
                        </div>
                    </div>
                </section>

                {/* 6. Kitchen Workflow */}
                <section id="workflow" className="mb-24 bg-gray-900 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="text-center mb-16 relative z-10">
                        <h2 className="text-4xl font-black tracking-tight mb-6">Seamless Kitchen Workflow (KDS)</h2>
                        <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg">Digitize your kitchen. Route orders directly to the right stations and never miss a beat.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
                        <div className="space-y-8">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0"><ChefHat size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2">Color-Coded Tickets</h4>
                                    <p className="text-gray-400 font-medium leading-relaxed">Instantly know which orders are new, cooking, or delayed based on automated color coding. Stay ahead of the rush.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0"><Clock size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2">Prep Time Tracking</h4>
                                    <p className="text-gray-400 font-medium leading-relaxed">Monitor average prep times per dish and identify bottlenecks in your kitchen assembly line in real-time.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0"><Monitor size={28} /></div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2">Multi-Station Routing</h4>
                                    <p className="text-gray-400 font-medium leading-relaxed">Automatically send drinks to the bar and food to the grill station without printing physical tickets.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-2xl transform lg:rotate-2">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                                <span className="text-xl font-black text-gray-100 flex items-center gap-2"><ChefHat className="text-gray-400"/> Grill Station</span>
                                <span className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold border border-red-500/20">12 Pending</span>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
                                    <div className="flex justify-between text-sm mb-3"><span className="font-black text-red-400 text-lg">Table 12</span><span className="text-red-300 font-bold flex items-center gap-1"><Clock size={14}/> 14m ago</span></div>
                                    <div className="text-white font-bold text-lg">2x Truffle Burger</div>
                                    <div className="text-gray-300 text-sm mt-1 bg-gray-900/50 inline-block px-2 py-1 rounded">No onions, extra cheese</div>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl">
                                    <div className="flex justify-between text-sm mb-3"><span className="font-black text-yellow-400 text-lg">Takeaway #104</span><span className="text-yellow-300 font-bold flex items-center gap-1"><Clock size={14}/> 5m ago</span></div>
                                    <div className="text-white font-bold text-lg">1x Classic Cheeseburger</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. Reports & Analytics */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Powerful Analytics</h2>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto">Data-driven insights to help your restaurant grow. Make decisions based on real-time metrics.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Revenue</h4>
                            <div className="text-4xl font-black text-gray-900">₹24,592</div>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-50 w-fit px-3 py-1 rounded-lg"><LineChart size={16}/> +12% this week</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Orders</h4>
                            <div className="text-4xl font-black text-gray-900">1,248</div>
                            <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-50 w-fit px-3 py-1 rounded-lg"><ShoppingBag size={16}/> +8% this week</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Best Selling</h4>
                            <div className="text-2xl font-black text-gray-900 truncate">Truffle Burger</div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
                                <div className="h-full bg-orange-500 rounded-full w-[85%]"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 9. Mobile App Preview */}
                <section className="mb-24 flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden">
                    <div className="flex-1 space-y-6 relative z-10">
                        <div className="inline-block px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg font-bold text-sm border border-indigo-500/30">Native iOS & Android</div>
                        <h2 className="text-4xl font-black tracking-tight">Your Restaurant, in Their Pocket</h2>
                        <p className="text-lg text-indigo-200 font-medium">Launch your own branded mobile app. Increase customer loyalty, send push notifications, and drive repeat orders.</p>
                        <button className="bg-white text-indigo-900 font-bold px-8 py-3 rounded-xl mt-4 hover:bg-gray-100 transition-colors">Learn More</button>
                    </div>
                    <div className="flex-1 flex justify-center relative">
                        <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl relative overflow-hidden flex flex-col relative z-10 transform rotate-[-5deg]">
                            <div className="h-6 w-32 bg-gray-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                            <div className="p-4 pt-8 bg-red-500 text-white font-black text-xl text-center">MyRestaurant</div>
                            <div className="flex-1 bg-gray-50 p-4">
                                <div className="w-full h-32 bg-gray-200 rounded-xl mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 10. Testimonials */}
                <section className="mb-24 text-center">
                    <h2 className="text-3xl font-black tracking-tight mb-12">Loved by owners and managers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Sarah Jenkins", role: "Owner, The Rustic Spoon", text: "Switching to RestaurantHub was the best decision. Our table turnover increased by 30% in the first month." },
                            { name: "David Chen", role: "Manager, Golden Dragon", text: "The Kitchen Display System completely eliminated lost tickets. The kitchen is so much quieter now." },
                            { name: "Maria Garcia", role: "Founder, Taco Fiesta", text: "Having our own online ordering site saved us thousands in third-party delivery fees. Highly recommend!" }
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left relative">
                                <div className="text-yellow-400 flex gap-1 mb-6"><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/><Star className="fill-yellow-400" size={18}/></div>
                                <p className="text-gray-700 font-medium mb-6 text-lg leading-relaxed">"{t.text}"</p>
                                <div>
                                    <div className="font-black text-gray-900">{t.name}</div>
                                    <div className="text-sm text-gray-500 font-medium">{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 11. Pricing Plans */}
                <section id="pricing" className="mb-24 pt-12 border-t border-gray-100">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto mb-8">No hidden fees, no long-term contracts. Choose the plan that fits your growth.</p>
                        
                        <div className="flex items-center justify-center gap-3">
                            <span className={`font-bold ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
                            <button 
                                onClick={() => setIsYearly(!isYearly)}
                                className="w-14 h-8 bg-red-500 rounded-full relative transition-colors duration-300"
                            >
                                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${isYearly ? 'left-7' : 'left-1'}`}></div>
                            </button>
                            <span className={`font-bold flex items-center gap-2 ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
                                Yearly <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold mb-2">Starter</h3>
                            <p className="text-gray-500 text-sm font-medium mb-6">Perfect for small cafes and food trucks.</p>
                            <div className="text-4xl font-black mb-6">₹{isYearly ? '39' : '49'}<span className="text-lg text-gray-400 font-medium">/mo</span></div>
                            <Link to={`/staff/register?plan=Starter&billing=${isYearly ? 'yearly' : 'monthly'}`} className="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:border-gray-900 transition-colors mb-8 flex justify-center items-center">Start Free Trial</Link>
                            <div className="space-y-4">
                                {['1 Outlet', 'Basic POS Billing', 'QR Ordering', 'Email Support'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /><span className="font-medium text-sm text-gray-600">{f}</span></div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-900 text-white p-8 rounded-3xl border border-gray-800 shadow-2xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">Most Popular</div>
                            <h3 className="text-xl font-bold mb-2">Professional</h3>
                            <p className="text-gray-400 text-sm font-medium mb-6">For growing restaurants and multi-locations.</p>
                            <div className="text-4xl font-black mb-6">₹{isYearly ? '79' : '99'}<span className="text-lg text-gray-500 font-medium">/mo</span></div>
                            <Link to={`/staff/register?plan=Professional&billing=${isYearly ? 'yearly' : 'monthly'}`} className="w-full py-3 rounded-xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-colors mb-8 shadow-lg shadow-white/10 flex justify-center items-center">Choose Plan</Link>
                            <div className="space-y-4">
                                {['Up to 3 Outlets', 'Kitchen Display System', 'Online Ordering App', 'Advanced Analytics', 'Priority Support'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-red-400" /><span className="font-medium text-sm text-gray-300">{f}</span></div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                            <p className="text-gray-500 text-sm font-medium mb-6">Custom solutions for massive chains.</p>
                            <div className="text-4xl font-black mb-6">Custom</div>
                            {showContact ? (
                                <div className="w-full p-4 rounded-xl border-2 border-red-100 bg-red-50 text-left mb-8 transition-all animate-fade-in">
                                    <div className="flex items-center gap-2 font-bold text-gray-900 mb-2 text-lg">
                                        <Phone size={18} className="text-red-500" /> +1 (800) 123-4567
                                    </div>
                                    <div className="flex items-start gap-2 text-sm font-medium text-gray-700 leading-tight">
                                        <MapPin size={18} className="text-red-500 shrink-0" /> 
                                        <span>123 Innovation Way, Suite 500<br/>San Francisco, CA 94103</span>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowContact(true)} className="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:border-gray-900 transition-colors mb-8 flex justify-center items-center">Contact Sales</button>
                            )}
                            <div className="space-y-4">
                                {['Unlimited Outlets', 'Custom APIs & Webhooks', 'Dedicated Account Manager', 'SLA Guarantee'].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500" /><span className="font-medium text-sm text-gray-600">{f}</span></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 12. FAQ */}
                <section id="faq" className="mb-24 max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { q: "How long does it take to set up?", a: "You can be fully up and running in less than 24 hours. Our automated menu import tool can pull your existing items instantly." },
                            { q: "Do I need to buy expensive hardware?", a: "No! RestaurantHub is cloud-based and runs on any standard iPad, Android tablet, smartphone, or Windows PC you already own." },
                            { q: "What happens if my internet goes down?", a: "Our POS includes an Offline Mode that allows you to continue taking orders and printing receipts. It auto-syncs the data the moment you're back online." }
                        ].map((faq, i) => (
                            <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left font-bold text-lg hover:bg-gray-50 transition-colors">
                                    {faq.q}
                                    {openFaq === i ? <Minus size={20} className="text-red-500 shrink-0"/> : <Plus size={20} className="text-gray-400 shrink-0"/>}
                                </button>
                                {openFaq === i && <div className="p-6 pt-0 text-gray-600 font-medium leading-relaxed border-t border-gray-100">{faq.a}</div>}
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* 13. Footer */}
            <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800">
                <div className="max-w-[1200px] mx-auto px-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white"><Utensils size={18} /></div>
                                <h2 className="text-2xl font-black text-white tracking-tight">RestaurantHub</h2>
                            </div>
                            <p className="text-slate-400 text-sm mb-6 max-w-sm leading-relaxed">
                                The all-in-one operating system for modern restaurants. POS, inventory, online ordering, and analytics all perfectly synced.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 transition-all">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 transition-all">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><a href="#features" className="hover:text-red-400 transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-red-400 transition-colors">Pricing</a></li>
                                <li><a href="#why-choose-us" className="hover:text-red-400 transition-colors">Integrations</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><a href="#faq" className="hover:text-red-400 transition-colors">Help Center</a></li>
                                <li><button onClick={() => toast.success("Blog portal coming soon!")} className="hover:text-red-400 transition-colors text-left">Blog</button></li>
                                <li><button onClick={() => toast.success("Developer API keys will be available in your settings panel soon!")} className="hover:text-red-400 transition-colors text-left">API</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><a href="#about" className="hover:text-red-400 transition-colors">About Us</a></li>
                                <li><a href="#pricing" onClick={() => setShowContact(true)} className="hover:text-red-400 transition-colors">Contact</a></li>
                                <li><button onClick={() => toast.success("Privacy Policy & Terms of Service are available in platform documentation.")} className="hover:text-red-400 transition-colors text-left">Privacy</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm">© 2026 RestaurantHub Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
