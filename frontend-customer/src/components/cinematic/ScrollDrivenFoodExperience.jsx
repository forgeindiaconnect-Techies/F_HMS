import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShoppingBag, Flame, ChevronDown, UtensilsCrossed, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

gsap.registerPlugin(ScrollTrigger);

export const FEATURED_DISHES = [
  {
    id: 'biryani-01',
    number: '01',
    total: '03',
    tag: 'SIGNATURE DISH',
    title: 'Chicken Dum Biryani',
    watermark: 'Biriyani',
    description: 'Bone-in tender chicken and saffron basmati, sealed with dough in a heavy brass handi and slow-cooked for ninety minutes. Served with salan and chilled burani raita.',
    price: 360,
    originalPrice: 420,
    heroImage: '/assets/images/dish-biryani-hero.jpg',
    spicesImage: '/assets/images/dish-biryani-spices.jpg',
    badgeText: 'AUTHENTIC DUM COOKING • SLOW FIRE • ROYAL HYDERABADI RECIPE •',
    ingredients: ['Star Anise', 'Green Cardamom', 'Cinnamon Bark', 'Saffron Strands', 'Fried Crispy Onions', 'Fresh Mint Sprigs', 'Kashmiri Chili'],
    accentColor: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.40)',
    category: 'Biryani'
  },
  {
    id: 'makhani-02',
    number: '02',
    total: '03',
    tag: 'MOST ORDERED',
    title: 'Butter Chicken (Murgh Makhani)',
    watermark: 'Makhani',
    description: 'Tandoor-charred chicken folded into a velvet tomato-makhani gravy, slow-simmered with cashews and finished with a generous cube of white butter and kasuri methi.',
    price: 380,
    originalPrice: 440,
    heroImage: '/assets/images/dish-makhani-hero.jpg',
    spicesImage: '/assets/images/dish-makhani-spices.jpg',
    badgeText: 'RICH TOMATO GRAVY • WHITE FARM BUTTER • HAND-CRUSHED KASURI METHI •',
    ingredients: ['Vine Tomatoes', 'White Farm Butter', 'Fresh Cream Swirl', 'Kasuri Methi', 'Ginger Juliennes', 'Green Chilies', 'Bay Leaves'],
    accentColor: '#EF4444',
    accentGlow: 'rgba(239, 68, 68, 0.40)',
    category: 'Curry'
  },
  {
    id: 'tandoori-03',
    number: '03',
    total: '03',
    tag: "CHEF'S SPECIAL",
    title: 'Tandoori Chicken Platter',
    watermark: 'Tandoori',
    description: 'Whole chicken leg quarters steeped in hung curd, degi mirch, and cold-pressed mustard oil, blistered over flaming charcoal embers in authentic clay pit ovens.',
    price: 420,
    originalPrice: 480,
    heroImage: '/assets/images/dish-tandoori-hero.jpg',
    spicesImage: '/assets/images/dish-tandoori-spices.jpg',
    badgeText: 'CLAY OVEN ROASTED • CHARCOAL SMOKED • KASHMIRI DEGI MIRCH •',
    ingredients: ['Charred Lemon', 'Pickled Onions', 'Mint Chutney', 'Charcoal Smoke', 'Paprika Puffs', 'Cracked Pepper'],
    accentColor: '#F97316',
    accentGlow: 'rgba(249, 115, 22, 0.40)',
    category: 'Grill'
  }
];

