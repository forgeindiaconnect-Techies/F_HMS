import { useState, useEffect, useRef } from 'react';
import { 
    QrCode, Smartphone, ChefHat, Monitor, Truck, Package, 
    CheckCircle2, ArrowRight, Play, Pause, Sparkles, Utensils, 
    Flame, MapPin, Zap, User, Clock, ChevronRight, CircleDot
} from 'lucide-react';

const WORKFLOW_STEPS = [
    {
        id: 1,
        step: 'QR MENU',
        title: 'Digital QR Menu',
        subtitle: 'Customer scans table QR code',
        detail: 'Instant digital menu load on smartphone without app download.',
        icon: QrCode,
        color: 'from-purple-500 to-indigo-600',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        activeGlow: 'shadow-purple-500/30'
    },
    {
        id: 2,
        step: 'CUSTOMER ORDER',
        title: 'Customer Order',
        subtitle: 'Order placed & paid',
        detail: 'Truffle Pizza & Peri Fries sent directly to kitchen queue.',
        icon: Smartphone,
        color: 'from-blue-500 to-cyan-500',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        activeGlow: 'shadow-blue-500/30'
    },
    {
        id: 3,
        step: 'KITCHEN KDS',
        title: 'Kitchen KDS Display',
        subtitle: 'Incoming ticket alert',
        detail: 'Kitchen Display Screen plays audio alert & categorizes order.',
        icon: Monitor,
        color: 'from-amber-500 to-orange-500',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        activeGlow: 'shadow-amber-500/30'
    },
    {
        id: 4,
        step: 'FOOD PREPARING',
        title: 'Food Preparation',
        subtitle: 'Chef batch cooking',
        detail: 'Status updates automatically to "Preparing" with live prep timers.',
        icon: ChefHat,
        color: 'from-red-500 to-rose-600',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        activeGlow: 'shadow-red-500/30'
    },
    {
        id: 5,
        step: 'DELIVERY',
        title: 'Dispatch & Delivery',
        subtitle: 'Courier partner transit',
        detail: 'Food packaged in eco box and assigned to delivery driver.',
        icon: Truck,
        color: 'from-emerald-500 to-teal-600',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        activeGlow: 'shadow-emerald-500/30'
    },
    {
        id: 6,
        step: 'DELIVERED',
        title: 'Customer Enjoyment',
        subtitle: 'Order delivered hot',
        detail: 'Customer receives fresh order with instant digital receipt.',
        icon: CheckCircle2,
        color: 'from-green-400 to-emerald-500',
        badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
        activeGlow: 'shadow-green-500/30'
    }
];

