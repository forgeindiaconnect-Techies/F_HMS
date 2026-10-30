import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, Sparkles, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import toast from 'react-hot-toast';

gsap.registerPlugin(ScrollTrigger);

const SIGNATURE_DISHES = [
    {
        id: 'sig-1',
        title: 'Double Angus Smash Burger',
        tagline: 'Artisan Brioche & Melted Aged Cheddar',
        category: 'Gourmet Burgers',
        price: 299,
        rating: 4.9,
        reviews: '1.8k+',
        prepTime: '15 mins',
        calories: '640 kcal',
        image: '/images/food/burger.jpg',
        description: 'Two grass-fed Angus beef patties seared on smoking cast iron, double layered with 18-month aged sharp cheddar, slow-caramelized onions, and house secret truffle aioli on a toasted butter brioche bun.',
        tastingNotes: ['Smoky Char', 'Rich Cheddar Umami', 'Sweet Onion Glaze', 'Crisp Butterhead']
    },
    {
        id: 'sig-2',
        title: 'Wood-Fired Neapolitan Pizza',
        tagline: 'Hand-Stretched Sourdough at 900°F',
        category: 'Artisan Pizzas',
        price: 449,
        rating: 4.8,
        reviews: '2.4k+',
        prepTime: '18 mins',
        calories: '720 kcal',
        image: '/images/food/pizza.jpg',
        description: 'Naturally fermented 48-hour dough baked in stone wood oven, topped with crushed San Marzano D.O.P. tomatoes, fresh Campania buffalo mozzarella, fragrant wild basil, and cold-pressed extra virgin olive oil.',
        tastingNotes: ['Blistered Crust', 'Tangy Sweet Tomato', 'Creamy Mozzarella', 'Wild Basil Aroma']
    },
    {
        id: 'sig-3',
        title: 'Royal Hyderabadi Dum Biryani',
        tagline: 'Sealed Earthen Clay Handi Cooking',
        category: 'Heritage Biryanis',
        price: 389,
        rating: 4.9,
        reviews: '3.1k+',
        prepTime: '20 mins',
        calories: '780 kcal',
        image: '/images/food/biryani.jpg',
        description: 'Aged long-grain basmati rice layered with succulent marinated chicken, saffron milk, caramelized shallots, mint, and secret royal potli spices, slow-steamed under dough-sealed clay lid.',
        tastingNotes: ['Saffron Perfume', 'Melt-in-Mouth Meat', 'Cardamom & Clove', 'Crispy Barista Shallots']
    },
    {
        id: 'sig-4',
        title: 'Truffle Fettuccine Alfredo',
        tagline: 'Fresh Handmade Ribbons & Shaved Truffle',
        category: 'Handmade Pasta',
        price: 369,
        rating: 4.7,
        reviews: '1.2k+',
        prepTime: '15 mins',
        calories: '590 kcal',
        image: '/images/food/pasta.jpg',
        description: 'Daily extruded fresh egg fettuccine tossed in emulsified 24-month Parmigiano Reggiano butter emulsion, crowned with freshly shaved Italian black summer truffles and cracked Tellicherry peppercorn.',
        tastingNotes: ['Earthy Black Truffle', 'Nutty Aged Parmesan', 'Silky Butter Emulsion', 'Coarse Pepper Heat']
    },
    {
        id: 'sig-5',
        title: 'Molten Chocolate Lava Sphere',
        tagline: 'Valrhona Dark Chocolate Ganache Eruption',
        category: 'Luxury Desserts',
        price: 249,
        rating: 4.9,
        reviews: '1.6k+',
        prepTime: '10 mins',
        calories: '490 kcal',
        image: '/images/food/dessert.jpg',
        description: 'Single-origin 72% Valrhona dark chocolate cake baked to tender perfection with an intensely molten core that flows effortlessly, paired with artisanal Madagascar vanilla bean gelato and tart raspberries.',
        tastingNotes: ['Warm Liquid Fudge', 'Bittersweet Cocoa', 'Cool Vanilla Bean', 'Tart Forest Berries']
    }
];

