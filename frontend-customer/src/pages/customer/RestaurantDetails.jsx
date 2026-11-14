import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Info, ShoppingBag, Plus, Minus, CheckCircle, Store, AlertCircle, ArrowLeft, Heart, Truck, Navigation } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getItemImage } from '../../utils/imageHelper';
import api, { getApiUrl } from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import DishDetailModal from '../../components/DishDetailModal';
import { getSavedCoordinates, getSavedLocation, calculateDistanceKm, requestBrowserGpsLocation, EVENT_LOCATION_UPDATED } from '../../utils/locationHelper';

const RestaurantDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cartItems, addToCart, removeFromCart, clearCart, cartTotal, cartCount, wishlist, toggleWishlist, setIsWishlistOpen } = useCart();

    const [customerCoords, setCustomerCoords] = useState(() => getSavedCoordinates());
    const [customerLocation, setCustomerLocation] = useState(() => getSavedLocation() || '');
    const [detectingGps, setDetectingGps] = useState(false);
    
    const [restaurant, setRestaurant] = useState(() => {
        try {
            const cached = sessionStorage.getItem(`restosys_rest_${id}`);
            return cached ? JSON.parse(cached) : null;
        } catch { return null; }
    });
    const [branches, setBranches] = useState(() => {
        try {
            const cached = sessionStorage.getItem(`restosys_branches_${id}`);
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [menu, setMenu] = useState(() => {
        try {
            const cached = sessionStorage.getItem(`restosys_menu_${id}`);
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(() => {
        try {
            return !sessionStorage.getItem(`restosys_rest_${id}`);
        } catch { return true; }
    });
    const [selectedDish, setSelectedDish] = useState(null);

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
        const capTimer = setTimeout(() => setLoading(false), 1500);
        const fetchDetails = async () => {
            try {
                // Fetch restaurant profile, branches, and menu in parallel
                const [restRes, branchRes, menuRes] = await Promise.all([
                    api.get(`/restaurants/${id}`).catch(() => 
                        api.get('/restaurants').then(res => ({
                            data: Array.isArray(res.data) ? res.data.find(r => String(r._id) === String(id)) : null
                        })).catch(() => ({ data: null }))
                    ),
                    api.get(`/restaurants/${id}/branches`).catch(() => ({ data: [] })),
                    api.get(`/menu?restaurantId=${id}`).catch(() => ({ data: [] }))
                ]);

                const fetchedRest = restRes?.data || null;

                // Check if restaurant is inactive, suspended, or soft-deleted
                const isInactiveStatus = fetchedRest?.status && fetchedRest.status.toLowerCase() === 'inactive';
                const isSoftDeleted = fetchedRest?.isDeleted === true;
                const isExplicitlyDisabled = fetchedRest?.isActive === false;
                const isRejected = fetchedRest?.approvalStatus === 'Rejected';

                if (!fetchedRest || isSoftDeleted || isInactiveStatus || isExplicitlyDisabled || isRejected) {
                    setRestaurant(null);
                    // Clean up cart if it holds items for this unavailable restaurant (synced with CartContext)
                    const hasMatchingItems = cartItems.some(item => {
                        const rId = typeof item.restaurantId === 'object' ? item.restaurantId?._id : (item.restaurantId || item.restaurant);
                        return String(rId) === String(id);
                    });
                    if (hasMatchingItems) clearCart();
                    setLoading(false);
                    return;
                }

                setRestaurant(fetchedRest);

                const branchList = Array.isArray(branchRes?.data) ? branchRes.data : [];
                setBranches(branchList);
                if (branchList.length > 0) {
                    setSelectedBranch(branchList[0]._id);
                }

                const rawMenu = Array.isArray(menuRes?.data) ? menuRes.data : [];
                const restaurantMenu = rawMenu.filter(m => {
                    const rId = typeof m.restaurantId === 'object' ? (m.restaurantId?._id || m.restaurantId?.id) : m.restaurantId;
                    return !rId || String(rId) === String(id);
                });
                setMenu(restaurantMenu);

                try {
                    sessionStorage.setItem(`restosys_rest_${id}`, JSON.stringify(fetchedRest));
                    sessionStorage.setItem(`restosys_branches_${id}`, JSON.stringify(branchList));
                    sessionStorage.setItem(`restosys_menu_${id}`, JSON.stringify(restaurantMenu));
                } catch {}
            } catch (error) {
                console.error("Failed to load restaurant details", error);
                setRestaurant(null);
            } finally {
                clearTimeout(capTimer);
                setLoading(false);
            }
        };
        fetchDetails();
        return () => clearTimeout(capTimer);
    }, [id]);

    // Synchronize customer GPS location when updated across tabs/modals
    useEffect(() => {
        const handleLocUpdate = (e) => {
            if (e.detail?.location) setCustomerLocation(e.detail.location);
            if (e.detail?.coordinates) {
                setCustomerCoords(e.detail.coordinates);
            } else {
                setCustomerCoords(getSavedCoordinates());
            }
        };
        window.addEventListener(EVENT_LOCATION_UPDATED, handleLocUpdate);
        return () => window.removeEventListener(EVENT_LOCATION_UPDATED, handleLocUpdate);
    }, []);

    const handleDetectGps = async () => {
        setDetectingGps(true);
        try {
            const res = await requestBrowserGpsLocation();
            if (res?.coordinates) {
                setCustomerCoords(res.coordinates);
                toast.success('GPS location detected successfully!');
            } else {
                toast.error('Unable to retrieve GPS coordinates. Please enable location services in your browser.');
            }
        } catch (err) {
            toast.error('GPS location request failed.');
        } finally {
            setDetectingGps(false);
        }
    };

    const getItemQuantity = (itemId) => {
        const item = cartItems.find((i) => (i.id || i._id) === itemId);
        return item ? (item.quantity || item.qty || 0) : 0;
    };

    // Calculate delivery radius & distance to customer GPS
    const deliverySettings = restaurant?.deliverySettings || { enabled: true, radius: 5, freeRadius: 2, baseFee: 30, perKmCharge: 10 };
    const deliveryRadius = deliverySettings.radius || 5;
    const restLat = deliverySettings.location?.latitude || restaurant?.branches?.[0]?.location?.latitude || null;
    const restLon = deliverySettings.location?.longitude || restaurant?.branches?.[0]?.location?.longitude || null;

    const distanceKm = (customerCoords?.latitude && customerCoords?.longitude && restLat && restLon)
        ? calculateDistanceKm(customerCoords.latitude, customerCoords.longitude, restLat, restLon)
        : null;

    const isWithinRadius = distanceKm !== null ? distanceKm <= deliveryRadius : null;
    const isHomeDeliveryEnabled = deliverySettings.enabled !== false && restaurant?.restaurantConfig?.orderKitchen?.homeDelivery !== false;

    const handleCheckout = () => {
        const storedCustomer = localStorage.getItem('restosys_customer_user');
        if (!storedCustomer) {
            toast.error('Please sign in or create an account to place your order.');
            navigate('/customer/login', { state: { from: { pathname: '/checkout', state: { restaurantId: id, branchId: selectedBranch, isWithinRadius, distanceKm } } } });
            return;
        }
        navigate('/checkout', { state: { restaurantId: id, branchId: selectedBranch, isWithinRadius, distanceKm } });
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
            {/* Header Images / Clean Store Banner */}
            <div className="h-32 sm:h-52 md:h-64 w-full bg-gradient-to-r from-stone-900 via-neutral-900 to-orange-950 overflow-hidden relative flex items-center justify-center">
                {(() => {
                    const hasDedicatedBanner = (restaurant.bannerImage && restaurant.bannerImage !== restaurant.logo) || 
                                               (restaurant.image && restaurant.image !== restaurant.logo);
                    const rawBanner = hasDedicatedBanner ? (restaurant.bannerImage || restaurant.image) : null;
                    if (rawBanner && typeof rawBanner === 'string') {
                        const apiBase = getApiUrl();
                        const origin = apiBase.startsWith('http') ? new URL(apiBase).origin : 'https://f-hms.onrender.com';
                        const bannerSrc = (rawBanner.startsWith('http') || rawBanner.startsWith('data:'))
                            ? rawBanner
                            : `${origin}${rawBanner.startsWith('/') ? '' : '/'}${rawBanner}`;
                        return (
                            <img 
                                src={bannerSrc} 
                                alt={restaurant.name}
                                onError={(e) => { e.target.style.display = 'none'; }}
                                className="w-full h-full object-cover opacity-75"
                            />
                        );
                    }
                    return (
                        <div className="flex flex-col items-center justify-center text-white/40 space-y-1.5">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 text-[#FF5A1F]">
                                <Store size={22} />
                            </div>
                            <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">{restaurant.name}</span>
                        </div>
                    );
                })()}
            </div>

            {/* Restaurant Info Card - Compact & Balanced for Mobile & Desktop */}
            <div className="max-w-4xl mx-auto px-3 sm:px-6 -mt-8 sm:-mt-12 relative z-10">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2.5 sm:gap-4">
                        <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 text-left flex-1">
                            {/* Restaurant Logo */}
                            {restaurant.logo && (() => {
                                const apiBase = getApiUrl();
                                const origin = apiBase.startsWith('http') ? new URL(apiBase).origin : 'https://f-hms.onrender.com';
                                const logoSrc = (restaurant.logo.startsWith('http') || restaurant.logo.startsWith('data:'))
                                    ? restaurant.logo
                                    : `${origin}${restaurant.logo.startsWith('/') ? '' : '/'}${restaurant.logo}`;
                                return (
                                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 shrink-0 shadow-sm flex items-center justify-center">
                                        <img 
                                            src={logoSrc} 
                                            alt={restaurant.name} 
                                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                );
                            })()}

                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                                <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate leading-snug">
                                    {restaurant.name}
                                </h1>
                                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                                    {restaurant.cuisines || 'Multi-Cuisine • Fast Food • Beverages'}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                                    <span className="inline-flex items-center gap-1 font-semibold text-[#FF5A1F] truncate">
                                        <MapPin size={11} className="shrink-0" /> 
                                        <span className="truncate">{restaurant.address || restaurant.city || 'Verified Outlet'}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-medium text-slate-400 shrink-0">
                                        <Clock size={11} className="shrink-0" /> 
                                        <span>Open Now</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dining Rating Pill */}
                        <div className="shrink-0 flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-400 font-black text-xs sm:text-sm shadow-2xs self-start">
                            <span>4.5</span>
                            <Star size={12} className="fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
                        </div>
                    </div>

                    {/* Showcase Image Gallery Preview */}
                    {Array.isArray(restaurant.showcaseImages) && restaurant.showcaseImages.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-2 text-left">
                                Outlet Showcase &amp; Ambiance
                            </span>
                            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                                {restaurant.showcaseImages.map((imgUrl, i) => {
                                    const apiBase = getApiUrl();
                                    const origin = apiBase.startsWith('http') ? new URL(apiBase).origin : 'https://f-hms.onrender.com';
                                    const src = (imgUrl.startsWith('http') || imgUrl.startsWith('data:'))
                                        ? imgUrl
                                        : `${origin}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
                                    return (
                                        <div key={i} className="relative w-20 h-14 sm:w-24 sm:h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xs">
                                            <img src={src} alt={`Showcase ${i+1}`} onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delivery Radius & Customer GPS Distance Card */}
                <div className="mt-3 sm:mt-4 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF5A1F] flex items-center justify-center shrink-0">
                                <Truck size={17} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                    Fixed Delivery Radius: <span className="text-[#FF5A1F]">{deliveryRadius} km</span>
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Home delivery accepted within {deliveryRadius} km of this outlet
                                </p>
                            </div>
                        </div>

                        {/* Customer GPS Distance Status Pill / Action */}
                        {distanceKm !== null ? (
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    isWithinRadius
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                }`}>
                                    <MapPin size={13} />
                                    <span>{distanceKm} km from your GPS location</span>
                                    <span className="opacity-60">•</span>
                                    <span>{isWithinRadius ? 'Within Radius' : 'Outside Radius'}</span>
                                </span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDetectGps}
                                disabled={detectingGps}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] text-xs font-bold transition-colors cursor-pointer border border-orange-200/80 self-start sm:self-auto"
                            >
                                {detectingGps ? (
                                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                    <Navigation size={13} />
                                )}
                                <span>Detect Distance with GPS</span>
                            </button>
                        )}
                    </div>

                    {/* Delivery Availability Status Notice */}
                    <div className="pt-2.5">
                        {!isHomeDeliveryEnabled ? (
                            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                                <AlertCircle size={15} className="shrink-0" />
                                <span>Home Delivery is currently disabled by this restaurant. Self-Pickup and Dine-In are available.</span>
                            </div>
                        ) : isWithinRadius === true ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                                <CheckCircle size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>🟢 Home Delivery is available for your location ({distanceKm} km is within the {deliveryRadius} km fixed radius).</span>
                            </div>
                        ) : isWithinRadius === false ? (
                            <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                                <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div>
                                    <span className="font-bold block">Outside Delivery Radius ({distanceKm} km away)</span>
                                    <span>This outlet's fixed delivery limit is {deliveryRadius} km. Home Delivery is unavailable for your address, but Self-Pickup and Dine-In orders are available!</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                <Info size={15} className="shrink-0 text-slate-400" />
                                <span>Home delivery is served within {deliveryRadius} km. Click "Detect Distance with GPS" to verify your exact location.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Branch Selection - Compact */}
                <div className="mt-3 sm:mt-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 text-left">
                    <div className="flex items-center justify-between mb-2.5">
                        <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                            <MapPin size={15} className="text-[#FF5A1F]" /> 
                            <span>Select Pickup Branch</span>
                        </h3>
                        {branches.length > 0 && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                {branches.length} available
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {branches.map(branch => (
                            <button
                                key={branch._id}
                                onClick={() => setSelectedBranch(branch._id)}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                                    selectedBranch === branch._id 
                                    ? 'border-[#FF5A1F] bg-orange-50/70 dark:bg-orange-950/40 text-[#FF5A1F] shadow-2xs' 
                                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 hover:border-orange-200 hover:bg-orange-50/30'
                                }`}
                            >
                                <span>{branch.name}</span>
                                {branch.address && (
                                    <span className="block text-[10px] opacity-75 font-normal mt-0.5">{branch.address}</span>
                                )}
                            </button>
                        ))}
                        {branches.length === 0 && (
                            <span className="text-xs text-gray-400 dark:text-slate-500 italic py-0.5">
                                Default counter pickup available.
                            </span>
                        )}
                    </div>
                </div>

                {/* Mobile Categories Quick Bar */}
                {categories.length > 0 && (
                    <div className="md:hidden mt-5 sm:mt-6 flex gap-2 overflow-x-auto py-2 -mx-1 px-1 scrollbar-none items-center">
                        {categories.map(cat => (
                            <a 
                                href={`#category-${cat}`} 
                                key={cat} 
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 hover:text-[#FF5A1F] hover:border-[#FF5A1F] transition-all whitespace-nowrap shadow-2xs shrink-0"
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
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 sticky top-24 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">Menu</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsWishlistOpen(true)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                                    title="View Wishlist"
                                >
                                    <Heart size={12} className="fill-rose-500 text-rose-500" />
                                    <span>{wishlist?.length || 0}</span>
                                </button>
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
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
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-gray-100 dark:border-slate-800 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 dark:text-white">
                                <ShoppingBag size={16} className="text-[#FF5A1F]" />
                                <span>Restaurant Menu ({menu.length} Dishes)</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWishlistOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-extrabold transition-colors cursor-pointer"
                            >
                                <Heart size={14} className={wishlist?.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                                <span>Wishlist ({wishlist?.length || 0})</span>
                            </button>
                        </div>

                        {categories.map(category => (
                            <div key={category} id={`category-${category}`} className="scroll-mt-24">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">{category}</h2>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden divide-y divide-gray-50 dark:divide-slate-800">
                                    {menu.filter(item => item.category === category).map(item => {
                                        const isFav = wishlist?.some(w => (w._id || w.id) === (item._id || item.id));
                                        return (
                                        <div 
                                             key={item._id} 
                                             onClick={() => setSelectedDish({ ...item, restaurantName: restaurant?.name })}
                                             className="p-4 sm:p-6 flex gap-4 sm:gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group rounded-2xl cursor-pointer"
                                         >
                                             <div className="flex-1">
                                                 <div className="flex items-start justify-between gap-2 mb-1">
                                                     <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.name}</h3>
                                                     <button
                                                         type="button"
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             toggleWishlist(item);
                                                             toast.success(isFav ? `${item.name} removed from wishlist` : `${item.name} added to wishlist!`);
                                                         }}
                                                         className={`p-1.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                                                             isFav
                                                                 ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800'
                                                                 : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-rose-500 hover:border-rose-200'
                                                         }`}
                                                         title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                                         aria-label="Toggle Wishlist"
                                                     >
                                                         <Heart size={15} className={isFav ? 'fill-rose-500 text-rose-500' : ''} />
                                                     </button>
                                                 </div>
                                                 <div className="font-extrabold text-red-600 dark:text-red-400 mb-1.5">₹{item.price}</div>
                                                 <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                                                 <button 
                                                     type="button"
                                                     onClick={(e) => { e.stopPropagation(); setSelectedDish({ ...item, restaurantName: restaurant?.name }); }}
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
                                        );
                                    })}
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
                            disabled={branches.length > 0 && !selectedBranch}
                            className={`px-8 py-3.5 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                                (branches.length === 0 || selectedBranch)
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' 
                                : 'bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Continue to Checkout
                        </button>
                    </div>
                </div>
            )}

            <DishDetailModal
                dish={selectedDish}
                isOpen={Boolean(selectedDish)}
                onClose={() => setSelectedDish(null)}
                onAddToCart={(d, qty) => {
                    addToCart(d, qty);
                    toast.success(`${qty > 1 ? `${qty}x ` : ''}${d.name} added to cart!`);
                }}
                isWishlisted={Boolean(selectedDish && wishlist?.some(w => (w._id || w.id) === (selectedDish._id || selectedDish.id)))}
                onToggleWishlist={(d) => {
                    const isFavNow = wishlist?.some(w => (w._id || w.id) === (d._id || d.id));
                    toggleWishlist(d);
                    toast.success(isFavNow ? `${d.name} removed from wishlist` : `${d.name} added to wishlist!`);
                }}
            />
        </div>
    );
};

export default RestaurantDetails;
