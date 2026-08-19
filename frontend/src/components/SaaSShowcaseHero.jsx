import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
    TrendingUp, ShoppingBag, DollarSign, Clock, Users, Star, 
    CheckCircle2, Bell, AlertTriangle, ArrowRight, ChevronRight, 
    Sparkles, Shield, Utensils, Zap, BarChart3, RefreshCw
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Reusable Dashboard Card Wrapper Component
const DashboardCard = ({ children, className = '', id, style }) => (
    <div 
        id={id}
        style={style}
        className={`absolute bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-shadow duration-300 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 pointer-events-auto ${className}`}
    >
        {children}
    </div>
);

const SaaSShowcaseHero = () => {
    const heroRef = useRef(null);
    const textRef = useRef(null);
    const cardsContainerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Main GSAP ScrollTrigger timeline for Hero parallax convergence
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.2,
                    invalidateOnRefresh: true
                }
            });

            // Card 1: Top-Left (Live Orders)
            tl.fromTo('#card-live-orders', 
                { x: '-120%', y: '-60%', rotate: -8, scale: 0.85, opacity: 0.4 },
                { x: '0%', y: '0%', rotate: -3, scale: 1, opacity: 1, ease: 'power2.out' },
                0
            );

            // Card 2: Top-Right (Revenue Analytics)
            tl.fromTo('#card-revenue', 
                { x: '120%', y: '-70%', rotate: 8, scale: 0.85, opacity: 0.4 },
                { x: '0%', y: '0%', rotate: 2, scale: 1, opacity: 1, ease: 'power2.out' },
                0
            );

            // Card 3: Middle-Left (Sales Stats)
            tl.fromTo('#card-sales-stats', 
                { x: '-140%', y: '20%', rotate: -6, scale: 0.88, opacity: 0.3 },
                { x: '0%', y: '0%', rotate: -2, scale: 1, opacity: 1, ease: 'power2.out' },
                0
            );

            // Card 4: Middle-Right (Customer Rating)
            tl.fromTo('#card-customer-rating', 
                { x: '140%', y: '20%', rotate: 6, scale: 0.88, opacity: 0.3 },
                { x: '0%', y: '0%', rotate: 3, scale: 1, opacity: 1, ease: 'power2.out' },
                0
            );

            // Card 5: Bottom-Left (Menu Management)
            tl.fromTo('#card-menu-mgmt', 
                { x: '-110%', y: '100%', rotate: -10, scale: 0.85, opacity: 0.2 },
                { x: '0%', y: '0%', rotate: -4, scale: 1, opacity: 1, ease: 'power2.out' },
                0
            );

            // Card 6: Bottom-Right (Inventory Alerts)
            tl.fromTo('#card-inventory', 
                { x: '110%', y: '100%', rotate: 10, scale: 0.85, opacity: 0.2 },
                { x: '0%', y: '0%', rotate: 4, scale: 1, opacity: 1, ease: 'power2.out' },
                0
            );

            // Card 7: Far Top Left (Table Reservations)
            tl.fromTo('#card-reservations', 
                { x: '-160%', y: '-10%', rotate: 5, scale: 0.8, opacity: 0 },
                { x: '0%', y: '0%', rotate: 1, scale: 0.95, opacity: 0.9, ease: 'power2.out' },
                0
            );

            // Card 8: Far Top Right (Staff Performance)
            tl.fromTo('#card-staff', 
                { x: '160%', y: '-10%', rotate: -5, scale: 0.8, opacity: 0 },
                { x: '0%', y: '0%', rotate: -1, scale: 0.95, opacity: 0.9, ease: 'power2.out' },
                0
            );

            // Card 9: Bottom Center Left (Notifications)
            tl.fromTo('#card-notifications', 
                { x: '-80%', y: '130%', rotate: -4, scale: 0.8, opacity: 0 },
                { x: '0%', y: '0%', rotate: -2, scale: 0.95, opacity: 0.95, ease: 'power2.out' },
                0
            );

            // Card 10: Bottom Center Right (Kitchen Queue)
            tl.fromTo('#card-kitchen', 
                { x: '80%', y: '130%', rotate: 4, scale: 0.8, opacity: 0 },
                { x: '0%', y: '0%', rotate: 2, scale: 0.95, opacity: 0.95, ease: 'power2.out' },
                0
            );

            // Subtle continuous floating animation loop for ambient SaaS feel
            gsap.to('.floating-card', {
                y: '+=8',
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: 'sine.easeInOut',
                stagger: {
                    amount: 1.5,
                    from: 'random'
                }
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section 
            ref={heroRef}
            className="relative min-h-[110vh] lg:min-h-[120vh] w-full bg-gradient-to-b from-slate-50 via-white to-slate-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden flex flex-col items-center justify-center pt-24 pb-20 px-4 transition-colors duration-300"
        >
            {/* Ambient Background Grid & Glows */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-rose-500/10 via-orange-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Central Hero Content */}
            <div 
                ref={textRef}
                className="relative z-20 max-w-4xl mx-auto text-center space-y-6 pt-10 pb-16 px-4"
            >
                {/* Product Tag Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-md text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider">
                    <span className="flex h-2 w-2 rounded-full bg-[#FF2D55] animate-pulse" />
                    <span>NEXT-GEN RESTAURANT SAAS ENGINE</span>
                    <ChevronRight size={14} className="text-slate-400" />
                </div>

                {/* Main Centered Headline */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] font-sans">
                    Manage Your Restaurant <br className="hidden sm:inline" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF2D55] via-[#FF551C] to-[#FF6A00]">
                        Smarter & Faster
                    </span>
                </h1>

                {/* Supporting Description */}
                <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                    Unify real-time POS billing, kitchen KDS, automated inventory, table QR ordering, and multi-branch revenue analytics in one high-performance platform.
                </p>

                {/* CTA Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                    <Link
                        to="/staff/register"
                        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FF2D55] to-[#FF6A00] hover:from-[#E0264A] hover:to-[#E55F00] text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-500/25 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                    >
                        <span>Start 1-Day Free Trial</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <Link
                        to="/menu"
                        className="w-full sm:w-auto px-7 py-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-black text-sm rounded-2xl shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Utensils size={16} className="text-[#FF2D55]" />
                        <span>Explore Customer Portal</span>
                    </Link>
                </div>

                {/* Feature Pills */}
                <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-extrabold text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Instant Activation</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Multi-Terminal POS</div>
                    <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Zero Hardware Lock-in</div>
                </div>
            </div>

            {/* ── FLOATING DASHBOARD CARDS LAYER ────────────────────────────────── */}
            <div 
                ref={cardsContainerRef}
                className="absolute inset-0 max-w-[1400px] mx-auto pointer-events-none z-10 hidden md:block"
            >

                {/* CARD 1: Live Orders Dashboard (Top Left) */}
                <DashboardCard 
                    id="card-live-orders" 
                    className="floating-card top-[12%] left-[3%] w-[310px]"
                >
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Live Table Orders</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                            3 Active
                        </span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                            <div>
                                <p className="font-extrabold text-slate-900 dark:text-slate-100">Table #08 • Dine-In</p>
                                <p className="text-[10px] text-slate-500">2x Paneer Tikka, 1x Naan</p>
                            </div>
                            <span className="font-black text-rose-600">₹680</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                            <div>
                                <p className="font-extrabold text-slate-900 dark:text-slate-100">Table #14 • QR Order</p>
                                <p className="text-[10px] text-slate-500">1x Butter Chicken, Rice</p>
                            </div>
                            <span className="font-black text-rose-600">₹850</span>
                        </div>
                    </div>
                </DashboardCard>

                {/* CARD 2: Revenue Analytics Chart (Top Right) */}
                <DashboardCard 
                    id="card-revenue" 
                    className="floating-card top-[10%] right-[3%] w-[330px]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">TODAY'S REVENUE</span>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">₹1,48,920</h4>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                            <TrendingUp size={14} /> +28.4%
                        </span>
                    </div>
                    {/* Visual Mock Trendline Chart */}
                    <div className="h-16 w-full flex items-end gap-1.5 pt-2">
                        {[40, 65, 45, 80, 95, 70, 100, 85, 110].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-rose-500 to-orange-400 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <span>12 PM</span><span>4 PM</span><span>8 PM</span><span>NOW</span>
                    </div>
                </DashboardCard>

                {/* CARD 3: Sales Statistics Widget (Middle Left) */}
                <DashboardCard 
                    id="card-sales-stats" 
                    className="floating-card top-[42%] left-[1.5%] w-[260px]"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-rose-500/10 text-[#FF2D55] rounded-xl">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">AVG TICKET SIZE</p>
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">₹1,240 <span className="text-xs font-bold text-emerald-500">↑ 12%</span></p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-full w-[78%]" />
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mt-2 text-right">78% Daily Target Reached</p>
                </DashboardCard>

                {/* CARD 4: Customer Reviews (Middle Right) */}
                <DashboardCard 
                    id="card-customer-rating" 
                    className="floating-card top-[42%] right-[1.5%] w-[280px]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className="fill-amber-400" />
                            ))}
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">4.9 / 5.0</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic line-clamp-2">
                        "Lightning fast table QR billing! Food was served piping hot in 10 mins."
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verified Dine-In Guest
                    </div>
                </DashboardCard>

                {/* CARD 5: Menu Management Panel (Bottom Left) */}
                <DashboardCard 
                    id="card-menu-mgmt" 
                    className="floating-card bottom-[12%] left-[4%] w-[290px]"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Menu Item Stock Status</span>
                        <RefreshCw size={12} className="text-slate-400 animate-spin" />
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Butter Chicken</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">IN STOCK</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Mysore Masala Dosa</span>
                            <span className="text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">LOW STOCK</span>
                        </div>
                    </div>
                </DashboardCard>

                {/* CARD 6: Inventory Status & Alerts (Bottom Right) */}
                <DashboardCard 
                    id="card-inventory" 
                    className="floating-card bottom-[12%] right-[4%] w-[300px]"
                >
                    <div className="flex items-center gap-2 mb-2 text-amber-500">
                        <AlertTriangle size={16} />
                        <span className="font-black text-xs uppercase tracking-wider">Inventory Alert</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                        Dairy Stock: Amul Cheese (2.5 kg left)
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[25%]" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                        <span>Min Threshold: 5kg</span>
                        <span className="text-rose-500 cursor-pointer hover:underline">Auto Re-order</span>
                    </div>
                </DashboardCard>

                {/* CARD 7: Table Reservations (Far Top Left) */}
                <DashboardCard 
                    id="card-reservations" 
                    className="floating-card top-[26%] left-[1.5%] w-[250px]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">TABLE BOOKINGS</span>
                        <span className="text-xs font-black text-indigo-600">Tonight (6)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">
                            T12
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 dark:text-slate-100">VIP Party (4 Guests)</p>
                            <p className="text-[10px] text-slate-500 font-semibold">Reserved for 8:30 PM</p>
                        </div>
                    </div>
                </DashboardCard>

                {/* CARD 8: Staff Performance (Far Top Right) */}
                <DashboardCard 
                    id="card-staff" 
                    className="floating-card top-[26%] right-[1.5%] w-[250px]"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">KITCHEN EFFICIENCY</span>
                        <Zap size={14} className="text-amber-500" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xl font-black text-slate-900 dark:text-slate-100">8.4 mins</p>
                            <p className="text-[10px] font-bold text-emerald-500">Avg Prep Speed (-1.2m)</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center text-xs font-black text-emerald-600">
                            96%
                        </div>
                    </div>
                </DashboardCard>

                {/* CARD 9: Notifications (Bottom Center Left) */}
                <DashboardCard 
                    id="card-notifications" 
                    className="floating-card bottom-[2%] left-[18%] w-[270px]"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                            <Bell size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 dark:text-slate-100">New Zomato Order #9401</p>
                            <p className="text-[10px] text-slate-500 font-medium">Auto-dispatched to Grill KDS</p>
                        </div>
                    </div>
                </DashboardCard>

                {/* CARD 10: Kitchen Queue & Timeline (Bottom Center Right) */}
                <DashboardCard 
                    id="card-kitchen" 
                    className="floating-card bottom-[2%] right-[18%] w-[270px]"
                >
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400">KITCHEN KDS TIMELINE</span>
                        <span className="text-[10px] font-black text-emerald-600">Station 1</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Garlic Naan & Dal Makhani</span>
                        <span className="text-[10px] font-black text-rose-500 ml-auto">04:12m</span>
                    </div>
                </DashboardCard>

            </div>
        </section>
    );
};

export default SaaSShowcaseHero;