export default function ScrollDrivenFoodExperience() {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const progressLineRef = useRef(null);
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeDishIndex, setActiveDishIndex] = useState(0);
  const [addedDishId, setAddedDishId] = useState(null);

  const { addToCart } = useCart();

  // Preload all high-res assets immediately on mount
  useEffect(() => {
    FEATURED_DISHES.forEach(dish => {
      const img1 = new Image();
      img1.src = dish.heroImage;
      const img2 = new Image();
      img2.src = dish.spicesImage;
    });
  }, []);

  const handleAddDish = (dish) => {
    try {
      addToCart({
        id: dish.id,
        _id: dish.id,
        name: dish.title,
        price: dish.price,
        image: dish.heroImage,
        category: dish.category
      });
      setAddedDishId(dish.id);
      toast.success(`Added ${dish.title} to your bag!`);
      setTimeout(() => setAddedDishId(null), 1800);
    } catch {
      toast.success(`Selected ${dish.title}!`);
    }
  };

  // GSAP ScrollTrigger Pinned Scrubbing
  useEffect(() => {
    const container = containerRef.current;
    const stickyEl = stickyRef.current;
    if (!container || !stickyEl) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        pin: stickyEl,
        pinSpacing: true,
        scrub: 0.8,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = Math.max(0, Math.min(1, self.progress));
          setScrollProgress(p);
          
          if (p < 0.38) {
            setActiveDishIndex(0);
          } else if (p < 0.72) {
            setActiveDishIndex(1);
          } else {
            setActiveDishIndex(2);
          }

          if (progressLineRef.current) {
            progressLineRef.current.style.width = `${p * 100}%`;
          }
        }
      });
    }, container);

    return () => ctx.revert();
  }, []);

  // Continuous Seamless Overlapping Interpolation (Zero Blank / Dark Screens)
  const getDishMetrics = (dishIndex) => {
    const P = scrollProgress;

    // Timeline Landmarks:
    // Dish 0 Full: [0.00, 0.32] -> Transition 0->1: [0.32, 0.48]
    // Dish 1 Full: [0.48, 0.65] -> Transition 1->2: [0.65, 0.80]
    // Dish 2 Full: [0.80, 1.00]

    let opacity = 0;
    let heroScale = 1.0;
    let heroY = 0;
    let spicesOpacity = 0;
    let spicesScale = 0.85;
    let spicesRotate = 0;
    let textOpacity = 0;
    let textY = 0;
    let watermarkOpacity = 0;
    let watermarkY = 0;

    if (dishIndex === 0) {
      if (P <= 0.32) {
        // Dish 0 Active
        opacity = 1.0;
        heroScale = 1.0 + P * 0.12;
        heroY = 0;
        
        // Exploded spices burst out smoothly as user scrolls past 0.10
        if (P <= 0.10) {
          spicesOpacity = (P / 0.10) * 0.4;
          spicesScale = 0.80 + (P / 0.10) * 0.15;
          spicesRotate = -5 + (P / 0.10) * 5;
        } else {
          const bloom = (P - 0.10) / 0.22; // 0 to 1
          spicesOpacity = 0.4 + bloom * 0.6;
          spicesScale = 0.95 + bloom * 0.22;
          spicesRotate = bloom * 12;
        }

        textOpacity = 1.0;
        textY = 0;
        watermarkOpacity = 0.28 + P * 0.10;
        watermarkY = 0;
      } else if (P <= 0.48) {
        // Cross-fading OUT to Dish 1 (Seamless handoff)
        const k = (P - 0.32) / 0.16; // 0 to 1
        opacity = 1.0 - k;
        heroScale = 1.04 - k * 0.08;
        heroY = -70 * k;
        spicesOpacity = (1.0 - k) * 0.8;
        spicesScale = 1.17 + k * 0.1;
        spicesRotate = 12 + k * 10;
        textOpacity = Math.max(0, 1.0 - k * 1.3);
        textY = -35 * k;
        watermarkOpacity = 0.38 * (1.0 - k);
        watermarkY = -30 * k;
      } else {
        opacity = 0;
      }
    } else if (dishIndex === 1) {
      if (P < 0.32) {
        opacity = 0;
      } else if (P <= 0.48) {
        // Cross-fading IN from Dish 0 (Always maintaining full brightness)
        const k = (P - 0.32) / 0.16; // 0 to 1
        opacity = k;
        heroScale = 0.94 + k * 0.08;
        heroY = 70 * (1.0 - k);
        spicesOpacity = k * 0.45;
        spicesScale = 0.85 + k * 0.15;
        spicesRotate = -8 * (1.0 - k);
        textOpacity = Math.max(0, (k - 0.2) / 0.8);
        textY = 35 * (1.0 - k);
        watermarkOpacity = 0.35 * k;
        watermarkY = 30 * (1.0 - k);
      } else if (P <= 0.65) {
        // Dish 1 Fully Active & Exploded Makhani Ingredients Bloom
        opacity = 1.0;
        const sub = (P - 0.48) / 0.17; // 0 to 1
        heroScale = 1.02 + Math.sin(sub * Math.PI) * 0.04;
        heroY = 0;
        spicesOpacity = 0.6 + sub * 0.4;
        spicesScale = 1.0 + sub * 0.18;
        spicesRotate = (sub - 0.5) * 14;
        textOpacity = 1.0;
        textY = 0;
        watermarkOpacity = 0.35;
        watermarkY = 0;
      } else if (P <= 0.80) {
        // Cross-fading OUT to Dish 2
        const k = (P - 0.65) / 0.15; // 0 to 1
        opacity = 1.0 - k;
        heroScale = 1.04 - k * 0.08;
        heroY = -70 * k;
        spicesOpacity = (1.0 - k) * 0.75;
        spicesScale = 1.18 + k * 0.1;
        spicesRotate = 7 + k * 10;
        textOpacity = Math.max(0, 1.0 - k * 1.3);
        textY = -35 * k;
        watermarkOpacity = 0.35 * (1.0 - k);
        watermarkY = -30 * k;
      } else {
        opacity = 0;
      }
    } else if (dishIndex === 2) {
      if (P < 0.65) {
        opacity = 0;
      } else if (P <= 0.80) {
        // Cross-fading IN from Dish 1
        const k = (P - 0.65) / 0.15; // 0 to 1
        opacity = k;
        heroScale = 0.94 + k * 0.08;
        heroY = 70 * (1.0 - k);
        spicesOpacity = k * 0.5;
        spicesScale = 0.85 + k * 0.15;
        spicesRotate = -8 * (1.0 - k);
        textOpacity = Math.max(0, (k - 0.2) / 0.8);
        textY = 35 * (1.0 - k);
        watermarkOpacity = 0.35 * k;
        watermarkY = 30 * (1.0 - k);
      } else {
        // Dish 2 Fully Active & Tandoori Smoke/Charred Spices Bloom
        opacity = 1.0;
        const sub = (P - 0.80) / 0.20; // 0 to 1
        heroScale = 1.02 + Math.sin(sub * Math.PI) * 0.03;
        heroY = 0;
        spicesOpacity = 0.7 + sub * 0.3;
        spicesScale = 1.0 + sub * 0.18;
        spicesRotate = sub * 12;
        textOpacity = 1.0;
        textY = 0;
        watermarkOpacity = 0.35;
        watermarkY = 0;
      }
    }

    return {
      opacity,
      heroScale,
      heroY,
      spicesOpacity,
      spicesScale,
      spicesRotate,
      textOpacity,
      textY,
      watermarkOpacity,
      watermarkY
    };
  };

  const currentDish = FEATURED_DISHES[activeDishIndex];

  const scrollToDish = (index) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const containerTop = rect.top + scrollTop;
    const totalHeight = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + (index / (FEATURED_DISHES.length - 1)) * totalHeight * 0.9;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <section 
      id="food-experience" 
      ref={containerRef} 
      className="relative w-full bg-[#080605] text-stone-100 select-none"
      style={{ height: '360vh' }}
    >
      {/* Pinned Stage Container Managed by GSAP ScrollTrigger Pin */}
      <div 
        ref={stickyRef} 
        className="h-screen w-full flex flex-col justify-between overflow-hidden px-4 sm:px-8 md:px-14 py-6 md:py-8 z-20 relative"
      >
        {/* Dynamic Ambient Background Glow */}
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentDish.accentGlow} 0%, rgba(14, 11, 9, 0.96) 55%, #060403 100%)`
          }}
        />

        {/* Center Golden Spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-500/12 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Header Bar */}
        <header className="relative z-30 flex items-center justify-between w-full pt-1 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs font-black tracking-[0.25em] uppercase text-amber-300 font-mono">
                ROYAL CULINARY SHOWCASE
              </span>
              <span className="text-[10px] text-stone-400 font-medium tracking-wider">
                Slow-Cooked Heritage Dum Recipes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-10">
            {/* The Table Dish Navigator */}
            <nav className="hidden lg:flex flex-col text-right font-mono text-[11px] tracking-widest space-y-1.5 border-r border-stone-800 pr-6">
              <span className="text-stone-500 font-bold uppercase text-[9px] tracking-[0.3em] pb-1">
                THE TABLE
              </span>
              {FEATURED_DISHES.map((dish, idx) => (
                <button
                  key={dish.id}
                  onClick={() => scrollToDish(idx)}
                  className={`transition-all duration-300 flex items-center justify-end gap-2 text-left cursor-pointer ${
                    activeDishIndex === idx
                      ? 'text-amber-300 font-black scale-105'
                      : 'text-stone-500 hover:text-stone-300 font-medium'
                  }`}
                >
                  <span className="text-[9px] opacity-70">{dish.number}</span>
                  <span>{dish.watermark.toUpperCase()}</span>
                  {activeDishIndex === idx && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  )}
                </button>
              ))}
            </nav>

            {/* Rotating Circular Culinary Stamp */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-amber-500/30" />
              <svg className="w-full h-full animate-[spin_24s_linear_infinite]" viewBox="0 0 100 100">
                <path
                  id="circlePathCust2"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text className="text-[7.5px] uppercase tracking-[0.2em] fill-amber-200/70 font-mono font-bold">
                  <textPath href="#circlePathCust2">
                    AUTHENTIC DUM COOKING • SLOW FIRE • FRESH SPICES •
                  </textPath>
                </text>
              </svg>
              <UtensilsCrossed size={16} className="text-amber-400 absolute" />
            </div>
          </div>
        </header>

        {/* Center Stage: Watermark + Exploded Ingredients + Hero Dishes */}
        <div className="relative flex-1 flex items-center justify-center w-full my-auto">
          {/* Watermark Typography: "Biriyani" / "Makhani" / "Tandoori" */}
          {FEATURED_DISHES.map((dish, idx) => {
            const m = getDishMetrics(idx);
            if (m.watermarkOpacity <= 0.01) return null;

            return (
              <div
                key={`wm-${dish.id}`}
                className="absolute inset-x-0 bottom-4 sm:bottom-8 md:bottom-10 flex justify-center items-center pointer-events-none transition-all duration-75"
                style={{
                  opacity: m.watermarkOpacity,
                  transform: `translate3d(0, ${m.watermarkY}px, 0)`,
                }}
              >
                <span 
                  className="text-6xl sm:text-8xl md:text-[13vw] lg:text-[15vw] font-serif font-black tracking-tight leading-none text-transparent select-none"
                  style={{
                    WebkitTextStroke: '1px rgba(245, 158, 11, 0.40)',
                    background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.90) 0%, rgba(217, 119, 6, 0.50) 85%, transparent 100%)',
                    WebkitBackgroundClip: 'text',
                    filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.95))'
                  }}
                >
                  {dish.watermark}
                </span>
              </div>
            );
          })}

          {/* Dishes & Exploded Ingredient Layers (Overlapping for zero blank frames) */}
          {FEATURED_DISHES.map((dish, idx) => {
            const m = getDishMetrics(idx);
            if (m.opacity <= 0.005) return null;

            return (
              <div 
                key={`dish-stage-${dish.id}`}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ opacity: m.opacity }}
              >
                {/* Exploded Spices Orbit Layer */}
                <div
                  className="absolute w-[340px] h-[340px] xs:w-[420px] xs:h-[420px] sm:w-[540px] sm:h-[540px] md:w-[680px] md:h-[680px] lg:w-[760px] lg:h-[760px] rounded-full pointer-events-none transition-transform duration-75"
                  style={{
                    opacity: m.spicesOpacity,
                    transform: `scale(${m.spicesScale}) rotate(${m.spicesRotate}deg)`,
                    mixBlendMode: 'screen',
                    filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.4))'
                  }}
                >
                  <img
                    src={dish.spicesImage}
                    alt={`${dish.title} ingredients explosion`}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    style={{
                      maskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 95%)'
                    }}
                  />
                </div>

                {/* Hero Dish Centerpiece (Copper Handi / Kadai / Cast Iron Platter) */}
                <div
                  className="relative z-20 w-[240px] h-[240px] xs:w-[290px] xs:h-[290px] sm:w-[380px] sm:h-[380px] md:w-[460px] md:h-[460px] lg:w-[520px] lg:h-[520px] rounded-full flex items-center justify-center transition-transform duration-75 pointer-events-auto group cursor-pointer"
                  style={{
                    transform: `translate3d(0, ${m.heroY}px, 0) scale(${m.heroScale})`,
                  }}
                  onClick={() => scrollToDish(idx)}
                >
                  <div 
                    className="absolute inset-4 rounded-full blur-2xl -z-10"
                    style={{
                      backgroundColor: dish.accentColor,
                      opacity: 0.35
                    }}
                  />

                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border border-amber-500/25 backdrop-blur-sm">
                    <img
                      src={dish.heroImage}
                      alt={dish.title}
                      className="w-full h-full object-cover rounded-full select-none transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/40 via-transparent to-white/15 pointer-events-none" />
                  </div>

                  <div className="absolute -bottom-2 sm:bottom-4 bg-stone-900/90 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider backdrop-blur-md shadow-xl flex items-center gap-1.5 pointer-events-none">
                    <Flame size={12} className="text-amber-400 fill-amber-400 animate-pulse" />
                    <span>Slow-Cooked Dum</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Left Column Text (Smooth Crossfade with vertical drift) */}
          {FEATURED_DISHES.map((dish, idx) => {
            const m = getDishMetrics(idx);
            if (m.textOpacity <= 0.01) return null;

            return (
              <div
                key={`info-${dish.id}`}
                className="absolute left-0 top-1/2 -translate-y-1/2 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl z-30 pointer-events-auto space-y-4 sm:space-y-5 text-left transition-all duration-75"
                style={{
                  opacity: m.textOpacity,
                  transform: `translate3d(0, ${m.textY}px, 0)`
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-3xl sm:text-5xl font-extrabold text-amber-400 tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                    {dish.number}
                  </span>
                  <span className="text-stone-500 font-mono text-sm sm:text-base font-bold">
                    / {dish.total}
                  </span>
                  <span className="h-4 w-[1px] bg-stone-700 mx-1" />
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest">
                    {dish.tag}
                  </span>
                </div>

                <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-black text-white tracking-tight leading-[1.05] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                  {dish.title}
                </h2>

                <p className="text-stone-300 text-xs sm:text-sm md:text-base font-medium leading-relaxed drop-shadow-md max-w-md">
                  {dish.description}
                </p>

                <div className="hidden sm:flex flex-wrap gap-1.5 pt-1">
                  {dish.ingredients.slice(0, 5).map((ing, i) => (
                    <span 
                      key={i}
                      className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-stone-900/80 border border-stone-800 text-stone-300 tracking-wide"
                    >
                      • {ing}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 sm:gap-6 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-serif font-black text-amber-400">
                      ₹{dish.price}
                    </span>
                    <span className="text-xs sm:text-sm text-stone-500 line-through font-mono">
                      ₹{dish.originalPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddDish(dish)}
                    className="group flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {addedDishId === dish.id ? (
                      <>
                        <Check size={16} />
                        <span>ADDED TO BAG</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={15} />
                        <span>ADD TO ORDER</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Progress Track & Jump Navigation */}
        <footer className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-800/80 pt-3 shrink-0">
          <div className="flex items-center gap-2.5 text-stone-400 font-mono text-[11px] font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>SCROLL TO SERVE THE NEXT DISH</span>
            <ChevronDown size={15} className="text-amber-400 animate-bounce" />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-80">
            <span className="text-[10px] font-mono text-stone-500 font-bold shrink-0">
              01
            </span>
            <div className="relative flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
              <div 
                ref={progressLineRef}
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-75"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
              03
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {FEATURED_DISHES.map((dish, idx) => (
              <button
                key={`btn-nav-${dish.id}`}
                onClick={() => scrollToDish(idx)}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all cursor-pointer ${
                  activeDishIndex === idx
                    ? 'bg-amber-400 text-stone-950 font-black scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                {dish.number}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </section>
  );
}
