import { useRef, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
    { name: 'Smash Burgers', tag: 'Burger', image: '/images/food/burger.jpg', count: '14 Outlets' },
    { name: 'Wood-Fired Pizza', tag: 'Pizza', image: '/images/food/pizza.jpg', count: '18 Outlets' },
    { name: 'Clay-Pot Biryani', tag: 'Biryani', image: '/images/food/biryani.jpg', count: '12 Outlets' },
    { name: 'Handmade Pasta', tag: 'Pasta', image: '/images/food/pasta.jpg', count: '9 Outlets' },
    { name: 'Artisan Desserts', tag: 'Dessert', image: '/images/food/dessert.jpg', count: '16 Outlets' },
    { name: 'South Indian', tag: 'Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80', count: '11 Outlets' },
    { name: 'Wok Noodles', tag: 'Noodles', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80', count: '15 Outlets' },
    { name: 'Coolers & Shakes', tag: 'Beverages', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80', count: '20 Outlets' }
];

const CravingsCategoryRail = ({ activeCategory, onSelectCategory }) => {
    const railRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            gsap.from('.craving-category-card', {
                scrollTrigger: {
                    trigger: railRef.current,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                scale: 0.88,
                opacity: 0,
                y: 30,
                stagger: 0.06,
                duration: 0.7,
                ease: 'back.out(1.4)'
            });
        }, railRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={railRef} className="py-16 md:py-20 bg-white dark:bg-slate-950 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2">
                            <Sparkles size={14} />
                            <span>Craving Something Delicious?</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Explore by Flavor &amp; Craving
                        </h2>
                    </div>

                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        Tap a category to filter live menus &amp; outlets
                    </span>
                </div>

                {/* Horizontal Scrollable Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {CATEGORIES.map((cat, idx) => {
                        const isSelected = activeCategory?.toLowerCase() === cat.tag.toLowerCase();
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => onSelectCategory(cat.tag)}
                                className={`craving-category-card p-3 rounded-2xl flex flex-col items-center text-center gap-3 transition-all duration-300 group cursor-pointer border ${
                                    isSelected
                                        ? 'bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-500/25 scale-105'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-800 hover:-translate-y-1.5 hover:shadow-md'
                                }`}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-md border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform duration-300 shrink-0">
                                    <img 
                                        src={cat.image} 
                                        alt={cat.name} 
                                        className="w-full h-full object-cover" 
                                        loading="lazy"
                                    />
                                </div>
                                <div className="w-full truncate">
                                    <h4 className={`text-xs font-black truncate block ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-orange-600'}`}>
                                        {cat.name}
                                    </h4>
                                    <span className={`text-[10px] font-bold block mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {cat.count}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default CravingsCategoryRail;
