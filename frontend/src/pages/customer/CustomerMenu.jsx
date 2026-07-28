import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, ChevronRight, Plus, Minus, Send, MessageSquare, BookOpen, Clock, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { getItemImage } from '../../utils/imageHelper';

const CustomerMenu = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const restaurantId = searchParams.get('restaurantId');
    const branchId = searchParams.get('branchId');
    const tableNumber = searchParams.get('tableNumber');
    const activeOrderId = searchParams.get('activeOrderId');

    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState('RestoSys Client');
    const [activeCategory, setActiveCategory] = useState('All');
    
    // Cart state
    const [cart, setCart] = useState([]);
    const [showCartModal, setShowCartModal] = useState(false);
    const [itemNotes, setItemNotes] = useState({}); // itemId -> note string
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getApiUrl = () => {
        let baseURL = import.meta.env.VITE_API_URL;
        if (baseURL) {
            if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
            if (!baseURL.endsWith('/api')) baseURL += '/api';
            return baseURL;
        }
        const hostname = window.location.hostname;
        const isLocalIp = hostname.startsWith('192.168.') || 
                          hostname.startsWith('10.') || 
                          hostname.startsWith('172.');
        if (isLocalIp) {
            return `http://${hostname}:5000/api`;
        }
        return 'http://localhost:5000/api';
    };
    const API_URL = getApiUrl();

    useEffect(() => {
        if (!restaurantId) {
            toast.error("Invalid QR Code: Restaurant ID is missing.");
            return;
        }

        const fetchMenu = async () => {
            try {
                // Fetch public menu items
                const res = await axios.get(`${API_URL}/menu?restaurantId=${restaurantId}&branchId=${branchId || ''}`);
                setMenuItems(res.data);
                
                // Fetch restaurant info for header display
                const restRes = await axios.get(`${API_URL}/restaurants/${restaurantId}`).catch(() => null);
                if (restRes && restRes.data) {
                    setRestaurantName(restRes.data.name);
                }
            } catch (error) {
                console.error("Failed to load menu", error);
                toast.error("Failed to load restaurant menu.");
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [restaurantId, branchId]);

    // Categories list
    const categories = ['All', ...new Set(menuItems.map(item => item.category))];

    const filteredItems = activeCategory === 'All'
        ? menuItems
        : menuItems.filter(item => item.category === activeCategory);

    const addToCart = (item) => {
        const existing = cart.find(c => c._id === item._id);
        if (existing) {
            setCart(cart.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, { ...item, qty: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        const existing = cart.find(c => c._id === id);
        if (!existing) return;
        if (existing.qty === 1) {
            setCart(cart.filter(c => c._id !== id));
        } else {
            setCart(cart.map(c => c._id === id ? { ...c, qty: c.qty - 1 } : c));
        }
    };

    const handleNoteChange = (itemId, note) => {
        setItemNotes(prev => ({ ...prev, [itemId]: note }));
    };

    const getCartTotal = () => {
        return cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);

        const orderData = {
            orderItems: cart.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price,
                image: item.image,
                product: item._id,
                notes: itemNotes[item._id] || ''
            })),
            orderType: 'Dine In',
            tableNumber: tableNumber || 'Any',
            source: 'QR',
            restaurantId,
            branchId,
            paymentMethod: 'UPI',
            taxPrice: 0,
            totalPrice: getCartTotal(),
            notes: activeOrderId ? 'Appended QR Items' : 'Initial QR Dine-In Order'
        };

        try {
            if (activeOrderId) {
                // Append items to existing order
                const res = await axios.put(`${API_URL}/orders/${activeOrderId}/items`, orderData);
                toast.success('Items added to your active order!');
                navigate(`/customer/track/${activeOrderId}?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`);
            } else {
                // Create new order
                const res = await axios.post(`${API_URL}/orders`, orderData);
                const createdOrder = res.data;
                toast.success('Order placed successfully!');
                navigate(`/customer/track/${createdOrder._id}?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`);
            }
        } catch (error) {
            console.error("Order submission failed", error);
            toast.error(error.response?.data?.message || 'Failed to submit order.');
        } finally {
            setIsSubmitting(false);
            setShowCartModal(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24 text-gray-800">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-25 flex justify-between items-center shadow-sm">
                <div>
                    <span className="text-[10px] bg-green-50 text-green-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-green-100 flex items-center gap-1 w-max mb-1">
                        <BookOpen size={10} /> Smart QR Menu
                    </span>
                    <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{restaurantName}</h1>
                    {tableNumber && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Seated at: <strong className="text-green-600">Table {tableNumber}</strong></p>
                    )}
                </div>
                
                {cart.length > 0 && (
                    <button 
                        onClick={() => setShowCartModal(true)}
                        className="bg-green-600 text-white p-3 rounded-2xl flex items-center gap-2 relative shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <ShoppingBag size={20} />
                        <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center border-2 border-white">
                            {cart.reduce((acc, curr) => acc + curr.qty, 0)}
                        </span>
                    </button>
                )}
            </header>

            {/* Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-6 flex justify-between items-center shadow-sm overflow-hidden relative">
                <div className="space-y-1 relative z-10">
                    <h2 className="text-lg font-black" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Directly from Table</h2>
                    <p className="text-xs text-green-50 opacity-90 max-w-[250px]">Choose your food, specify instructions, and start preparation instantly.</p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 opacity-15 transform translate-x-12 translate-y-4">
                    <ShoppingBag size={180} />
                </div>
            </div>

            {/* Category Selector */}
            <div className="sticky top-[81px] z-20 bg-white border-b border-gray-100 py-3 flex gap-2 overflow-x-auto px-6 scrollbar-none shadow-sm">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                            activeCategory === cat 
                            ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-500/10' 
                            : 'bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Menu Items Grid */}
            <main className="px-6 py-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="font-bold">No menu items found.</p>
                        <p className="text-xs">Check back later or scan a different code.</p>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        const inCart = cart.find(c => c._id === item._id);
                        return (
                            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-4 items-center">
                                <img 
                                    src={getItemImage(item)} 
                                    onError={(e) => { e.target.onerror = null; e.target.src = getItemImage({ ...item, image: '' }); }}
                                    alt={item.name} 
                                    className="w-20 h-20 rounded-xl object-cover border border-gray-50 shrink-0"
                                />
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">{item.description || 'Delectable recipe freshly cooked.'}</p>
                                    <p className="text-green-600 font-extrabold text-sm mt-2">₹{item.price}</p>
                                </div>

                                <div className="shrink-0">
                                    {inCart ? (
                                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-150">
                                            <button 
                                                onClick={() => removeFromCart(item._id)}
                                                className="w-6 h-6 bg-white border border-gray-250 rounded-lg text-gray-600 flex items-center justify-center hover:bg-gray-100"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-bold text-xs w-4 text-center">{inCart.qty}</span>
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="w-6 h-6 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => addToCart(item)}
                                            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl transition-all shadow-md shadow-green-500/10 flex items-center justify-center hover:scale-105 active:scale-95"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* Cart slide-up Modal */}
            {showCartModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCartModal(false)}></div>
                    
                    <div className="bg-white rounded-t-3xl shadow-xl w-full max-w-md relative z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-gray-900 text-lg">My Order Cart</h3>
                                <p className="text-xs text-gray-400 font-medium">Table: {tableNumber || 'Any'}</p>
                            </div>
                            <button onClick={() => setShowCartModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <Minus size={24} className="stroke-[3]" />
                            </button>
                        </div>

                        {/* Cart List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {cart.map(item => (
                                <div key={item._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                            <p className="text-xs text-green-600 font-bold mt-0.5">₹{item.price} each</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => removeFromCart(item._id)} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100"><Minus size={14} /></button>
                                            <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                                            <button onClick={() => addToCart(item)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] text-gray-400 font-black tracking-wider uppercase flex items-center gap-1.5 mb-1.5">
                                            <MessageSquare size={12} /> Special instructions
                                        </label>
                                        <input 
                                            type="text"
                                            value={itemNotes[item._id] || ''}
                                            onChange={(e) => handleNoteChange(item._id, e.target.value)}
                                            placeholder="e.g. Less Spicy, No Onion, Extra Cheese..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cart Footer */}
                        <div className="p-6 border-t border-gray-100 shrink-0 bg-white space-y-4">
                            <div className="flex justify-between items-center font-black text-gray-900">
                                <span>Order Total</span>
                                <span className="text-green-600 text-lg">₹{getCartTotal()}</span>
                            </div>
                            
                            <button 
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                            >
                                <Send size={18} /> {isSubmitting ? 'Submitting Order...' : activeOrderId ? 'Confirm & Add to Order' : 'Place Dine-In Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerMenu;
