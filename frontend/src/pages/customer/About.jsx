import { Link } from 'react-router-dom';
import { 
    UtensilsCrossed, ArrowRight, ShieldCheck, Award, Heart, 
    Sparkles, CheckCircle2, Users, Store, TrendingUp, Clock, 
    ChevronRight, ArrowLeft 
} from 'lucide-react';
import WebsiteNavbar from '../../components/WebsiteNavbar';
import WebsiteFooter from '../../components/WebsiteFooter';

const MILESTONES = [
    { year: '2021', title: 'Founded with a Mission', desc: 'Started with a vision to replace obsolete, bulky POS terminals with a lightweight, cloud-first platform.' },
    { year: '2022', title: '500+ Outlets Onboarded', desc: 'Rapidly expanded across major metropolitan dining hubs, powering fast QSRs and fine-dining bistros.' },
    { year: '2023', title: 'Central Kitchen & Chain POS', desc: 'Launched enterprise commissary inventory dispatch and automated franchise royalty tracking.' },
    { year: '2024+', title: 'Omnichannel Dining Suite', desc: 'Processed over 50,000+ daily orders with 99.9% uptime across multi-branch restaurant empires.' }
];

const CORE_VALUES = [
    {
        icon: Sparkles,
        title: 'Crafted for Speed',
        desc: 'Every split second at the billing counter matters during peak lunch rush. Our software is built for lightning execution.'
    },
    {
        icon: ShieldCheck,
        title: 'Audited Transparency',
        desc: 'Real-time sync between kitchen display, cashier billing, and raw material stores ensures zero pilferage.'
    },
    {
        icon: Heart,
        title: 'Customer-First Heart',
        desc: 'From independent family diners to national franchise chains, we treat every food entrepreneur’s dream as our own.'
    },
    {
        icon: TrendingUp,
        title: 'Engineered for Scale',
        desc: 'Effortlessly launch new branch locations in under 15 minutes with standardized menu, price, and tax templates.'
    }
];

const About = () => {
    return (
        <div className="flex flex-col min-h-screen bg-[#FFFDF9] font-sans text-slate-900 transition-colors relative overflow-x-hidden">
            {/* Unified FoodNest Navbar */}
            <WebsiteNavbar />

            {/* Ambient Warm Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-orange-100/40 via-amber-50/20 to-transparent blur-3xl pointer-events-none z-0" />

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 relative z-10 space-y-16 sm:space-y-20">
                
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-[#FF5A1F] font-bold text-xs shadow-xs transition-all group cursor-pointer"
                    >
                        <ArrowLeft size={14} className="text-[#FF5A1F] group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back to Home</span>
                    </Link>
                    <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                        FoodNest Story • About Our Mission
                    </span>
                </div>

                {/* Hero Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF5A1F] font-bold text-xs uppercase tracking-wider">
                        About FoodNest
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#142B45] tracking-tight leading-tight">
                        Empowering Restaurants to Grow Smarter, Not Harder.
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                        FoodNest is the all-in-one cloud operating platform designed to eliminate operational chaos in commercial kitchens and dining rooms worldwide.
                    </p>
                </div>

                {/* Story & Vision Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xs">
                    <div className="lg:col-span-7 space-y-5 text-left">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] bg-orange-50 px-3 py-1 rounded-full inline-block">
                            Our Story
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#142B45] tracking-tight">
                            Built by Restaurateurs, for Restaurateurs.
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                            Running a successful eatery isn't just about delicious recipes — it's managing fluctuating inventory, rush-hour table turnover, staff rosters, and multi-channel delivery orders without dropping the ball.
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                            We built FoodNest with a simple belief: restaurant owners shouldn't have to juggle five disjointed software tools just to get through a single dinner service. Today, FoodNest delivers seamless POS billing, live kitchen displays, automated commissary stock alerts, and customer loyalty in one connected system.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-6">
                            <div>
                                <span className="text-2xl sm:text-3xl font-black text-[#142B45] block">500+</span>
                                <span className="text-xs text-slate-400 font-bold">Active Outlets</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div>
                                <span className="text-2xl sm:text-3xl font-black text-[#142B45] block">50,000+</span>
                                <span className="text-xs text-slate-400 font-bold">Daily Orders</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div>
                                <span className="text-2xl sm:text-3xl font-black text-[#142B45] block">99.9%</span>
                                <span className="text-xs text-slate-400 font-bold">Uptime Track Record</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 relative flex justify-center">
                        <div className="relative w-64 sm:w-72 h-80 sm:h-96 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
                            <img 
                                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop" 
                                alt="Modern restaurant kitchen team"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 text-white text-left">
                                <p className="text-xs font-black tracking-wide uppercase text-orange-300">Modern Hospitality</p>
                                <p className="text-sm font-bold">Technology that feels like second nature in the kitchen.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Values */}
                <div className="space-y-8 text-center">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full inline-block mb-2">
                            What Drives Us
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#142B45] tracking-tight">
                            Our Core Principles
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {CORE_VALUES.map((val, idx) => {
                            const IconComponent = val.icon;
                            return (
                                <div 
                                    key={idx}
                                    className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-left space-y-3 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <IconComponent size={22} strokeWidth={2.2} />
                                    </div>
                                    <h3 className="text-base font-black text-[#142B45]">
                                        {val.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {val.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Milestone Journey */}
                <div className="space-y-8 text-center">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full inline-block mb-2">
                            Our Journey
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#142B45] tracking-tight">
                            How FoodNest Evolved
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
                        {MILESTONES.map((m, idx) => (
                            <div 
                                key={idx}
                                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden"
                            >
                                <span className="text-2xl sm:text-3xl font-black text-[#FF5A1F] block mb-2">
                                    {m.year}
                                </span>
                                <h4 className="text-sm font-black text-[#142B45] mb-1">
                                    {m.title}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {m.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Callout Banner */}
                <div className="rounded-3xl bg-gradient-to-r from-[#FFF0E8] via-[#FFEADB] to-[#FFF3EB] border border-orange-200/80 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="text-left space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-[#142B45] tracking-tight">
                            Ready to transform your restaurant operations?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">
                            Join hundreds of restaurant owners who power their kitchen with FoodNest.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link 
                            to="/register"
                            className="px-6 py-3 bg-[#FF5A1F] hover:bg-[#E04812] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 group"
                        >
                            <span>Get Started Free</span>
                            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link 
                            to="/contact"
                            className="px-5 py-3 bg-white hover:bg-orange-50 border border-slate-200 text-[#142B45] font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>

            </main>

            {/* Unified FoodNest Footer */}
            <WebsiteFooter />
        </div>
    );
};

export default About;
