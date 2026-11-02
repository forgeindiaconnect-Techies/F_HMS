import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Info, ShoppingBag, Plus, Minus, CheckCircle, Store, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getItemImage } from '../../utils/imageHelper';
import { getApiUrl } from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const RestaurantDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, removeFromCart, cartTotal, cartCount } = useCart();
    
    const [restaurant, setRestaurant] = useState(null);
    const [branches, setBranches] = useState([]);
    const [menu, setMenu] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingGuests, setBookingGuests] = useState('2');
    const [bookingSeating, setBookingSeating] = useState('indoor');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    const handleBookTable = (e) => {
        e.preventDefault();
        if (!bookingDate || !bookingTime) {
            toast.error('Please select a date and time.');
            return;
        }
        setBookingLoading(true);
        setTimeout(() => {
            setBookingLoading(false);
            
            let formattedTime = bookingTime;
            if (bookingTime === '17:00') formattedTime = '5:00 PM';
            else if (bookingTime === '17:30') formattedTime = '5:30 PM';
            else if (bookingTime === '18:00') formattedTime = '6:00 PM';
            else if (bookingTime === '18:30') formattedTime = '6:30 PM';
            else if (bookingTime === '19:00') formattedTime = '7:00 PM';
            else if (bookingTime === '19:30') formattedTime = '7:30 PM';
            else if (bookingTime === '20:00') formattedTime = '8:00 PM';
            else if (bookingTime === '20:30') formattedTime = '8:30 PM';
            else if (bookingTime === '21:00') formattedTime = '9:00 PM';

            let formattedDate = bookingDate;
            try {
                const d = new Date(bookingDate);
                formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } catch (err) {}

            const newRes = {
                date: formattedDate,
                time: formattedTime,
                guests: parseInt(bookingGuests) || 2,
                type: bookingSeating === 'indoor' ? 'Indoor' : bookingSeating === 'outdoor' ? 'Outdoor' : 'Bar',
                status: 'Confirmed',
                statusColor: 'bg-green-50 text-green-700 border-green-100',
                restaurantName: restaurant?.name || 'Restaurant'
            };

            const existing = JSON.parse(localStorage.getItem('customerReservations') || '[]');
            localStorage.setItem('customerReservations', JSON.stringify([newRes, ...existing]));
            setBookingSuccess(true);
        }, 1200);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                let API_URL = getApiUrl();

                // Fetch restaurant profile directly to verify visibility and status
                let fetchedRest = null;
                try {
                    const restRes = await axios.get(`${API_URL}/restaurants/${id}`);
                    fetchedRest = restRes.data;
                } catch (rErr) {
                    // Fallback to list search
                    const listRes = await axios.get(`${API_URL}/restaurants`);
                    fetchedRest = listRes.data.find(r => r._id === id);
                }

                // Check if restaurant is inactive, suspended, or soft-deleted
                if (
                    !fetchedRest || 
                    fetchedRest.isDeleted || 
                    (fetchedRest.status && fetchedRest.status !== 'Active') || 
                    fetchedRest.isActive === false || 
                    fetchedRest.approvalStatus === 'Rejected'
                ) {
                    setRestaurant(null);
                    // Automatically clean up cart if it holds items for this unavailable restaurant
                    try {
                        const savedCart = JSON.parse(localStorage.getItem('restosys_cart') || '[]');
                        const cleanedCart = savedCart.filter(item => {
                            const rId = typeof item.restaurantId === 'object' ? item.restaurantId?._id : (item.restaurantId || item.restaurant);
                            return String(rId) !== String(id);
                        });
                        if (cleanedCart.length !== savedCart.length) {
                            localStorage.setItem('restosys_cart', JSON.stringify(cleanedCart));
                        }
                    } catch (e) {}
                    setLoading(false);
                    return;
                }

                setRestaurant(fetchedRest);

                // Fetch branches
                try {
                    const branchRes = await axios.get(`${API_URL}/restaurants/${id}/branches`);
                    setBranches(branchRes.data || []);
                    if (branchRes.data?.length > 0) {
                        setSelectedBranch(branchRes.data[0]._id);
                    }
                } catch (bErr) {
                    setBranches([]);
                }
                
                // Fetch menu
                const menuRes = await axios.get(`${API_URL}/menu?restaurantId=${id}`);
                setMenu(Array.isArray(menuRes.data) ? menuRes.data.filter(m => m.restaurantId === id) : []);
                
            } catch (error) {
                console.error("Failed to load restaurant details", error);
                setRestaurant(null);
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
        const storedCustomer = localStorage.getItem('restosys_customer_user');
        if (!storedCustomer) {
            toast.error('Please sign in or create an account to place your order.');
            navigate('/customer/login', { state: { from: { pathname: '/checkout', state: { restaurantId: id, branchId: selectedBranch } } } });
            return;
        }
        navigate('/checkout', { state: { restaurantId: id, branchId: selectedBranch } });
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
    
    if (!restaurant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 px-4 text-center">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-sm">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Restaurant Currently Unavailable</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8">
                    This restaurant is currently hidden, inactive, or not accepting online orders at this time. Please check back later or explore other nearby restaurants.
                </p>
                <Link 
                    to="/explore"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all text-sm"
                >
                    <ArrowLeft size={16} /> Explore Other Restaurants
                </Link>
            </div>
        );
    }

    const categories = [...new Set(menu.map(item => item.category))];

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-32 transition-colors">
            {/* Header Images */}
            <div className="h-72 w-full bg-gray-900 dark:bg-slate-900 overflow-hidden relative">
                <img 
                    src={
                        restaurant.logo 
                            ? (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:')
                                ? restaurant.logo 
                                : `${new URL(getApiUrl()).origin}${restaurant.logo.startsWith('/') ? '' : '/'}${restaurant.logo}`)
                            : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop"
                    } 
                    alt={restaurant.name}
                    className="w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Restaurant Info */}
            <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{restaurant.name}</h1>
                        <p className="text-gray-500 dark:text-slate-400 mb-4">Multi-Cuisine • Desserts • Beverages</p>
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-slate-300">
                            <span className="flex items-center gap-1"><Clock size={16} className="text-red-500" /> Opens at 10:00 AM</span>
                            <span className="flex items-center gap-1"><Info size={16} className="text-gray-400 dark:text-slate-500" /> Known for great ambiance</span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-950/40 rounded-xl">
                            <span className="flex items-center gap-1 text-green-700 dark:text-green-400 font-bold text-lg">4.5 <Star size={16} className="fill-green-700 dark:fill-green-400" /></span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-bold mt-1">Dining Rating</span>
                        </div>
                    </div>
                </div>

                {/* Branch Selection */}
                <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 shadow-sm' 
                                    : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-300 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900'
                                }`}
                            >
                                {branch.name}
                                <span className="block text-xs opacity-70 font-normal mt-0.5">{branch.address}</span>
                            </button>
                        ))}
                        {branches.length === 0 && <span className="text-gray-500 dark:text-slate-400">No branches available for self-pickup.</span>}
                    </div>
                </div>

                {/* Mobile Categories Quick Bar */}
                {categories.length > 0 && (
                    <div className="md:hidden mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map(cat => (
                            <a 
                                href={`#category-${cat}`} 
                                key={cat} 
                                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-bold text-gray-700 dark:text-slate-300 hover:text-red-600 hover:border-red-300 whitespace-nowrap shadow-xs"
                            >
                                {cat}
                            </a>
                        ))}
                    </div>
                )}

                {/* Main Content: Menu Items FIRST, followed by Table Booking */}
                <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left Categories Sidebar (Desktop) */}
                    <div className="lg:w-56 shrink-0 hidden lg:block">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 sticky top-24">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 px-2">Menu</h3>
                            <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                {categories.map(cat => (
                                    <a href={`#category-${cat}`} key={cat} className="block px-4 py-2.5 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium text-sm">
                                        {cat}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Menu Items (Appears First) */}
                    <div className="flex-1 w-full space-y-10 order-1">
                        {categories.map(category => (
                            <div key={category} id={`category-${category}`} className="scroll-mt-24">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">{category}</h2>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden divide-y divide-gray-50 dark:divide-slate-800">
                                    {menu.filter(item => item.category === category).map(item => (
                                        <div 
                                             key={item._id} 
                                             className="p-4 sm:p-6 flex gap-4 sm:gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group rounded-2xl"
                                         >
                                             <div className="flex-1">
                                                 <div className="flex items-start justify-between mb-1">
                                                     <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.name}</h3>
                                                 </div>
                                                 <div className="font-extrabold text-red-600 dark:text-red-400 mb-1.5">₹{item.price}</div>
                                                 <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                                                 <button 
                                                     onClick={() => { addToCart(item); toast.success(`${item.name} added to cart!`); }}
                                                     className="mt-3 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                                 >
                                                     <Plus size={14} /> Add
                                                 </button>
                                             </div>
                                             {item.image && item.image.trim() !== '' && !item.image.includes('unsplash.com') && !item.image.includes('placeholder') && (
                                                 <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
                                                     <img 
                                                         src={item.image} 
                                                         alt={item.name} 
                                                         className="w-full h-full object-cover rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300" 
                                                     />
                                                 </div>
                                             )}
                                         </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {menu.length === 0 && <div className="text-center text-gray-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">Menu not available for this restaurant.</div>}
                    </div>

                    {/* Table Booking Column (Positioned after the menu items) */}
                    <div className="w-full lg:w-80 shrink-0 order-2">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 sticky top-24">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-red-500" /> Book a Table
                            </h3>
                            {bookingSuccess ? (
                                <div className="text-center py-6 animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Table Confirmed!</h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Your table has been reserved successfully.</p>
                                    <div className="flex flex-col gap-3">
                                        <Link 
                                            to="/profile/reservations"
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                                        >
                                            View Details
                                        </Link>
                                        <button 
                                            onClick={() => setBookingSuccess(false)}
                                            className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 font-bold transition-colors"
                                        >
                                            Book Another Table
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleBookTable} className="space-y-4 min-w-0 pr-1.5 flex-1">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Date</label>
                                        <input 
                                            type="date" 
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl outline-none focus:border-red-500 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Time</label>
                                        <select 
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl outline-none focus:border-red-500 text-sm"
                                            required
                                        >
                                            <option value="">Select time...</option>
                                            <option value="17:00">5:00 PM</option>
                                            <option value="17:30">5:30 PM</option>
                                            <option value="18:00">6:00 PM</option>
                                            <option value="18:30">6:30 PM</option>
                                            <option value="19:00">7:00 PM</option>
                                            <option value="19:30">7:30 PM</option>
                                            <option value="20:00">8:00 PM</option>
                                            <option value="20:30">8:30 PM</option>
                                            <option value="21:00">9:00 PM</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Guests</label>
                                        <select 
                                            value={bookingGuests}
                                            onChange={(e) => setBookingGuests(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl outline-none focus:border-red-500 text-sm"
                                        >
                                            <option value="1">1 Guest</option>
                                            <option value="2">2 Guests</option>
                                            <option value="3">3 Guests</option>
                                            <option value="4">4 Guests</option>
                                            <option value="5">5 Guests</option>
                                            <option value="6">6 Guests</option>
                                            <option value="8">8 Guests</option>
                                            <option value="10">10 Guests</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Seating Area</label>
                                        <select 
                                            value={bookingSeating}
                                            onChange={(e) => setBookingSeating(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white rounded-xl outline-none focus:border-red-500 text-sm"
                                        >
                                            <option value="indoor">Indoor Dining</option>
                                            <option value="outdoor">Outdoor Terrace</option>
                                            <option value="bar">Bar Lounge</option>
                                        </select>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={bookingLoading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-75"
                                    >
                                        {bookingLoading ? 'Reserving...' : 'Book Table'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Cart Banner */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 relative">
                                <ShoppingBag size={24} />
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-bold flex items-center justify-center shadow-sm">
                                    {cartCount}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Subtotal</p>
                                <p className="font-bold text-xl text-gray-900 dark:text-white">₹{cartTotal.toFixed(2)}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={!selectedBranch}
                            className={`px-8 py-3.5 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                                selectedBranch 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' 
                                : 'bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-slate-500 cursor-not-allowed'
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
