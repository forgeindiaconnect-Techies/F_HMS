import { useState, useEffect } from 'react';
import { Gift, Clock, Star, MapPin, ChevronRight, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CustomerDashboard = () => {
    const { user, logout, api } = useCustomerAuth();
    const { wishlist, addToCart } = useCart();
    const [reservations, setReservations] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders/myorders');
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch customer orders", error);
            } finally {
                setLoadingOrders(false);
            }
        };
        if (api) {
            fetchOrders();
        }
    }, [api]);

    const activeSubscriptions = orders.filter(o => o.subscriptionPlan && o.subscriptionPlan !== 'One-time Order');

    const dashboardFoods = [
        { id: 'd_m1', name: 'Margherita Pizza', price: 299, category: 'Mains', description: 'Classic cheese and tomato pizza with basil.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800' },
        { id: 'd_m2', name: 'Pepperoni Pizza', price: 399, category: 'Mains', description: 'Double pepperoni and mozzarella cheese.', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800' },
        { id: 'd_m3', name: 'Garlic Bread', price: 149, category: 'Starters', description: 'Toasted french bread with garlic butter and herbs.', image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?q=80&w=800' },
        { id: 'd_m4', name: 'Greek Salad', price: 199, category: 'Salads', description: 'Fresh cucumbers, tomatoes, olives, and feta cheese.', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800' },
        { id: 'd_m5', name: 'Chocolate Lava Cake', price: 159, category: 'Desserts', description: 'Rich chocolate cake with a molten center.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800' },
        { id: 'd_m6', name: 'Mango Smoothie', price: 129, category: 'Beverages', description: 'Creamy yogurt smoothie with fresh mango pulp.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800' },
        { id: 'd_m7', name: 'Paneer Tikka', price: 280, category: 'Starters', description: 'Spiced cottage cheese cubes grilled to perfection.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800' },
        { id: 'd_m8', name: 'Veg Hakka Noodles', price: 220, category: 'Mains', description: 'Stir-fried noodles with fresh vegetables and soy sauce.', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=800' }
    ];

    const handleReorder = (itemsList) => {
        itemsList.forEach(item => {
            addToCart(item);
        });
    };

    useEffect(() => {
        const localRes = JSON.parse(localStorage.getItem('customerReservations') || '[]');
        const defaultReservations = [
            { date: 'Oct 10, 2026', time: '8:00 PM', guests: 4, type: 'Outdoor', status: 'Completed', statusColor: 'bg-gray-100 text-gray-600 border-gray-200' },
            { date: 'Sep 24, 2026', time: '1:00 PM', guests: 2, type: 'Bar', status: 'Completed', statusColor: 'bg-gray-100 text-gray-600 border-gray-200' }
        ];
        setReservations([...localRes, ...defaultReservations]);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Welcome */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                        <span className="text-3xl font-bold text-orange-600 font-sans">
                            {user?.name?.charAt(0) || 'C'}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-sans tracking-tight">
                            Welcome back, {user?.name || 'Foodie'}!
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Ready for your next culinary adventure?</p>
                    </div>
                </div>
                <div className="flex gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
                    <button 
                        onClick={logout}
                        className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 font-bold transition-all flex items-center gap-2 cursor-pointer text-sm sm:text-base"
                    >
                        <LogOut size={18} /> Log Out
                    </button>
                    <Link 
                        to="/menu"
                        className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2 text-sm sm:text-base"
                    >
                        Order Now <ChevronRight size={18} />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Loyalty & Quick Stats */}
                <div className="space-y-8">
                    {/* Loyalty Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/30 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-orange-400 mb-6 font-bold tracking-widest text-xs uppercase">
                                <Star size={16} className="fill-orange-400" /> Gold Member
                            </div>
                            <h2 className="text-5xl font-bold font-sans tracking-tighter mb-2">2,450</h2>
                            <p className="text-gray-400 text-sm">Resto Rewards Points</p>
                            
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-sm font-medium mb-3 flex justify-between">
                                    <span>Progress to Platinum</span>
                                    <span className="text-orange-400">550 pts needed</span>
                                </p>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 w-[80%] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Meal Subscriptions */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-purple-600" /> Active Meal Subscriptions
                        </h3>
                        <div className="space-y-3">
                            {loadingOrders ? (
                                <div className="text-center py-6 text-xs text-gray-400 font-medium">
                                    Loading subscriptions...
                                </div>
                            ) : activeSubscriptions.length === 0 ? (
                                <div className="text-center py-6 text-xs text-gray-400 font-medium bg-gray-50 rounded-2xl">
                                    No active meal subscriptions. Subscribe during checkout!
                                </div>
                            ) : (
                                activeSubscriptions.map((sub, idx) => (
                                    <div key={idx} className="border border-purple-100 bg-purple-50/30 rounded-2xl p-4 space-y-2 text-left">
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                                    {sub.subscriptionPlan}
                                                </span>
                                                {sub.restaurantId?.name && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                                                        📍 {sub.restaurantId.name}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-semibold">
                                                {new Date(sub.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm truncate">
                                            {sub.orderItems.map(i => i.name).join(', ')}
                                        </p>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>Paid via: {sub.paymentMethod}</span>
                                            <span className="font-bold text-purple-700">₹{sub.totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Coupons */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-orange-500" /> Available Offers
                        </h3>
                        <div className="space-y-3">
                            <div className="border border-orange-100 bg-orange-50/50 rounded-2xl p-4 flex justify-between items-center border-dashed">
                                <div>
                                    <p className="font-bold text-orange-900">20% OFF WEEKEND</p>
                                    <p className="text-xs text-orange-700/70 mt-1">Valid until Sunday</p>
                                </div>
                                <button className="text-xs font-bold bg-white text-orange-600 px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                                    Copy
                                </button>
                            </div>
                            <div className="border border-gray-100 bg-gray-50 rounded-2xl p-4 flex justify-between items-center border-dashed">
                                <div>
                                    <p className="font-bold text-gray-900">FREE DESSERT</p>
                                    <p className="text-xs text-gray-500 mt-1">On orders over ₹50</p>
                                </div>
                                <button className="text-xs font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle & Right Column: Orders & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Recent Orders */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 font-sans">Recent Orders</h3>
                            <Link to="/profile/orders" className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {[
                                { 
                                    id: '#ORD-8821', 
                                    date: 'Yesterday', 
                                    items: 'Ribeye Steak, Craft IPA', 
                                    total: '₹848.00', 
                                    status: 'Delivered',
                                    itemsList: [
                                        { id: 'm_ribeye', name: 'Ribeye Steak', price: 599, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800' },
                                        { id: 'm_ipa', name: 'Craft IPA', price: 249, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800' }
                                    ]
                                },
                                { 
                                    id: '#ORD-8805', 
                                    date: 'Oct 12, 2026', 
                                    items: 'Paneer Tikka, Green Wrap', 
                                    total: '₹460.00', 
                                    status: 'Delivered',
                                    itemsList: [
                                        { id: 'm12', name: 'Paneer Tikka', price: 280, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800' },
                                        { id: 'm_wrap', name: 'Green Salad Wrap', price: 180, image: 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?q=80&w=800' }
                                    ]
                                }
                            ].map((order, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{order.items}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{order.id} • {order.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                        <span className="font-bold text-gray-900">{order.total}</span>
                                        <button 
                                            onClick={() => handleReorder(order.itemsList)}
                                            className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                                        >
                                            Reorder
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Reservation History */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Reservation History</h3>
                            </div>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
                                {reservations.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-400 font-medium bg-gray-50 rounded-2xl">
                                        No reservations made yet.
                                    </div>
                                ) : (
                                    reservations.map((res, i) => (
                                        <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs sm:text-sm">
                                            <div>
                                                <p className="font-bold text-gray-900">{res.date} • {res.time}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Table for {res.guests} ({res.type})</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs font-bold border rounded-lg ${res.statusColor}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Quick Order Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 font-sans">Quick Order Menu</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Order your favorite types directly from your dashboard</p>
                    </div>
                    
                    {/* Categories Row */}
                    <div className="flex flex-wrap gap-2">
                        {['All', 'Starters', 'Salads', 'Mains', 'Desserts', 'Beverages'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                                    selectedCategory === cat
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Foods Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                    {dashboardFoods
                        .filter(food => selectedCategory === 'All' || food.category === selectedCategory)
                        .map(food => (
                            <div 
                                key={food.id}
                                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                            >
                                <div className="relative aspect-[4/3] w-full overflow-hidden">
                                    <img 
                                        src={food.image} 
                                        alt={food.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                        {food.category}
                                    </span>
                                </div>
                                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                                    <div>
                                        <h4 className="font-bold text-gray-900 font-sans text-base line-clamp-1 group-hover:text-orange-600 transition-colors">
                                            {food.name}
                                        </h4>
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                                            {food.description}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-gray-900 text-base">₹{food.price}</span>
                                        <button 
                                            onClick={() => addToCart(food)}
                                            className="px-4 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-xl transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