const SignatureDishShowcase = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [addedId, setAddedId] = useState(null);
    const containerRef = useRef(null);
    const activeDish = SIGNATURE_DISHES[activeIndex];
    const { addToCart } = useCart();

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            gsap.from('.dish-card-showcase', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 75%',
                    toggleActions: 'play none none reverse'
                },
                y: 60,
                opacity: 0,
                stagger: 0.15,
                duration: 1,
                ease: 'power3.out'
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleQuickAdd = (dish) => {
        addToCart({
            _id: dish.id,
            name: dish.title,
            price: dish.price,
            image: dish.image,
            category: dish.category
        });
        setAddedId(dish.id);
        toast.success(`Added ${dish.title} to your bag!`);
        setTimeout(() => setAddedId(null), 1800);
    };

    return (
        <section 
            ref={containerRef}
            className="py-20 md:py-32 bg-slate-950 text-white relative overflow-hidden"
        >
            {/* Background Ambient Depth Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/* Section Header with Staggered Narrative */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="space-y-3 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
                            <Flame size={14} className="text-orange-500" />
                            <span>Curated Masterpieces</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                            Chef's Signature <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-400">Creations</span>
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base font-medium">
                            Scroll through our award-winning gastronomic icons, crafted fresh on order using small-batch heritage techniques.
                        </p>
                    </div>

                    {/* Navigation Buttons for Slider */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveIndex(prev => (prev === 0 ? SIGNATURE_DISHES.length - 1 : prev - 1))}
                            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
                            aria-label="Previous Dish"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveIndex(prev => (prev === SIGNATURE_DISHES.length - 1 ? 0 : prev + 1))}
                            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
                            aria-label="Next Dish"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* 3D Interactive Centerpiece Showcase Stage */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black/80 mb-12">
                    
                    {/* Left: Active Dish Imagery with 3D Depth & Lighting */}
                    <div className="lg:col-span-6 flex justify-center relative perspective-[1200px]">
                        <div 
                            className="relative w-[280px] sm:w-[360px] md:w-[420px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-orange-950/40 border-2 border-slate-700/60 group cursor-pointer"
                            style={{
                                transform: 'rotateY(-4deg) rotateX(4deg)',
                                transformStyle: 'preserve-3d',
                                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            <img 
                                src={activeDish.image} 
                                alt={activeDish.title} 
                                className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700"
                            />
                            
                            {/* Realistic Corner Glass Badge */}
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-xs font-black text-amber-300">
                                <Star size={12} className="fill-amber-300" />
                                <span>{activeDish.rating} ({activeDish.reviews})</span>
                            </div>

                            <div className="absolute top-4 right-4 bg-orange-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-black">
                                ₹{activeDish.price}
                            </div>
                        </div>
                    </div>

                    {/* Right: Rich Tasting Profile & Instant Order Action */}
                    <div className="lg:col-span-6 space-y-6">
                        
                        <div className="space-y-2">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400 block">
                                {activeDish.category}
                            </span>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                                {activeDish.title}
                            </h3>
                            <p className="text-sm sm:text-base font-semibold text-amber-200/80 italic">
                                "{activeDish.tagline}"
                            </p>
                        </div>

                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            {activeDish.description}
                        </p>

                        {/* Tasting Flavor Notes Pills */}
                        <div className="space-y-2.5">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                                Chef's Sensory Flavor Profile
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {activeDish.tastingNotes.map((note, idx) => (
                                    <span 
                                        key={idx} 
                                        className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-200"
                                    >
                                        • {note}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800 text-xs">
                            <div>
                                <span className="text-slate-400 block font-bold">Preparation Time</span>
                                <span className="text-sm font-black text-white">{activeDish.prepTime}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-bold">Caloric Count</span>
                                <span className="text-sm font-black text-white">{activeDish.calories}</span>
                            </div>
                        </div>

                        {/* Order Action Buttons */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => handleQuickAdd(activeDish)}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer text-sm"
                            >
                                {addedId === activeDish.id ? (
                                    <>
                                        <Check size={18} />
                                        <span>Added to Order!</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag size={18} />
                                        <span>Add to Bag • ₹{activeDish.price}</span>
                                    </>
                                )}
                            </button>

                            <Link
                                to="/menu"
                                className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <span>Browse Full Menu</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                    </div>

                </div>

                {/* Horizontal Quick Selector Carousel Thumbnails */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {SIGNATURE_DISHES.map((dish, idx) => (
                        <div
                            key={dish.id}
                            onClick={() => setActiveIndex(idx)}
                            className={`dish-card-showcase p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center gap-2.5 ${
                                activeIndex === idx
                                    ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10 scale-102'
                                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                                <img src={dish.image} alt={dish.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 w-full">
                                <h4 className="text-xs font-black text-white truncate">{dish.title}</h4>
                                <span className="text-[11px] font-extrabold text-orange-400">₹{dish.price}</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default SignatureDishShowcase;
