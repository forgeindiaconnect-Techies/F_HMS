import { useRef, useEffect } from 'react';
import { Leaf, Award, QrCode, ShieldCheck, HeartHandshake, UtensilsCrossed } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
    {
        icon: Leaf,
        badge: 'Zero Shortcuts',
        title: 'Farm-to-Table Freshness',
        desc: 'Hand-picked organic vegetables, farm-fresh dairy, and ethically sourced meats delivered daily for uncompromising quality.'
    },
    {
        icon: Award,
        badge: 'Authentic Heritage',
        title: 'Master Chef Craftsmanship',
        desc: 'Slow-simmered stocks, 48-hour sourdough fermentations, and traditional sealed clay-pot dum cooking methods.'
    },
    {
        icon: QrCode,
        badge: 'Frictionless Tech',
        title: 'Instant Table QR Service',
        desc: 'Scan your table QR code to browse live digital menus, customize dishes in real time, and pay securely without waiting for bills.'
    }
];

const CulinaryParallaxStory = () => {
    const sectionRef = useRef(null);
    const splashLayerRef = useRef(null);
    const cardsRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            // Parallax movement on floating ingredients splash
            if (splashLayerRef.current) {
                gsap.to(splashLayerRef.current, {
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.5,
                    },
                    y: -180,
                    rotation: 15,
                    scale: 1.15,
                    ease: 'none'
                });
            }

            // Cards Staggered Reveal
            gsap.from('.parallax-pillar-card', {
                scrollTrigger: {
                    trigger: cardsRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                y: 50,
                opacity: 0,
                stagger: 0.15,
                duration: 0.9,
                ease: 'power3.out'
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section 
            ref={sectionRef}
            className="py-24 md:py-36 bg-gradient-to-b from-slate-950 via-slate-900 to-white dark:to-slate-950 text-white relative overflow-hidden"
        >
            {/* Multi-Plane Parallax Foreground Splash Element */}
            <div 
                ref={splashLayerRef}
                className="absolute top-1/4 -left-12 sm:left-4 w-72 sm:w-96 aspect-square pointer-events-none opacity-25 dark:opacity-35 mix-blend-screen will-change-transform z-20"
                style={{
                    backgroundImage: 'url(/images/food/ingredients_splash.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'contrast(1.2)'
                }}
            />

            {/* Ambient Background Warm Light */}
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/* Section Narrative Heading */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
                        <UtensilsCrossed size={14} />
                        <span>The Culinary Standard</span>
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        Rooted in Passion, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-400">Perfected by Fire</span>
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
                        Every plate is an invitation to taste real culinary dedication. We bridge traditional artisanal cooking with modern seamless dining technology.
                    </p>
                </div>

                {/* 3 Pillars Cards with Hover Elevation */}
                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {PILLARS.map((pillar, idx) => (
                        <div 
                            key={idx}
                            className="parallax-pillar-card bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl hover:border-orange-500/40 hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-md">
                                    <pillar.icon size={26} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-orange-400/90 block">
                                    {pillar.badge}
                                </span>
                                <h3 className="text-xl font-black text-white group-hover:text-orange-300 transition-colors">
                                    {pillar.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    {pillar.desc}
                                </p>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <span>Verified Restaurant Promise</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default CulinaryParallaxStory;
