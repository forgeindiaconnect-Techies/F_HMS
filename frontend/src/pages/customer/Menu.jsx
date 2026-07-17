import { useState, useMemo } from 'react';
import { Search, Heart, ShoppingBag, Star, Filter, Info, Flame, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';

import { useEffect } from 'react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const categories = ['All', 'Starters', 'Salads', 'Mains', 'Desserts', 'Beverages'];

const getItemImage = (item) => {
    if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
        return item.image;
    }
    
    const testString = `${item.image || ''} ${item.name || ''}`.toLowerCase();
    
    if (testString.includes('pizza')) {
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('burger') || testString.includes('burgur')) {
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('dosa') || testString.includes('dhosa') || testString.includes('dhos')) {
        return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('biryani')) {
        return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('paneer')) {
        return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('chicken')) {
        return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('noodle') || testString.includes('pasta')) {
        return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('salad')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('dessert') || testString.includes('cake') || testString.includes('sweet')) {
        return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    if (testString.includes('drink') || testString.includes('beverage') || testString.includes('soda') || testString.includes('juice')) {
        return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop';
};

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
                setMenuItems(data);
            } catch (error) {
                console.error('Failed to fetch menu', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [api]);

    const filteredMenu = useMemo(() => {
        return menuItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, activeCategory, menuItems]);

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Header Banner */}
            <div className="bg-gray-900 text-white py-16 px-4 relative overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop" 
                    alt="Menu Banner" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-4">Our Culinary Menu</h1>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg">Discover our chef-curated selection of premium dishes, crafted with locally sourced ingredients.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Search dishes, ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white rounded-xl outline-none transition-all text-sm font-medium"
                        />
                    </div>

                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto py-8 custom-scrollbar scroll-smooth">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                                activeCategory === cat 
                                ? 'bg-orange-600 text-white shadow-orange-600/30' 
                                : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <svg className="animate-spin h-10 w-10 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </div>
                ) : filteredMenu.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No dishes found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your search or category filters.</p>
                        <button 
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            className="mt-6 text-orange-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredMenu.map(item => {
                            const isWished = wishlist.some(w => (w._id || w.id) === (item._id || item.id));
                            
                            return (
                                <div key={item._id || item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 group flex flex-col">
                                    <div className="relative h-56 overflow-hidden">
                                        <img 
                                            src={getItemImage(item)} 
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity"></div>
                                        
                                        {/* Tags */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm">
                                                    {tag === 'Spicy' && <Flame size={12} className="text-red-500" />}
                                                    {tag === 'Vegetarian' && <Leaf size={12} className="text-green-500" />}
                                                    {tag === 'Vegan' && <Leaf size={12} className="text-green-500" />}
                                                    {tag === 'Popular' && <Star size={12} className="text-orange-500 fill-orange-500" />}
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        {/* Wishlist Button */}
                                        <button 
                                            onClick={() => toggleWishlist(item)}
                                            className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
                                                isWished ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                                            }`}
                                        >
                                            <Heart size={18} className={isWished ? 'fill-white' : ''} />
                                        </button>
                                    </div>
                                    
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 font-sans group-hover:text-orange-600 transition-colors leading-tight">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-1 mt-1 text-sm font-medium text-gray-500">
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="text-gray-900">{item.rating}</span>
                                                    <span>({item.reviews})</span>
                                                </div>
                                            </div>
                                            <span className="text-xl font-bold text-orange-600 shrink-0 bg-orange-50 px-3 py-1 rounded-xl">
                                                ₹{item.price.toFixed(2)}
                                            </span>
                                        </div>
                                        
                                        <p className="text-gray-500 text-sm mt-3 mb-6 flex-1 line-clamp-2">
                                            {item.description}
                                        </p>
                                        
                                        <button 
                                            onClick={() => addToCart(item)}
                                            className="w-full bg-gray-900 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2 group/btn"
                                        >
                                            <ShoppingBag size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" /> 
                                            Add to Cart
                                        </button>
                                    </div>
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
