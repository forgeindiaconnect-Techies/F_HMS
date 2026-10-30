import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, ShoppingBag, Percent, ArrowRight, MapPin, Store, Utensils } from 'lucide-react';
import { getApiUrl } from '../../utils/axiosInstance';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const RestaurantShowcaseGrid = ({ restaurants, loading, search, activeCategory, onResetFilters }) => {
    const gridSectionRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || loading) return;

        const ctx = gsap.context(() => {
            gsap.from('.restaurant-card-item', {
                scrollTrigger: {
                    trigger: gridSectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                y: 40,
                opacity: 0,
                stagger: 0.08,
                duration: 0.8,
                ease: 'power3.out'
            });
        }, gridSectionRef);

        return () => ctx.revert();
    }, [restaurants, loading]);

    return (
        <section 
            id="restaurant-grid" 
            ref={gridSectionRef}
            className="py-16 md:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 transition-colors scroll-mt-20"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header with Results Count */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2">
                            <Store size={14} />
                            <span>Verified Culinary Outlets</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Partner Kitchens &amp; Dine-in Spots
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Showing {restaurants.length} {restaurants.length === 1 ? 'kitchen' : 'kitchens'}
                        </span>
                        {(search || activeCategory) && (
                            <button
                                type="button"
                                onClick={onResetFilters}
                                className="text-xs font-black text-orange-600 hover:text-orange-700 dark:text-orange-400 underline cursor-pointer"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading State Spinner */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Locating artisan kitchens...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {restaurants.map((restaurant) => {
                            // Resolve restaurant image
                            const resolvedImg = restaurant.img 
                                ? restaurant.img 
                                : restaurant.logo 
                                    ? (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:')
                                        ? restaurant.logo 
                                        : `${new URL(getApiUrl()).origin}${restaurant.logo.startsWith('/') ? '' : '/'}${restaurant.logo}`)
                                    : "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";

                            return (
                                <Link 
                                    to={`/restaurant/${restaurant._id}`} 
                                    key={restaurant._id}
                                    className="restaurant-card-item group block bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-orange-500/40 hover:-translate-y-2 transition-all duration-300"
                                >
                                    {/* Food Image with Parallax Hover Zoom */}
                                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img 
                                            src={resolvedImg} 
                                            alt={restaurant.name} 
                                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                        
                                        {/* Offer Ribbon Overlay */}
                                        <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
                                            <span className="text-xs font-black tracking-tight flex items-center gap-1 bg-red-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                                <Percent size={12} /> 50% OFF UPTO ₹100
                                            </span>
                                            <span className="text-[11px] font-bold bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-slate-200 flex items-center gap-1">
                                                <Clock size={11} className="text-orange-400" /> {restaurant.time || '15-20'}m
                                            </span>
                                        </div>
                                    </div>

                                    {/* Restaurant Card Details */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-base font-black text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                {restaurant.name}
                                            </h3>
                                            <div className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 shrink-0 shadow-xs">
                                                <Star size={10} className="fill-white" />
                                                <span>4.{Math.floor(Math.random() * 4) + 6}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                                            {restaurant.tags || 'Artisan Dishes, Wood-Fired, Beverages'}
                                        </p>

                                        {/* Bottom Perks Row */}
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <span className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400">
                                                <ShoppingBag size={13} />
                                                <span>Pickup &amp; Dine-in QR</span>
                                            </span>
                                            <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-orange-600 transition-all flex items-center gap-0.5 text-[11px]">
                                                Menu <ArrowRight size={13} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Empty Search Fallback */}
                {!loading && restaurants.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 mb-2">
                            <Utensils size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">No partner kitchens found</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            We couldn't find any restaurants matching your search. Try resetting your filters to explore all available venues.
                        </p>
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

            </div>
        </section>
    );
};

export default RestaurantShowcaseGrid;