const Hero3DRestaurantScene = () => {
    const [activeStep, setActiveStep] = useState(1);
    const [isPlaying, setIsPlaying] = useState(true);
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Auto-advance step sequence every 3.5s if playing
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setActiveStep(prev => (prev % WORKFLOW_STEPS.length) + 1);
        }, 3500);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Parallax mouse tilt handler
    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        setMouseOffset({
            x: Math.max(-1, Math.min(1, deltaX)),
            y: Math.max(-1, Math.min(1, deltaY))
        });
    };

    const handleMouseLeave = () => {
        setMouseOffset({ x: 0, y: 0 });
    };

    const currentStepData = WORKFLOW_STEPS.find(s => s.id === activeStep) || WORKFLOW_STEPS[0];

    // Compute status text for KDS screen based on active step
    const getKdsStatus = () => {
        if (activeStep <= 2) return { label: 'NEW ORDER RECEIVED', color: 'bg-blue-500 text-white animate-pulse' };
        if (activeStep === 3 || activeStep === 4) return { label: 'PREPARING (CHEF COOKING)', color: 'bg-amber-500 text-white animate-bounce' };
        return { label: 'READY FOR DISPATCH', color: 'bg-emerald-500 text-white' };
    };

    const kdsStatus = getKdsStatus();

    return (
        <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-6xl mx-auto rounded-[3rem] p-6 md:p-10 bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden select-none my-8 transition-colors"
        >
            {/* Background Ambient Studio Lighting & Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent pointer-events-none" />
            
            {/* Subtle Isometric Grid lines overlay */}
            <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Header Controls Bar */}
            <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Sparkles size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">3D Interactive SaaS Ecosystem</span>
                            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black uppercase">Live Simulation</span>
                        </div>
                        <h3 className="text-lg font-black text-white">Full Automation Flow: QR Menu &rarr; KDS &rarr; Delivery</h3>
                    </div>
                </div>

                {/* Step Selector & Play Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        {isPlaying ? <Pause size={14} className="text-amber-400" /> : <Play size={14} className="text-emerald-400" />}
                        <span>{isPlaying ? 'Pause Auto-Play' : 'Play Flow'}</span>
                    </button>
                </div>
            </div>

            {/* Flow Step Badges Navigation */}
            <div className="relative z-20 flex items-center justify-between gap-2 py-4 overflow-x-auto custom-scrollbar">
                {WORKFLOW_STEPS.map((s) => {
                    const isActive = s.id === activeStep;
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.id}
                            onClick={() => {
                                setActiveStep(s.id);
                                setIsPlaying(false);
                            }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                                isActive 
                                ? `bg-gradient-to-r ${s.color} text-white border-white/20 shadow-lg ${s.activeGlow} scale-105`
                                : 'bg-slate-900/80 hover:bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">{s.id}</span>
                            <Icon size={14} />
                            <span>{s.step}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main 3D Isometric Interactive Stage */}
            <div className="relative z-10 my-6 min-h-[440px] md:min-h-[480px] flex items-center justify-center overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950/60 backdrop-blur-md p-4">
                {/* Parallax Container with Dynamic 3D Transform */}
                <div 
                    className="relative w-full max-w-4xl h-full flex items-center justify-center transition-transform duration-200 ease-out"
                    style={{
                        transform: `perspective(1000px) rotateX(${12 + mouseOffset.y * -8}deg) rotateY(${mouseOffset.x * 12}deg)`
                    }}
                >
                    {/* Isometric Base Restaurant Platform */}
                    <div className="relative w-[340px] sm:w-[480px] md:w-[620px] h-[260px] sm:h-[320px] bg-gradient-to-tr from-slate-900 via-slate-800/90 to-slate-900 rounded-[3rem] border-2 border-indigo-500/20 shadow-2xl transform rotate-45 flex items-center justify-center overflow-visible">
                        
                        {/* Floor Glow Rings */}
                        <div className="absolute inset-4 rounded-[2.5rem] border border-white/5 pointer-events-none" />
                        <div className="absolute inset-12 rounded-[2rem] border border-indigo-500/10 pointer-events-none" />
                        <div className="absolute -inset-10 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Animated Glowing Connection Lines Path */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible -rotate-45" viewBox="0 0 600 300">
                            <defs>
                                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>
                            <path 
                                d="M 50 150 Q 200 60 350 150 T 550 150" 
                                fill="none" 
                                stroke="url(#pathGradient)" 
                                strokeWidth="3" 
                                strokeDasharray="8,6"
                                className="animate-pulse"
                            />
                        </svg>

                        {/* ─── 3D ISOMETRIC ELEMENT 1: DINING TABLE & SMARTPHONE QR MENU (FOREGROUND LEFT) ─── */}
                        <div 
                            className={`absolute -left-4 sm:left-4 -top-8 transition-all duration-500 -rotate-45 ${
                                activeStep === 1 || activeStep === 2 ? 'scale-110 z-30' : 'scale-100 opacity-90'
                            }`}
                        >
                            {/* Dining Table Base */}
                            <div className="relative w-36 h-36 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl p-3 flex flex-col items-center justify-between group">
                                {/* Table QR Code Stand */}
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider">TABLE #04</span>
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center animate-ping">
                                        <CircleDot size={10} />
                                    </div>
                                </div>

                                {/* Smartphone displaying Digital Menu */}
                                <div className="w-20 h-28 bg-slate-950 rounded-2xl border-2 border-purple-500/50 p-1.5 shadow-xl relative overflow-hidden flex flex-col justify-between group-hover:scale-105 transition-transform">
                                    {/* Phone Notch & Header */}
                                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-1">
                                        <div className="w-2 h-1 bg-purple-400 rounded-full" />
                                        <span className="text-[7px] font-mono font-bold text-purple-300">QR MENU</span>
                                    </div>

                                    {/* Phone Screen Dish Preview */}
                                    <div className="space-y-1 my-auto">
                                        <div className="w-full h-8 rounded-lg bg-gradient-to-r from-purple-900/60 to-indigo-900/60 p-1 flex items-center gap-1">
                                            <div className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center text-[10px]">🍕</div>
                                            <div className="space-y-0.5">
                                                <div className="w-8 h-1 bg-purple-200 rounded-full" />
                                                <div className="w-5 h-1 bg-purple-400/50 rounded-full" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="w-full py-1 bg-purple-600 rounded-md text-[7px] font-black text-center text-white uppercase tracking-wider">
                                        Order & Pay
                                    </div>
                                </div>

                                {/* Table Plate & Utensils */}
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-[10px]">🍽️</div>
                                    <span className="text-[8px] font-bold text-slate-400">Scan QR Code</span>
                                </div>
                            </div>

                            {/* Floating QR Menu Pulse Badge */}
                            <div className="absolute -top-5 -right-6 bg-purple-900/90 text-purple-200 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-purple-500/40 text-[10px] font-black flex items-center gap-1.5 shadow-xl animate-bounce">
                                <QrCode size={12} className="text-purple-400" />
                                <span>Scan QR Menu</span>
                            </div>
                        </div>

                        {/* ─── 3D ISOMETRIC ELEMENT 2: KITCHEN PREP & KITCHEN DISPLAY SCREEN (KDS) (CENTER RIGHT) ─── */}
                        <div 
                            className={`absolute right-4 sm:right-12 top-4 transition-all duration-500 -rotate-45 ${
                                activeStep === 3 || activeStep === 4 ? 'scale-110 z-30' : 'scale-100 opacity-90'
                            }`}
                        >
                            {/* Kitchen Prep Counter */}
                            <div className="relative w-44 h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl p-4 flex flex-col justify-between">
                                {/* Kitchen Title */}
                                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                                    <div className="flex items-center gap-1.5 text-amber-400">
                                        <ChefHat size={16} />
                                        <span className="text-[10px] font-black uppercase text-white tracking-wider">Kitchen KDS</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                </div>

                                {/* Kitchen Display Screen Monitor */}
                                <div className="bg-slate-950 rounded-2xl border-2 border-amber-500/40 p-2.5 space-y-2 shadow-inner">
                                    <div className="flex items-center justify-between text-[8px] font-mono">
                                        <span className="text-amber-400 font-bold">#TICK-882</span>
                                        <span className="text-slate-400">12:40 PM</span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-bold text-white">
                                            <span>1x Truffle Pizza</span>
                                            <span className="text-amber-400">₹650</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold text-white">
                                            <span>2x Craft Sodas</span>
                                            <span className="text-amber-400">₹240</span>
                                        </div>
                                    </div>

                                    {/* KDS Status Badge */}
                                    <div className={`py-1 px-2 rounded-lg text-[8px] font-black text-center uppercase tracking-wider ${kdsStatus.color}`}>
                                        {kdsStatus.label}
                                    </div>
                                </div>

                                {/* Chef Prep Indicator */}
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-1">
                                    <span className="flex items-center gap-1 text-red-400"><Flame size={12} /> Prep Line #02</span>
                                    <span className="text-emerald-400">Timer: 04:12</span>
                                </div>
                            </div>

                            {/* Floating Chef Badge */}
                            <div className="absolute -top-6 -left-4 bg-amber-950/90 text-amber-200 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/40 text-[10px] font-black flex items-center gap-1.5 shadow-xl animate-pulse">
                                <ChefHat size={12} className="text-amber-400" />
                                <span>Kitchen KDS Sync</span>
                            </div>
                        </div>

                        {/* ─── 3D ISOMETRIC ELEMENT 3: DELIVERY PACKAGE & DISPATCH EXPRESS (BACKGROUND BOTTOM) ─── */}
                        <div 
                            className={`absolute bottom-2 left-16 sm:left-24 transition-all duration-500 -rotate-45 ${
                                activeStep === 5 || activeStep === 6 ? 'scale-110 z-30' : 'scale-100 opacity-90'
                            }`}
                        >
                            {/* Delivery Hub Station */}
                            <div className="relative w-40 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl p-3 flex items-center justify-between gap-3">
                                {/* Package Box */}
                                <div className="w-14 h-16 bg-amber-700/80 rounded-2xl border-2 border-amber-500/40 p-2 flex flex-col justify-between shadow-lg">
                                    <Package size={16} className="text-amber-200" />
                                    <span className="text-[7px] font-mono font-black text-amber-100 uppercase">Express</span>
                                </div>

                                {/* Delivery Partner Logistics Details */}
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black">
                                        <Truck size={14} />
                                        <span>Dispatch Ready</span>
                                    </div>
                                    <p className="text-[8px] text-slate-300 font-bold">Driver: Ramesh K.</p>
                                    <p className="text-[7px] text-slate-400 font-mono">TRK-MUM-8821</p>
                                    <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-4/5 animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            {/* Floating Delivery Pin Badge */}
                            <div className="absolute -bottom-4 -right-4 bg-emerald-950/90 text-emerald-200 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-500/40 text-[10px] font-black flex items-center gap-1.5 shadow-xl">
                                <MapPin size={12} className="text-emerald-400 animate-bounce" />
                                <span>Express Delivery</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ─── FLOATING GLASSMORPHISM SAAS UI CARDS (FOREGROUND OVERLAYS) ─── */}
                
                {/* Top-Left Floating Card: Active Order Notification */}
                <div className="absolute top-6 left-6 z-30 hidden sm:flex items-center gap-3 p-3.5 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl max-w-xs animate-in fade-in slide-in-from-top-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-[10px] text-indigo-400 font-black uppercase">
                            <span>Live Order Stream</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <h4 className="text-xs font-black text-white mt-0.5">Order #TRK-882 Confirmed</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Table #04 &bull; QR Digital Checkout</p>
                    </div>
                </div>

                {/* Bottom-Right Floating Card: Active Workflow Detail */}
                <div className="absolute bottom-6 right-6 z-30 max-w-sm w-full p-4 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-indigo-500/30 shadow-2xl space-y-2 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentStepData.badgeColor}`}>
                            Step {currentStepData.id} of 6 &bull; {currentStepData.step}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Sync: 100% Real-time</span>
                    </div>

                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                        {currentStepData.title}
                    </h4>

                    <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                        {currentStepData.detail}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-800">
                        <span>Automatic Cloud Routing</span>
                        <button 
                            onClick={() => setActiveStep(prev => (prev % WORKFLOW_STEPS.length) + 1)}
                            className="text-indigo-400 hover:text-white flex items-center gap-1 font-black cursor-pointer"
                        >
                            Next Step <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero3DRestaurantScene;
