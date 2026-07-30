import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Clock, RefreshCw, ChevronLeft, PhoneCall, Coffee, Utensils, 
    FileText, CheckCircle2, AlertCircle, ShoppingBag, BellRing, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerOrderTracking = () => {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const restaurantId = searchParams.get('restaurantId');
    const branchId = searchParams.get('branchId');
    const tableNumber = searchParams.get('tableNumber');

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(null); // requestType or null

    // Delivery Rating States
    const [speedRating, setSpeedRating] = useState(5);
    const [behaviourRating, setBehaviourRating] = useState(5);
    const [foodHandlingRating, setFoodHandlingRating] = useState(5);
    const [overallRating, setOverallRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isRatingLoading, setIsRatingLoading] = useState(false);

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

    const handleSubmitRating = async (e) => {
        e.preventDefault();
        setIsRatingLoading(true);
        try {
            await axios.put(`${API_URL}/orders/${orderId}/rating`, {
                speed: speedRating,
                behaviour: behaviourRating,
                foodHandling: foodHandlingRating,
                overall: overallRating,
                review: reviewText
            });
            toast.success('Thank you for rating your delivery experience!');
            fetchOrderDetails();
        } catch (error) {
            toast.error('Failed to submit rating');
        } finally {
            setIsRatingLoading(false);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders/${orderId}`);
            setOrder(res.data);
        } catch (error) {
            console.error("Failed to load order", error);
            toast.error("Failed to load order details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();

        // WebSocket Connection for instant status updates!
        let ws;
        const connectWS = () => {
            let baseURL = API_URL;
            let wsURL = baseURL.replace(/^http/, 'ws').replace(/\/api$/, '');
            
            ws = new WebSocket(wsURL);

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    type: 'register',
                    orderId: orderId,
                    role: 'customer'
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'order_status_updated') {
                        setOrder(msg.data);
                        toast.success(`Order status updated to: ${msg.data.status}`);
                    }
                } catch (e) {
                    console.error("Error reading websocket message", e);
                }
            };

            ws.onclose = () => {
                setTimeout(connectWS, 5000);
            };
        };

        connectWS();

        return () => {
            if (ws) ws.close();
        };
    }, [orderId]);

    const handleServiceRequest = async (requestType) => {
        if (!restaurantId) {
            toast.error("Missing Restaurant context details.");
            return;
        }
        setRequestLoading(requestType);

        try {
            await axios.post(`${API_URL}/service-requests`, {
                restaurantId,
                branchId,
                tableNumber: tableNumber || 1,
                requestType
            });
            toast.success(`${requestType} sent to waiters!`);
        } catch (error) {
            console.error("Service request failed", error);
            toast.error("Failed to call waiter. Please try again.");
        } finally {
            setRequestLoading(null);
        }
    };

    const isDelivery = order?.orderType === 'Delivery';
    const isSelfPickup = order?.orderType === 'Self-Pickup' || order?.orderType === 'Self Pickup';

    const getStatusStep = (status) => {
        if (isDelivery) {
            if (status === 'Pending') return 0;
            if (status === 'Preparing') return 1;
            if (status === 'Ready') return 2;
            if (status === 'Out for Delivery') return 3;
            if (status === 'Delivered') return 4;
            return 0;
        }
        if (isSelfPickup) {
            if (status === 'Pending') return 0;
            if (status === 'Accepted') return 1;
            if (status === 'Preparing') return 2;
            if (status === 'Ready for Pickup') return 3;
            if (status === 'Picked Up') return 4;
            if (status === 'Completed') return 5;
            return 0;
        }
        if (status === 'Pending') return 0;
        if (status === 'Preparing') return 1;
        if (status === 'Ready') return 2;
        if (['Served', 'Billing Requested', 'Delivered', 'Completed'].includes(status)) return 3;
        return 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900">Order Not Found</h3>
                <p className="text-sm text-gray-500 mt-1">We couldn't retrieve the details for order #{orderId}.</p>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-6 bg-gray-950 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-black"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const currentStep = getStatusStep(order.status);
    const stepsList = isDelivery ? [
        { title: 'Order Received', desc: 'Awaiting restaurant accept' },
        { title: 'Preparing Food', desc: 'Chef is cooking your recipe' },
        { title: 'Ready for Pickup', desc: 'Food is prepared' },
        { title: 'Out for Delivery', desc: 'Partner is carrying your food' },
        { title: 'Delivered', desc: 'Food has reached your doorstep!' }
    ] : isSelfPickup ? [
        { title: 'Order Received', desc: 'Awaiting kitchen accept' },
        { title: 'Accepted', desc: 'Chef accepted your order' },
        { title: 'Preparing Food', desc: 'Chef is cooking your recipe' },
        { title: 'Food Prepared', desc: 'Runner moving food to counter' },
        { title: 'Ready for Pickup', desc: 'Collect it from the cashier counter!' },
        { title: 'Collected', desc: 'Enjoy your meal!' }
    ] : [
        { title: 'Order Received', desc: 'Awaiting kitchen accept' },
        { title: 'In the Kitchen', desc: 'Chef is cooking your recipe' },
        { title: 'Ready to Serve', desc: 'Food is being plated' },
        { title: 'Served', desc: 'Food is on your table!' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24 text-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10 flex justify-between items-center shadow-sm shrink-0">
                <button 
                    onClick={() => navigate(`/customer/menu?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`)}
                    className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-sm font-black text-gray-950">Live Order Status</h1>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Order: #{order._id.substring(order._id.length - 4).toUpperCase()}</p>
                </div>
                <button 
                    onClick={fetchOrderDetails}
                    className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50"
                >
                    <RefreshCw size={16} />
                </button>
            </header>

            {/* Tracking Status Timeline */}
            <main className="flex-1 px-6 py-6 max-w-md mx-auto w-full space-y-6">
                
                {/* Timeline Box */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <div>
                            <p className="text-xs text-gray-400 font-black tracking-wider uppercase">Current Status</p>
                            <h3 className="text-xl font-black text-green-650 mt-1">{order.status}</h3>
                        </div>
                        <div className="bg-green-50 text-green-700 p-3 rounded-2xl animate-pulse">
                            <Clock size={24} />
                        </div>
                    </div>

                    {/* Steps Timeline Visual */}
                    <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                        {stepsList.map((step, idx) => {
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                                <div key={idx} className="relative">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isDone 
                                        ? 'bg-green-600 border-green-600 text-white' 
                                        : 'bg-white border-gray-200 text-gray-300'
                                    }`}>
                                        <CheckCircle2 size={14} className={isDone ? 'opacity-100' : 'opacity-30'} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black transition-colors ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</h4>
                                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pickup Counter Verification Card */}
                {isSelfPickup && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 text-center">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="font-black text-gray-905 text-sm">Pickup Verification</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Present this QR Code or Order ID at the counter to collect your food.</p>
                        </div>
                        
                        <div className="flex justify-center py-2">
                            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-md">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order._id}`} 
                                    alt="Pickup QR Code" 
                                    className="w-36 h-36 object-contain"
                                />
                            </div>
                        </div>

                        <div className="bg-orange-50 text-orange-950 px-4 py-2.5 rounded-2xl font-mono text-xs font-bold border border-orange-100 tracking-wide select-all">
                            ID: {order._id.toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Table Quick Requests */}
                {!isDelivery && !isSelfPickup && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Need Assistance?</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleServiceRequest('Call Waiter')}
                                disabled={requestLoading !== null}
                                className="bg-white hover:bg-red-50 hover:border-red-200 border border-gray-150 p-4 rounded-2xl transition-all text-left flex flex-col justify-between shadow-sm h-28 group"
                            >
                                <PhoneCall size={20} className="text-red-500 stroke-[2] transition-transform group-hover:scale-110" />
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm">Call Waiter</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Request staff assistance</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleServiceRequest('Request Water')}
                                disabled={requestLoading !== null}
                                className="bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-150 p-4 rounded-2xl transition-all text-left flex flex-col justify-between shadow-sm h-28 group"
                            >
                                <Coffee size={20} className="text-blue-500 stroke-[2] transition-transform group-hover:scale-110" />
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm">Need Water</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Request clean drinking water</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleServiceRequest('Request Cutlery')}
                                disabled={requestLoading !== null}
                                className="bg-white hover:bg-orange-50 hover:border-orange-200 border border-gray-150 p-4 rounded-2xl transition-all text-left flex flex-col justify-between shadow-sm h-28 group"
                            >
                                <Utensils size={20} className="text-orange-500 stroke-[2] transition-transform group-hover:scale-110" />
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm">Get Cutlery</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Spoons, forks, or tissues</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleServiceRequest('Request Bill')}
                                disabled={requestLoading !== null}
                                className="bg-white hover:bg-purple-50 hover:border-purple-200 border border-gray-150 p-4 rounded-2xl transition-all text-left flex flex-col justify-between shadow-sm h-28 group"
                            >
                                <FileText size={20} className="text-purple-500 stroke-[2] transition-transform group-hover:scale-110" />
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm">Ask for Bill</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Request dining check bill</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Delivery Driver Info Card */}
                {isDelivery && order.deliveryPartner && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400 font-black tracking-wider uppercase">Delivery Driver</p>
                                <h4 className="font-extrabold text-gray-900 text-sm mt-1">{order.deliveryPartner.name || 'Assigned Driver'}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">Vehicle: Bike</p>
                            </div>
                            <a 
                                href={`tel:${order.deliveryPartner.phoneNumber || '12345'}`}
                                className="bg-green-50 text-green-700 p-3 rounded-2xl border border-green-100 hover:scale-105 active:scale-95 transition-transform"
                            >
                                <PhoneCall size={18} />
                            </a>
                        </div>
                        
                        {/* Mock Maps Tracking visual */}
                        {order.status === 'Out for Delivery' ? (
                            <div className="relative h-28 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-between px-8">
                                <style>{`
                                    @keyframes bikeRideMap {
                                        0% { left: 15%; transform: scaleX(1) translateY(-50%); }
                                        45% { left: 75%; transform: scaleX(1) translateY(-50%); }
                                        50% { left: 75%; transform: scaleX(-1) translateY(-50%); }
                                        95% { left: 15%; transform: scaleX(-1) translateY(-50%); }
                                        100% { left: 15%; transform: scaleX(1) translateY(-50%); }
                                    }
                                    @keyframes dashMap {
                                        to { stroke-dashoffset: -20; }
                                    }
                                `}</style>
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:15px_15px]"></div>
                                
                                {/* Dashed Route Line */}
                                <div className="absolute left-16 right-16 h-1 bg-gray-700/60 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full" 
                                        style={{ 
                                            backgroundImage: 'linear-gradient(90deg, #f97316 50%, transparent 50%)',
                                            backgroundSize: '10px 100%',
                                            animation: 'dashMap 1s linear infinite'
                                        }}
                                    />
                                </div>

                                {/* Restaurant Icon */}
                                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 z-10">
                                    <ShoppingBag size={14} />
                                </div>

                                {/* Animated Motorbike Rider */}
                                <div 
                                    className="absolute w-9 h-9 bg-white text-orange-600 rounded-full shadow-lg flex items-center justify-center border border-orange-200 z-20"
                                    style={{
                                        animation: 'bikeRideMap 8s linear infinite',
                                        top: '50%'
                                    }}
                                >
                                    <span className="text-sm">🏍️</span>
                                </div>

                                {/* House Icon */}
                                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/20 z-10">
                                    <span className="text-xs">🏠</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative h-24 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:15px_15px]"></div>
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Driver en route</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Delivery Star Rating Form */}
                {isDelivery && order.status === 'Delivered' && (!order.deliveryRating || order.deliveryRating.overall === 0) && (
                    <form onSubmit={handleSubmitRating} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Rate your Delivery</h3>
                            <p className="text-[10px] text-gray-400">Share your feedback to help us improve service quality.</p>
                        </div>
                        
                        <div className="space-y-3">
                            {[
                                { label: 'Overall Quality', val: overallRating, set: setOverallRating },
                                { label: 'Delivery Speed', val: speedRating, set: setSpeedRating },
                                { label: 'Driver Behaviour', val: behaviourRating, set: setBehaviourRating },
                                { label: 'Food Handling', val: foodHandlingRating, set: setFoodHandlingRating }
                            ].map((rItem, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-gray-700">{rItem.label}</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => rItem.set(star)}
                                                className="text-amber-400 focus:outline-none hover:scale-110 transition-transform"
                                            >
                                                <Star 
                                                    size={16} 
                                                    className={star <= rItem.val ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Add comments (optional)..."
                                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-green-500"
                                rows="2"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isRatingLoading}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                        >
                            {isRatingLoading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                )}

                {/* Ordered Items Summary */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-black text-gray-900 text-sm border-b border-gray-100 pb-3 flex justify-between items-center">
                        <span>Items Ordered</span>
                        <span className="text-green-600 font-extrabold text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                            Total: ₹{order.totalPrice}
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {order.orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                                <div>
                                    <p className="font-bold text-gray-900">{item.qty}x {item.name}</p>
                                    {item.notes && <p className="text-[10px] text-orange-500 italic mt-0.5">Note: {item.notes}</p>}
                                </div>
                                <span className="text-gray-500 font-medium">₹{item.price * item.qty}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add More Items Button */}
                <button 
                    onClick={() => navigate(`/customer/menu?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}&activeOrderId=${orderId}`)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                >
                    <ShoppingBag size={18} /> Add More Items
                </button>
            </main>
        </div>
    );
};

export default CustomerOrderTracking;
