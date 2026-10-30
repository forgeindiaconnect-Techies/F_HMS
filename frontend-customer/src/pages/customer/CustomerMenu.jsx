import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { getApiUrl } from '../../utils/axiosInstance';
import { 
    ShoppingBag, ChevronRight, Plus, Minus, Send, MessageSquare, 
    BookOpen, Clock, Heart, User, UtensilsCrossed, CheckCircle2, 
    QrCode, CreditCard, Store, Receipt, Sparkles, X, ShieldCheck,
    Phone, Check, ArrowRight, AlertCircle, Utensils
} from 'lucide-react';
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
    const [restaurantName, setRestaurantName] = useState('FoodNest Client');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isUnavailable, setIsUnavailable] = useState(false);
    const [unavailableReason, setUnavailableReason] = useState('');
    
    // Cart state
    const [cart, setCart] = useState([]);
    const [showCartModal, setShowCartModal] = useState(false);
    const [itemNotes, setItemNotes] = useState({}); // itemId -> note string
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Customer Name & Service selection
    const [customerName, setCustomerName] = useState(() => localStorage.getItem('restosys_guest_name') || '');
    const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('restosys_guest_phone') || '');
    
    // Service Type: 'Self Dine-In (KFC Style)' | 'Waiter Table Service'
    const [serviceType, setServiceType] = useState('Self Dine-In (KFC Style)');
    
    // Payment Option:
    // Self Dine-In: 'UPI' | 'Card' | 'Counter'
    // Waiter Service: 'WaiterCash' | 'UPI' | 'WaiterCard'
    const [paymentOption, setPaymentOption] = useState('UPI');

    // Simulated Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState('idle'); // 'idle' | 'simulating' | 'success'

    // Operational Settings from Backend
    const [publicConfig, setPublicConfig] = useState(null);
    const [tipPercent, setTipPercent] = useState(0); // 0, 5, 10, 15, 20 or -1 for custom
    const [customTipAmount, setCustomTipAmount] = useState('');

    const API_URL = getApiUrl();

    useEffect(() => {
        if (!restaurantId) {
            toast.error("Invalid QR Code: Restaurant ID is missing.");
            return;
        }

        const fetchMenu = async () => {
            try {
                // Fetch public operational settings & restaurant info
                const [restRes, configRes] = await Promise.all([
                    api.get(`/restaurants/${restaurantId}`).catch((err) => err.response || null),
                    api.get(`/restaurants/${restaurantId}/public-config`).catch((err) => err.response || null)
                ]);

                // Verify restaurant is active and visible
                if (
                    restRes?.status === 403 || 
                    restRes?.status === 404 || 
                    !restRes?.data || 
                    restRes?.data?.isDeleted || 
                    (restRes?.data?.status && restRes?.data?.status !== 'Active') ||
                    restRes?.data?.isActive === false
                ) {
                    setIsUnavailable(true);
                    setUnavailableReason(restRes?.data?.message || 'This restaurant is currently hidden, inactive, or suspended.');
                    setLoading(false);
                    return;
                }

                if (restRes && restRes.data) {
                    setRestaurantName(restRes.data.name);
                }

                // Fetch public menu items
                const res = await api.get(`/menu?restaurantId=${restaurantId}&branchId=${branchId || ''}`);
                setMenuItems(Array.isArray(res.data) ? res.data : []);

                if (configRes && configRes.data) {
                    setPublicConfig(configRes.data);
                    if (configRes.data.restaurantName) {
                        setRestaurantName(configRes.data.restaurantName);
                    }

                    // Auto-adjust default service mode based on active options
                    const qrCfg = configRes.data.qrOrdering || {};
                    if (qrCfg.allowSelfDineIn && !qrCfg.allowWaiterOrdering) {
                        setServiceType('Self Dine-In (KFC Style)');
                        setPaymentOption('UPI');
                    } else if (!qrCfg.allowSelfDineIn && qrCfg.allowWaiterOrdering) {
                        setServiceType('Waiter Table Service');
                        setPaymentOption('WaiterCash');
                    }
                }
            } catch (error) {
                console.error("Failed to load menu", error);
                if (error.response?.status === 403 || error.response?.status === 404) {
                    setIsUnavailable(true);
                    setUnavailableReason(error.response?.data?.message || 'Restaurant is currently unavailable.');
                } else {
                    toast.error("Failed to load restaurant menu.");
                }
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

    const totalItemsCount = cart.reduce((acc, curr) => acc + curr.qty, 0);

    // Validate and begin order checkout
    const handleProceedToPlaceOrder = () => {
        if (cart.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        if (!customerName || customerName.trim() === '') {
            toast.error("Please enter your name to place the order");
            const nameInput = document.getElementById('customer-name-input');
            if (nameInput) nameInput.focus();
            return;
        }

        // Save name & phone for future scans
        localStorage.setItem('restosys_guest_name', customerName.trim());
        if (customerPhone) localStorage.setItem('restosys_guest_phone', customerPhone.trim());

        // If online payment (UPI or Card) is chosen, open simulated payment modal
        if (paymentOption === 'UPI' || paymentOption === 'Card') {
            setShowPaymentModal(true);
            setPaymentStep('idle');
        } else {
            // Direct placement with Pay at Counter or Pay to Waiter
            submitOrderToBackend(false);
        }
    };

    const getTipAmount = () => {
        if (!publicConfig?.waiterTips?.enabled || !publicConfig?.waiterTips?.allowCustomerTips) {
            return 0;
        }
        if (tipPercent === -1) {
            const parsed = parseFloat(customTipAmount);
            return !isNaN(parsed) && parsed > 0 ? Math.round(parsed) : 0;
        }
        if (tipPercent > 0) {
            return Math.round((getCartTotal() * tipPercent) / 100);
        }
        return 0;
    };

    // Actual submission to backend
    const submitOrderToBackend = async (isPrePaid = false) => {
        setIsSubmitting(true);

        const tipAmt = getTipAmount();
        const cartAmt = getCartTotal();
        const finalTotal = cartAmt + tipAmt;

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
            serviceType: serviceType,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            tableNumber: tableNumber || 'Any',
            source: 'QR',
            restaurantId,
            branchId,
            paymentMethod: paymentOption === 'UPI' ? 'UPI' : 
                           paymentOption === 'Card' ? 'Card' : 
                           paymentOption === 'WaiterCard' ? 'Card on Table' : 
                           paymentOption === 'Counter' ? 'Pay at Counter' : 'Cash to Waiter',
            isPaid: isPrePaid,
            taxPrice: 0,
            tipAmount: tipAmt,
            totalPrice: finalTotal,
            notes: activeOrderId 
                ? `Appended Items [${serviceType}] • Guest: ${customerName.trim()}${tipAmt > 0 ? ` • Tip: ₹${tipAmt}` : ''}`
                : `[${serviceType}] • Guest: ${customerName.trim()}${customerPhone ? ` (${customerPhone.trim()})` : ''}${tipAmt > 0 ? ` • Tip: ₹${tipAmt}` : ''}`
        };

        try {
            if (activeOrderId) {
                // Append items to existing order
                await api.put(`/orders/${activeOrderId}/items`, orderData);
                toast.success('Items added to your active order!');
                navigate(`/customer/track/${activeOrderId}?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`);
            } else {
                // Create new order
                const res = await api.post('/orders', orderData);
                const createdOrder = res.data;
                toast.success('Order placed successfully!');
                navigate(`/customer/track/${createdOrder._id}?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`);
            }
        } catch (error) {
            console.error("Order submission failed", error);
            toast.error(error.response?.data?.message || 'Failed to submit order.');
            setShowPaymentModal(false);
        } finally {
            setIsSubmitting(false);
            setShowCartModal(false);
        }
    };

    // Simulate online payment success
    const handleConfirmSimulatedPayment = () => {
        setPaymentStep('simulating');
        setTimeout(() => {
            setPaymentStep('success');
            setTimeout(() => {
                submitOrderToBackend(true);
            }, 800);
        }, 1200);
    };

    if (!loading && isUnavailable) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-sm">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Restaurant Currently Unavailable</h2>
                <p className="text-sm text-slate-500 max-w-md mb-8">
                    {unavailableReason || 'This restaurant is currently hidden, inactive, or suspended. Online ordering is disabled.'}
                </p>
                <button
                    onClick={() => navigate('/explore')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg transition-all text-sm"
                >
                    <ArrowRight size={16} /> Explore Other Restaurants
                </button>
            </div>
        );
    }

    if (!loading && publicConfig && publicConfig.qrOrdering?.enabled === false) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
                        <QrCode size={36} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
                            Digital Ordering Inactive
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            QR Table Ordering is Disabled
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                            <strong>{restaurantName}</strong> has currently paused digital QR ordering for {tableNumber ? `Table ${tableNumber}` : 'dining tables'}.
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 space-y-2 text-left">
                        <p className="flex items-center gap-2">
                            <span>🛎️</span> Please place your order directly with your table waiter.
                        </p>
                        <p className="flex items-center gap-2">
                            <span>🧾</span> Or visit the food counter / cashier desk for assistance.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-36 text-slate-800 transition-colors">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
                <div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 w-max mb-1">
                        <BookOpen size={10} /> Smart QR Menu
                    </span>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>{restaurantName}</h1>
                    {tableNumber && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Seated at: <strong className="text-emerald-600 font-black">Table {tableNumber}</strong></p>
                    )}
                </div>
                <div className="flex items-center gap-2.5">
                    {activeOrderId && (
                        <button 
                            onClick={() => navigate(`/customer/track/${activeOrderId}?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border border-emerald-200"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            View Active Order
                        </button>
                    )}
                </div>
            </header>

            {/* Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-6 py-6 flex justify-between items-center shadow-sm overflow-hidden relative">
                <div className="space-y-1 relative z-10 max-w-[280px]">
                    <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={14} /> Instant Table Ordering
                    </div>
                    <h2 className="text-lg font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Order Directly From Table {tableNumber || ''}
                    </h2>
                    <p className="text-xs text-emerald-100/90 leading-relaxed">
                        Select Self Dine-In (KFC style) or Table Waiter Service with instant payment options.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 opacity-15 transform translate-x-10 translate-y-4 pointer-events-none">
                    <ShoppingBag size={180} />
                </div>
            </div>

            {/* Category Selector */}
            <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 flex gap-2 overflow-x-auto px-6 scrollbar-none shadow-sm">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                            activeCategory === cat 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
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
                            <div key={item._id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow">
                                <img 
                                    src={getItemImage(item)} 
                                    onError={(e) => { e.target.onerror = null; e.target.src = getItemImage({ ...item, image: '' }); }}
                                    alt={item.name} 
                                    className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-100"
                                />
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description || 'Delectable recipe freshly cooked.'}</p>
                                    <p className="text-emerald-600 font-black text-sm mt-1.5">₹{item.price}</p>
                                </div>

                                <div className="shrink-0">
                                    {inCart ? (
                                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                            <button 
                                                onClick={() => removeFromCart(item._id)}
                                                className="w-7 h-7 bg-white border border-slate-300 rounded-lg text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                            >
                                                <Minus size={13} />
                                            </button>
                                            <span className="font-black text-xs w-4 text-center text-slate-900">{inCart.qty}</span>
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors"
                                            >
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => addToCart(item)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
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

            {/* STICKY BOTTOM ORDER COUNT BAR */}
            {cart.length > 0 && !showCartModal && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-10px_35px_rgba(0,0,0,0.16)] px-4 pt-3 pb-8 sm:pb-3 sm:px-6 transition-all duration-300 animate-in slide-in-from-bottom-4">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                                    <ShoppingBag size={22} />
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full w-5 h-5 text-[11px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                                    {totalItemsCount}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} Selected
                                    </span>
                                    {tableNumber && (
                                        <span className="text-[11px] font-bold text-slate-500">
                                            • Table {tableNumber}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className="text-lg font-black text-slate-900">₹{getCartTotal().toLocaleString('en-IN')}</span>
                                    <span className="text-[11px] text-slate-400 font-medium">total amount</span>
                                </div>
                            </div>
                        </div>

                        <button
                            id="sticky-place-order-btn"
                            onClick={() => setShowCartModal(true)}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/35 flex items-center gap-2 text-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                            <span>Place Order</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* CART & CHECKOUT SLIDE-UP MODAL */}
            {showCartModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center h-[100dvh] max-h-[100dvh] overflow-hidden">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCartModal(false)}></div>
                    
                    <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col h-[85vh] max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-250">
                        {/* Modal Header */}
                        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/80">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-slate-900 text-lg">Table Order Summary</h3>
                                    {tableNumber && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Table {tableNumber}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Review items, enter your name, and choose dining method.</p>
                            </div>
                            <button 
                                onClick={() => setShowCartModal(false)} 
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Content Scrollable Area */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-slate-50/50 overscroll-contain pb-8">
                            {/* 1. Cart Items List */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
                                    <span>Selected Items ({totalItemsCount})</span>
                                    <span className="text-emerald-700">Subtotal: ₹{getCartTotal().toLocaleString('en-IN')}</span>
                                </div>

                                {cart.map(item => (
                                    <div key={item._id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div className="min-w-0 flex-1 pr-2">
                                                <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-emerald-600 font-black mt-0.5">₹{item.price} each</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button onClick={() => removeFromCart(item._id)} className="w-7 h-7 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors"><Minus size={13} /></button>
                                                <span className="font-black text-sm w-4 text-center text-slate-900">{item.qty}</span>
                                                <button onClick={() => addToCart(item)} className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-colors"><Plus size={13} /></button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <input 
                                                type="text"
                                                value={itemNotes[item._id] || ''}
                                                onChange={(e) => handleNoteChange(item._id, e.target.value)}
                                                placeholder="Special instructions (e.g. Less Spicy, No Onion)..."
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 2. Customer Name & Details (Required as per prompt) */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                                    <User size={15} className="text-emerald-600" />
                                    <span>Who is placing this order?</span>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                        Customer Full Name <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <input 
                                        id="customer-name-input"
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => {
                                            setCustomerName(e.target.value);
                                            localStorage.setItem('restosys_guest_name', e.target.value);
                                        }}
                                        placeholder="Enter your name (e.g., Alex Johnson)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Your name will appear on the kitchen ticket and digital receipt.</p>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                        Phone Number <span className="text-slate-400 font-normal">(Optional, for WhatsApp / SMS tracking)</span>
                                    </label>
                                    <input 
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => {
                                            setCustomerPhone(e.target.value);
                                            localStorage.setItem('restosys_guest_phone', e.target.value);
                                        }}
                                        placeholder="e.g., 9876543210"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* 3. Choose Dining Service Mode based on Restaurant Settings */}
                            {(() => {
                                const allowSelf = publicConfig?.qrOrdering?.allowSelfDineIn ?? true;
                                const allowWaiter = publicConfig?.qrOrdering?.allowWaiterOrdering ?? true;

                                if (!allowSelf && !allowWaiter) {
                                    return (
                                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                                            Online table ordering service modes are currently disabled by the restaurant.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                                            Choose Dine-In Service Method:
                                        </label>
                                        <div className={`grid gap-3 ${allowSelf && allowWaiter ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                            {/* Option A: Self Dine-In (KFC Style) */}
                                            {allowSelf && (
                                                <div
                                                    onClick={() => {
                                                        setServiceType('Self Dine-In (KFC Style)');
                                                        if (publicConfig?.paymentMethods?.upi ?? true) setPaymentOption('UPI');
                                                        else if (publicConfig?.paymentMethods?.card ?? true) setPaymentOption('Card');
                                                        else setPaymentOption('Counter');
                                                    }}
                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                                                        serviceType === 'Self Dine-In (KFC Style)'
                                                            ? 'bg-emerald-50/80 border-emerald-600 shadow-md shadow-emerald-500/10'
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                            serviceType === 'Self Dine-In (KFC Style)'
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            <Store size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-black text-slate-900 text-sm">Self Dine-In</span>
                                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full border border-amber-200">
                                                                    Like KFC / QSR
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                                                Collect your food from the pickup counter when your token is called.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Option B: Waiter Table Service */}
                                            {allowWaiter && (
                                                <div
                                                    onClick={() => {
                                                        setServiceType('Waiter Table Service');
                                                        if (publicConfig?.paymentMethods?.cash ?? true) setPaymentOption('WaiterCash');
                                                        else if (publicConfig?.paymentMethods?.upi ?? true) setPaymentOption('UPI');
                                                        else setPaymentOption('WaiterCard');
                                                    }}
                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                                                        serviceType === 'Waiter Table Service'
                                                            ? 'bg-emerald-50/80 border-emerald-600 shadow-md shadow-emerald-500/10'
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                            serviceType === 'Waiter Table Service'
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            <UtensilsCrossed size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-black text-slate-900 text-sm">Waiter Service</span>
                                                                <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded-full border border-blue-200">
                                                                    Table Served
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                                                Waiter collects food from the kitchen and serves directly to Table {tableNumber || 'your table'}.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 4. Payment Options tailored to selected service mode & enabled methods */}
                            {(() => {
                                const pmCash = publicConfig?.paymentMethods?.cash ?? true;
                                const pmUpi = publicConfig?.paymentMethods?.upi ?? true;
                                const pmCard = publicConfig?.paymentMethods?.card ?? true;
                                const pmOnline = publicConfig?.paymentMethods?.onlineGateway ?? true;

                                return (
                                    <div className="space-y-2.5">
                                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                                            {serviceType === 'Self Dine-In (KFC Style)' ? 'Self Dine-In Payment Options:' : 'Table Service Payment Options:'}
                                        </label>

                                        {serviceType === 'Self Dine-In (KFC Style)' ? (
                                            <div className="space-y-2">
                                                {/* UPI / Dynamic QR */}
                                                {pmUpi && (
                                                    <label 
                                                        onClick={() => setPaymentOption('UPI')}
                                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentOption === 'UPI' ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" name="paymentOption" checked={paymentOption === 'UPI'} onChange={() => setPaymentOption('UPI')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-slate-900">Instant UPI / QR Code</span>
                                                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Fastest</span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500">Scan & pay via GPay, PhonePe, Paytm, or CRED</p>
                                                            </div>
                                                        </div>
                                                        <QrCode size={20} className="text-emerald-600 shrink-0" />
                                                    </label>
                                                )}

                                                {/* Online Card */}
                                                {(pmCard || pmOnline) && (
                                                    <label 
                                                        onClick={() => setPaymentOption('Card')}
                                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentOption === 'Card' ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" name="paymentOption" checked={paymentOption === 'Card'} onChange={() => setPaymentOption('Card')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                                            <div>
                                                                <span className="text-xs font-black text-slate-900">Credit / Debit Card</span>
                                                                <p className="text-[11px] text-slate-500">Instant online card checkout</p>
                                                            </div>
                                                        </div>
                                                        <CreditCard size={20} className="text-slate-600 shrink-0" />
                                                    </label>
                                                )}

                                                {/* Pay at Pickup Counter */}
                                                {pmCash && (
                                                    <label 
                                                        onClick={() => setPaymentOption('Counter')}
                                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentOption === 'Counter' ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" name="paymentOption" checked={paymentOption === 'Counter'} onChange={() => setPaymentOption('Counter')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                                            <div>
                                                                <span className="text-xs font-black text-slate-900">Pay at Counter (Cash / UPI / Card)</span>
                                                                <p className="text-[11px] text-slate-500">Pay at the food pickup counter when your token is called</p>
                                                            </div>
                                                        </div>
                                                        <Store size={20} className="text-slate-600 shrink-0" />
                                                    </label>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {/* Pay to Waiter on Table */}
                                                {pmCash && (
                                                    <label 
                                                        onClick={() => setPaymentOption('WaiterCash')}
                                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentOption === 'WaiterCash' ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" name="paymentOption" checked={paymentOption === 'WaiterCash'} onChange={() => setPaymentOption('WaiterCash')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-slate-900">Pay to Waiter on Table</span>
                                                                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">Post-Meal</span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500">Pay cash or UPI when waiter brings the bill after dining</p>
                                                            </div>
                                                        </div>
                                                        <Receipt size={20} className="text-blue-600 shrink-0" />
                                                    </label>
                                                )}

                                                {/* Pre-Pay Online via UPI */}
                                                {pmUpi && (
                                                    <label 
                                                        onClick={() => setPaymentOption('UPI')}
                                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentOption === 'UPI' ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" name="paymentOption" checked={paymentOption === 'UPI'} onChange={() => setPaymentOption('UPI')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                                            <div>
                                                                <span className="text-xs font-black text-slate-900">Pre-Pay Online (UPI / QR)</span>
                                                                <p className="text-[11px] text-slate-500">Instant contactless payment from your table</p>
                                                            </div>
                                                        </div>
                                                        <QrCode size={20} className="text-emerald-600 shrink-0" />
                                                    </label>
                                                )}

                                                {/* Card on Table */}
                                                {pmCard && (
                                                    <label 
                                                        onClick={() => setPaymentOption('WaiterCard')}
                                                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentOption === 'WaiterCard' ? 'border-emerald-600 bg-emerald-50/60 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input type="radio" name="paymentOption" checked={paymentOption === 'WaiterCard'} onChange={() => setPaymentOption('WaiterCard')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                                            <div>
                                                                <span className="text-xs font-black text-slate-900">Card on Table (POS Machine)</span>
                                                                <p className="text-[11px] text-slate-500">Waiter will bring portable swipe terminal to your table</p>
                                                            </div>
                                                        </div>
                                                        <CreditCard size={20} className="text-slate-600 shrink-0" />
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* 5. Optional Waiter Tips Section */}
                            {publicConfig?.waiterTips?.enabled && publicConfig?.waiterTips?.allowCustomerTips && (
                                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-amber-600" />
                                            <span className="text-xs font-black text-slate-900">Add Tip for Waiter &amp; Staff</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                            Optional Gratuity
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {[0, ...(publicConfig.waiterTips?.tipPercentages || [5, 10, 15, 20])].map((pct) => (
                                            <button
                                                key={pct}
                                                type="button"
                                                onClick={() => { setTipPercent(pct); setCustomTipAmount(''); }}
                                                className={`py-2 rounded-xl text-xs font-black transition-all ${
                                                    tipPercent === pct 
                                                        ? 'bg-amber-500 text-white shadow-xs' 
                                                        : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/50'
                                                }`}
                                            >
                                                {pct === 0 ? 'No Tip' : `${pct}%`}
                                            </button>
                                        ))}
                                    </div>
                                    {publicConfig.waiterTips?.customTipAllowed && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setTipPercent(-1)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                                    tipPercent === -1 ? 'bg-amber-500 text-white' : 'bg-white border border-amber-200 text-slate-700'
                                                }`}
                                            >
                                                Custom ₹
                                            </button>
                                            {tipPercent === -1 && (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Enter tip (e.g. 50)"
                                                    value={customTipAmount}
                                                    onChange={(e) => setCustomTipAmount(e.target.value)}
                                                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Sticky Bottom Action Bar */}
                        <div className="p-3 sm:p-4 pt-2.5 pb-8 sm:pb-4 border-t border-slate-200 shrink-0 bg-white/98 backdrop-blur-md shadow-[0_-8px_25px_rgba(0,0,0,0.12)] space-y-2 z-30">
                            <div className="flex justify-between items-center font-black text-slate-900">
                                <div>
                                    <span className="text-xs block text-slate-700 font-bold">Total Payable</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} • {serviceType}</span>
                                </div>
                                <span className="text-emerald-600 text-lg font-black">₹{getCartTotal().toLocaleString('en-IN')}</span>
                            </div>
                            
                            <button 
                                id="modal-confirm-order-btn"
                                onClick={handleProceedToPlaceOrder}
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-slate-300 text-white font-black py-3 sm:py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm cursor-pointer"
                            >
                                <Send size={16} />
                                <span>
                                    {isSubmitting ? 'Submitting Order...' : 
                                     paymentOption === 'UPI' || paymentOption === 'Card' ? `Proceed to Pay ₹${getCartTotal()} & Order` :
                                     `Confirm Order • ₹${getCartTotal()}`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIMULATED UPI / CARD PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 h-[100dvh] max-h-[100dvh] overflow-y-auto">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-5 sm:p-6 text-center space-y-3.5 max-h-[88dvh] overflow-y-auto my-auto border border-slate-100">
                        <button 
                            onClick={() => setShowPaymentModal(false)} 
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                            {paymentOption === 'UPI' ? <QrCode size={26} /> : <CreditCard size={26} />}
                        </div>

                        <div>
                            <h3 className="font-black text-slate-900 text-lg">
                                {paymentOption === 'UPI' ? 'Scan & Pay via UPI' : 'Simulated Card Payment'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Order for <strong className="text-slate-800">{customerName}</strong> • Table {tableNumber || 'Dine-In'}
                            </p>
                            <p className="text-2xl font-black text-emerald-600 mt-2">
                                ₹{getCartTotal().toLocaleString('en-IN')}
                            </p>
                        </div>

                        {paymentOption === 'UPI' ? (
                            <div className="space-y-3">
                                <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=resto@upi&pn=${encodeURIComponent(restaurantName)}&am=${getCartTotal()}&cu=INR`)}`} 
                                        alt="UPI QR Code" 
                                        className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto"
                                    />
                                </div>
                                <div className="flex justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>CRED</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Card Number</span>
                                    <div className="font-mono text-sm font-bold text-slate-800">4532 •••• •••• 8892</div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Expires</span>
                                        <div className="font-semibold text-slate-800">12/28</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">CVV</span>
                                        <div className="font-semibold text-slate-800">•••</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            {paymentStep === 'simulating' ? (
                                <div className="py-3 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                                    <span>Processing Payment...</span>
                                </div>
                            ) : paymentStep === 'success' ? (
                                <div className="py-3 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm animate-in zoom-in">
                                    <CheckCircle2 size={20} />
                                    <span>Payment Successful! Creating Order...</span>
                                </div>
                            ) : (
                                <button
                                    id="confirm-simulated-payment-btn"
                                    onClick={handleConfirmSimulatedPayment}
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Simulate Payment & Send to Kitchen</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Active Order Tracker Button */}
            {activeOrderId && !cart.length && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs px-4">
                    <button 
                        onClick={() => navigate(`/customer/track/${activeOrderId}?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-green-600/35 flex items-center justify-between transition-all duration-300 hover:scale-[1.03] active:scale-95 border border-green-500/20 cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                            </span>
                            <span className="text-sm font-black tracking-wide">View Active Order</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomerMenu;
