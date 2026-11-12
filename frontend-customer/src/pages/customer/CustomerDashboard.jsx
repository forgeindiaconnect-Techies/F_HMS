import { useState, useEffect, useMemo } from 'react';
import { 
    LayoutGrid, BookOpen, ShoppingBag, 
    Calendar, Heart, MessageSquare, Settings, 
    Crown, Sparkles, Plus, Trash2, 
    ChevronRight, LogOut, Wallet, Star, ShieldAlert,
    MapPin, Phone, Lock, Clock, Gift, User,
    Bike, Store, BellRing, Menu, X
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getApiUrl } from '../../utils/axiosInstance';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getItemImage } from '../../utils/imageHelper';
import toast from 'react-hot-toast';
import { ThemeSettingCard } from '../../components/ThemeToggle';
import LocationPickerModal from '../../components/LocationPickerModal';
import { getSavedLocation, saveUserLocation, detectUserLocation, filterRestaurantsForLocation, matchesRestaurantLocation, EVENT_LOCATION_UPDATED } from '../../utils/locationHelper';
import { Navigation, Loader2 } from 'lucide-react';
import { getOrderReadyTimeInfo } from '../../utils/orderReadyHelper';

const CustomerDashboard = () => {
    const { user, logout, api } = useCustomerAuth();
    
    // Safely get Cart context values with fallbacks
    const cartContext = useCart() || {};
    const wishlist = cartContext.wishlist || [];
    const addToCart = cartContext.addToCart || (() => {});
    const toggleWishlist = cartContext.toggleWishlist || (() => {});
    
    // Core states
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const t = new URLSearchParams(window.location.search).get('tab');
            return t || 'overview';
        } catch { return 'overview'; }
    });
    const [orders, setOrders] = useState(() => {
        try {
            const cached = sessionStorage.getItem('restosys_cust_orders_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [loadingOrders, setLoadingOrders] = useState(() => {
        try {
            const cached = sessionStorage.getItem('restosys_cust_orders_cache');
            return !(cached && JSON.parse(cached)?.length >= 0);
        } catch { return true; }
    });
    const [reservations, setReservations] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [registeredRestaurants, setRegisteredRestaurants] = useState([]);
    const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState('All');
    const [userLocation, setUserLocation] = useState(() => getSavedLocation() || '');
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [showOnlyLocalOutlets, setShowOnlyLocalOutlets] = useState(true);
    const [outletSearchFilter, setOutletSearchFilter] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
    
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

    const [walletTransactions, setWalletTransactions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('customerWalletTransactions') || '[]');
        } catch (e) {
            return [];
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

    // Customer Review (Landing Page Testimonials) State
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [myReviews, setMyReviews] = useState([]);
    const [loadingMyReviews, setLoadingMyReviews] = useState(false);

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

        // Synchronize location across dashboard and listen for updates
    useEffect(() => {
        const saved = getSavedLocation();
        if (saved) {
            setUserLocation(saved);
        }

        const handleLocationUpdate = (e) => {
            if (e?.detail?.location !== undefined) {
                setUserLocation(e.detail.location);
            } else {
                setUserLocation(getSavedLocation());
            }
        };

        window.addEventListener(EVENT_LOCATION_UPDATED, handleLocationUpdate);
        window.addEventListener('storage', handleLocationUpdate);
        return () => {
            window.removeEventListener(EVENT_LOCATION_UPDATED, handleLocationUpdate);
            window.removeEventListener('storage', handleLocationUpdate);
        };
    }, []);

    // Filter restaurants for current location
    const locationFilteredRestaurants = useMemo(() => {
        if (!userLocation) return registeredRestaurants;
        return registeredRestaurants.filter(r => matchesRestaurantLocation(r, userLocation));
    }, [registeredRestaurants, userLocation]);

    // Handle detecting GPS location
    const handleDetectLocation = async () => {
        setIsDetectingLocation(true);
        const loadingToast = toast.loading('Detecting your GPS location...');
        try {
            const res = await detectUserLocation();
            toast.dismiss(loadingToast);
            if (res.success && res.formattedLocation) {
                setUserLocation(res.formattedLocation);
                toast.success(`Location set to ${res.formattedLocation}!`, { icon: '📍' });
            } else {
                setIsLocationPickerOpen(true);
                toast('Please select your city from the list', { icon: '📍' });
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            setIsLocationPickerOpen(true);
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const [liveMenuItems, setLiveMenuItems] = useState([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState(true);

    useEffect(() => {
        const fetchRegisteredRestaurants = async () => {
            try {
                const { data } = await api.get('/restaurants');
                if (Array.isArray(data)) {
                    setRegisteredRestaurants(data);
                }
            } catch (err) {
                console.error('Failed to load registered restaurants for menu page', err);
                setRegisteredRestaurants([]);
            }
        };

        const fetchLiveMenu = async () => {
            try {
                const { data } = await api.get('/menu');
                if (Array.isArray(data)) {
                    setLiveMenuItems(data);
                }
            } catch (err) {
                console.error('Failed to load live menu in dashboard', err);
                setLiveMenuItems([]);
            } finally {
                setLoadingMenuItems(false);
            }
        };

        fetchRegisteredRestaurants();
        fetchLiveMenu();
    }, []);

    // Safe short ID helper
    const getShortId = (id) => {
        if (!id || typeof id !== 'string') return '';
        return id.substring(id.length - 6).toUpperCase();
    };

    // Fetch user orders on mount
    const fetchOrders = async () => {
        const capTimer = setTimeout(() => setLoadingOrders(false), 1500);
        try {
            const { data } = await api.get('/orders/myorders');
            if (Array.isArray(data)) {
                setOrders(data);
                try { sessionStorage.setItem('restosys_cust_orders_cache', JSON.stringify(data.slice(0, 30))); } catch {}
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Failed to fetch customer orders", error);
        } finally {
            clearTimeout(capTimer);
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

    // Real-time WebSocket connection to receive instant order updates
    useEffect(() => {
        let isUnmounted = false;
        let reconnectTimer;
        let ws;
        const connectWS = () => {
            if (isUnmounted) return;
            try {
                let baseURL = getApiUrl();
                let wsURL = baseURL.replace(/^http/, 'ws').replace(/\/api$/, '');
                ws = new WebSocket(wsURL);

                ws.onopen = () => {
                    const token = sessionStorage.getItem('customer_token') || localStorage.getItem('customer_token') || sessionStorage.getItem('token') || localStorage.getItem('token');
                    ws.send(JSON.stringify({
                        type: 'register',
                        role: 'customer',
                        token
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (['new_order', 'order_updated', 'ready_to_serve', 'order_status_updated', 'delivery_updated'].includes(msg.type)) {
                            fetchOrders();
                        }
                    } catch (e) {}
                };

                ws.onclose = () => {
                    if (!isUnmounted) {
                        reconnectTimer = setTimeout(connectWS, 5000);
                    }
                };
            } catch (e) {}
        };

        connectWS();

        return () => {
            isUnmounted = true;
            clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
    }, []);

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

    // Fetch Customer's Own Reviews for Landing Page
    const fetchMyReviews = async () => {
        if (!api) return;
        setLoadingMyReviews(true);
        try {
            const { data } = await api.get('/customer-reviews/mine');
            if (data?.data && Array.isArray(data.data)) {
                setMyReviews(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch customer reviews", err);
        } finally {
            setLoadingMyReviews(false);
        }
    };

    useEffect(() => {
        fetchMyReviews();
    }, [api]);

    // Submit Real Customer Review for Landing Page
    const handleSubmitCustomerReview = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) {
            toast.error("Please enter your review text");
            return;
        }
        setSubmittingReview(true);
        try {
            const res = await api.post('/customer-reviews', {
                rating: reviewRating,
                reviewText: reviewText.trim()
            });
            toast.success(res.data?.message || "Review submitted! It is now live on our landing page.");
            setReviewText('');
            setReviewRating(5);
            fetchMyReviews();
        } catch (err) {
            console.error("Failed to submit customer review", err);
            toast.error(err.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    // Delete review
    const handleDeleteCustomerReview = async (id) => {
        if (!window.confirm("Are you sure you want to remove this review?")) return;
        try {
            await api.delete(`/customer-reviews/${id}`);
            toast.success("Review removed");
            setMyReviews(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            toast.error("Failed to delete review");
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

    const [redeemedPoints, setRedeemedPoints] = useState(() => {
        try {
            return Number(localStorage.getItem('customer_redeemed_points') || 0);
        } catch {
            return 0;
        }
    });

    const deductUserPoints = (pts) => {
        setRedeemedPoints(prev => {
            const next = prev + pts;
            localStorage.setItem('customer_redeemed_points', String(next));
            return next;
        });
    };

    const safeOrders = Array.isArray(orders) ? orders : [];
    const earnedPoints = user?.loyaltyPoints || (safeOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length * 50) || 0;
    const userPoints = Math.max(0, earnedPoints - redeemedPoints);
    const tierName = userPoints >= 1000 ? 'GOLD MEMBER' : userPoints >= 500 ? 'SILVER MEMBER' : 'BRONZE MEMBER';

    const activeOrders = safeOrders.filter(o => 
        !['Delivered', 'Completed', 'Served', 'Cancelled'].includes(o.status) &&
        o.deliveryStatus !== 'Delivered'
    );

    // Sidebar navigation tabs definitions
    const tabsList = [
        { id: 'overview', name: 'Overview', icon: <LayoutGrid size={18} /> },
        { id: 'outlets', name: 'Nearby Outlets', icon: <Store size={18} /> },
        { id: 'orders', name: 'Orders & Tracking', icon: <ShoppingBag size={18} /> },
        { id: 'reservations', name: 'Reservations', icon: <Calendar size={18} /> },
        { id: 'favorites', name: 'Favorite Items', icon: <Heart size={18} /> },
        { id: 'loyalty', name: 'Loyalty & Rewards', icon: <Crown size={18} /> },
        { id: 'wallet', name: 'Wallet', icon: <Wallet size={18} /> },
        { id: 'offers', name: 'Offers & Coupons', icon: <Gift size={18} /> },
        { id: 'feedback', name: 'Feedback & Inquiries', icon: <MessageSquare size={18} /> },
        { id: 'reviews', name: 'My Reviews & Story', icon: <Star size={18} /> },
        { id: 'profile', name: 'Profile & Settings', icon: <Settings size={18} /> }
    ];

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-in fade-in duration-300 text-slate-800">
            {/* Header Welcome banner with Landing Page Warm Organic Gradient Canvas */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white via-[#FCF9F5] to-[#F8F5EE] p-4 sm:p-7 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
                {/* Soft ambient blur glow */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-100/30 via-orange-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-row items-center gap-3.5 sm:gap-5 text-left relative z-10 w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#FF5A1F] to-orange-400 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#FF5A1F]/25 shrink-0">
                        <span className="text-xl sm:text-2xl font-black font-sans uppercase">
                            {user?.name?.charAt(0) || 'C'}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-orange-200/80 text-[#FF5A1F] text-[10px] font-bold shadow-xs mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]" />
                            <span>Customer Portal</span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                            Welcome back, {user?.name || 'Foodie'}!
                        </h1>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Track your orders, view loyalty scores, and reserve tables.</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto relative z-10">
                    <button 
                        onClick={logout}
                        className="flex-1 sm:flex-initial px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <LogOut size={14} /> Log Out
                    </button>
                    <Link 
                        to="/menu"
                        className="flex-1 sm:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-bold shadow-sm shadow-[#FF5A1F]/30 hover:shadow-md transition-all flex items-center justify-center gap-1 text-xs cursor-pointer"
                    >
                        <span>Order Now</span>
                        <ChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Mobile & Desktop Hamburger Drawer Control Header */}
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-200/80 shadow-xs lg:hidden">
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className="p-2 rounded-xl bg-orange-50 text-[#FF5A1F] hover:bg-orange-100 transition-all cursor-pointer flex items-center gap-2 font-bold text-xs border border-orange-200/80"
                    aria-label="Toggle Navigation Sidebar"
                >
                    <Menu size={18} />
                    <span>{tabsList.find(t => t.id === activeTab)?.name || 'Dashboard Menu'}</span>
                </button>
                <span className="text-[11px] font-bold text-slate-400">
                    {tabsList.length} Sections
                </span>
            </div>

            {/* Portal Layout Container with Toggleable Sidebar */}
            <div className={`grid grid-cols-1 ${isSidebarOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6 items-start transition-all duration-300`}>
                
                {/* Sidebar Navigation Options */}
                {isSidebarOpen ? (
                    <div className="bg-white rounded-2xl p-2.5 sm:p-4 shadow-xs border border-slate-200/80 transition-all duration-300 animate-in fade-in">
                        <div className="flex items-center justify-between px-3 py-1.5 mb-2 border-b border-slate-100 pb-2">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Account</p>
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(false)}
                                title="Collapse Sidebar Menu"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF5A1F] hover:bg-orange-50 transition-colors cursor-pointer"
                                aria-label="Collapse Sidebar"
                            >
                                <X size={17} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-1.5 w-full">
                            {tabsList.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                        }}
                                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-[15px] font-bold transition-all cursor-pointer w-full text-left ${
                                            isActive
                                            ? 'bg-orange-50 text-[#FF5A1F] border border-orange-200/80 shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                        }`}
                                    >
                                        <span className={isActive ? 'text-[#FF5A1F]' : 'text-slate-400'}>
                                            {tab.icon}
                                        </span>
                                        <span>{tab.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Collapsed Quick Hamburger Bar (Desktop) */
                    <div className="hidden lg:flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-200/80 shadow-xs">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 rounded-xl bg-orange-50 text-[#FF5A1F] hover:bg-orange-100 transition-all cursor-pointer flex items-center gap-2 font-bold text-xs shadow-xs border border-orange-200/80"
                                title="Open Sidebar Menu"
                                aria-label="Open Sidebar Menu"
                            >
                                <Menu size={18} />
                                <span>Sections</span>
                            </button>
                            <span className="text-xs font-bold text-slate-500">
                                Currently viewing: <strong className="text-slate-800">{tabsList.find(t => t.id === activeTab)?.name || 'Dashboard'}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {tabsList.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    title={tab.name}
                                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                                        activeTab === tab.id
                                            ? 'bg-orange-500 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Dynamic Viewport Panel */}
                <div className={`${isSidebarOpen ? 'lg:col-span-3' : 'w-full'}`}>
                    
                                        {/* Tab: Nearby Outlets */}
                    {activeTab === 'outlets' && (
                        <div className="space-y-6 text-left">
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                            <Store className="text-[#FF5A1F]" size={20} /> Verified Outlets &amp; Dining Locations
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            {userLocation 
                                                ? `Found ${locationFilteredRestaurants.length} kitchen outlets serving ${userLocation}`
                                                : `Found ${registeredRestaurants.length} registered outlets nationwide`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleDetectLocation}
                                            disabled={isDetectingLocation}
                                            className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] border border-orange-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Navigation size={13} />
                                            <span>GPS</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsLocationPickerOpen(true)}
                                            className="px-3.5 py-1.5 rounded-xl bg-[#FF5A1F] hover:bg-[#e04f1a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                        >
                                            <MapPin size={13} />
                                            <span>Change Location</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Outlet Search & Filter Bar */}
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative flex-1 w-full">
                                        <input
                                            type="text"
                                            placeholder="Search outlets by name, city, or address..."
                                            value={outletSearchFilter}
                                            onChange={(e) => setOutletSearchFilter(e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#FF5A1F]"
                                        />
                                    </div>
                                    {userLocation && (
                                        <button
                                            type="button"
                                            onClick={() => setShowOnlyLocalOutlets(!showOnlyLocalOutlets)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                                showOnlyLocalOutlets
                                                    ? 'bg-[#FF5A1F] text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {showOnlyLocalOutlets ? `In ${userLocation.split(',')[0]} Only` : 'All Cities'}
                                        </button>
                                    )}
                                </div>

                                {/* Outlets Grid */}
                                {(() => {
                                    let list = showOnlyLocalOutlets && userLocation && locationFilteredRestaurants.length > 0
                                        ? locationFilteredRestaurants
                                        : registeredRestaurants;

                                    if (outletSearchFilter.trim()) {
                                        const q = outletSearchFilter.toLowerCase();
                                        list = list.filter(r => 
                                            (r.name || '').toLowerCase().includes(q) ||
                                            (r.city || '').toLowerCase().includes(q) ||
                                            (r.address || '').toLowerCase().includes(q) ||
                                            (r.cuisines || '').toLowerCase().includes(q)
                                        );
                                    }

                                    if (list.length === 0) {
                                        return (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                                                <Store size={32} className="mx-auto text-slate-400" />
                                                <h4 className="text-sm font-bold text-slate-700">No outlets found</h4>
                                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                                    No registered outlets matched your current filter. You can explore all outlets or pick a different city.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowOnlyLocalOutlets(false);
                                                        setOutletSearchFilter('');
                                                    }}
                                                    className="px-4 py-2 bg-[#FF5A1F] text-white text-xs font-bold rounded-xl shadow-xs"
                                                >
                                                    View All Registered Outlets
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            {list.map((outlet) => {
                                                const branchList = Array.isArray(outlet.branches) ? outlet.branches : [];
                                                const primaryBranch = branchList[0];
                                                const branchCity = primaryBranch?.location?.city || outlet.city || '';
                                                const branchAddr = primaryBranch?.location?.address || outlet.address || 'Central Kitchen';

                                                return (
                                                    <div 
                                                        key={outlet._id}
                                                        className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                                                    >
                                                        <div className="space-y-2.5">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shrink-0">
                                                                        <Store size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#FF5A1F] transition-colors">
                                                                            {outlet.name}
                                                                        </h4>
                                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                            Verified Kitchen
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {branchCity && (
                                                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                                                                        {branchCity}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="space-y-1 text-xs text-slate-600 pl-0.5">
                                                                <p className="flex items-center gap-1.5 text-[11px]">
                                                                    <MapPin size={13} className="text-[#FF5A1F] shrink-0" />
                                                                    <span className="line-clamp-1">{branchAddr}</span>
                                                                </p>
                                                                {outlet.phone && (
                                                                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                                                        <Phone size={13} className="text-slate-400 shrink-0" />
                                                                        <span>{outlet.phone}</span>
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {branchList.length > 1 && (
                                                                <div className="pt-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                                        Available Branches ({branchList.length}):
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {branchList.map(b => (
                                                                            <span key={b._id} className="text-[10px] font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                                                                                {b.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                                                            <Link
                                                                to={`/restaurant/${outlet._id}`}
                                                                className="flex-1 py-2 px-3 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white text-xs font-bold rounded-xl text-center shadow-xs transition-colors"
                                                            >
                                                                Browse Outlet Menu
                                                            </Link>
                                                            <Link
                                                                to="/reservations"
                                                                className="py-2 px-3 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#FF5A1F] border border-slate-200 text-xs font-bold rounded-xl transition-colors"
                                                            >
                                                                Book Table
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Tab: Overview */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 min-w-0 pr-1.5 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                                {/* Loyalty Points Balance */}
                                <div className="bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-xl relative overflow-hidden border border-[#d4af37]/30 group transition-all duration-300 hover:shadow-2xl hover:shadow-[#d4af37]/5 hover:border-[#d4af37]/50">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#d4af37]/15"></div>
                                    
                                    <div className="relative z-10 space-y-3.5 sm:space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#ffe07d] to-[#f3c056] text-black flex items-center justify-center shadow-lg shrink-0">
                                                    <Crown size={14} className="fill-black" />
                                                </div>
                                                <div>
                                                    <span className="block font-black tracking-[0.2em] sm:tracking-[0.25em] text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-[#ffe07d] via-[#f5c661] to-[#ffe07d]">
                                                        {tierName}
                                                    </span>
                                                    <span className="block text-[8px] text-gray-500 font-extrabold uppercase tracking-widest leading-none mt-0.5">
                                                        Resto Loyalty Points
                                                    </span>
                                                </div>
                                            </div>
                                            <Sparkles size={14} className="text-[#ffe07d] animate-pulse" />
                                        </div>
                                        
                                        <div className="space-y-0.5 sm:space-y-1 min-w-0 pr-1.5 flex-1">
                                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-black tracking-widest uppercase block">Points Balance</span>
                                            <h2 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fff2d1] to-[#f3c056]">
                                                {userPoints.toLocaleString()}
                                            </h2>
                                            <p className="text-gray-400 text-[11px] sm:text-xs font-medium">Convert points to cash discount at checkout</p>
                                        </div>
                                        
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-[#ffe07d]/10">
                                            <div className="h-full bg-gradient-to-r from-[#f3c056] via-[#ffe07d] to-[#f3c056] w-[80%] rounded-full shadow-[0_0_8px_rgba(243,192,86,0.3)]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet Component */}
                                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    <div className="relative z-10 space-y-3.5 sm:space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF5A1F] flex items-center justify-center shadow-xs">
                                                    <Wallet size={16} className="sm:hidden" />
                                                    <Wallet size={19} className="hidden sm:block" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Customer Wallet</h3>
                                                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">Fast &amp; Secure Payments</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                                        </div>

                                        <div className="space-y-0.5 min-w-0 pr-1.5 flex-1">
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wallet Balance</span>
                                            <h2 className="text-2xl sm:text-4xl font-black font-sans text-slate-900">
                                                ₹{walletBalance.toFixed(2)}
                                            </h2>
                                            <p className="text-slate-500 text-[11px] sm:text-xs font-medium">Skip cards &amp; settle food orders in 1-click</p>
                                        </div>

                                        <button 
                                            onClick={handleAddFunds}
                                            className="w-full py-2 sm:py-2.5 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Plus size={14} /> Add Funds
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Registered Restaurants & Cafes Filter Section */}
                            {registeredRestaurants.length > 0 && (
                                <div className="bg-[#FCF9F5] border border-orange-200/70 p-4 rounded-2xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                                            <Store size={14} className="text-[#FF5A1F]" /> Registered Restaurants &amp; Cafes
                                        </h4>
                                        <span className="text-[10px] font-bold text-[#FF5A1F] bg-white px-2.5 py-0.5 rounded-full border border-orange-200 shadow-xs">
                                            {registeredRestaurants.length} Verified Outlets
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedRestaurantFilter('All')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                selectedRestaurantFilter === 'All'
                                                    ? 'bg-[#FF5A1F] text-white shadow-xs'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-orange-50/60'
                                            }`}
                                        >
                                            All Registered Places
                                        </button>
                                        {registeredRestaurants.map((rest) => (
                                            <button
                                                key={rest._id}
                                                onClick={() => setSelectedRestaurantFilter(rest.name)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                    selectedRestaurantFilter === rest.name
                                                        ? 'bg-[#FF5A1F] text-white shadow-xs'
                                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-orange-50/60'
                                                }`}
                                            >
                                                <Store size={12} className="text-[#FF5A1F]" /> {rest.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Order Section (Browse Menu & Place Order) */}
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Quick Order Menu Items</h3>
                                        <p className="text-slate-500 text-xs mt-0.5">Order directly from verified registered restaurants &amp; cafes</p>
                                    </div>
                                    
                                    {/* Categories Row */}
                                    <div className="flex flex-wrap gap-1.5 select-none">
                                        {['All', 'Starters', 'Salads', 'Mains', 'Desserts'].map(cat => {
                                            const isActive = selectedCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-[#FF5A1F] text-white shadow-xs'
                                                            : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF5A1F]'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Foods Grid Matching Landing Page Design */}
                                 {loadingMenuItems ? (
                                     <div className="flex justify-center items-center py-12">
                                         <div className="w-6 h-6 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
                                     </div>
                                 ) : liveMenuItems.length === 0 ? (
                                     <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                                         <p className="text-xs font-semibold text-slate-500">No menu items found.</p>
                                     </div>
                                 ) : (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
                                         {liveMenuItems
                                             .filter(food => {
                                                 const foodCat = (food.category || '').toLowerCase();
                                                 const matchesCat = selectedCategory === 'All' || 
                                                     (selectedCategory === 'Starters' && ['starters', 'starter', 'sides', 'bbq'].includes(foodCat)) ||
                                                     (selectedCategory === 'Salads' && ['salads', 'salad'].includes(foodCat)) ||
                                                     (selectedCategory === 'Mains' && ['mains', 'main', 'pizzas', 'pizza', 'burgers', 'burger'].includes(foodCat)) ||
                                                     (selectedCategory === 'Desserts' && ['desserts', 'dessert', 'sweets'].includes(foodCat)) ||
                                                     foodCat === selectedCategory.toLowerCase();

                                                 const restName = food.restaurantId?.name || food.restaurantName || '';
                                                 const matchesRest = selectedRestaurantFilter === 'All' || restName === selectedRestaurantFilter;

                                                 return matchesCat && matchesRest;
                                             })
                                             .map(food => {
                                                 const foodImg = getItemImage(food);
                                                 const restName = food.restaurantId?.name || food.restaurantName || registeredRestaurants[0]?.name || 'Partner Outlet';

                                                 return (
                                                     <div 
                                                         key={food._id || food.id}
                                                         className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between text-left group"
                                                     >
                                                         <div>
                                                             <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-slate-50 mb-2.5 flex items-center justify-center">
                                                                 {foodImg ? (
                                                                     <img 
                                                                         src={foodImg} 
                                                                         onError={(e) => { e.target.style.display = 'none'; }}
                                                                         alt={food.name} 
                                                                         className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                                                     />
                                                                 ) : (
                                                                     <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/50 text-[#FF5A1F]">
                                                                         <ShoppingBag size={28} className="opacity-40" />
                                                                         <span className="text-[10px] font-bold text-slate-400 mt-1">{food.category || 'Dish'}</span>
                                                                     </div>
                                                                 )}
                                                                 {food.category && (
                                                                     <span className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                                                                         {food.category}
                                                                     </span>
                                                                 )}
                                                                 <button
                                                                     type="button"
                                                                     onClick={(e) => {
                                                                         e.stopPropagation();
                                                                         const isFavNow = wishlist?.some(w => (w._id || w.id) === (food._id || food.id));
                                                                         toggleWishlist(food);
                                                                         toast.success(isFavNow ? 'Removed from wishlist' : 'Added to wishlist!');
                                                                     }}
                                                                     className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                                                                         wishlist?.some(w => (w._id || w.id) === (food._id || food.id))
                                                                             ? 'bg-rose-500 text-white shadow-xs'
                                                                             : 'bg-white/90 text-slate-600 hover:text-rose-500 shadow-xs'
                                                                     }`}
                                                                     aria-label="Wishlist"
                                                                     title="Save to Wishlist"
                                                                 >
                                                                     <Heart size={13} className={wishlist?.some(w => (w._id || w.id) === (food._id || food.id)) ? 'fill-white' : ''} />
                                                                 </button>
                                                             </div>

                                                             <div className="space-y-1">
                                                                 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF5A1F] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                                                     <Store size={11} /> {restName}
                                                                 </span>
                                                                 <h4 className="font-bold text-slate-900 text-[13px] sm:text-sm line-clamp-1 group-hover:text-[#FF5A1F] transition-colors">
                                                                     {food.name}
                                                                 </h4>
                                                                 {food.description && (
                                                                     <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                                                         {food.description}
                                                                     </p>
                                                                 )}
                                                             </div>
                                                         </div>

                                                         <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-slate-100">
                                                             <span className="font-black text-slate-900 text-sm sm:text-base">₹{food.price}</span>
                                                             <button 
                                                                 onClick={() => { addToCart(food); toast.success(`${food.name} added to cart!`); }}
                                                                 className="px-3.5 py-1.5 bg-[#FF5A1F] hover:bg-[#e04f1a] active:scale-98 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                                             >
                                                                 <ShoppingBag size={12} />
                                                                 <span>Add</span>
                                                             </button>
                                                         </div>
                                                     </div>
                                                 );
                                             })}
                                     </div>
                                 )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Orders & Tracking */}
                    {activeTab === 'orders' && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3 sm:pb-4 gap-2">
                                <h3 className="text-sm sm:text-lg font-bold text-gray-900 truncate">Your Order History &amp; Tracking</h3>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">Delivery</span>
                                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">Pickup</span>
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4 min-w-0 pr-0.5 sm:pr-1.5 flex-1">
                                {loadingOrders ? (
                                    <p className="text-center text-gray-400 py-6 text-xs">Loading orders...</p>
                                ) : safeOrders.length === 0 ? (
                                    <p className="text-center text-gray-400 py-10 text-xs">No orders found. Settle a new order from the Menu!</p>
                                ) : (
                                    safeOrders.map(order => (
                                        <div key={order._id} className="border border-gray-100 hover:border-orange-100 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl transition-all space-y-3 sm:space-y-4 bg-white shadow-xs">
                                            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-gray-50 pb-2.5 sm:pb-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 font-mono">#{getShortId(order._id)}</span>
                                                    {order.createdAt && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                                                            <Calendar size={11} className="text-slate-500" />
                                                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const isSelfPickupOrder = order.orderType === 'Self-Pickup' || order.orderType === 'Takeaway' || order.source === 'Self-Pickup' || String(order.orderType || '').toLowerCase().includes('pickup');
                                                        const isSelfDineInOrder = !isSelfPickupOrder && (order.serviceType === 'Self Dine-In (KFC Style)' || String(order.serviceType || '').toLowerCase().includes('self dine-in'));
                                                        const isDeliveryOrder = order.orderType === 'Delivery';

                                                        const badgeText = isDeliveryOrder
                                                            ? 'Home Delivery'
                                                            : isSelfPickupOrder
                                                            ? 'Self-Pickup'
                                                            : isSelfDineInOrder
                                                            ? 'Self Dine-In'
                                                            : 'Waiter Service';

                                                        const badgeStyle = isDeliveryOrder
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : isSelfPickupOrder
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                            : isSelfDineInOrder
                                                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                                                        return (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                                                {badgeText} {order.tableNumber && !isSelfPickupOrder && !isDeliveryOrder && order.tableNumber !== 'Any' ? `(T-${order.tableNumber})` : ''}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                     (order.status === 'Delivered' || order.status === 'Completed' || order.deliveryStatus === 'Delivered')
                                                     ? 'bg-green-50 text-green-700 border border-green-200'
                                                     : (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up')
                                                     ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                     : (order.status === 'Preparing' || order.status === 'Ready' || order.status === 'Accepted')
                                                     ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                                     : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                 }`}>
                                                     {order.orderType === 'Delivery' ? (
                                                         (order.status === 'Delivered' || order.status === 'Completed' || order.deliveryStatus === 'Delivered') ? 'Delivered' :
                                                         (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up') ? 'Out for Delivery' :
                                                         (order.status === 'Preparing' || order.status === 'Ready') ? 'Kitchen Preparing' :
                                                         (order.status === 'Accepted') ? 'Order Accepted' : 'Order Placed (Pending)'
                                                     ) : order.status}
                                                 </span>
                                            </div>

                                            {/* Order Ready Time & ETA Display */}
                                            {(() => {
                                                const readyInfo = getOrderReadyTimeInfo(order);
                                                if (!readyInfo) return null;
                                                return (
                                                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                                                        readyInfo.isReady
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                                            : readyInfo.isPreparing
                                                            ? 'bg-amber-50/90 border-amber-300/90 text-amber-950 font-medium'
                                                            : readyInfo.isCompleted
                                                            ? 'bg-gray-50 border-gray-200 text-gray-600'
                                                            : 'bg-red-50 border-red-200 text-red-700'
                                                    }`}>
                                                        <div className="flex items-center gap-2.5">
                                                            <Clock size={16} className={readyInfo.isPreparing ? 'text-amber-600 animate-spin shrink-0' : readyInfo.isReady ? 'text-emerald-600 shrink-0' : 'text-gray-400 shrink-0'} />
                                                            <div>
                                                                <span className="text-[10px] uppercase font-black tracking-wider block opacity-70">
                                                                    {readyInfo.isReady ? 'Order Ready for Pickup' : readyInfo.isPreparing ? 'Estimated Order Ready Time' : 'Order Status'}
                                                                </span>
                                                                <span className="font-extrabold text-xs">
                                                                    {readyInfo.isReady ? (
                                                                        <span className="text-emerald-700 font-black">Food is Ready Now! Please collect / receive tray.</span>
                                                                    ) : readyInfo.isPreparing ? (
                                                                        <span>{readyInfo.label} <span className="opacity-75 font-normal">(Ready by {readyInfo.exactReadyTime})</span></span>
                                                                    ) : (
                                                                        readyInfo.label
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {readyInfo.isPreparing && (
                                                            <span className="font-mono font-black text-xs bg-white text-amber-950 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 shadow-xs">
                                                                Ready by {readyInfo.exactReadyTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <div className="flex justify-between items-center flex-wrap gap-4 text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-900">{order.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ') || ''}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                                                </div>
                                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                                    <span className="font-extrabold text-gray-950 text-sm">₹{order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</span>
                                                    
                                                    {/* Tracking button */}
                                                    {(order.status !== 'Delivered' && order.deliveryStatus !== 'Delivered' && order.status !== 'Completed' && order.status !== 'Cancelled') && (
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
                                                    {order.deliveryOtp && (
                                                        <span className="font-mono font-black text-base text-amber-950 bg-white px-3.5 py-1 rounded-lg border border-amber-300 shadow-sm tracking-[0.25em]">
                                                            {order.deliveryOtp}
                                                        </span>
                                                    )}
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
                                                                    {order.restaurantId?.name || 'Restaurant'}
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
                                                                    {(order.deliveryPartner && typeof order.deliveryPartner === 'object') ? (order.deliveryPartner.name || 'Assigned Executive') : (order.deliveryPartner ? 'Assigned Executive' : 'Assigning nearest rider...')}
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

                                                    {/* Live Rider Support Updates Banner */}
                                                    {Array.isArray(order.supportMessages) && order.supportMessages.length > 0 && (
                                                        <div className="bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-xl space-y-2 animate-in fade-in">
                                                            <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-wider">
                                                                <MessageSquare size={14} className="text-purple-400 animate-pulse" />
                                                                <span>Rider Live Updates</span>
                                                            </div>
                                                            <div className="space-y-1.5 pl-5 border-l-2 border-purple-500/40">
                                                                {order.supportMessages.map((msg, mIdx) => (
                                                                    <div key={mIdx} className="text-xs">
                                                                        <p className="font-bold text-white">{msg.message}</p>
                                                                        <span className="text-[9px] text-purple-300 font-mono">
                                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mini Zomato-Style Live Route Tracking Progress */}
                                                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                                                        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                                                            <span className="flex items-center gap-1 text-emerald-400">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Route Progress (Zomato Style)
                                                            </span>
                                                            <span className="text-white font-mono uppercase">
                                                                {(order.status === 'Delivered' || order.status === 'Completed' || order.deliveryStatus === 'Delivered') ? 'Delivered' :
                                                                (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up') ? 'Out for Delivery' :
                                                                (order.status === 'Preparing' || order.status === 'Ready') ? 'Kitchen Preparing' :
                                                                (order.status === 'Accepted') ? 'Order Accepted' : 'Order Placed (Pending)'}
                                                            </span>
                                                        </div>

                                                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="absolute h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-1000"
                                                                style={{
                                                                    width: (order.status === 'Delivered' || order.status === 'Completed' || order.deliveryStatus === 'Delivered') ? '100%' :
                                                                           (order.status === 'Out for Delivery' || order.deliveryStatus === 'On the Way' || order.deliveryStatus === 'Picked Up') ? '66%' :
                                                                           (order.status === 'Preparing' || order.status === 'Ready' || order.status === 'Accepted') ? '35%' : '0%'
                                                                }}
                                                            ></div>
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
                        <div className="space-y-6 sm:space-y-8 min-w-0 pr-0.5 sm:pr-1.5 flex-1">
                            {/* Book Table Form */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Book A Table Reservation</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Pick table, schedule date, and book instant tables</p>
                                </div>

                                <form onSubmit={handleBookReservation} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-w-xl">
                                    <div className="space-y-0.5 min-w-0">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Reservation Date</label>
                                        <input 
                                            type="date"
                                            value={resDate}
                                            onChange={(e) => setResDate(e.target.value)}
                                            className="w-full bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Time Slot</label>
                                        <input 
                                            type="time"
                                            value={resTime}
                                            onChange={(e) => setResTime(e.target.value)}
                                            className="w-full bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Guests Count</label>
                                        <select 
                                            value={resGuests}
                                            onChange={(e) => setResGuests(e.target.value)}
                                            className="w-full bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                                                <option key={n} value={n}>{n} Guests</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Seating Preference</label>
                                        <select 
                                            value={resType}
                                            onChange={(e) => setResType(e.target.value)}
                                            className="w-full bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                                        >
                                            <option value="Dine In">Dine-In Dining Hall</option>
                                            <option value="Rooftop">Rooftop Sky Lounge</option>
                                            <option value="Window Seat">Window view booth</option>
                                            <option value="Private Cabin">Private family cabin</option>
                                        </select>
                                    </div>
                                    <button 
                                        type="submit"
                                        className="col-span-full py-2 sm:py-2.5 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-extrabold text-xs sm:text-sm rounded-lg shadow-sm shadow-[#FF5A1F]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-0.5"
                                    >
                                        <Calendar size={14} /> Confirm Reservation Table
                                    </button>
                                </form>
                            </div>

                            {/* Reservation History List */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-base sm:text-lg text-gray-900">Your Booking History</h3>
                                <div className="space-y-3 min-w-0">
                                    {reservations.length === 0 ? (
                                        <p className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">No table bookings scheduled.</p>
                                    ) : (
                                        reservations.map((res, i) => (
                                            <div key={i} className="border border-gray-100 p-3.5 sm:p-4 rounded-xl flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 bg-gray-50/50 text-xs sm:text-sm">
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{res.date} • {res.time}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Table for {res.guests} ({res.type})</p>
                                                </div>
                                                <span className={`self-start xs:self-auto px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border shrink-0 ${res.statusColor}`}>{res.status}</span>
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
                                                 <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                                                     {getItemImage(item) ? (
                                                         <img 
                                                             src={getItemImage(item)} 
                                                             alt={item.name} 
                                                             onError={(e) => { e.target.style.display = 'none'; }}
                                                             className="w-full h-full object-cover" 
                                                         />
                                                     ) : (
                                                         <div className="w-full h-full flex items-center justify-center bg-orange-50/60 text-[#FF5A1F]">
                                                             <ShoppingBag size={20} className="opacity-50" />
                                                         </div>
                                                     )}
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
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-sans">Loyalty & Rewards Program</h3>
                                <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">Track your points, redeem rewards, and view membership tiers</p>
                            </div>

                            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                                {/* Loyalty Tier Card */}
                                <div className="bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#0a0a0a] rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-xl relative overflow-hidden border border-[#d4af37]/30">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#ffe07d] to-[#f3c056] text-black flex items-center justify-center shadow-lg shadow-yellow-500/10 shrink-0">
                                                <Crown size={15} className="fill-black" />
                                            </div>
                                            <div>
                                                <span className="block font-black tracking-widest text-[10px] sm:text-[11px] text-[#ffe07d]">{tierName}</span>
                                                <span className="block text-[8px] sm:text-[9px] text-gray-400">FoodNest Rewards</span>
                                            </div>
                                        </div>
                                        <Sparkles size={15} className="text-[#ffe07d] animate-pulse" />
                                    </div>

                                    <div className="mt-4 sm:mt-6 space-y-0.5 sm:space-y-1 relative z-10">
                                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Available Balance</span>
                                        <h2 className="text-3xl sm:text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fff2d1] to-[#f3c056]">
                                            {userPoints.toLocaleString()} <span className="text-lg sm:text-2xl font-bold">Pts</span>
                                        </h2>
                                        <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Value: ₹{(userPoints * 0.1).toFixed(2)} (Redeemable at checkout)</p>
                                    </div>

                                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-white/10 space-y-2 relative z-10">
                                        <div className="flex justify-between text-[11px] sm:text-xs font-bold">
                                            <span className="text-gray-300">Resto Platinum Tier Progress</span>
                                            <span className="text-[#ffe07d]">80% Complete</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-[#ffe07d]/20">
                                            <div className="h-full bg-gradient-to-r from-[#f3c056] via-[#ffe07d] to-[#f3c056] w-[80%] rounded-full shadow-[0_0_8px_rgba(243,192,86,0.3)]"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rewards redemption catalog */}
                                <div className="space-y-3 min-w-0 pr-0.5 flex-1">
                                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">Available Redemptions</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                                        <div className="border border-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 bg-gray-50/60 hover:bg-white transition-all shadow-2xs">
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">₹100 Store Credit</p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Requires 1000 pts</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (userPoints >= 1000) {
                                                        deductUserPoints(1000);
                                                        setWalletBalance(prev => {
                                                            const next = prev + 100;
                                                            localStorage.setItem('customerWalletBalance', String(next));
                                                            return next;
                                                        });
                                                        toast.success('Successfully redeemed 1000 points for ₹100 Store Credit!');
                                                    } else {
                                                        toast.error('Insufficient points! You need 1000 points.');
                                                    }
                                                }}
                                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl shadow-xs shrink-0 cursor-pointer"
                                            >
                                                Redeem
                                            </button>
                                        </div>

                                        <div className="border border-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 bg-gray-50/60 hover:bg-white transition-all shadow-2xs">
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">Free Cheese Pizza</p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Requires 2000 pts</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (userPoints >= 2000) {
                                                        deductUserPoints(2000);
                                                        toast.success('🎉 Voucher for Free Double Cheese Pizza redeemed!');
                                                    } else {
                                                        toast.error('Insufficient points! You need 2000 points.');
                                                    }
                                                }}
                                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl shadow-xs shrink-0 cursor-pointer"
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
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-sans">Customer Wallet</h3>
                                <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">Add credits, check transactions, and manage 1-click checkout options</p>
                            </div>

                            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                                {/* Wallet Card */}
                                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-28 h-28 bg-orange-50 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                <Wallet size={16} />
                                            </div>
                                            <span className="font-extrabold text-xs sm:text-sm text-gray-900">FoodNest Secure Wallet</span>
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-black text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">ACTIVE</span>
                                    </div>

                                    <div className="relative z-10 space-y-0.5 sm:space-y-1 my-4 sm:my-5">
                                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
                                        <h2 className="text-3xl sm:text-5xl font-black font-sans text-gray-950">₹{walletBalance.toFixed(2)}</h2>
                                    </div>

                                    <div className="flex gap-2 sm:gap-3 relative z-10">
                                        <button 
                                            onClick={handleAddFunds}
                                            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Plus size={15} /> Add Funds
                                        </button>
                                    </div>
                                </div>

                                {/* Ledger records */}
                                <div className="space-y-2.5 min-w-0 pr-0.5 flex-1">
                                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">Recent Transactions</h4>
                                    {walletTransactions.length === 0 ? (
                                        <div className="border border-dashed border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gray-50/50 text-center">
                                            <p className="text-xs font-semibold text-gray-500">No wallet transactions recorded yet.</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Deposits and refunds will appear here in real-time.</p>
                                        </div>
                                    ) : (
                                        walletTransactions.map(tx => (
                                            <div key={tx.id} className="border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gray-50/60 flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{tx.description}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{tx.date} • Ref #{tx.ref}</p>
                                                </div>
                                                <span className={`font-black text-xs sm:text-sm ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'credit' ? `+₹${tx.amount.toFixed(2)}` : `-₹${tx.amount.toFixed(2)}`}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Offers & Coupons */}
                    {activeTab === 'offers' && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-sans">Offers & Coupons</h3>
                                <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">Apply coupons at checkout for discounts and complimentary delivery</p>
                            </div>

                            {loadingOffers ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-600 mx-auto"></div>
                                </div>
                            ) : liveOffers.length === 0 ? (
                                <div className="text-center py-8 sm:py-12 text-gray-400 bg-gray-50 rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 p-4">
                                    <p className="text-xs sm:text-sm font-bold text-gray-700">No active coupons available right now.</p>
                                    <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Check back soon when new restaurant offers are released!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 animate-in fade-in duration-300">
                                    {liveOffers.map((offer) => (
                                        <div key={offer._id || offer.code} className="border border-orange-200/80 bg-orange-50/40 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl space-y-3 border-dashed relative overflow-hidden flex flex-col justify-between shadow-2xs">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-xl pointer-events-none"></div>
                                            <div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="bg-orange-600 text-white font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">Active Promo</span>
                                                    {offer.expiresAt && (
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">
                                                            Exp: {new Date(offer.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-black text-gray-900 text-base sm:text-xl mt-2 tracking-tight">{offer.code}</h4>
                                                <p className="text-xs sm:text-sm font-bold text-orange-600 mt-0.5">
                                                    {offer.type === 'Percentage' ? `${offer.discountValue}% OFF Total Bill` : 
                                                     offer.type === 'Fixed Amount' ? `₹${offer.discountValue.toFixed(2)} Flat Discount` : 
                                                     'FREE SHIPPING ON ORDER'}
                                                </p>
                                                {offer.minSpend > 0 && (
                                                    <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 font-medium">Valid on orders above ₹{offer.minSpend}.</p>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center pt-2.5 border-t border-orange-100 text-xs gap-2">
                                                <span className="font-extrabold text-orange-950 font-mono tracking-wider bg-orange-100/80 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm border border-orange-200">
                                                    {offer.code}
                                                </span>
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(offer.code); toast.success(`Coupon code ${offer.code} copied!`); }}
                                                    className="text-[11px] sm:text-xs font-bold bg-white hover:bg-orange-50 text-orange-600 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-orange-200 transition-colors shadow-2xs cursor-pointer shrink-0"
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
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-sans">Feedback & Inquiries</h3>
                                <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">Submit inquiries, complaints, or restaurant feedback directly to administration</p>
                            </div>

                            <form onSubmit={handleSubmitFeedback} className="space-y-3 sm:space-y-4 min-w-0 pr-0.5 flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Submission Type</label>
                                        <select 
                                            value={feedbackType}
                                            onChange={(e) => setFeedbackType(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="Feedback">General Feedback & Reviews</option>
                                            <option value="Complaint">Complaint / Bug Report</option>
                                            <option value="Support">Support Ticket inquiry</option>
                                            <option value="Franchise">Franchise request</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Subject Summary</label>
                                        <input 
                                            type="text"
                                            placeholder="E.g. Food quality, delivery delay..."
                                            value={feedbackSubject}
                                            onChange={(e) => setFeedbackSubject(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Message Details</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Write your review, support question, or complaint detail here..."
                                        value={feedbackMessage}
                                        onChange={(e) => setFeedbackMessage(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500 resize-none"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                    Submit Ticket
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Tab: My Reviews & Landing Page Testimonials */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Review Submission Card */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5A1F] text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-1">
                                            <Sparkles size={11} />
                                            <span>Featured On Landing Page</span>
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight font-sans">Share Your FoodNest Story</h3>
                                        <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">
                                            Your reviews are featured live under <strong>"What Our Customers Say"</strong> on our main customer landing page!
                                        </p>
                                    </div>
                                    <Link 
                                        to="/"
                                        target="_blank"
                                        className="text-xs font-bold text-[#FF5A1F] hover:underline flex items-center gap-1 self-start sm:self-auto"
                                    >
                                        <span>Preview Landing Page</span>
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>

                                <form onSubmit={handleSubmitCustomerReview} className="space-y-3.5 sm:space-y-4">
                                    {/* Star Rating Picker */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                                                Your Overall Rating
                                            </label>
                                            <span className="text-[11px] sm:text-xs font-black text-amber-950 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                                                {reviewRating === 5 ? '5.0 ★ Exceptional!' : reviewRating === 4 ? '4.0 ★ Great!' : reviewRating === 3 ? '3.0 ★ Good' : reviewRating === 2 ? '2.0 ★ Fair' : '1.0 ★ Poor'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className="p-1 -ml-1 first:ml-0 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                                    aria-label={`Rate ${star} star`}
                                                >
                                                    <Star
                                                        size={24}
                                                        className={reviewRating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Review Text Area */}
                                    <div>
                                        <label className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                            Your Review / Feedback
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Write your experience... What dishes did you love? How was the service?"
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF5A1F] focus:bg-white rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
                                        <p className="text-[10px] sm:text-[11px] text-slate-400">
                                            Posting as <strong>{user?.name || 'Customer'}</strong>
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-2.5 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {submittingReview ? (
                                                <span>Submitting...</span>
                                            ) : (
                                                <>
                                                    <Sparkles size={14} />
                                                    <span>Publish Review</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* My Previously Submitted Reviews */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 space-y-3 sm:space-y-4">
                                <h4 className="text-sm sm:text-base font-bold text-gray-900">Your Submitted Reviews ({myReviews.length})</h4>
                                {loadingMyReviews ? (
                                    <div className="py-6 text-center text-xs text-slate-400">Loading your reviews...</div>
                                ) : myReviews.length === 0 ? (
                                    <div className="py-6 text-center bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 p-4">
                                        <p className="text-xs text-slate-500 font-medium">You haven't posted any reviews yet.</p>
                                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Submit your first review above and see it featured live on the front page!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {myReviews.map((rev) => (
                                            <div key={rev._id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start sm:items-center justify-between gap-3">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <div className="flex items-center gap-0.5 text-amber-400">
                                                            {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                                                                <Star key={i} size={11} className="fill-amber-400" />
                                                            ))}
                                                        </div>
                                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                                                            Live
                                                        </span>
                                                        <span className="text-[9px] text-slate-400">
                                                            {new Date(rev.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-slate-700 font-medium italic break-words">
                                                        "{rev.reviewText}"
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCustomerReview(rev._id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                                    title="Delete Review"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Profile & Settings */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 min-w-0 pr-1.5 flex-1">
                            <ThemeSettingCard />
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Profile & Settings</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Manage your contact name, phone, address, and password settings</p>
                                </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4 min-w-0 pr-1.5 flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-3 text-gray-400"><User size={14} /></span>
                                            <input 
                                                type="text"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-3 text-gray-400"><Phone size={14} /></span>
                                            <input 
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                pattern="[6-9][0-9]{9}"
                                                value={profilePhone}
                                                onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                placeholder="10-digit mobile number"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
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
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5 space-y-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Update (Optional)</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Password</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-3 text-gray-400"><Lock size={14} /></span>
                                                <input 
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Password</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-3 text-gray-400"><Lock size={14} /></span>
                                                <input 
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Minimum 6 characters"
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-orange-500"
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

                        <div className="space-y-4 min-w-0 pr-1.5 flex-1">
                            <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deposit Amount (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-400 font-bold text-sm">₹</span>
                                    <input 
                                        type="number"
                                        value={addFundsAmount}
                                        onChange={(e) => setAddFundsAmount(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:border-orange-500"
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
                                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
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
                                        const newTx = {
                                            id: `tx-${Date.now()}`,
                                            description: 'Wallet Deposit (UPI transaction)',
                                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                                            ref: `WLT-${Math.floor(100 + Math.random() * 900)}`,
                                            amount: val,
                                            type: 'credit'
                                        };
                                        const updatedTx = [newTx, ...walletTransactions];
                                        setWalletTransactions(updatedTx);
                                        try {
                                            localStorage.setItem('customerWalletTransactions', JSON.stringify(updatedTx));
                                        } catch (e) {
                                            console.error(e);
                                        }
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

            <LocationPickerModal
                isOpen={isLocationPickerOpen}
                onClose={() => setIsLocationPickerOpen(false)}
                currentLocation={userLocation}
                onSelectLocation={(loc) => setUserLocation(loc)}
                restaurants={registeredRestaurants}
            />
        </div>
    );
};

export default CustomerDashboard;
