import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Navigation, Sparkles, ArrowRight, Utensils, Clock, ShieldCheck, Flame, ChevronDown as ScrollDownIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CinematicHero = ({ 
    search, 
    setSearch, 
    location, 
    setLocation, 
    isLocationOpen, 
    setIsLocationOpen, 
    fetchLocation, 
    availableLocations,
    onScrollToMenu
}) => {
    const heroRef = useRef(null);
    const dishContainerRef = useRef(null);
    const dishImgRef = useRef(null);
    const splashRef = useRef(null);
    const textGroupRef = useRef(null);
    const badgeRef = useRef(null);
    const floatingBadge1Ref = useRef(null);
    const floatingBadge2Ref = useRef(null);

    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // Mouse tilt effect for 3D realism on desktop
    const handleMouseMove = (e) => {
        if (!dishContainerRef.current) return;
        const rect = dishContainerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        setTilt({
            x: Math.max(-12, Math.min(12, -deltaY * 10)),
            y: Math.max(-12, Math.min(12, deltaX * 10))
        });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const handleScrollToExperience = () => {
        const el = document.getElementById('food-experience');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            // Initial Entrance Choreography
            gsap.from(badgeRef.current, {
                y: -25,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            });

            gsap.from('.hero-headline-word', {
                y: 40,
                opacity: 0,
                stagger: 0.08,
                duration: 1,
                ease: 'power4.out',
                delay: 0.1
            });

            gsap.from('.hero-sub-text', {
                y: 20,
                opacity: 0,
                duration: 0.9,
                ease: 'power3.out',
                delay: 0.3
            });

            gsap.from(dishContainerRef.current, {
                scale: 0.85,
                opacity: 0,
                rotation: -8,
                duration: 1.2,
                ease: 'elastic.out(1, 0.75)',
                delay: 0.2
            });

            // Smooth Scroll-Linked Animation: Scaled, moved, and subtly rotated food image coordinated with text
            const scrollTl = gsap.timeline({
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                }
            });

            // Smoothly scale, move, and subtly rotate the food image
            scrollTl.to(dishContainerRef.current, {
                y: 160,
                scale: 1.16,
                rotateX: 14,
                rotateZ: 6,
                transformOrigin: 'center center',
                ease: 'power1.out'
            }, 0);

            // Coordinated text group slide & soft fade
            if (textGroupRef.current) {
                scrollTl.to(textGroupRef.current, {
                    y: -70,
                    opacity: 0.25,
                    ease: 'power1.out'
                }, 0);
            }

            // Floating ingredients splash moves faster for 3D parallax depth
            if (splashRef.current) {
                scrollTl.to(splashRef.current, {
                    y: -140,
                    scale: 1.15,
                    ease: 'none'
                }, 0);
            }

            // Floating micro badges animate outward
            if (floatingBadge1Ref.current && floatingBadge2Ref.current) {
                scrollTl.to(floatingBadge1Ref.current, {
                    y: -50,
                    x: -25,
                    scale: 0.92,
                    ease: 'none'
                }, 0);
                scrollTl.to(floatingBadge2Ref.current, {
                    y: 70,
                    x: 30,
                    scale: 1.05,
                    ease: 'none'
                }, 0);
            }

        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section 
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-amber-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800/80 transition-colors"
        >
            {/* Ambient Lighting Spheres for Depth */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-400/10 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3"></div>
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-red-500/10 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Background Floating Herb / Splash Layer with Multi-Plane Depth */}
            <div 
                ref={splashRef} 
                className="absolute top-8 right-4 md:right-12 w-64 md:w-96 aspect-square pointer-events-none opacity-20 dark:opacity-30 mix-blend-screen transition-transform will-change-transform"
                style={{
                    backgroundImage: 'url(/images/food/ingredients_splash.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'contrast(1.2)'
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    
                    {/* Left Column: Bold Typography & Action Controls */}
                    <div ref={textGroupRef} className="lg:col-span-7 space-y-6">
                        
                        {/* Eyebrow Badge */}
                        <div ref={badgeRef} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-black tracking-wide uppercase shadow-xs">
                            <Sparkles size={14} className="text-orange-500 animate-pulse" />
                            <span>Cinematic Gourmet Dining</span>
                        </div>

                        {/* Bold Typography & Short Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.08]">
                            <span className="hero-headline-word inline-block mr-2.5">Feast</span>
                            <span className="hero-headline-word inline-block mr-2.5">Your</span>
                            <span className="hero-headline-word inline-block mr-2.5 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-red-500">
                                Senses.
                            </span>
                            <br className="hidden sm:inline" />
                            <span className="hero-headline-word inline-block mr-2.5">Artisan</span>
                            <span className="hero-headline-word inline-block mr-2.5">Flavors,</span>
                            <span className="hero-headline-word inline-block text-slate-800 dark:text-slate-200">
                                Perfected.
                            </span>
                        </h1>

                        <p className="hero-sub-text text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed">
                            An immersive culinary journey crafted with obsessive passion. Explore flame-grilled tandoori kebabs, stone-baked pizzas, royal clay-pot biryanis, and decadent molten desserts.
                        </p>

                        {/* Clear Action Buttons: Explore Menu & Order Now */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleScrollToExperience}
                                className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 text-sm cursor-pointer"
                            >
                                <Flame size={16} />
                                <span>Explore Menu</span>
                                <ArrowRight size={16} />
                            </button>

                            <button
                                type="button"
                                onClick={onScrollToMenu}
                                className="bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg border border-slate-700/80 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 text-sm cursor-pointer"
                            >
                                <Utensils size={15} className="text-orange-400" />
                                <span>Order Now</span>
                            </button>
                        </div>

                        {/* Location Selector & Live Search Box */}
                        <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl transition-all">
                            
                            {/* Location Selector */}
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                                    className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 shrink-0">
                                            <MapPin size={16} />
                                        </div>
                                        <div className="truncate">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">Your Location</span>
                                            <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate block max-w-[140px]">
                                                {location}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isLocationOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            type="button"
                                            onClick={fetchLocation}
                                            className="w-full px-4 py-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 flex items-center gap-2 text-left cursor-pointer transition-colors"
                                        >
                                            <Navigation size={14} /> Detect Current Location
                                        </button>
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                                        {availableLocations.map((loc) => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => {
                                                    setLocation(loc);
                                                    localStorage.setItem('userLocation', loc);
                                                    setIsLocationOpen(false);
                                                }}
                                                className={`w-full px-4 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                                    location === loc 
                                                        ? 'bg-orange-500 text-white font-bold' 
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:block w-[1px] h-8 bg-slate-200 dark:bg-slate-800 self-center"></div>

                            {/* Live Search Input */}
                            <div className="flex-1 flex items-center px-3 py-1">
                                <Search size={18} className="text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search restaurants, cuisines, or dishes..."
                                    className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Find Food CTA */}
                            <button
                                type="button"
                                onClick={onScrollToMenu}
                                className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-orange-600/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 cursor-pointer shrink-0"
                            >
                                <span>Find</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>

                        {/* Quick Trust Highlights */}
                        <div className="pt-2 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Clock size={15} className="text-orange-500" />
                                <span>Avg. 20-min Prep &amp; Serve</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Flame size={15} className="text-red-500" />
                                <span>Fresh Farm-to-Table Quality</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck size={15} className="text-emerald-500" />
                                <span>100% Contactless Dine-in QR</span>
                            </span>
                        </div>

                    </div>

                    {/* Right Column: Large Photorealistic Food Visual with 3D Mouse Tilt & Scroll Zoom */}
                    <div className="lg:col-span-5 flex justify-center relative perspective-[1200px]">
                        
                        <div 
                            ref={dishContainerRef}
                            style={{
                                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.15s ease-out'
                            }}
                            className="relative w-[290px] sm:w-[380px] lg:w-[420px] aspect-square flex items-center justify-center will-change-transform cursor-grab active:cursor-grabbing"
                        >
                            {/* Realistic Glow Ring Behind Dish */}
                            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/25 to-red-500/25 blur-2xl transform translate-z-[-20px]"></div>
                            
                            {/* Outer Decorative Orbit Ring */}
                            <div className="absolute inset-0 rounded-full border border-orange-500/25 dark:border-orange-500/35 border-dashed animate-[spin_60s_linear_infinite] pointer-events-none"></div>

                            {/* Main High-Res Food Asset */}
                            <div className="relative w-[90%] h-[90%] rounded-full overflow-hidden shadow-2xl shadow-orange-950/40 border-4 border-white/90 dark:border-slate-800/90 group">
                                <img 
                                    ref={dishImgRef}
                                    src="/images/food/burger.jpg" 
                                    alt="Artisan Gourmet Double Angus Burger" 
                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-108"
                                    loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 drop-shadow-md">Chef's Signature</span>
                                    <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow-md">Double Angus Smash Burger</h3>
                                </div>
                            </div>

                            {/* Floating Micro-Badge 1: Star Rating */}
                            <div 
                                ref={floatingBadge1Ref}
                                style={{ transform: 'translateZ(40px)' }}
                                className="absolute -top-3 -left-3 sm:-left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-2 px-3.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 animate-bounce [animation-duration:3.2s]"
                            >
                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/30">
                                    ★
                                </div>
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">Master Rating</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">4.9 / 5.0 (2.4k+)</span>
                                </div>
                            </div>

                            {/* Floating Micro-Badge 2: Chef Tag */}
                            <div 
                                ref={floatingBadge2Ref}
                                style={{ transform: 'translateZ(50px)' }}
                                className="absolute -bottom-4 -right-2 sm:-right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-2 px-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 animate-bounce [animation-duration:4s]"
                            >
                                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-orange-600/30">
                                    <Utensils size={14} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">Prepared Live</span>
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">100% Fresh Daily</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Bottom Scroll Indicator Guiding Into Food Storytelling */}
                <div className="pt-8 flex justify-center">
                    <button
                        type="button"
                        onClick={handleScrollToExperience}
                        className="group flex flex-col items-center gap-1.5 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">
                            Scroll To Experience Dishes
                        </span>
                        <div className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-start justify-center p-1 group-hover:border-orange-500 transition-colors">
                            <div className="w-1.5 h-2.5 bg-orange-500 rounded-full animate-bounce"></div>
                        </div>
                    </button>
                </div>

            </div>
        </section>
    );
};

export default CinematicHero;
