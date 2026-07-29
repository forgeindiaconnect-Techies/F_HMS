import { useState, useMemo, useEffect } from 'react';
import { Search, Heart, ShoppingBag, Star, Filter, Info, Flame, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getItemImage } from '../../utils/imageHelper';
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
