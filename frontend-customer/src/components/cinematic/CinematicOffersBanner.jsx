import { useState, useRef, useEffect } from 'react';
import { Percent, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CinematicOffersBanner = () => {
    const [copied, setCopied] = useState(false);
    const bannerRef = useRef(null);

    const handleCopyCode = () => {
        navigator.clipboard.writeText('FEAST50');
        setCopied(true);
        toast.success('Promo code FEAST50 copied to clipboard!');
        setTimeout(() => setCopied(false), 2200);
    };

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            gsap.from(bannerRef.current, {
                scrollTrigger: {
                    trigger: bannerRef.current,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                scale: 0.94,
                y: 40,
                opacity: 0,
                duration: 0.9,
                ease: 'power3.out'
            });
        }, bannerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="py-12 bg-white dark:bg-slate-950 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div 
                    ref={bannerRef}
                    className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white p-8 sm:p-12 lg:p-16 shadow-2xl shadow-orange-600/20 flex flex-col lg:flex-row items-center justify-between gap-10"
                >
                    {/* Background Light Blur Spheres */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute -bottom-12 left-8 w-64 h-64 bg-black/20 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Left: Offer Details & Value Proposition */}
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-amber-200">
                            <Sparkles size={14} />
                            <span>VIP Welcome Privilege</span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                            Get 50% OFF Up To ₹150 On Your First Feast
                        </h3>
                        <p className="text-white/90 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                            Unlock maximum savings across all verified partner kitchens. Order ahead for lightning takeaway, contactless dine-in QR ordering, or schedule in advance.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-white/80">
                            <span className="flex items-center gap-1.5">
                                <Gift size={14} className="text-amber-300" />
                                <span>2x Loyalty Rewards</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-amber-300" />
                                <span>Zero Convenience Charges</span>
                            </span>
                        </div>
                    </div>

                    {/* Right: Interactive Promo Code Voucher Card */}
                    <div className="relative z-10 shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
                        <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-4 flex items-center justify-between gap-6 w-full sm:w-auto shadow-lg">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 block">Apply Code</span>
                                <span className="text-2xl font-black text-white tracking-widest font-mono">FEAST50</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyCode}
                                className="bg-white text-orange-600 hover:bg-amber-100 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                                {copied ? (
                                    <>
                                        <Check size={15} />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={15} />
                                        <span>Copy Code</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <Link
                            to="/menu"
                            className="w-full sm:w-auto bg-slate-950 text-white hover:bg-black font-extrabold px-6 py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 text-sm"
                        >
                            <span>Browse Dishes</span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default CinematicOffersBanner;
