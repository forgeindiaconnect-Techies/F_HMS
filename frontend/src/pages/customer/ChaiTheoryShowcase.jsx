import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Utensils, ArrowRight, Sparkles, Flame, Coffee, Heart, 
    ShoppingBag, ChevronDown, Award, CheckCircle2, Store,
    Calculator, QrCode, Boxes, CalendarDays, LineChart, Shield
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const ChaiTheoryShowcase = () => {
    // Refs for GSAP timelines and ScrollTrigger
    const containerRef = useRef(null);
    const heroTitleRef = useRef(null);
    const cursorRef = useRef(null);
    const cursorFollowerRef = useRef(null);

    // States
    const [preloaderDone, setPreloaderDone] = useState(false);
    const [preloaderProgress, setPreloaderProgress] = useState(0);
    const [activeExplodedTag, setActiveExplodedTag] = useState(0);
    const [scrolled, setScrolled] = useState(false);

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

    // Initialize Lenis Smooth Scrolling Inertia
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

        // Sync Lenis with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0, 0);

        return () => {
            lenis.destroy();
        };
    }, []);

    // Preloader Animation Ticker (<1.5s)
    useEffect(() => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 8;
            setPreloaderProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setPreloaderDone(true);
                }, 250);
            }
        }, 40);

        return () => clearInterval(interval);
    }, []);

    // Custom Ring Cursor Trackers
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

    // GSAP ScrollTrigger Animations Initialization
    useEffect(() => {
        if (!preloaderDone) return;

        const ctx = gsap.context(() => {
            // 1. Hero Stagger Title Reveal
            const heroChars = heroTitleRef.current?.querySelectorAll('.char-span');
            if (heroChars && heroChars.length > 0) {
                gsap.fromTo(
                    heroChars,
                    { y: 80, opacity: 0, rotateX: -45 },
                    { 
                        y: 0, 
                        opacity: 1, 
                        rotateX: 0, 
                        stagger: 0.03, 
                        duration: 1.1, 
                        ease: 'power4.out',
                        delay: 0.15
                    }
                );
            }

            // Hero Parallax Zoom Out
            gsap.to('.hero-bg-media', {
                scale: 1.15,
                yPercent: 12,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero-section',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // 2. Filter Coffee Parallax Reveal
            gsap.fromTo('.coffee-image-box',
                { scale: 0.9, opacity: 0.5 },
                {
                    scale: 1,
                    opacity: 1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: '.coffee-section',
                        start: 'top 80%',
                        end: 'center center',
                        scrub: 1
                    }
                }
            );

            // 3. THE EXPLODED THALI HERO INTERACTION (PIN & SCRUB)
            const thaliTl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.thali-pin-container',
                    start: 'top top',
                    end: '+=140%',
                    pin: true,
                    scrub: 1,
                    onUpdate: (self) => {
                        const progress = self.progress;
                        if (progress < 0.25) setActiveExplodedTag(0);
                        else if (progress < 0.5) setActiveExplodedTag(1);
                        else if (progress < 0.75) setActiveExplodedTag(2);
                        else setActiveExplodedTag(3);
                    }
                }
            });

            thaliTl
                .to('.thali-main-img', { scale: 1.12, rotate: 3, duration: 1 })
                .to('.thali-tag-1', { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0.2)
                .to('.thali-tag-2', { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0.4)
                .to('.thali-tag-3', { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0.6)
                .to('.thali-tag-4', { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0.8);

            // 4. STREET FOOD SAMOSA EXPLOSION PIN & SCRUB
            const samosaTl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.samosa-pin-container',
                    start: 'top top',
                    end: '+=120%',
                    pin: true,
                    scrub: 1
                }
            });

            samosaTl
                .fromTo('.samosa-bg-box', { scale: 0.85, rotate: -4 }, { scale: 1.05, rotate: 0, duration: 1 })
                .fromTo('.samosa-tag-1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.3)
                .fromTo('.samosa-tag-2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.6);

            // 5. Horizontal Scrub Gallery
            const galleryCards = gsap.utils.toArray('.gallery-card-item');
            if (galleryCards.length > 0) {
                gsap.to(galleryCards, {
                    xPercent: -100 * (galleryCards.length - 1),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.horizontal-gallery-wrapper',
                        pin: true,
                        scrub: 1,
                        end: () => '+=' + (document.querySelector('.horizontal-gallery-wrapper')?.offsetWidth || 1000)
                    }
                });
            }

        }, containerRef);

        return () => ctx.revert();
    }, [preloaderDone]);

    // Magnetic Button Hover Micro-interactions
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

    const titleText = "CHAI THEORY";

    return (
        <div ref={containerRef} className="w-full min-h-screen bg-[#FAFAF8] text-[#2B2320] font-sans relative overflow-x-hidden selection:bg-[#E38A2C] selection:text-white cursor-none">
            
            {/* Custom Interactive Ring Cursor */}
            <div 
                ref={cursorRef} 
                className="fixed top-0 left-0 w-3.5 h-3.5 bg-[#E38A2C] rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 shadow-lg hidden md:block" 
            />
            <div 
                ref={cursorFollowerRef} 
                className="fixed top-0 left-0 w-11 h-11 border-2 border-[#6B3F1D]/40 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 hidden md:block" 
            />

            {/* Subtle Film Grain Noise Texture Canvas Overlay (2-3%) */}
            <div 
                className="fixed inset-0 pointer-events-none z-[9990] opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(43,35,32,0.8) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                }}
            />

            {/* ========================================================================= */}
            {/* A. PRELOADER (<1.5s) */}
            {/* ========================================================================= */}
            {!preloaderDone && (
                <div className="fixed inset-0 z-[10000] bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300">
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6B3F1D] to-[#E38A2C] text-white flex items-center justify-center mx-auto shadow-xl shadow-[#6B3F1D]/20 animate-bounce">
                            <Utensils size={24} />
                        </div>
                        
                        <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-[#6B3F1D]">
                            CHAI THEORY — Built By Ruturaj
                        </h2>
                        
                        <p className="text-xs font-black uppercase tracking-widest text-[#E38A2C]">
                            Artisan Indian Café & Restaurant Platform
                        </p>

                        {/* Thin Saffron Progress Bar */}
                        <div className="w-64 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden mt-6">
                            <div 
                                className="h-full bg-gradient-to-r from-[#E38A2C] via-[#C23B22] to-[#6B3F1D] transition-all duration-75"
                                style={{ width: `${preloaderProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#2B2320]/10 py-4 px-6 sm:px-12 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-[#6B3F1D] text-white flex items-center justify-center shadow-lg shadow-[#6B3F1D]/20 group-hover:rotate-12 transition-transform">
                        <Coffee size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black font-serif tracking-tight text-[#6B3F1D]">
                            CHAI THEORY
                        </h1>
                        <p className="text-[10px] font-black tracking-widest text-[#E38A2C] uppercase -mt-0.5">
                            Built By Ruturaj
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    <Link 
                        to="/menu"
                        onMouseMove={handleMagneticMove}
                        onMouseLeave={handleMagneticLeave}
                        className="bg-[#6B3F1D] hover:bg-[#2B2320] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#6B3F1D]/20 transition-all flex items-center gap-2"
                    >
                        <ShoppingBag size={14} />
                        <span>Digital Menu</span>
                    </Link>
                    <Link 
                        to="/features/management"
                        onMouseMove={handleMagneticMove}
                        onMouseLeave={handleMagneticLeave}
                        className="bg-gradient-to-r from-[#E38A2C] to-[#C23B22] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#E38A2C]/20 transition-all flex items-center gap-2"
                    >
                        <Store size={14} />
                        <span>Restaurant Suite</span>
                    </Link>
                </div>
            </header>

            {/* ========================================================================= */}
            {/* B. HERO SECTION: CHAI POUR HERO */}
            {/* ========================================================================= */}
            <section className="hero-section relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-[#FAFAF8]">
                
                {/* Background Hero Media Container */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="hero-bg-media w-full h-full object-cover opacity-75 scale-105 transition-transform duration-700"
                    >
                        <source src="/hero-bg.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF8] via-[#FAFAF8]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FAFAF8]/90 via-transparent to-[#FAFAF8]/90" />
                </div>

                {/* Main Hero Header Overlay */}
                <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 pt-12">
                    
                    {/* Saffron Kicker Badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-[#E38A2C]/40 text-[#6B3F1D] font-extrabold text-xs tracking-wider uppercase shadow-xl backdrop-blur-md">
                        <Sparkles size={14} className="text-[#E38A2C] animate-spin" />
                        <span>MASALA CHAI • FILTER COFFEE • STREET FOOD</span>
                    </div>

                    {/* Grand Character Stagger Title */}
                    <h1 ref={heroTitleRef} className="text-6xl sm:text-8xl lg:text-9xl font-black font-serif tracking-tight leading-none text-[#6B3F1D] drop-shadow-sm overflow-hidden flex justify-center flex-wrap">
                        {titleText.split('').map((char, index) => (
                            <span key={index} className="char-span inline-block">
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        ))}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base sm:text-xl text-[#2B2320]/85 font-bold max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                        An artisan Indian café experience crafted for sensory perfection. Slow-steeped spices, golden snacks, and authentic heritage brews.
                    </p>

                    {/* Built By Signature Tag & Action Callouts */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <span className="text-xs font-mono font-bold text-[#E38A2C] bg-[#E38A2C]/10 border border-[#E38A2C]/30 px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                            <Heart size={13} className="fill-[#E38A2C]" /> Built By Ruturaj
                        </span>
                        
                        <Link 
                            to="/menu"
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={handleMagneticLeave}
                            className="bg-[#6B3F1D] hover:bg-[#2B2320] text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-lg shadow-[#6B3F1D]/25 transition-all flex items-center gap-2"
                        >
                            <span>Explore Gourmet Menu</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    <button
                        onClick={() => {
                            const el = document.getElementById('food-showcase') || document.querySelector('.coffee-section');
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                            } else {
                                window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
                            }
                        }}
                        aria-label="Scroll to explore menu"
                        className={`pt-10 flex flex-col items-center gap-2 text-xs font-bold text-[#6B3F1D] transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 group focus:outline-none ${scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <span className="uppercase tracking-widest text-[10px] group-hover:text-[#E38A2C] transition-colors">SCROLL TO EXPLORE</span>
                        <ChevronDown size={20} className="animate-bounce text-[#E38A2C] group-hover:scale-125 transition-transform" />
                    </button>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* C. "OUR COFFEE" — FILTER COFFEE SHOWCASE */}
            {/* ========================================================================= */}
            <section className="coffee-section min-h-screen py-24 px-6 sm:px-12 bg-gradient-to-b from-[#FAFAF8] via-[#8A5A2B]/5 to-[#FAFAF8] flex items-center">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Left: Filter Coffee Media Box */}
                    <div className="coffee-image-box relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-white group">
                        <img 
                            src="/assets/images/filter-coffee.png" 
                            alt="South Indian Filter Coffee"
                            className="w-full h-[520px] object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#8A5A2B]/85 via-transparent to-transparent" />
                        
                        <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-[#D9A441] bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                                SOUTHERN BREW HERITAGE
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-serif font-black">
                                Traditional Brass Dabara Filter Coffee
                            </h3>
                        </div>
                    </div>

                    {/* Right: Roasted Tan Typography & Stat Callouts */}
                    <div className="space-y-8 text-left">
                        <div className="space-y-3">
                            <span className="text-xs font-black uppercase tracking-widest text-[#8A5A2B] bg-[#8A5A2B]/10 px-3.5 py-1.5 rounded-full border border-[#8A5A2B]/20">
                                OUR COFFEE
                            </span>
                            <h2 className="text-4xl sm:text-6xl font-black font-serif text-[#8A5A2B] tracking-tight leading-tight">
                                Slow-Brewed South Indian Coffee.
                            </h2>
                            <p className="text-base sm:text-lg text-[#2B2320]/80 font-semibold leading-relaxed">
                                Dark roast Chikmagalur beans double-filtered through traditional brass apparatus, frothed with steaming whole milk for a thick, velvety crown.
                            </p>
                        </div>

                        {/* Staggered Stat Callouts Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="bg-white p-5 rounded-2xl border border-[#8A5A2B]/20 shadow-md">
                                <span className="text-2xl font-black text-[#8A5A2B] font-serif block">100%</span>
                                <span className="text-xs font-bold text-[#2B2320]/70">Chikmagalur Arabica</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-[#8A5A2B]/20 shadow-md">
                                <span className="text-2xl font-black text-[#8A5A2B] font-serif block">Slow</span>
                                <span className="text-xs font-bold text-[#2B2320]/70">South Indian Style</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-[#8A5A2B]/20 shadow-md">
                                <span className="text-2xl font-black text-[#8A5A2B] font-serif block">Since</span>
                                <span className="text-xs font-bold text-[#2B2320]/70">2026 Edition</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>


            {/* ========================================================================= */}
            {/* D. "WHAT WE SERVE" — THE EXPLODED SCROLL MOMENT (HERO REEL INTERACTION) */}
            {/* ========================================================================= */}
            <section className="thali-pin-container relative min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-[#FAFAF8]">
                <div className="max-w-6xl mx-auto text-center space-y-6 w-full">
                    
                    <span className="text-xs font-black uppercase tracking-widest text-[#E38A2C] bg-[#E38A2C]/10 px-4 py-2 rounded-full border border-[#E38A2C]/30">
                        WHAT WE SERVE • REEL WOW MOMENT
                    </span>

                    <h2 className="text-4xl sm:text-7xl font-black font-serif text-[#6B3F1D] tracking-tight">
                        The Exploded Thali Experience.
                    </h2>

                    <p className="text-sm sm:text-base text-[#2B2320]/80 font-bold max-w-xl mx-auto">
                        Scroll down to assemble every dish component in mid-air high key parallax.
                    </p>

                    {/* Exploded Media Display Container */}
                    <div className="relative w-full max-w-4xl h-[450px] sm:h-[550px] mx-auto rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center my-8">
                        <img 
                            src="/assets/images/exploded-thali.png" 
                            alt="Exploded South Indian Thali"
                            className="thali-main-img w-full h-full object-cover transition-all"
                        />

                        {/* Interactive Floating Pop Labels (Saffron Orange #E38A2C) */}
                        <div className={`thali-tag-1 absolute top-12 left-8 sm:left-16 bg-[#E38A2C] text-white px-4 py-2 rounded-2xl shadow-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 border-2 border-white transition-all duration-300 ${activeExplodedTag === 0 ? 'scale-110 shadow-2xl' : 'opacity-80'}`}>
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            <span>MASALA DOSA</span>
                        </div>

                        <div className={`thali-tag-2 absolute top-24 right-8 sm:right-16 bg-[#E38A2C] text-white px-4 py-2 rounded-2xl shadow-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 border-2 border-white transition-all duration-300 ${activeExplodedTag === 1 ? 'scale-110 shadow-2xl' : 'opacity-80'}`}>
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            <span>SAMBAR</span>
                        </div>

                        <div className={`thali-tag-3 absolute bottom-20 left-12 sm:left-20 bg-[#E38A2C] text-white px-4 py-2 rounded-2xl shadow-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 border-2 border-white transition-all duration-300 ${activeExplodedTag === 2 ? 'scale-110 shadow-2xl' : 'opacity-80'}`}>
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            <span>MEDU VADA</span>
                        </div>

                        <div className={`thali-tag-4 absolute bottom-12 right-12 sm:right-20 bg-[#E38A2C] text-white px-4 py-2 rounded-2xl shadow-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 border-2 border-white transition-all duration-300 ${activeExplodedTag === 3 ? 'scale-110 shadow-2xl' : 'opacity-80'}`}>
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            <span>COCONUT CHUTNEY</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* STREET FOOD ELEVATED PIN & SCRUB */}
            <section className="samosa-pin-container min-h-screen py-24 px-6 bg-gradient-to-b from-[#FAFAF8] via-[#C23B22]/5 to-[#FAFAF8] flex flex-col items-center justify-center text-center">
                <div className="max-w-5xl mx-auto space-y-6">
                    <span className="text-xs font-black uppercase tracking-widest text-[#C23B22] bg-[#C23B22]/10 px-4 py-2 rounded-full border border-[#C23B22]/30">
                        CRUNCH &amp; SPICE
                    </span>

                    <h2 className="text-4xl sm:text-7xl font-black font-serif text-[#C23B22] tracking-tight">
                        STREET FOOD, ELEVATED.
                    </h2>

                    <p className="text-base text-[#2B2320]/80 font-bold max-w-xl mx-auto">
                        Hand-folded samosas, tangy pani puri, and fiery street snacks made fresh every hour.
                    </p>

                    <div className="samosa-bg-box relative max-w-3xl h-[420px] mx-auto rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-white my-8 flex items-center justify-center">
                        <img 
                            src="/assets/images/sweets-fusion.png" 
                            alt="Street Food Elevated"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#C23B22]/80 via-transparent to-transparent" />
                        
                        <div className="samosa-tag-1 absolute top-8 left-8 bg-[#C23B22] text-white px-4 py-2 rounded-2xl shadow-xl font-black text-xs uppercase tracking-wider border-2 border-white">
                            🌶️ Fiery Mint Chutney
                        </div>
                        <div className="samosa-tag-2 absolute bottom-8 right-8 bg-[#C23B22] text-white px-4 py-2 rounded-2xl shadow-xl font-black text-xs uppercase tracking-wider border-2 border-white">
                            🥟 Handmade Potato Filling
                        </div>

                        <div className="absolute bottom-8 left-8 text-white text-left space-y-1">
                            <span className="text-xs font-black text-[#D9A441] uppercase tracking-widest">SIGNATURE CRUNCH</span>
                            <h3 className="text-2xl font-black font-serif">Artisanal Samosa &amp; Tangy Chutneys</h3>
                        </div>
                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* E. "OUR SWEETS" — TURMERIC GOLD GALLERY */}
            {/* ========================================================================= */}
            <section className="py-24 px-6 sm:px-12 bg-[#FAFAF8]">
                <div className="max-w-7xl mx-auto space-y-12 text-center">
                    <div className="space-y-3">
                        <span className="text-xs font-black uppercase tracking-widest text-[#D9A441] bg-[#D9A441]/10 px-4 py-2 rounded-full border border-[#D9A441]/30">
                            DESI DESSERTS
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-black font-serif text-[#D9A441] tracking-tight">
                            OUR SWEETS
                        </h2>
                        <p className="text-base text-[#2B2320]/80 font-bold max-w-xl mx-auto">
                            Warm saffron syrup, velvety rose water, and freshly churned rabri.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#D9A441]/30 shadow-xl space-y-4 text-left group hover:-translate-y-2 transition-all">
                            <div className="h-64 rounded-2xl overflow-hidden">
                                <img src="/assets/images/sweets-fusion.png" alt="Spiral Golden Jalebi" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <span className="text-xs font-black text-[#D9A441] uppercase tracking-widest">CLASSIC SACRED DESSERT</span>
                            <h3 className="text-2xl font-black font-serif text-[#6B3F1D]">Spiral Golden Jalebi</h3>
                            <p className="text-sm text-[#2B2320]/80 font-medium leading-relaxed">Crispy fried saffron dough rings soaked in warm cardamom sugar syrup.</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-[#D9A441]/30 shadow-xl space-y-4 text-left group hover:-translate-y-2 transition-all">
                            <div className="h-64 rounded-2xl overflow-hidden">
                                <img src="/assets/images/hero-chai-pour.png" alt="Rose Water Gulab Jamun" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <span className="text-xs font-black text-[#D9A441] uppercase tracking-widest">ROYAL DELICACY</span>
                            <h3 className="text-2xl font-black font-serif text-[#6B3F1D]">Gulab Jamun with Rabri</h3>
                            <p className="text-sm text-[#2B2320]/80 font-medium leading-relaxed">Soft milk solids dumplings steeped in rose water syrup, served over chilled thick rabri.</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* F. "COLD & FUSION DRINKS" */}
            {/* ========================================================================= */}
            <section className="py-24 px-6 sm:px-12 bg-gradient-to-r from-[#F2994A]/10 via-[#FAFAF8] to-[#5C8A3A]/10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* Left: Mango Lassi */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#F2994A]/30 shadow-2xl space-y-6 text-left">
                        <span className="text-xs font-black uppercase tracking-widest text-[#F2994A] bg-[#F2994A]/10 px-3.5 py-1.5 rounded-full">
                            CHILLED REFRESHMENT
                        </span>
                        <h3 className="text-4xl font-black font-serif text-[#F2994A]">
                            MANGO LASSI
                        </h3>
                        <p className="text-sm text-[#2B2320]/80 font-semibold leading-relaxed">
                            Alphonso mango pulp blended with thick cultured yogurt, crushed ice, and topped with sliced pistachios and saffron threads.
                        </p>
                        <div className="h-60 rounded-2xl overflow-hidden">
                            <img src="/assets/images/sweets-fusion.png" alt="Mango Lassi" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                    </div>

                    {/* Right: Matcha Chai Fusion */}
                    <div className="bg-white p-8 rounded-[3rem] border border-[#5C8A3A]/30 shadow-2xl space-y-6 text-left">
                        <span className="text-xs font-black uppercase tracking-widest text-[#5C8A3A] bg-[#5C8A3A]/10 px-3.5 py-1.5 rounded-full">
                            MODERN HERBAL FUSION
                        </span>
                        <h3 className="text-4xl font-black font-serif text-[#5C8A3A]">
                            MATCHA CHAI FUSION
                        </h3>
                        <p className="text-sm text-[#2B2320]/80 font-semibold leading-relaxed">
                            Japanese ceremonial grade matcha whisked with spiced Indian chai tea infusion and oat milk for an energizing dual-tone elixir.
                        </p>
                        <div className="h-60 rounded-2xl overflow-hidden">
                            <img src="/assets/images/filter-coffee.png" alt="Matcha Chai Fusion" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                    </div>

                </div>
            </section>


            {/* ========================================================================= */}
            {/* FOOD & RESTAURANT MANAGEMENT INTEGRATION */}
            {/* ========================================================================= */}
            <section className="py-24 px-6 sm:px-12 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto space-y-12 text-center">
                    <div className="space-y-3">
                        <span className="text-xs font-black uppercase tracking-widest text-[#6B3F1D] bg-[#6B3F1D]/10 px-4 py-2 rounded-full border border-[#6B3F1D]/30">
                            FOOD &amp; RESTAURANT OPERATING STACK
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-black font-serif text-[#6B3F1D] tracking-tight">
                            Powered By RestaurantHub Platform
                        </h2>
                        <p className="text-base text-[#2B2320]/80 font-bold max-w-2xl mx-auto">
                            From instant digital QR table ordering to real-time Kitchen KDS displays and inventory tracking.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Link to="/customer/menu" className="bg-[#FAFAF8] p-6 rounded-3xl border border-[#6B3F1D]/20 shadow-md hover:-translate-y-1.5 transition-all text-left space-y-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-[#E38A2C]/10 text-[#E38A2C] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <QrCode size={24} />
                            </div>
                            <h4 className="font-bold text-[#6B3F1D] text-lg">Digital Table QR Menu</h4>
                            <p className="text-xs text-[#2B2320]/70 font-medium">Scan table QR codes to place orders instantly with live dish customizations.</p>
                        </Link>

                        <Link to="/menu" className="bg-[#FAFAF8] p-6 rounded-3xl border border-[#6B3F1D]/20 shadow-md hover:-translate-y-1.5 transition-all text-left space-y-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-[#6B3F1D]/10 text-[#6B3F1D] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShoppingBag size={24} />
                            </div>
                            <h4 className="font-bold text-[#6B3F1D] text-lg">Online Food Ordering</h4>
                            <p className="text-xs text-[#2B2320]/70 font-medium">Explore dishes, apply promo codes, and track real-time kitchen preparation.</p>
                        </Link>

                        <Link to="/features/details?module=orders" className="bg-[#FAFAF8] p-6 rounded-3xl border border-[#6B3F1D]/20 shadow-md hover:-translate-y-1.5 transition-all text-left space-y-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-[#C23B22]/10 text-[#C23B22] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Flame size={24} />
                            </div>
                            <h4 className="font-bold text-[#6B3F1D] text-lg">Kitchen Display (KDS)</h4>
                            <p className="text-xs text-[#2B2320]/70 font-medium">Direct order routing to chef terminals for 30% faster cooking speed.</p>
                        </Link>

                        <Link to="/features/management" className="bg-[#FAFAF8] p-6 rounded-3xl border border-[#6B3F1D]/20 shadow-md hover:-translate-y-1.5 transition-all text-left space-y-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-[#5C8A3A]/10 text-[#5C8A3A] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <LineChart size={24} />
                            </div>
                            <h4 className="font-bold text-[#6B3F1D] text-lg">POS &amp; Analytics</h4>
                            <p className="text-xs text-[#2B2320]/70 font-medium">Automated stock tracking, revenue dashboards, and multi-branch management.</p>
                        </Link>
                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* G. INGREDIENT & TEXTURE PARALLAX GALLERY */}
            {/* ========================================================================= */}
            <section className="horizontal-gallery-wrapper min-h-screen py-20 px-6 bg-[#FAFAF8] flex flex-col justify-center overflow-hidden">
                <div className="max-w-7xl mx-auto space-y-8 text-center w-full">
                    <span className="text-xs font-black uppercase tracking-widest text-[#6B3F1D] bg-[#6B3F1D]/10 px-4 py-2 rounded-full">
                        CRAFT &amp; INGREDIENTS
                    </span>
                    <h2 className="text-4xl sm:text-6xl font-black font-serif text-[#6B3F1D]">
                        Culinary Texture Gallery
                    </h2>

                    {/* Horizontal Scrub Gallery */}
                    <div className="flex gap-8 pt-6 w-[300vw] sm:w-[200vw]">
                        {[
                            { name: 'ORIGIN', img: '/assets/images/hero-chai-pour.png', desc: 'Single-estate Assam & Nilgiri tea leaves' },
                            { name: 'AROMA', img: '/assets/images/filter-coffee.png', desc: 'Green cardamom, clove, ginger root' },
                            { name: 'CRUNCH', img: '/assets/images/exploded-thali.png', desc: 'Golden crispy fried samosa pastry' },
                            { name: 'SWEET', img: '/assets/images/sweets-fusion.png', desc: 'Pure desi ghee & saffron syrup' },
                        ].map((item, idx) => (
                            <div key={idx} className="gallery-card-item w-80 sm:w-96 bg-white p-6 rounded-[2.5rem] border border-[#6B3F1D]/20 shadow-xl space-y-4 text-left shrink-0">
                                <div className="h-72 rounded-2xl overflow-hidden">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs font-black text-[#E38A2C] uppercase tracking-widest">{item.name}</span>
                                <p className="text-sm font-bold text-[#6B3F1D]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ========================================================================= */}
            {/* H. FINALE / CTA SECTION */}
            {/* ========================================================================= */}
            <section className="relative py-32 px-6 bg-[#C23B22] text-white text-center overflow-hidden">
                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-extrabold text-xs tracking-wider uppercase backdrop-blur-md">
                        <Sparkles size={14} />
                        <span>CHAI THEORY • BUILT BY RUTURAJ</span>
                    </div>

                    <h2 className="text-5xl sm:text-8xl font-black font-serif tracking-tight leading-none">
                        Experience The Theory.
                    </h2>

                    <p className="text-base sm:text-xl font-bold max-w-xl mx-auto text-white/90">
                        Reserve your table or order online for instant dine-in and pickup delivery.
                    </p>

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/menu"
                            onMouseMove={handleMagneticMove}
                            onMouseLeave={handleMagneticLeave}
                            className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#C23B22] font-black text-base px-10 py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3"
                        >
                            <span>RESERVE YOUR TABLE</span>
                            <ArrowRight size={20} />
                        </Link>
                    </div>

                    <div className="pt-16 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-white/80">
                        <p>© 2026 Chai Theory — Built By Ruturaj | BR</p>
                        <p>High-Key Daylight Brand Architecture</p>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default ChaiTheoryShowcase;
