import { useState, useMemo, useEffect } from 'react';
import { Search, Heart, ShoppingBag, Star, Filter, Info, Flame, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getItemImage, getFallbackFoodImage } from '../../utils/imageHelper';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const categories = ['All', 'Starters', 'Salads', 'Mains', 'Desserts', 'Beverages'];


const fallbackMenu = [
    { _id: 'm1', name: 'Margherita Pizza', price: 299, category: 'Mains', description: 'Classic cheese and tomato pizza with basil.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800', rating: 4.8, reviews: 154, tags: ['Vegetarian', 'Popular'] },
    { _id: 'm2', name: 'Pepperoni Pizza', price: 399, category: 'Mains', description: 'Double pepperoni and mozzarella cheese.', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800', rating: 4.7, reviews: 98, tags: ['Popular'] },
    { _id: 'm4', name: 'Classic Cheeseburger', price: 199, category: 'Mains', description: 'Flame-grilled beef patty, cheddar, lettuce, tomato, pickles.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800', rating: 4.6, reviews: 112, tags: ['Popular'] },
    { _id: 'm6', name: 'Crispy French Fries', price: 129, category: 'Starters', description: 'Golden, crispy potatoes served with a side of ketchup.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800', rating: 4.4, reviews: 76, tags: ['Vegetarian'] },
    { _id: 'm7', name: 'Greek Salad', price: 199, category: 'Salads', description: 'Fresh cucumbers, tomatoes, red onions, olives, and feta cheese.', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800', rating: 4.5, reviews: 45, tags: ['Vegetarian', 'Healthy'] },
    { _id: 'm8', name: 'Caesar Salad', price: 219, category: 'Salads', description: 'Crisp romaine lettuce, parmesan cheese, and creamy caesar dressing.', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=800', rating: 4.6, reviews: 62, tags: ['Healthy'] },
    { _id: 'm12', name: 'Paneer Tikka', price: 280, category: 'Starters', description: 'Cottage cheese cubes marinated in spices and grilled.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800', rating: 4.8, reviews: 142, tags: ['Vegetarian', 'Popular'] },
    { _id: 'm14', name: 'Orange Juice', price: 119, category: 'Beverages', description: 'Freshly squeezed natural orange juice.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800', rating: 4.5, reviews: 54, tags: ['Healthy'] },
    { _id: 'm15', name: 'Mango Smoothie', price: 139, category: 'Beverages', description: 'Thick, refreshing mango and yogurt smoothie.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800', rating: 4.7, reviews: 83, tags: ['Vegetarian'] },
    { _id: 'm16', name: 'Chocolate Fudge Cake', price: 169, category: 'Desserts', description: 'Decadent chocolate cake with hot chocolate syrup.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800', rating: 4.8, reviews: 120, tags: ['Vegetarian', 'Popular'] }
];

const Menu = () => {
    const { addToCart, wishlist, toggleWishlist } = useCart();
    const { api } = useCustomerAuth();
    
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const { data } = await api.get('/menu');
                const apiNames = new Set(data.map(i => i.name.toLowerCase()));
                const nonDuplicateFallbacks = fallbackMenu.filter(i => !apiNames.has(i.name.toLowerCase()));
                setMenuItems([...data, ...nonDuplicateFallbacks]);
            } catch (error) {
                console.error('Failed to fetch menu', error);
                setMenuItems(fallbackMenu);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [api]);

    const filteredMenu = useMemo(() => {
        return menuItems.filter(item => {
            let matchesCategory = false;
            const itemCat = (item.category || '').toLowerCase();
            if (activeCategory === 'All') {
                matchesCategory = true;
            } else if (activeCategory === 'Starters') {
                matchesCategory = ['sides', 'bbq', 'starters', 'starter'].includes(itemCat);
            } else if (activeCategory === 'Salads') {
                matchesCategory = ['salads', 'salad'].includes(itemCat);
            } else if (activeCategory === 'Mains') {
                const isDosa = item.name.toLowerCase().includes('dosa') || item.name.toLowerCase().includes('dhosa');
                matchesCategory = ['pizzas', 'pizza', 'burgers', 'burger', 'chinese', 'south indian', 'mains', 'main'].includes(itemCat) || isDosa;
            } else if (activeCategory === 'Desserts') {
                const isDosa = item.name.toLowerCase().includes('dosa') || item.name.toLowerCase().includes('dhosa');
                matchesCategory = ['desserts', 'dessert', 'sweets', 'sweet'].includes(itemCat) && !isDosa;
            } else if (activeCategory === 'Beverages') {
                matchesCategory = ['beverages', 'beverage', 'drinks', 'drink'].includes(itemCat);
            } else {
                matchesCategory = itemCat === activeCategory.toLowerCase();
            }

            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, activeCategory, menuItems]);

    return (
        <div className="bg-white min-h-screen pb-20 font-sans selection:bg-[#FF5A1F] selection:text-white">
            {/* 1. Warm Hero Banner Matching Landing Page */}
            <div className="relative w-full overflow-hidden bg-gradient-to-r from-white via-[#FCF9F5] to-[#F8F5EE] border-b border-slate-100 py-10 sm:py-14">
                {/* Soft Organic Background Glow */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-100/40 via-orange-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-2xl text-left space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF5A1F] text-xs font-bold shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-pulse" />
                            <span>Fresh Daily Menu</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Explore Delicious Food,<br />
                            <span className="text-[#FF5A1F]">Crafted with Passion.</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                            Order mouthwatering biryanis, hand-stretched pizzas, sizzling burgers, and fresh desserts prepared by top chefs and delivered hot.
                        </p>
                    </div>

                    {/* Integrated Search Bar inside Hero */}
                    <div className="mt-6 max-w-xl">
                        <div className="relative flex items-center bg-white rounded-full border border-slate-200/90 shadow-sm focus-within:border-[#FF5A1F] focus-within:ring-2 focus-within:ring-orange-100 transition-all p-1">
                            <Search className="text-slate-400 ml-3.5 shrink-0" size={18} />
                            <input 
                                type="text"
                                placeholder="Search dishes, ingredients, or cuisines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 text-xs sm:text-sm font-medium bg-transparent outline-none text-slate-800 placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchQuery('')}
                                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                            <button 
                                type="button"
                                className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shrink-0 shadow-xs cursor-pointer"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                
                {/* Category Filter Pills (Matching Landing Page Style) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar select-none">
                    {categories.map(cat => {
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                    isActive 
                                    ? 'bg-[#FF5A1F] text-white shadow-xs shadow-[#FF5A1F]/30 scale-102' 
                                    : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF5A1F] border border-transparent'
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Section Header Count */}
                <div className="flex items-center justify-between mb-5 mt-2">
                    <div className="text-left">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            {activeCategory === 'All' ? 'All Dishes' : activeCategory}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Showing {filteredMenu.length} delicious {filteredMenu.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                </div>

                {/* Dishes Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <svg className="animate-spin h-8 w-8 text-[#FF5A1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </div>
                ) : filteredMenu.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/60 rounded-3xl border border-slate-100 max-w-lg mx-auto">
                        <Search size={40} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-base font-bold text-slate-900">No dishes match your search</h3>
                        <p className="text-xs text-slate-500 mt-1">Try searching with a different keyword or category.</p>
                        <button 
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            className="mt-4 text-xs font-bold text-[#FF5A1F] hover:underline cursor-pointer"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                        {filteredMenu.map(item => {
                            const isFav = wishlist?.some(w => (w._id || w.id) === (item._id || item.id));
                            const discountBadge = item.discount || (item.tags?.includes('Popular') ? '20% OFF' : null);
                            
                            return (
                                <div 
                                    key={item._id || item.id} 
                                    className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between text-left group"
                                >
                                    <div>
                                        {/* Square Image with Badges & Heart Button */}
                                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2.5">
                                            <img 
                                                src={getItemImage(item)} 
                                                alt={item.name}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = getFallbackFoodImage(item.name || item.category);
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                            {discountBadge && (
                                                <div className="absolute top-2 left-2 bg-[#10B981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                                    {discountBadge}
                                                </div>
                                            )}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(item);
                                                }}
                                                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                                                    isFav ? 'bg-red-500 text-white shadow-xs' : 'bg-white/90 text-slate-600 hover:text-red-500 shadow-xs'
                                                }`}
                                                aria-label="Wishlist"
                                            >
                                                <Heart size={12} className={isFav ? 'fill-white' : ''} />
                                            </button>
                                        </div>

                                        {/* Dish Details */}
                                        <div className="space-y-0.5">
                                            <h4 className="text-[13px] sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#FF5A1F] transition-colors">
                                                {item.name}
                                            </h4>
                                            
                                            <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
                                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                                <span>{item.rating || '4.5'}</span>
                                                {item.category && (
                                                    <span className="text-[11px] text-slate-400 font-normal ml-1">
                                                        • {item.category}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-baseline gap-1.5 pt-1">
                                                <span className="text-base font-extrabold text-slate-900">
                                                    ₹{item.price}
                                                </span>
                                                {item.originalPrice && (
                                                    <span className="text-xs font-semibold text-slate-400 line-through">
                                                        ₹{item.originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compact Orange Add to Cart Button (Matching Landing Page) */}
                                    <button 
                                        onClick={() => addToCart(item)}
                                        className="w-full mt-3 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-98 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <ShoppingBag size={13} />
                                        <span>Add to Cart</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Menu;
