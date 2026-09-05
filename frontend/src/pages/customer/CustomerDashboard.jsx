import { useState, useEffect } from 'react';
import { 
    LayoutGrid, BookOpen, QrCode, ShoppingBag, 
    Calendar, Heart, MessageSquare, Settings, 
    Crown, Sparkles, Plus, Trash2, CheckCircle, 
    ChevronRight, LogOut, Wallet, Star, ShieldAlert,
    MapPin, Phone, Mail, Lock, Clock, Gift, User,
    Bike, Store, Truck, Navigation
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getItemImage } from '../../utils/imageHelper';
import toast from 'react-hot-toast';
import { ThemeSettingCard } from '../../components/ThemeToggle';

const CustomerDashboard = () => {
    const { user, logout, api } = useCustomerAuth();
    
    // Safely get Cart context values with fallbacks
    const cartContext = useCart() || {};
    const wishlist = cartContext.wishlist || [];
    const addToCart = cartContext.addToCart || (() => {});
    const toggleWishlist = cartContext.toggleWishlist || (() => {});
    
    // Core states
    const [activeTab, setActiveTab] = useState('overview');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [registeredRestaurants, setRegisteredRestaurants] = useState([]);
    const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState('All');
    
    // Add Funds Modal States
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [addFundsAmount, setAddFundsAmount] = useState('500');
    
    // Wallet State
    const [walletBalance, setWalletBalance] = useState(() => {
        try {
            return parseFloat(localStorage.getItem('customerWalletBalance') || '0.00');
        } catch (e) {
            return 0.00;
        }
    });

    // Reservations Form State
    const [resDate, setResDate] = useState('');
    const [resTime, setResTime] = useState('19:00');
    const [resGuests, setResGuests] = useState('2');
    const [resType, setResType] = useState('Dine In');

    // Feedback Form State
    const [feedbackSubject, setFeedbackSubject] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState('Feedback');

    // Profile Form State
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
    const [profileAddress, setProfileAddress] = useState(user?.address || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Synchronize profile name fields if user object loads late
    useEffect(() => {
        if (user) {
            if (user.name) setProfileName(user.name);
            if (user.phoneNumber) setProfilePhone(user.phoneNumber);
            if (user.address) setProfileAddress(user.address);
        }
    }, [user]);

    const dashboardFoods = [
        { id: 'd_m1', name: 'Margherita Pizza', price: 299, category: 'Mains', restaurantName: registeredRestaurants[0]?.name || 'Grand Bistro', description: 'Classic cheese and tomato pizza with basil.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800' },
        { id: 'd_m2', name: 'Pepperoni Pizza', price: 399, category: 'Mains', restaurantName: registeredRestaurants[1]?.name || 'Chai Theory Cafe', description: 'Double pepperoni and mozzarella cheese.', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800' },
        { id: 'd_m4', name: 'Greek Salad', price: 199, category: 'Salads', restaurantName: registeredRestaurants[2]?.name || 'Spice Route Diner', description: 'Fresh cucumbers, tomatoes, olives, and feta cheese.', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800' },
        { id: 'd_m5', name: 'Chocolate Lava Cake', price: 159, category: 'Desserts', restaurantName: registeredRestaurants[0]?.name || 'Grand Bistro', description: 'Rich chocolate cake with a molten center.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800' },
        { id: 'd_m6', name: 'Mango Smoothie', price: 129, category: 'Beverages', restaurantName: registeredRestaurants[1]?.name || 'Chai Theory Cafe', description: 'Creamy yogurt smoothie with fresh mango pulp.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800' },
        { id: 'd_m7', name: 'Paneer Tikka', price: 280, category: 'Starters', restaurantName: registeredRestaurants[2]?.name || 'Spice Route Diner', description: 'Spiced cottage cheese cubes grilled to perfection.', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800' }
    ];

    useEffect(() => {
        const fetchRegisteredRestaurants = async () => {
            try {
                const { data } = await api.get('/restaurants');
                if (Array.isArray(data) && data.length > 0) {
                    setRegisteredRestaurants(data);
                }
            } catch (err) {
                console.error('Failed to load registered restaurants for menu page', err);
            }
        };
        fetchRegisteredRestaurants();
    }, []);

    // Safe short ID helper
    const getShortId = (id) => {
        if (!id || typeof id !== 'string') return '';
        return id.substring(id.length - 6).toUpperCase();
    };

    // Fetch user orders on mount
    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders/myorders');
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Failed to fetch customer orders", error);
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Live Offers State from Admin
    const [liveOffers, setLiveOffers] = useState([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    const fetchLiveOffers = async () => {
        try {
            const { data } = await api.get('/offers');
            if (Array.isArray(data)) {
                setLiveOffers(data.filter(o => o.isActive !== false));
            }
        } catch (err) {
            console.error("Failed to fetch live offers", err);
        } finally {
            setLoadingOffers(false);
        }
    };

    useEffect(() => {
        if (api) {
            fetchOrders();
            fetchLiveOffers();
            const interval = setInterval(() => {
                fetchOrders();
                fetchLiveOffers();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [api]);

    // Load reservations from localStorage
    useEffect(() => {
        try {
            const localRes = JSON.parse(localStorage.getItem('customerReservations') || '[]');
            setReservations(Array.isArray(localRes) ? localRes : []);
        } catch (e) {
            setReservations([]);
        }
    }, []);

    // Save Wallet balance to local storage when changed
    useEffect(() => {
        try {
            localStorage.setItem('customerWalletBalance', walletBalance.toString());
        } catch (e) {
            console.error("Failed to save wallet balance", e);
        }
    }, [walletBalance]);

    const handleReorder = (itemsList) => {
        if (!Array.isArray(itemsList)) return;
        itemsList.forEach(item => {
            addToCart(item);
        });
        toast.success('Items added to cart!');
    };

    // Add Funds to Wallet
    const handleAddFunds = () => {
        setAddFundsAmount('500');
        setIsAddFundsOpen(true);
    };

    // Book table reservation
    const handleBookReservation = (e) => {
        e.preventDefault();
        if (!resDate) {
            toast.error("Please pick a reservation date");
            return;
        }
        const newRes = {
            date: resDate,
            time: resTime,
            guests: resGuests,
            type: resType,
            status: 'Confirmed',
            statusColor: 'bg-green-50 text-green-700 border-green-200'
        };
        const updated = [newRes, ...reservations];
        setReservations(updated);
        try {
            localStorage.setItem('customerReservations', JSON.stringify(updated));
        } catch (err) {
            console.error(err);
        }
        toast.success(`Table booked for ${resGuests} guests on ${resDate} at ${resTime}!`);
        setResDate('');
    };

    // Submit Feedback/Inquiry
    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
            toast.error("Please fill in all feedback fields");
            return;
        }
        try {
            await api.post('/inquiries', {
                name: user?.name || 'Guest User',
                email: user?.email || 'guest@example.com',
                subject: `[${feedbackType}] ${feedbackSubject}`,
                message: feedbackMessage
            });
            toast.success("Feedback submitted successfully! Thank you.");
            setFeedbackSubject('');
            setFeedbackMessage('');
        } catch (error) {
            console.error("Failed to submit inquiry", error);
            toast.error("Failed to submit feedback. Please try again.");
        }
    };

    // Update Profile Settings
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!profileName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }
        try {
            await api.put('/users/profile', {
                name: profileName,
                phoneNumber: profilePhone,
                address: profileAddress,
                password: newPassword || undefined
            });
            toast.success("Profile updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            console.error("Profile update failed", error);
            toast.error("Failed to update profile details");
        }
    };

    const safeOrders = Array.isArray(orders) ? orders : [];
    const userPoints = user?.loyaltyPoints || (safeOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length * 50) || 0;
    const tierName = userPoints >= 1000 ? 'GOLD MEMBER' : userPoints >= 500 ? 'SILVER MEMBER' : 'BRONZE MEMBER';

    const readySelfPickupOrders = safeOrders.filter(o => 
        (o.orderType === 'Self-Pickup' || o.orderType === 'Self Pickup') && 
        (['Ready for Pickup', 'Ready'].includes(o.status))
    );

    // Sidebar navigation tabs definitions
    const tabsList = [
        { id: 'overview', name: 'Overview', icon: <LayoutGrid size={18} /> },
        { id: 'orders', name: 'Orders & Tracking', icon: <ShoppingBag size={18} /> },
        { id: 'reservations', name: 'Reservations', icon: <Calendar size={18} /> },
        { id: 'favorites', name: 'Favorite Items', icon: <Heart size={18} /> },
        { id: 'loyalty', name: 'Loyalty & Rewards', icon: <Crown size={18} /> },
        { id: 'wallet', name: 'Wallet', icon: <Wallet size={18} /> },
        { id: 'offers', name: 'Offers & Coupons', icon: <Gift size={18} /> },
        { id: 'feedback', name: 'Feedback & Inquiries', icon: <MessageSquare size={18} /> },
        { id: 'profile', name: 'Profile & Settings', icon: <Settings size={18} /> }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500 text-gray-800">
            
            {/* Ready for Pickup Alert Banner */}
            {readySelfPickupOrders.map(order => (
                <div key={order._id} className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-pulse relative overflow-hidden group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white shrink-0">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Your Order is Ready for Pickup!</h3>
                            <p className="text-white/90 text-sm mt-0.5 font-medium">Please collect your Order <span className="font-bold font-mono">#{getShortId(order._id)}</span> from the Pickup Counter.</p>
                        </div>
                    </div>
                    <Link 
                        to={`/track/${order._id}?restaurantId=${order.restaurantId?._id || order.restaurantId}`}
                        className="px-6 py-2.5 bg-white text-orange-600 font-extrabold text-sm rounded-full hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-2"
                    >
                        Track & View QR
                    </Link>
                </div>
            ))}

            {/* Header Welcome banner */}
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
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Track your orders, view loyalty scores, and reserve tables.</p>
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

            {/* Portal Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* Sidebar Navigation Options */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Customer Account</p>
                    {tabsList.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                                activeTab === tab.id
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>

                {/* Main Dynamic Viewport Panel */}
                <div className="lg:col-span-3">
                    
                    {/* Tab: Overview */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Loyalty Points Balance */}
                                <div className="bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#d4af37]/30 group transition-all duration-300 hover:shadow-2xl hover:shadow-[#d4af37]/5 hover:border-[#d4af37]/50">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#d4af37]/15"></div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ffe07d] to-[#f3c056] text-black flex items-center justify-center shadow-lg shrink-0">
                                                    <Crown size={15} className="fill-black" />
                                                </div>
                                                <div>
                                                    <span className="block font-black tracking-[0.25em] text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-[#ffe07d] via-[#f5c661] to-[#ffe07d]">
                                                        {tierName}
                                                    </span>
                                                    <span className="block text-[8px] text-gray-500 font-extrabold uppercase tracking-widest leading-none mt-0.5">
                                                        Resto Loyalty Points
                                                    </span>
                                                </div>
                                            </div>
                                            <Sparkles size={14} className="text-[#ffe07d] animate-pulse" />
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase block">Points Balance</span>
                                            <h2 className="text-5xl font-black font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fff2d1] to-[#f3c056]">
                                                {userPoints.toLocaleString()}
                                            </h2>
                                            <p className="text-gray-500 text-xs font-semibold">Convert points to cash discount at checkout</p>
                                        </div>
                                        
                                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-[#ffe07d]/10">
                                            <div className="h-full bg-gradient-to-r from-[#f3c056] via-[#ffe07d] to-[#f3c056] w-[80%] rounded-full shadow-[0_0_8px_rgba(243,192,86,0.3)]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Component */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-gray-900 text-sm">Customer Wallet</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fast & Secure Payments</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-extrabold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-150">Active</span>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
                                            <h2 className="text-4xl font-black font-sans text-gray-900">
                                                ₹{walletBalance.toFixed(2)}
                                            </h2>
                                            <p className="text-gray-500 text-xs font-semibold">Skip credit cards & settle bills in 1-click</p>
                                        </div>

                                        <button 
                                            onClick={handleAddFunds}
                                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 transition-all"
                                        >
                                            <Plus size={16} /> Add Funds
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Registered Restaurants & Cafes Filter Section */}
                            {registeredRestaurants.length > 0 && (
                                <div className="bg-orange-50/70 border border-orange-100 p-4 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase text-orange-800 tracking-wider flex items-center gap-1.5">
                                            <Store size={14} className="text-orange-600" /> Registered Restaurants &amp; Cafes
                                        </h4>
                                        <span className="text-[10px] font-bold text-orange-600 bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
                                            {registeredRestaurants.length} Verified Outlets
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedRestaurantFilter('All')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                selectedRestaurantFilter === 'All'
                                                    ? 'bg-orange-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-orange-100/50'
                                            }`}
                                        >
                                            All Registered Places
                                        </button>
                                        {registeredRestaurants.map((rest) => (
                                            <button
                                                key={rest._id}
                                                onClick={() => setSelectedRestaurantFilter(rest.name)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    selectedRestaurantFilter === rest.name
                                                        ? 'bg-orange-600 text-white shadow-sm'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-orange-100/50'
                                                }`}
                                            >
                                                <Store size={12} /> {rest.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Order Section (Browse Menu & Place Order) */}
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 font-sans">Quick Order Menu Items</h3>
                                        <p className="text-gray-500 text-sm mt-0.5">Order directly from verified registered restaurants &amp; cafes</p>
                                    </div>
                                    
                                    {/* Categories Row */}
                                    <div className="flex flex-wrap gap-2">
                                        {['All', 'Starters', 'Salads', 'Mains', 'Desserts'].map(cat => (
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
                                </div>                                 {/* Foods Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                                    {dashboardFoods
                                        .filter(food => (selectedCategory === 'All' || food.category === selectedCategory) &&
                                                        (selectedRestaurantFilter === 'All' || food.restaurantName === selectedRestaurantFilter))
                                        .map(food => {
                                            return (
                                                <div 
                                                    key={food.id}
                                                    className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                                                >
                                                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                                                        <img 
                                                            src={getItemImage(food)} 
                                                            onError={(e) => { e.target.onerror = null; e.target.src = getFallbackFoodImage(food.name || food.category); }}
                                                            alt={food.name} 
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                            {food.category}
                                                        </span>
                                                    </div>
                                                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                                                    <div>
                                                        <div className="mb-1">
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                                                <Store size={12} /> {food.restaurantName || 'Chai Theory Cafe'}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-gray-900 font-sans text-base line-clamp-1 group-hover:text-orange-600 transition-colors">
                                                            {food.name}
                                                        </h4>
                                                        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                                                            {food.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                                        <span className="font-bold text-gray-900 text-base">₹{food.price}</span>
                                                        <button 
                                                            onClick={() => { addToCart(food); toast.success(`${food.name} added to cart!`); }}
                                                            className="px-4 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-xl transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Orders & Tracking */}
                    {activeTab === 'orders' && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold text-gray-900">Your Order History & Tracking</h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150">Delivery</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-150">Self Pickup</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loadingOrders ? (
                                    <p className="text-center text-gray-400 py-6 text-xs">Loading orders...</p>
                                ) : safeOrders.length === 0 ? (
                                    <p className="text-center text-gray-400 py-10 text-xs">No orders found. Settle a new order from the Menu!</p>
                                ) : (
                                    safeOrders.map(order => (
                                        <div key={order._id} className="border border-gray-100 hover:border-orange-150 p-5 rounded-2xl transition-all space-y-4 bg-white">
                                            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-gray-50 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-sm text-gray-900 font-mono">#{getShortId(order._id)}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        order.orderType === 'Delivery' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                    }`}>
                                                        {order.orderType}
                                                    </span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                     (order.status === 'Delivered' || order.deliveryStatus === 'Delivered' || order.status === 'Completed')
                                                     ? 'bg-green-50 text-green-700 border border-green-200'
                                                     : (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up')
                                                     ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                     : (order.status === 'Preparing' || order.status === 'Ready')
                                                     ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                     : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                 }`}>
                                                     {order.orderType === 'Delivery' ? (
                                                         (order.status === 'Delivered' || order.deliveryStatus === 'Delivered') ? 'Delivered' :
                                                         (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up') ? 'Out for Delivery' :
                                                         (order.status === 'Preparing' || order.status === 'Ready') ? 'Kitchen Preparing' : 'Order Placed (Pending)'
                                                     ) : order.status}
                                                 </span>
                                            </div>

                                            <div className="flex justify-between items-center flex-wrap gap-4 text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-900">{order.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ') || ''}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-extrabold text-gray-950 text-sm">₹{order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</span>
                                                    
                                                    {/* Tracking button */}
                                                    {order.status !== 'Completed' && order.status !== 'Delivered' && order.status !== 'Served' && (
                                                        <Link 
                                                            to={`/track/${order._id}?restaurantId=${order.restaurantId?._id || order.restaurantId}&branchId=${order.branchId?._id || order.branchId || ''}`}
                                                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors text-xs shadow-sm"
                                                        >
                                                            Track Live
                                                        </Link>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={() => handleReorder(order.orderItems?.map(i => ({ _id: i.product, name: i.name, price: i.price, quantity: i.qty })) || [])}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors text-xs"
                                                    >
                                                        Reorder
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Delivery OTP Badge for Active Home Deliveries */}
                                            {order.orderType === 'Delivery' && order.status !== 'Delivered' && order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                                                        <div>
                                                            <span className="font-extrabold text-amber-900 block">Delivery Verification OTP</span>
                                                            <span className="text-[10px] text-amber-700 font-medium">Share with delivery agent upon arrival</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono font-black text-base text-amber-950 bg-white px-3.5 py-1 rounded-lg border border-amber-300 shadow-sm tracking-[0.25em]">
                                                        {order.deliveryOtp || '4829'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Delivery Pickup & Destination Route Details Card (Zomato Style) */}
                                            {order.orderType === 'Delivery' && (
                                                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-4 border border-slate-800 shadow-md">
                                                    {/* Pickup & Delivery Addresses */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-slate-800 pb-3">
                                                        <div className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                                                            <Store size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Pickup Store</span>
                                                                <p className="font-extrabold text-white text-xs mt-0.5">
                                                                    {order.restaurantId?.name || 'Juice Box Main Hub'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">Branch Central Kitchen Counter</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                                                            <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Delivered To</span>
                                                                <p className="font-extrabold text-white text-xs mt-0.5 truncate">
                                                                    {typeof order.shippingAddress === 'object' 
                                                                        ? (order.shippingAddress?.address || 'Customer Home Location')
                                                                        : (order.shippingAddress || 'Customer Home Location')}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">Home Delivery Address</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delivery Partner Executive Details */}
                                                    <div className="flex justify-between items-center flex-wrap gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                                                                <Bike size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Delivery Executive</span>
                                                                <p className="font-extrabold text-white text-sm">
                                                                    {order.deliveryPartner ? (typeof order.deliveryPartner === 'object' ? order.deliveryPartner.name : 'Assigned Executive') : 'Assigning nearest rider...'}
                                                                </p>
                                                                {order.deliveryPartner && typeof order.deliveryPartner === 'object' && (
                                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                                        Vehicle: {order.deliveryPartner.vehicleDetails?.type || 'Bike'} {order.deliveryPartner.vehicleDetails?.model ? `(${order.deliveryPartner.vehicleDetails.model})` : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {order.deliveryPartner && typeof order.deliveryPartner === 'object' && order.deliveryPartner.phoneNumber && (
                                                            <a
                                                                href={`tel:${order.deliveryPartner.phoneNumber}`}
                                                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                                                            >
                                                                <Phone size={14} /> Call Rider
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Mini Zomato-Style Live Route Tracking Progress */}
                                                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                                                        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                                                            <span className="flex items-center gap-1 text-emerald-400">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Route Progress (Zomato Style)
                                                            </span>
                                                            <span className="text-white font-mono uppercase">
                                                                 {(order.status === 'Delivered' || order.deliveryStatus === 'Delivered') ? 'Delivered' :
                                                                  (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up') ? 'Out for Delivery' :
                                                                  (order.status === 'Preparing' || order.status === 'Ready') ? 'Kitchen Preparing' : 'Order Placed (Pending)'}
                                                            </span>
                                                        </div>

                                                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="absolute h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-1000"
                                                                style={{
                                                                    width: (order.status === 'Delivered' || order.deliveryStatus === 'Delivered') ? '100%' :
                                                                           (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up') ? '66%' :
                                                                           (order.status === 'Preparing' || order.status === 'Ready') ? '35%' : '10%'
                                                                }}
                                                            ></div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-1 text-[9px] font-bold text-slate-400">
                                                            <span>🏪 Shop Pickup Hub</span>
                                                            <span>🚴 Rider En Route</span>
                                                            <span>🏠 Home Delivered</span>
                                                        </div>
                                                    </div>

                                                    {/* View Full Route Map Button */}
                                                    <Link 
                                                        to={`/track/${order._id}?restaurantId=${order.restaurantId?._id || order.restaurantId || ''}`}
                                                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all uppercase tracking-wider"
                                                    >
                                                        <Bike size={16} className="animate-bounce" /> Open Live Zomato Map Route ➔
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Reservations */}
                    {activeTab === 'reservations' && (
                        <div className="space-y-8">
                            {/* Book Table Form */}
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Book A Table Reservation</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Pick table, schedule date, and book instant tables</p>
                                </div>

                                <form onSubmit={handleBookReservation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reservation Date</label>
                                        <input 
                                            type="date"
                                            value={resDate}
                                            onChange={(e) => setResDate(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Time Slot</label>
                                        <input 
                                            type="time"
                                            value={resTime}
                                            onChange={(e) => setResTime(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Guests Count</label>
                                        <select 
                                            value={resGuests}
                                            onChange={(e) => setResGuests(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                                                <option key={n} value={n}>{n} Guests</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Seating Preference</label>
                                        <select 
                                            value={resType}
                                            onChange={(e) => setResType(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="Dine In">Dine-In Dining Hall</option>
                                            <option value="Rooftop">Rooftop Sky Lounge</option>
                                            <option value="Window Seat">Window view booth</option>
                                            <option value="Private Cabin">Private family cabin</option>
                                        </select>
                                    </div>
                                    <button 
                                        type="submit"
                                        className="col-span-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/10 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Calendar size={16} /> Confirm Reservation Table
                                    </button>
                                </form>
                            </div>

                            {/* Reservation History List */}
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-900">Your Booking History</h3>
                                <div className="space-y-3">
                                    {reservations.length === 0 ? (
                                        <p className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">No table bookings scheduled.</p>
                                    ) : (
                                        reservations.map((res, i) => (
                                            <div key={i} className="border border-gray-100 p-4 rounded-xl flex justify-between items-center bg-gray-50/50 text-xs sm:text-sm">
                                                <div>
                                                    <p className="font-extrabold text-gray-900">{res.date} • {res.time}</p>
                                                    <p className="text-[11px] text-gray-500 mt-1">Table for {res.guests} ({res.type})</p>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${res.statusColor}`}>{res.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Favorite Items */}
                    {activeTab === 'favorites' && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Your Favorite Items</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Quick order your saved favorites</p>
                            </div>

                            {wishlist.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                                    <Heart size={32} className="text-gray-300" />
                                    <p className="text-xs font-semibold">No favorite items saved.</p>
                                    <p className="text-[10px] text-gray-500">Go to Menu and heart foods to add them here!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {wishlist.map(item => (
                                        <div key={item._id || item.id} className="border border-gray-100 hover:border-orange-200 p-4 rounded-2xl transition-all flex items-center justify-between gap-4 bg-white shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                                    <img src={getItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-sm text-gray-900">{item.name}</h4>
                                                    <span className="font-black text-xs text-orange-600 block mt-1">₹{item.price}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => { addToCart(item); toast.success(`${item.name} added to cart!`); }}
                                                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                                                >
                                                    Add
                                                </button>
                                                <button 
                                                    onClick={() => { toggleWishlist(item); toast.success('Removed from favorites'); }}
                                                    className="p-2 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Loyalty & Rewards */}
                    {activeTab === 'loyalty' && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-sans">Loyalty & Rewards Program</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Track your points, redeem rewards, and view membership tiers</p>
                            </div>

                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-[#d4af37]/30">
                                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#d4af37]/10 rounded-full blur-3xl"></div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ffe07d] to-[#f3c056] text-black flex items-center justify-center shadow-lg shadow-yellow-500/10">
                                                <Crown size={18} className="fill-black" />
                                            </div>
                                            <div>
                                                <span className="block font-black tracking-widest text-[11px] text-[#ffe07d]">{tierName}</span>
                                                <span className="block text-[9px] text-gray-500">RestoSys Rewards</span>
                                            </div>
                                        </div>
                                        <Sparkles size={16} className="text-[#ffe07d] animate-pulse" />
                                    </div>

                                    <div className="mt-8 space-y-1">
                                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Available Balance</span>
                                        <h2 className="text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fff2d1] to-[#f3c056]">{userPoints.toLocaleString()} Pts</h2>
                                        <p className="text-xs text-gray-500 font-semibold mt-1">Value: ₹{(userPoints * 0.1).toFixed(2)} (Redeemable at checkout)</p>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-gray-400">Resto Platinum Tier Progress</span>
                                            <span className="text-[#ffe07d]">80% Complete</span>
                                        </div>
                                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-[#ffe07d]/10">
                                            <div className="h-full bg-gradient-to-r from-[#f3c056] via-[#ffe07d] to-[#f3c056] w-[80%] rounded-full shadow-[0_0_8px_rgba(243,192,86,0.2)]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rewards redemption catalog */}
                                <div className="space-y-4">
                                    <h4 className="font-extrabold text-sm text-gray-900">Available Redemptions</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border border-gray-150 p-4 rounded-2xl flex justify-between items-center bg-gray-50/50">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">₹100 Store Credit</p>
                                                <p className="text-xs text-gray-500 mt-1">Requires 1000 points</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (userPoints >= 1000) {
                                                        setUserPoints(prev => prev - 1000);
                                                        setWalletBalance(prev => prev + 100);
                                                        toast.success('Successfully redeemed 1000 points for ₹100 Store Credit!');
                                                    } else {
                                                        toast.error('Insufficient points! You need 1000 points.');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                                            >
                                                Redeem
                                            </button>
                                        </div>
                                        <div className="border border-gray-150 p-4 rounded-2xl flex justify-between items-center bg-gray-50/50">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Free Double Cheese Pizza</p>
                                                <p className="text-xs text-gray-500 mt-1">Requires 2000 points</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (userPoints >= 2000) {
                                                        setUserPoints(prev => prev - 2000);
                                                        toast.success('🎉 Voucher for Free Double Cheese Pizza redeemed!');
                                                    } else {
                                                        toast.error('Insufficient points! You need 2000 points.');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                                            >
                                                Redeem
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Wallet */}
                    {activeTab === 'wallet' && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Customer Wallet</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Add credits, check transactions, and manage 1-click checkout options</p>
                            </div>

                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="bg-white rounded-3xl p-8 border border-gray-150 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl"></div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                <Wallet size={20} />
                                            </div>
                                            <span className="font-extrabold text-sm text-gray-900">RestoSys Secure Wallet</span>
                                        </div>
                                        <span className="text-[10px] font-black text-green-700 bg-green-50 border border-green-150 px-2 py-0.5 rounded-full">ACTIVE</span>
                                    </div>

                                    <div className="relative z-10 space-y-1 my-6">
                                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
                                        <h2 className="text-5xl font-black font-sans text-gray-950">₹{walletBalance.toFixed(2)}</h2>
                                    </div>

                                    <div className="flex gap-3 relative z-10">
                                        <button 
                                            onClick={handleAddFunds}
                                            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                                        >
                                            <Plus size={16} /> Add Funds
                                        </button>
                                    </div>
                                </div>

                                {/* Mock ledger records */}
                                <div className="space-y-3">
                                    <h4 className="font-extrabold text-sm text-gray-900">Recent Transactions</h4>
                                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-gray-900">Wallet Load (UPI transaction)</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Aug 07, 2026 • Ref #WLT-240</p>
                                        </div>
                                        <span className="font-black text-green-600">+₹500.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Offers & Coupons */}
                    {activeTab === 'offers' && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Offers & Coupons</h3>
                            </div>

                            {loadingOffers ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                                </div>
                            ) : liveOffers.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                    <p className="text-sm font-bold text-gray-700">No active coupons available right now.</p>
                                    <p className="text-xs text-gray-500 mt-1">Check back soon when new restaurant offers are released!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                    {liveOffers.map((offer) => (
                                        <div key={offer._id || offer.code} className="border border-orange-100 bg-orange-50/50 p-6 rounded-2xl space-y-4 border-dashed relative overflow-hidden flex flex-col justify-between shadow-sm">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"></div>
                                            <div>
                                                <div className="flex justify-between items-center">
                                                    <span className="bg-orange-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">Active Promo</span>
                                                    {offer.expiresAt && (
                                                        <span className="text-[10px] font-bold text-gray-500">
                                                            Expires: {new Date(offer.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-black text-gray-900 text-xl mt-3">{offer.code}</h4>
                                                <p className="text-sm font-bold text-orange-600 mt-0.5">
                                                    {offer.type === 'Percentage' ? `${offer.discountValue}% OFF Total Bill` : 
                                                     offer.type === 'Fixed Amount' ? `₹${offer.discountValue.toFixed(2)} Flat Discount` : 
                                                     'FREE SHIPPING ON ORDER'}
                                                </p>
                                                {offer.minSpend > 0 && (
                                                    <p className="text-xs text-gray-600 mt-1 font-medium">Valid on orders above ₹{offer.minSpend}.</p>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-orange-100/50 text-xs">
                                                <span className="font-extrabold text-orange-950 font-mono tracking-wider bg-orange-100 px-3 py-1 rounded-lg text-sm border border-orange-200">
                                                    {offer.code}
                                                </span>
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(offer.code); toast.success(`Coupon code ${offer.code} copied!`); }}
                                                    className="text-xs font-bold bg-white hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-200 transition-colors shadow-sm"
                                                >
                                                    Copy Code
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Feedback & Inquiries */}
                    {activeTab === 'feedback' && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Feedback & Inquiries</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Submit inquiries, complaints, or restaurant feedback directly to administration</p>
                            </div>

                            <form onSubmit={handleSubmitFeedback} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Submission Type</label>
                                        <select 
                                            value={feedbackType}
                                            onChange={(e) => setFeedbackType(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="Feedback">General Feedback & Reviews</option>
                                            <option value="Complaint">Complaint / Bug Report</option>
                                            <option value="Support">Support Ticket inquiry</option>
                                            <option value="Franchise">Franchise request</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Subject Summary</label>
                                        <input 
                                            type="text"
                                            placeholder="E.g. Food quality, delivery delay, table service..."
                                            value={feedbackSubject}
                                            onChange={(e) => setFeedbackSubject(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Message Details</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Write your review, support question, or complaint detail here. We review every ticket within 24 hours..."
                                        value={feedbackMessage}
                                        onChange={(e) => setFeedbackMessage(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-150 rounded-xl p-4 text-xs focus:outline-none focus:border-orange-500 resize-none"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/10 transition-colors"
                                >
                                    Submit Ticket
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Tab: Profile & Settings */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <ThemeSettingCard />
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Profile & Settings</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Manage your contact name, phone, address, and password settings</p>
                                </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-3 text-gray-400"><User size={14} /></span>
                                            <input 
                                                type="text"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-3 text-gray-400"><Phone size={14} /></span>
                                            <input 
                                                type="text"
                                                value={profilePhone}
                                                onChange={(e) => setProfilePhone(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 col-span-full">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Default Delivery Address</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-3 text-gray-400"><MapPin size={14} /></span>
                                            <input 
                                                type="text"
                                                placeholder="Street name, floor, city, postal code..."
                                                value={profileAddress}
                                                onChange={(e) => setProfileAddress(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5 space-y-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Update (Optional)</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Password</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-3 text-gray-400"><Lock size={14} /></span>
                                                <input 
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Password</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-3 text-gray-400"><Lock size={14} /></span>
                                                <input 
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Minimum 6 characters"
                                                    className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit"
                                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/10 transition-colors"
                                    >
                                        Save Profile Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    )}

                </div>

            </div>

            {/* Beautiful Custom Add Funds Modal */}
            {isAddFundsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-100 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-left">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-950 text-base">Add Funds to Wallet</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fast & Secure Deposit</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deposit Amount (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-450 font-bold text-sm">₹</span>
                                    <input 
                                        type="number"
                                        value={addFundsAmount}
                                        onChange={(e) => setAddFundsAmount(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-150 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:border-orange-500"
                                        placeholder="500"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Quick Amount Suggestion Tags */}
                            <div className="flex gap-2">
                                {[100, 200, 500, 1000].map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setAddFundsAmount(amt.toString())}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                            addFundsAmount === amt.toString()
                                            ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm'
                                            : 'bg-gray-50 text-gray-650 border-gray-150 hover:bg-gray-100'
                                        }`}
                                    >
                                        +₹{amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsAddFundsOpen(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const val = parseFloat(addFundsAmount);
                                    if (val > 0) {
                                        setWalletBalance(prev => prev + val);
                                        toast.success(`₹${val.toFixed(2)} added to your wallet!`);
                                        setIsAddFundsOpen(false);
                                    } else {
                                        toast.error("Please enter a valid positive amount");
                                    }
                                }}
                                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-600/10 transition-all cursor-pointer text-center"
                            >
                                Deposit
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CustomerDashboard;
