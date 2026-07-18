import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Info, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const RestaurantDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, removeFromCart, cartTotal, cartCount } = useCart();
    
    const [restaurant, setRestaurant] = useState(null);
    const [branches, setBranches] = useState([]);
    const [menu, setMenu] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
                if (!API_URL.endsWith('/api')) API_URL += '/api';
                // Fetch branches
                const branchRes = await axios.get(`${API_URL}/restaurants/${id}/branches`);
                setBranches(branchRes.data);
                if (branchRes.data.length > 0) {
                    setSelectedBranch(branchRes.data[0]._id);
                }
                
                // For a real app, we'd have a specific /api/restaurants/:id endpoint
                // and /api/menu?restaurantId=...
                // Using existing /api/menu and filtering on client for simplicity since it's a demo
                const menuRes = await axios.get(`${API_URL}/menu`);
                setMenu(menuRes.data.filter(m => m.restaurantId === id));
                
                // Get restaurant details from list
                const restRes = await axios.get(`${API_URL}/restaurants`);
                setRestaurant(restRes.data.find(r => r._id === id));
                
            } catch (error) {
                console.error("Failed to load restaurant details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const getItemQuantity = (itemId) => {
        const item = cartItems.find((i) => (i.id || i._id) === itemId);
        return item ? (item.quantity || item.qty || 0) : 0;
    };

    const handleCheckout = () => {
        // We'll need to pass the branchId to checkout
        navigate('/checkout', { state: { restaurantId: id, branchId: selectedBranch } });
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
    if (!restaurant) return <div className="p-20 text-center text-gray-500">Restaurant not found.</div>;

    const categories = [...new Set(menu.map(item => item.category))];

    return (
        <div className="bg-gray-50 min-h-screen pb-32">
            {/* Header Images */}
            <div className="h-72 w-full bg-gray-900 overflow-hidden relative">
                <img 
                    src={restaurant.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop"} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Restaurant Info */}
            <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{restaurant.name}</h1>
                        <p className="text-gray-500 mb-4">Multi-Cuisine • Desserts • Beverages</p>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Clock size={16} className="text-red-500" /> Opens at 10:00 AM</span>
                            <span className="flex items-center gap-1"><Info size={16} className="text-gray-400" /> Known for great ambiance</span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                            <span className="flex items-center gap-1 text-green-700 font-bold text-lg">4.5 <Star size={16} className="fill-green-700" /></span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Dining Rating</span>
                        </div>
                    </div>
                </div>

                {/* Branch Selection */}
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-red-500" /> 
                        Select Pickup Location (Branch)
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        {branches.map(branch => (
                            <button
                                key={branch._id}
                                onClick={() => setSelectedBranch(branch._id)}
                                className={`px-6 py-3 rounded-xl font-medium border-2 transition-all ${
                                    selectedBranch === branch._id 
                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
                                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {branch.name}
                                <span className="block text-xs opacity-70 font-normal mt-0.5">{branch.address}</span>
                            </button>
                        ))}
                        {branches.length === 0 && <span className="text-gray-500">No branches available for self-pickup.</span>}
                    </div>
                </div>

                {/* Menu Layout */}
                <div className="mt-8 flex flex-col md:flex-row gap-8">
                    {/* Sidebar Categories */}
                    <div className="md:w-64 shrink-0 hidden md:block">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4 px-2">Menu</h3>
                            <div className="space-y-1">
                                {categories.map(cat => (
                                    <a href={`#category-₹{cat}`} key={cat} className="block px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors">
                                        {cat}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 space-y-12">
                        {categories.map(category => (
                            <div key={category} id={`category-₹{category}`} className="scroll-mt-24">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                    {menu.filter(item => item.category === category).map(item => (
                                        <div key={item._id} className="p-6 flex gap-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                                                </div>
                                                <div className="font-medium text-gray-700 mb-3">₹{item.price}</div>
                                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{item.description}</p>
                                            </div>
                                            <div className="w-32 h-32 shrink-0 relative">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl shadow-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {menu.length === 0 && <div className="text-center text-gray-500 py-10">Menu not available for this restaurant.</div>}
                    </div>
                </div>
            </div>

            {/* Sticky Cart Banner */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 relative">
                                <ShoppingBag size={24} />
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Subtotal</p>
                                <p className="font-bold text-xl text-gray-900">₹{cartTotal.toFixed(2)}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={!selectedBranch}
                            className={`px-8 py-3.5 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                                selectedBranch 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Continue to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantDetails;
