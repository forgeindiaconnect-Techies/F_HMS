import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CreditCard, MapPin, Ticket, ChevronRight, Utensils, CheckCircle, ShieldCheck, ArrowRight, Store } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { api } = useCustomerAuth();
    const navigate = useNavigate();
    
    const [orderType, setOrderType] = useState('dine_in');
    const [tableNumber, setTableNumber] = useState('');
    const [address, setAddress] = useState('');
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    const [subscriptionPlan, setSubscriptionPlan] = useState('One-time Order');
    const [paymentMethod, setPaymentMethod] = useState('Card');
    const [upiId, setUpiId] = useState('');
    const [upiMethod, setUpiMethod] = useState('QR'); // 'QR' or 'ID'
    const [isScanned, setIsScanned] = useState(false);
    const [upiPlatform, setUpiPlatform] = useState(''); // 'GPay', 'PhonePe', 'Paytm'
    const [checkoutStep, setCheckoutStep] = useState(1);
    const [restaurantsList, setRestaurantsList] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState('');

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
                if (!API_URL.endsWith('/api')) API_URL += '/api';
                const res = await axios.get(`${API_URL}/restaurants`);
                const activeList = res.data.filter(r => r.isActive !== false);
                setRestaurantsList(activeList);
                if (activeList.length > 0 && !selectedRestaurantId && !location.state?.restaurantId) {
                    setSelectedRestaurantId(activeList[0]._id);
                }
            } catch (error) {
                console.error("Failed to load restaurants for checkout", error);
            }
        };
        fetchRestaurants();
    }, []);

    useEffect(() => {
        let timer;
        if (paymentMethod === 'UPI' && upiMethod === 'QR' && !isScanned) {
            timer = setTimeout(() => {
                setIsScanned(true);
            }, 3000); // Transition to payment apps after 3 seconds of scanning simulation
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [paymentMethod, upiMethod, isScanned]);

    // If cart is empty and order not placed, kick them out
    if (cartItems.length === 0 && !orderPlaced) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                <Link to="/menu" className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold">Return to Menu</Link>
            </div>
        );
    }

    let subscriptionDiscount = 0;
    if (subscriptionPlan === 'Weekly Subscription') {
        subscriptionDiscount = cartTotal * 0.10;
    } else if (subscriptionPlan === 'Monthly Subscription') {
        subscriptionDiscount = cartTotal * 0.20;
    }

    const totalDiscount = discount + subscriptionDiscount;
    const tax = (cartTotal - totalDiscount) * 0.05; // 5% tax
    const grandTotal = cartTotal - totalDiscount + tax;

    const location = useLocation();
    const { restaurantId, branchId } = location.state || {};

    useEffect(() => {
        if (restaurantId && !selectedRestaurantId) {
            setSelectedRestaurantId(restaurantId);
        }
    }, [restaurantId, selectedRestaurantId]);

    const selectedRestaurantObj = restaurantsList.find(r => r._id === (selectedRestaurantId || restaurantId));
    const selectedRestaurantName = selectedRestaurantObj ? selectedRestaurantObj.name : 'Selected Restaurant';

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        if (coupon.toUpperCase() === 'WELCOME20') {
            setDiscount(cartTotal * 0.20);
        } else {
            alert('Invalid coupon code');
            setDiscount(0);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!selectedRestaurantId && !restaurantId) {
            alert('Please select a restaurant from the dropdown list before proceeding.');
            return;
        }
        setIsPlacingOrder(true);
        
        try {
            const orderData = {
                orderItems: cartItems.map(item => ({
                    name: item.name,
                    qty: item.quantity,
                    image: item.image || 'https://via.placeholder.com/150',
                    price: item.price,
                    product: item._id || item.id
                })),
                orderType: 'Self-Pickup',
                source: 'Self-Pickup',
                restaurantId: selectedRestaurantId || restaurantId,
                branchId,
                paymentMethod: paymentMethod === 'UPI' 
                    ? (upiMethod === 'QR' ? `UPI - ${upiPlatform || 'QR'}` : `UPI ID - ${upiId}`) 
                    : paymentMethod,
                subscriptionPlan,
                taxPrice: tax,
                totalPrice: grandTotal
            };
            
            const { data } = await api.post('/orders', orderData);
            setOrderPlaced(data._id); // Save order ID for success screen
            clearCart();
        } catch (error) {
            console.error('Order failed', error);
            alert('Failed to place order: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 max-w-lg w-full text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500 mb-8 text-lg">Your order #{orderPlaced.substring(orderPlaced.length - 6).toUpperCase()} has been sent to the kitchen.</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100 space-y-2.5">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Order Details</p>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Restaurant</span>
                            <span className="font-bold text-gray-900">{selectedRestaurantName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Type</span>
                            <span className="font-bold text-gray-900">Self-Pickup</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Plan / Subscription</span>
                            <span className="font-bold text-purple-700 bg-purple-100/50 px-2 py-0.5 rounded-lg border border-purple-200 text-xs">{subscriptionPlan}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Payment Method</span>
                            <span className="font-bold text-gray-900">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-600">Amount Paid</span>
                            <span className="font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-gray-200/50 pt-2">
                            <span className="font-medium text-gray-600">Est. Prep Time</span>
                            <span className="font-bold text-orange-600">20-25 mins</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/profile')}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
                    >
                        View Dashboard <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-8">Checkout</h1>
            
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Payment */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Self-Pickup Info */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 font-sans mb-6">Pickup Details</h2>
                        <div className="flex items-center gap-4 p-4 border border-orange-200 bg-orange-50 rounded-2xl">
                            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                                <Utensils size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Self-Pickup Order</h3>
                                <p className="text-sm text-gray-600">Your order will be prepared and ready for you to pick up from the restaurant counter.</p>
                            </div>
                        </div>
                    </div>

                    {/* Help banner for Step 1 */}
                    {checkoutStep === 1 && (
                        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 text-left animate-in fade-in duration-300">
                            <h3 className="font-bold text-orange-950 text-base">Complete your details to proceed</h3>
                            <p className="text-sm text-orange-800/80 mt-1">Review your order details and click the <strong>Proceed</strong> button in the order summary sidebar to select a subscription plan and choose your payment method.</p>
                        </div>
                    )}

                    {/* Subscription & Restaurant selection dropdown */}
                    {checkoutStep === 2 && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
                                    <Store className="text-orange-600" size={24} /> Choose Restaurant & Subscription
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed mt-1">Select your preferred restaurant and subscription plan for this order. Subscriptions give you additional discounts on your total.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Restaurant Selector */}
                                <div className="space-y-2 text-left">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Select Restaurant</label>
                                    <select
                                        value={selectedRestaurantId || restaurantId || ''}
                                        onChange={(e) => setSelectedRestaurantId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors bg-white font-semibold text-gray-800 text-sm"
                                        required
                                    >
                                        <option value="">-- Choose Restaurant Name --</option>
                                        {restaurantsList.map((r) => (
                                            <option key={r._id} value={r._id}>
                                                {r.name} {r.address ? `(${typeof r.address === 'object' ? (r.address.city || r.address.street || '') : r.address})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subscription Plan Selector */}
                                <div className="space-y-2 text-left">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Subscription Plan</label>
                                    <select
                                        value={subscriptionPlan}
                                        onChange={(e) => setSubscriptionPlan(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors bg-white font-semibold text-gray-800 text-sm"
                                    >
                                        <option value="One-time Order">One-time Order (Standard Price)</option>
                                        <option value="Weekly Subscription">Weekly Subscription (10% Discount)</option>
                                        <option value="Monthly Subscription">Monthly Subscription (20% Discount)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Information */}
                    {checkoutStep === 2 && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 font-sans">Payment Method</h2>
                                <ShieldCheck className="text-green-500" size={24} />
                            </div>

                            {/* Payment Method Selector */}
                            <div className="grid grid-cols-3 gap-4">
                                {['Card', 'UPI', 'Cash on Delivery'].map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-3.5 px-4 rounded-xl border text-sm font-bold transition-all ${
                                            paymentMethod === method
                                                ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm shadow-orange-500/10'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>

                            {/* Payment Details Container */}
                            {paymentMethod === 'Card' && (
                                <div className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-gray-900/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <CreditCard size={28} className="text-gray-400" />
                                        <span className="font-bold tracking-widest text-lg">VISA</span>
                                    </div>
                                    
                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1 block">Card Number</label>
                                            <input type="text" defaultValue="•••• •••• •••• 4242" className="w-full bg-transparent border-b border-gray-700 focus:border-orange-500 outline-none pb-1 font-mono text-lg transition-colors" required />
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1 block">Expiry</label>
                                                <input type="text" defaultValue="12/28" className="w-full bg-transparent border-b border-gray-700 focus:border-orange-500 outline-none pb-1 font-mono transition-colors" required />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1 block">CVC</label>
                                                <input type="password" defaultValue="•••" className="w-full bg-transparent border-b border-gray-700 focus:border-orange-500 outline-none pb-1 font-mono transition-colors" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1 block">Cardholder Name</label>
                                            <input type="text" placeholder="JOHN DOE" className="w-full bg-transparent border-b border-gray-700 focus:border-orange-500 outline-none pb-1 font-bold transition-colors" required />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'UPI' && (
                                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 text-left">

                                    {/* Sub-selector: QR Code vs UPI ID */}
                                    <div className="flex gap-3 border-b border-gray-100 pb-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUpiMethod('QR');
                                                setIsScanned(false);
                                                setUpiPlatform('');
                                            }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                upiMethod === 'QR'
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Scan QR Code
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUpiMethod('ID')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                upiMethod === 'ID'
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Enter UPI ID
                                        </button>
                                    </div>

                                    {upiMethod === 'QR' ? (
                                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                            {!isScanned ? (
                                                <>
                                                    {/* Clean QR code wrapper */}
                                                    <div className="w-48 h-48 bg-white p-3 rounded-2xl border border-gray-200 shadow-md flex items-center justify-center">
                                                        <img src="/images/payment_qr.png" alt="Scan to pay" className="w-full h-full object-contain rounded-xl" />
                                                    </div>

                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm">Scan QR Code to Pay</h3>
                                                        <p className="text-xs text-gray-500 mt-1">Use GPay, PhonePe, Paytm, or any banking app to scan. Payment apps will be shown automatically after scan.</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                                                        <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg mb-1">✓</span>
                                                        <h4 className="font-bold text-green-900 text-sm">Scan Completed Successfully!</h4>
                                                        <p className="text-[11px] text-green-700 mt-0.5">Please select the platform you used to make the payment:</p>
                                                    </div>

                                                    {/* App Logos selector */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { id: 'GPay', name: 'Google Pay', short: 'GPay' },
                                                            { id: 'PhonePe', name: 'PhonePe', short: 'PhonePe' },
                                                            { id: 'Paytm', name: 'Paytm', short: 'Paytm' }
                                                        ].map(app => (
                                                            <button
                                                                key={app.id}
                                                                type="button"
                                                                onClick={() => setUpiPlatform(app.id)}
                                                                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                                                                    upiPlatform === app.id
                                                                        ? 'border-orange-500 bg-orange-50/50 text-orange-700 scale-105 shadow-sm'
                                                                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                                                                }`}
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] uppercase shadow-sm">
                                                                    {app.short}
                                                                </div>
                                                                {app.name}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsScanned(false);
                                                            setUpiPlatform('');
                                                        }}
                                                        className="text-xs text-gray-500 hover:text-gray-700 underline font-medium"
                                                    >
                                                        Re-scan QR Code
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-gray-700">Enter UPI ID</label>
                                            <input 
                                                type="text" 
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                placeholder="e.g. mobile@upi, username@okaxis" 
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors bg-white font-mono text-sm"
                                                required={upiMethod === 'ID'}
                                            />
                                            <p className="text-xs text-gray-500">Pay using BHIM, Google Pay, PhonePe, Paytm, or any UPI app.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {paymentMethod === 'Cash on Delivery' && (
                                <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-4 duration-300 text-left">
                                    <h3 className="font-bold text-green-800 text-base">Cash on Delivery Confirmed</h3>
                                    <p className="text-sm text-green-700/80 mt-1 leading-relaxed">No online payment is required. You can pay via cash, card, or UPI directly at the restaurant counter when picking up your order.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-28">
                        <h2 className="text-xl font-bold text-gray-900 font-sans mb-6">Order Summary</h2>
                        
                        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h4>
                                        <p className="text-gray-500 text-xs mt-0.5">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-bold text-gray-900 flex items-center">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Coupon */}
                        <div className="flex gap-2 mb-6">
                            <div className="relative flex-1">
                                <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value)}
                                    placeholder="Add coupon code..." 
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white text-sm font-bold uppercase transition-colors" 
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={handleApplyCoupon}
                                className="bg-gray-900 text-white px-4 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                        <p className="text-xs text-orange-600 mb-6 font-medium">Try code: WELCOME20</p>
                        
                        {/* Totals */}
                        <div className="space-y-3 pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-sm font-bold text-green-600">
                                    <span>Promo Discount (20%)</span>
                                    <span>-₹{discount.toFixed(2)}</span>
                                </div>
                            )}
                            {subscriptionDiscount > 0 && (
                                <div className="flex justify-between items-center text-sm font-bold text-purple-600">
                                    <span>Subscription Discount ({subscriptionPlan === 'Weekly Subscription' ? '10%' : '20%'})</span>
                                    <span>-₹{subscriptionDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                <span>Tax (5%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between items-end pt-4">
                                <span>Total</span>
                                <span className="text-3xl font-bold text-orange-600 tracking-tight">₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        {checkoutStep === 1 ? (
                            <button 
                                type="button" 
                                onClick={() => setCheckoutStep(2)}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl mt-8 transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                            >
                                Proceed <ChevronRight size={18} />
                            </button>
                        ) : (
                            <div className="space-y-3 mt-8">
                                <button 
                                    type="submit" 
                                    disabled={isPlacingOrder}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                                >
                                    {isPlacingOrder ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                            Processing Payment...
                                        </>
                                    ) : (
                                        <>Pay ₹{grandTotal.toFixed(2)} <ChevronRight size={18} /></>
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setCheckoutStep(1)}
                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                                >
                                    Back to Details
                                </button>
                            </div>
                        )}
                        
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Checkout;
