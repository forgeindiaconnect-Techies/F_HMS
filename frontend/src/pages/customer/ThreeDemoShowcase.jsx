import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Utensils, ArrowLeft, ArrowRight, Sparkles, QrCode, 
    ChefHat, Monitor, Truck, CheckCircle2, Star, Play
} from 'lucide-react';
import Interactive3DRestaurantExperience from '../../components/Interactive3DRestaurantExperience';

const ThreeDemoShowcase = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700/80 shadow-sm cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>

                    <div className="h-5 w-px bg-slate-800 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                            <Utensils size={18} />
                        </div>
                        <span className="text-base font-black text-white">RestaurantHub 3D Animatic</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs">
                        <Sparkles size={14} className="animate-spin" /> Interactive WebGL Animatic
                    </div>

                    <Link 
                        to="/staff/register" 
                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-1.5"
                    >
                        <span>Subscribe Now</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </header>

            {/* Main Showcase Hero Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col justify-between relative z-10">
                {/* Banner Headline */}
                <div className="text-center max-w-3xl mx-auto mb-6 space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs">
                        <Star size={14} className="fill-red-400" /> Scroll-Driven 3D Storytelling Experience
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Restaurant Story</span> & Micro-Animations
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 font-medium max-w-xl mx-auto">
                        Scroll to fly into the entrance, watch chairs slide into place, interact with micro-animated dish preparations, and witness live kitchen workflows.
                    </p>
                </div>

                {/* 3D WebGL Scene Container */}
                <div className="w-full flex-1 flex items-center justify-center min-h-[550px] md:min-h-[680px] my-2">
                    <Interactive3DRestaurantExperience height="h-[550px] md:h-[680px]" isStandalone={true} />
                </div>

                {/* Bottom Feature Guide Pills */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div className="flex items-center gap-2 text-purple-400 text-xs font-black">
                            <QrCode size={16} /> 1. Table QR Menu
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Customers scan table QR code to view menus & order instantly.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                            <ChefHat size={16} /> 2. Kitchen KDS Sync
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Orders route instantly to kitchen displays with prep timers.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                            <Truck size={16} /> 3. Express Dispatch
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Automated courier partner assignment and live tracking.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-black">
                            <CheckCircle2 size={16} /> 4. Real-time Cloud
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">All financial & inventory logs updated live in MongoDB.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ThreeDemoShowcase;
