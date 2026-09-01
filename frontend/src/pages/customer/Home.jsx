import { useState, useEffect, useRef } from 'react';
import { 
    Utensils, ArrowRight, Star, ChevronDown, CheckCircle2, 
    Monitor, QrCode, Boxes, Users, LineChart, Store, Calculator, CalendarDays, 
    ChefHat, Clock, Globe, X, Sparkles, Flame, Shield,
    ShoppingBag, ChevronRight, Smartphone, Receipt, Menu as MenuIcon, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
    // Food Showcase Items - User-Provided Video Cards
    const foodItems = [
        {
            id: 'food1',
            title: 'Artisanal Tea Pouring & Spices Arrangement',
            subtitle: 'Hand-crafted Chai with Cardamom, Cinnamon & Star Anise',
            price: '₹149',
            rating: '4.9',
            prepTime: '5-8 min',
            videoUrl: '/tea-pouring-spices.mp4',
            posterUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
            desc: 'Freshly poured spiced milk tea infused with hand-crushed cardamom pods, cinnamon sticks, ginger, and aromatic star anise.'
        },
        {
            id: 'food2',
            title: 'South Indian Filter Kaapi & Dosa',
            subtitle: 'Authentic Meter Kaapi & Crispy Masala Dosa',
            price: '₹180',
            rating: '4.9',
            prepTime: '10-12 min',
            videoUrl: '/masala-dosa-video.mp4',
            posterUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
            desc: 'Foamy chicory filter coffee served alongside golden ghee roast masala dosa and fresh chutneys.'
        }
    ];

    const defaultPlans = [
        { _id: 'p1', name: 'Basic', monthlyPrice: 49, yearlyPrice: 39, features: ['1 Restaurant Branch', 'Basic POS Billing & KOT', 'QR Code Dine-In Ordering', 'Real-time Stock Tracking', 'Email & Chat Support'] },
        { _id: 'p2', name: 'Pro', monthlyPrice: 99, yearlyPrice: 79, features: ['Up to 3 Branches', 'Kitchen Display System (KDS)', 'Dine-In + Delivery Integration', 'Advanced Revenue Analytics', 'Automated Low-Stock Alerts', '24/7 Priority Support'] },
        { _id: 'p3', name: 'Enterprise', monthlyPrice: 199, yearlyPrice: 159, features: ['Unlimited Branches', 'Custom API & Webhooks', 'Dedicated Account Manager', 'Multi-Currency & Custom Tax Rules', 'SLA 99.9% Uptime Guarantee', '24/7 Phone & On-Site Support'] }
    ];

    const containerRef = useRef(null);
    const heroTitleRef = useRef(null);
    const cursorRef = useRef(null);
    const cursorFollowerRef = useRef(null);

    const [plans, setPlans] = useState(defaultPlans);
    const [plansLoading, setPlansLoading] = useState(false);
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Active Card Video State
    const [hoveredCardIndex, setHoveredCardIndex] = useState(0);

    // Interactive Workflow Carousel State
    const [workflowTab, setWorkflowTab] = useState('customer'); // 'customer' | 'restaurant'
    const [customerStep, setCustomerStep] = useState(0);
    const [restaurantStep, setRestaurantStep] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Scroll listener for header & button visibility
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 80) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Initialize Lenis Smooth Scroll Inertia
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0, 0);

        return () => {
            lenis.destroy();
        };
    }, []);

    // Fetch live pricing plans dynamically from Super Admin
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans', { timeout: 3000 });
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setPlans(res.data);
                }
            } catch (error) {
                // Keep default plans
            } finally {
                setPlansLoading(false);
            }
        };

        fetchPlans();
        document.documentElement.classList.remove('dark');
    }, []);

    // Custom Ring Cursor Tracker
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (cursorRef.current && cursorFollowerRef.current) {
                gsap.to(cursorRef.current, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.1,
                    ease: 'power2.out'
                });
                gsap.to(cursorFollowerRef.current, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // GSAP ScrollTrigger Character Stagger Title Reveal
    useEffect(() => {
        const ctx = gsap.context(() => {
            const heroChars = heroTitleRef.current?.querySelectorAll('.char-span');
            if (heroChars && heroChars.length > 0) {
                gsap.fromTo(
                    heroChars,
                    { y: 60, opacity: 0, rotateX: -30 },
                    { 
                        y: 0, 
                        opacity: 1, 
                        rotateX: 0, 
                        stagger: 0.03, 
                        duration: 1, 
                        ease: 'power4.out',
                        delay: 0.1
                    }
                );
            }
        }, containerRef);

        return () => ctx.revert();
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

    // Magnetic Button Micro-interactions
    const handleMagneticMove = (e) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: 'power2.out' });
    };

    const handleMagneticLeave = (e) => {
        gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    };

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

    const customerSteps = [
        {
            title: "1. Scan Table QR Code",
            subtitle: "Instant Digital Menu Access",
            desc: "Guest scans table QR code using phone camera. No app download or registration required.",
            badge: "0.2s Instant Load",
            badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
            icon: <QrCode size={28} className="text-[#FF2D55]" />,
            highlight: "Contactless & Hygiene Safe",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-emerald-400 font-bold">● Table #04 Active</span>
                        <span className="text-slate-400">QR Session: #8921</span>
                    </div>
                    <div className="space-y-1.5 text-slate-300">
                        <p>✓ Camera Auto-Detect URL</p>
                        <p>✓ Instant Menu Token Verified</p>
                        <p>✓ Smart Menu Ready</p>
                    </div>
                </div>
            )
        },
        {
            title: "2. Browse Live Digital Menu",
            subtitle: "Rich Photos, Customization & Filters",
            desc: "Customers explore food items with high-res photos, veg/non-veg tags, spice levels, and custom add-ons.",
            badge: "Dynamic Stock Sync",
            badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
            icon: <Utensils size={28} className="text-[#FF6A00]" />,
            highlight: "Real-time Item Availability",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center bg-slate-800 p-2 rounded-xl">
                        <span className="font-bold text-amber-400">Butter Chicken Masala</span>
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">In Stock</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800 p-2 rounded-xl">
                        <span className="font-bold text-slate-300">Filter Coffee Brew</span>
                        <span className="text-slate-400 text-[10px]">Custom Spice</span>
                    </div>
                </div>
            )
        },
        {
            title: "3. Real-time Order Placement",
            subtitle: "Direct KDS Kitchen Dispatch",
            desc: "Order is dispatched straight to the Kitchen Display System (KDS) and POS cashier terminal simultaneously.",
            badge: "Zero Wait Time",
            badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
            icon: <Clock size={28} className="text-blue-500" />,
            highlight: "Automated Ticket Printing",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-blue-400 font-bold border-b border-slate-800 pb-2">
                        <span>KDS Ticket #1042</span>
                        <span>Status: Cooking</span>
                    </div>
                    <div className="text-slate-300 space-y-1">
                        <p>• 1x Masala Dosa (Extra Sambar)</p>
                        <p>• 2x South Indian Filter Coffee</p>
                    </div>
                </div>
            )
        },
        {
            title: "4. Digital Bill & Payment",
            subtitle: "UPI, Cards & Split Bills",
            desc: "Guests review itemized digital receipt, apply promo coupons, and pay instantly via UPI or card.",
            badge: "Instant Receipt",
            badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
            icon: <Receipt size={28} className="text-purple-500" />,
            highlight: "Auto POS Settlement",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                        <span>Payment Received</span>
                        <span>₹480.00</span>
                    </div>
                    <p className="text-slate-400">Transaction ID: UPI/2026/89201948</p>
                </div>
            )
        }
    ];

    const restaurantSteps = [
        {
            title: "1. Real-time Order Reception on POS",
            subtitle: "Centralized Order Stream",
            desc: "All dine-in, takeaway, and online orders stream directly into the master POS terminal in real time.",
            badge: "Multi-Channel Stream",
            badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
            icon: <Monitor size={28} className="text-[#FF2D55]" />,
            highlight: "No Manual Entry",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-rose-400 font-bold border-b border-slate-800 pb-2">
                        <span>POS Terminal #1</span>
                        <span>Active Orders: 12</span>
                    </div>
                    <p className="text-slate-300">Sync: Dine-In + Swiggy + Zomato</p>
                </div>
            )
        },
        {
            title: "2. Kitchen Display (KDS) Routing",
            subtitle: "Prep Time & Station Management",
            desc: "Orders are routed to specific kitchen prep stations (Grill, Beverages, Sweets) with timer alerts.",
            badge: "Color-Coded Timers",
            badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
            icon: <ChefHat size={28} className="text-amber-500" />,
            highlight: "Zero Verbal Miscommunication",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
                        <span>Station: Beverages</span>
                        <span>Prep Time: 03:45m</span>
                    </div>
                    <p className="text-slate-300">Ticket #1042 ready for pickup</p>
                </div>
            )
        },
        {
            title: "3. Smart Inventory & Stock Auto-Deduction",
            subtitle: "Recipe-Based Stock Management",
            desc: "Ingredients automatically deduct from inventory with low-stock warnings and vendor purchase orders.",
            badge: "Auto Stock Track",
            badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
            icon: <Boxes size={28} className="text-emerald-500" />,
            highlight: "Prevent Waste & Pilferage",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                        <span>Milk Stock: 42L</span>
                        <span>Coffee Powder: 12kg</span>
                    </div>
                    <p className="text-slate-300">Auto PO generated for Tea Leaves</p>
                </div>
            )
        },
        {
            title: "4. Analytics & Daily Revenue Reporting",
            subtitle: "Live Profitability & Staff Metrics",
            desc: "Track sales velocity, top-selling dishes, peak ordering hours, and profit margins from any phone or laptop.",
            badge: "Live Dashboard",
            badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
            icon: <LineChart size={28} className="text-cyan-500" />,
            highlight: "Automated Daily P&L",
            demoUI: (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                        <span>Today's Sales: ₹42,850</span>
                        <span>Orders: 184</span>
                    </div>
                    <p className="text-slate-300">Margin: 68.4% | Peak: 1:30 PM - 3:00 PM</p>
                </div>
            )
        }
    ];

    const faqs = [
        {
            q: "How fast can I set up my restaurant on RestaurantHub?",
            a: "You can create your account and launch a fully functional digital POS with table QR ordering in under 10 minutes. Our setup wizard imports your menu items seamlessly."
        },
        {
            q: "Does RestaurantHub support offline billing if the internet goes down?",
            a: "Yes! Our POS application supports local offline storage so billing and KOT printing continue uninterrupted even during internet outages, syncing automatically once reconnected."
        },
        {
            q: "Is multi-branch management included in the Pro & Enterprise plans?",
            a: "Absolutely. Pro supports up to 3 branches, while Enterprise offers unlimited branches with centralized inventory, staff permissions, and consolidated financial reports."
        },
        {
            q: "Do customers need to download an app to order via QR code?",
            a: "No app download or registration is required. Guests simply scan the table QR code using their standard phone camera, browse the live menu, and place orders directly in their mobile web browser."
        }
    ];

    const currentSteps = workflowTab === 'customer' ? customerSteps : restaurantSteps;
    const activeStepIdx = workflowTab === 'customer' ? customerStep : restaurantStep;

    const mainTitleText = "RESTAURANTHUB POS";

    return (
        <div ref={containerRef} className="w-full min-h-screen bg-[#FAFAF8] text-slate-900 font-sans selection:bg-[#FF2D55] selection:text-white relative overflow-x-hidden transition-colors duration-300">
            
            {/* Custom Interactive Ring Cursor */}
            <div 
                ref={cursorRef} 
                className="fixed top-0 left-0 w-3.5 h-3.5 bg-[#FF2D55] rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 shadow-lg hidden md:block" 
            />
            <div 
                ref={cursorFollowerRef} 
                className="fixed top-0 left-0 w-11 h-11 border-2 border-[#FF6A00]/40 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 hidden md:block" 
            />

            {/* Subtle Film Grain Noise Texture Canvas Overlay (2-3%) */}
            <div 
                className="fixed inset-0 pointer-events-none z-[9990] opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(15,23,42,0.8) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}
            />

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
                        <a href="#faq" className="text-slate-700 hover:text-slate-950 transition-colors">FAQ</a>
                        <Link to="/contact" className="text-slate-700 hover:text-slate-950 transition-colors">Contact</Link>
                    </nav>

                    {/* Right CTA Actions & Mobile Toggle */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold shrink-0">
                        <Link 
                            to="/menu" 
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={handleMagneticLeave}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        >
                            <ShoppingBag size={16} className="sm:w-4 sm:h-4" />
                            <span>Order Now</span>
                        </Link>

                        <Link to="/customer/login" className="hidden xs:inline-block text-slate-700 hover:text-slate-950 transition-colors px-2.5 py-1.5 sm:px-3 rounded-xl hover:bg-slate-100">
                            Log In
                        </Link>

                        <Link 
                            to="/register" 
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={handleMagneticLeave}
                            className="hidden lg:flex bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-[#FF2D55]/25 transition-all focus:outline-none"
                        >
                            Get Started Free
                        </Link>

                        {/* Mobile Hamburger Menu Toggle Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation Menu"
                            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-3 pt-3 border-t border-slate-200/80 space-y-2 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
                        <div className="space-y-1">
                            <button
                                onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-800 font-extrabold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span>✨</span> Features &amp; Modules
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
                                        <span>📊 Management Suite</span>
                                        <ChevronRight size={14} className="text-[#FF2D55]" />
                                    </Link>
                                    <Link 
                                        to="/features/details?module=orders" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-2.5 rounded-xl text-slate-800 font-bold text-xs hover:bg-[#FF6A00]/10 transition-colors"
                                    >
                                        <span>🍳 Kitchen Workflow (KDS)</span>
                                        <ChevronRight size={14} className="text-[#FF6A00]" />
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
                        <a 
                            href="#faq" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                        >
                            FAQ
                        </a>
                    </div>
                )}
            </header>


            {/* ========================================================================= */}
            {/* HERO SECTION: 100% CRYSTAL CLEAR BACKGROUND VIDEO WITH PULSING SCROLL ICON */}
            {/* ========================================================================= */}
            <section id="demo" className="min-h-[92vh] sm:min-h-screen flex flex-col justify-center items-center text-center px-4 py-20 sm:py-28 relative z-10 overflow-hidden bg-slate-950">
                
                {/* 100% Crystal Clear Background Video Container with Poster Fallback */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img 
                        src="/assets/images/saas-hero-scene-1.png" 
                        alt="Restaurant POS Hero Scene"
                        className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105"
                    />
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/assets/images/saas-hero-scene-1.png"
                        className="absolute inset-0 w-full h-full object-cover opacity-95 scale-100"
                    >
                        <source src="/hero-bg.mp4" type="video/mp4" />
                    </video>
                    {/* Subtle Overlay for header contrast while keeping video crystal clear */}
                    <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50 pointer-events-none" />
                </div>

                <div className="flex flex-col items-center justify-center my-auto relative z-10 max-w-5xl mx-auto pt-4 space-y-6">
                    {/* Small Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/85 border border-white/20 text-[#FF2D55] font-extrabold text-xs sm:text-sm shadow-2xl backdrop-blur-md">
                        <Star size={14} className="fill-[#FF2D55] text-[#FF2D55]" />
                        <span className="text-white">Rated #1 Restaurant POS Platform 2026</span>
                    </div>

                    {/* Character Stagger Heading Directly On Video */}
                    <h1 ref={heroTitleRef} className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.1] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] flex justify-center flex-wrap">
                        {mainTitleText.split('').map((char, index) => (
                            <span key={index} className="char-span inline-block">
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        ))}
                    </h1>

                    {/* Subtitle Directly On Video */}
                    <p className="text-base sm:text-xl text-slate-100 font-semibold max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                        Streamline your restaurant operations, increase revenue, manage inventory, and delight customers with our all-in-one Restaurant POS platform.
                    </p>

                    {/* Action Buttons Directly On Video */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none pt-4">
                        <Link 
                            to="/staff/register" 
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={handleMagneticLeave}
                            className="w-full sm:w-auto bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold text-base px-8 py-3.5 rounded-2xl shadow-2xl shadow-[#FF2D55]/40 transition-all flex items-center justify-center gap-2.5 group"
                        >
                            <span>Get Started Free</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                        </Link>

                        <Link 
                            to="/features/management" 
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={handleMagneticLeave}
                            className="w-full sm:w-auto bg-black/60 hover:bg-black/80 text-white font-extrabold text-base px-8 py-3.5 rounded-2xl border border-white/30 shadow-2xl backdrop-blur-md transition-all flex items-center justify-center gap-2.5 group"
                        >
                            <span>Explore Features</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform text-[#FF2D55]" />
                        </Link>
                    </div>

                    {/* Pulsing Scroll Indicator Icon (Clickable & smooth scrolls to features) */}
                    <button
                        onClick={() => {
                            const el = document.getElementById('features');
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                            } else {
                                window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
                            }
                        }}
                        aria-label="Scroll to explore features"
                        className={`pt-10 flex flex-col items-center gap-2 text-xs font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 group focus:outline-none ${scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <span className="uppercase tracking-widest text-[10px] group-hover:text-[#FF2D55] transition-colors">SCROLL TO EXPLORE</span>
                        <ChevronDown size={22} className="animate-bounce text-[#FF2D55] group-hover:scale-125 transition-transform" />
                    </button>
                </div>
            </section>


            {/* Main Content Body - Pure White Background */}
            <main id="features" className="w-full bg-white py-16 space-y-24 relative z-10">
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

                    {/* Enterprise Platform Summary Grid */}
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
                    <section className="space-y-12">
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

                    {/* Complete End-to-End Workflow Section with Step Cards */}
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
                                    <span>👨‍🍳 Restaurant Partner &amp; Staff Ops</span>
                                </button>
                            </div>
                        </div>

                        {/* Workflow Step Grid Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            {currentSteps.map((step, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => {
                                        if (workflowTab === 'customer') setCustomerStep(idx);
                                        else setRestaurantStep(idx);
                                    }}
                                    className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-4 flex flex-col justify-between ${
                                        activeStepIdx === idx 
                                            ? 'bg-white border-[#FF2D55] shadow-xl scale-[1.03] ring-2 ring-[#FF2D55]/20' 
                                            : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm'
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-slate-100 rounded-xl">
                                                {step.icon}
                                            </div>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${step.badgeColor}`}>
                                                {step.badge}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-900">{step.title}</h4>
                                            <p className="text-xs font-bold text-[#FF2D55] mt-0.5">{step.subtitle}</p>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{step.desc}</p>
                                    </div>

                                    {/* Live Simulated UI Container */}
                                    <div className="pt-2">
                                        {step.demoUI}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>


                    {/* ========================================================================= */}
                    {/* EXCLUSIVE USER VIDEO SHOWCASE CARDS (ONLY USER PROVIDED VIDEOS) */}
                    {/* ========================================================================= */}
                    <section id="food-showcase" className="space-y-10 py-8">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF2D55]/10 to-[#FF6A00]/10 border border-[#FF2D55]/20 text-[#FF2D55] font-black text-xs uppercase tracking-wider">
                                <Utensils size={14} /> Signature Culinary Showcase
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                Gourmet Food &amp; Beverage Experience
                            </h2>
                            <p className="text-slate-600 font-medium text-base sm:text-lg">
                                Watch live dish preparation videos directly inside the cards and order instantly.
                            </p>
                        </div>

                        {/* Exclusive 2-Column Video Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
                            {foodItems.map((food, idx) => {
                                const isHovered = hoveredCardIndex === idx;

                                return (
                                    <div 
                                        key={food.id}
                                        onMouseEnter={() => setHoveredCardIndex(idx)}
                                        className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer ${
                                            isHovered 
                                                ? 'border-[#FF2D55] shadow-2xl ring-4 ring-[#FF2D55]/15 scale-[1.01]' 
                                                : 'border-slate-200 shadow-md hover:shadow-xl hover:border-slate-300'
                                        }`}
                                    >
                                        {/* Card Media Frame: Clean Video Player */}
                                        <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-950">
                                            <video
                                                key={food.id}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                poster={food.posterUrl}
                                                className="w-full h-full object-cover transition-transform duration-700"
                                            >
                                                <source src={food.videoUrl} type="video/mp4" />
                                            </video>

                                            {/* Rating & Prep Time Bar */}
                                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-bold text-white z-10">
                                                <span className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                                    <span>{food.rating} Rating</span>
                                                </span>

                                                <span className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-amber-300 shadow-md">
                                                    <Clock size={14} /> {food.prepTime}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Body Content */}
                                        <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-2.5">
                                                <div className="flex justify-between items-start gap-3">
                                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight group-hover:text-[#FF2D55] transition-colors">
                                                        {food.title}
                                                    </h3>
                                                    <span className="text-xl sm:text-2xl font-black text-[#FF2D55] bg-[#FF2D55]/10 px-3.5 py-1 rounded-xl shrink-0">
                                                        {food.price}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-bold text-[#FF2D55]">
                                                    {food.subtitle}
                                                </p>

                                                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                                                    {food.desc}
                                                </p>
                                            </div>

                                            {/* Prominent Order Now Button at Bottom of Each Card */}
                                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                                <Link 
                                                    to="/menu"
                                                    className="w-full bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-extrabold text-base py-4 px-6 rounded-2xl shadow-lg shadow-[#FF2D55]/25 transition-all flex items-center justify-center gap-2.5 group/btn"
                                                >
                                                    <ShoppingBag size={18} />
                                                    <span>Order Now</span>
                                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
                                                </Link>

                                                <p className="text-[11px] text-center font-bold text-slate-400">
                                                    Instant table ordering • Contactless &amp; Fast Prep
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>





                    {/* ========================================================================= */}
                    {/* FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
                    {/* ========================================================================= */}
                    <section id="faq" className="space-y-10 py-8 max-w-4xl mx-auto">
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] font-bold text-xs uppercase tracking-wider">
                                <HelpCircle size={14} /> Got Questions?
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-slate-600 font-medium text-sm sm:text-base">
                                Everything you need to know about setting up and running your restaurant with RestaurantHub.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div 
                                        key={idx}
                                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                                    >
                                        <button
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full p-6 text-left font-black text-slate-900 text-base sm:text-lg flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <span>{faq.q}</span>
                                            <ChevronDown size={20} className={`text-[#FF2D55] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="px-6 pb-6 pt-1 text-slate-600 font-medium text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </main>

            {/* ========================================================================= */}
            {/* COMPLETE RESTAURANTHUB FOOTER */}
            {/* ========================================================================= */}
            <footer className="bg-slate-950 text-white border-t border-slate-800 py-16 px-6 sm:px-12 relative z-10 font-sans">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
                    
                    {/* Brand Column */}
                    <div className="space-y-4 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-gradient-to-tr from-[#FF2D55] to-[#FF6A00] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                <Utensils size={18} />
                            </div>
                            <span className="text-xl font-black text-white">
                                Restaurant<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-[#FF6A00]">Hub</span>
                            </span>
                        </Link>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            The enterprise-grade cloud operating system for modern restaurants, cafes, food courts, and multi-branch chains.
                        </p>
                    </div>

                    {/* Navigation Columns */}
                    <div>
                        <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Platform Modules</h4>
                        <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                            <li><Link to="/features/management" className="hover:text-white transition-colors">Management Suite</Link></li>
                            <li><Link to="/features/details?module=orders" className="hover:text-white transition-colors">Kitchen Display (KDS)</Link></li>
                            <li><Link to="/features/details?module=intelligence" className="hover:text-white transition-colors">POS Billing System</Link></li>
                            <li><Link to="/menu" className="hover:text-white transition-colors">Dine-In Digital Menu</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Resources</h4>
                            <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                                <li><a href="#food-showcase" className="hover:text-white transition-colors">Food Showcase</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Subscription Plans</a></li>
                                <li><a href="#workflow" className="hover:text-white transition-colors">Interactive Workflows</a></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors">24/7 Support Center</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Account &amp; Access</h4>
                        <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                            <li><Link to="/staff/register" className="hover:text-white transition-colors">Register Partner Account</Link></li>
                            <li><Link to="/customer/login" className="hover:text-white transition-colors">Customer Login</Link></li>
                            <li><Link to="/staff/login" className="hover:text-white transition-colors">Staff &amp; POS Portal</Link></li>
                            <li><Link to="/super-admin/login" className="hover:text-white transition-colors">Super Admin Portal</Link></li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-slate-500 gap-4">
                    <p>© 2026 RestaurantHub — Built By Ruturaj. All Rights Reserved.</p>
                    <div className="flex items-center gap-6">
                        <span className="hover:text-slate-[#FF2D55] cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
                        <span className="hover:text-slate-300 cursor-pointer">SLA Guarantee</span>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default Home;
