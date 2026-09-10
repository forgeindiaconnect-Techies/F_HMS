import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Clock, RefreshCw, ChevronLeft, PhoneCall, Coffee, Utensils, 
    FileText, CheckCircle2, AlertCircle, ShoppingBag, BellRing, Star,
    Bike, MapPin, Store, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/axiosInstance';

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
    const [riderProgress, setRiderProgress] = useState(0);

    // Delivery Rating States
    const [speedRating, setSpeedRating] = useState(5);
    const [behaviourRating, setBehaviourRating] = useState(5);
    const [foodHandlingRating, setFoodHandlingRating] = useState(5);
    const [overallRating, setOverallRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isRatingLoading, setIsRatingLoading] = useState(false);

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

    useEffect(() => {
        if (!order) return;
        
        const isSelf = order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup';
        const isMoving = !isSelf && (
            ['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status) ||
            ['Picked Up', 'On the Way'].includes(order.deliveryStatus)
        );
        
        if (order.status === 'Delivered' || order.deliveryStatus === 'Delivered') {
            setRiderProgress(100);
        } else if (isMoving) {
            setRiderProgress(65);
        } else if (order.deliveryPartner || order.deliveryStatus === 'Accepted') {
            setRiderProgress(25);
        } else {
            setRiderProgress(0);
        }
    }, [order?.status, order?.deliveryStatus, order?.orderType, order?.deliveryPartner]);

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

    const getStatusStep = (status, deliveryStatus) => {
        if (isDelivery) {
            const st = String(status || '').trim();
            const delSt = String(deliveryStatus || '').trim();

            if (st === 'Delivered' || delSt === 'Delivered') return 3; // Step 4 (index 3): Delivered
            if (st === 'Out for Delivery' || delSt === 'On the Way' || delSt === 'Picked Up' || st === 'Picked Up') return 2; // Step 3 (index 2): Out for Delivery
            if (st === 'Preparing' || st === 'Accepted' || st === 'Ready' || st === 'Ready for Pickup') return 1; // Step 2 (index 1): Preparing
            return 0; // Step 1 (index 0): Order Placed
        }
        if (isSelfPickup) {
            if (status === 'Completed') return 5;
            if (status === 'Picked Up') return 4;
            if (['Ready for Pickup', 'Ready'].includes(status)) return 3;
            if (status === 'Preparing') return 2;
            if (status === 'Accepted') return 1;
            return 0;
        }
        if (['Served', 'Billing Requested', 'Delivered', 'Completed'].includes(status)) return 3;
        if (['Ready', 'Ready for Pickup'].includes(status)) return 2;
        if (['Preparing', 'Accepted'].includes(status)) return 1;
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

    const currentStep = getStatusStep(order.status, order.deliveryStatus);
    const stepsList = isDelivery ? [
        { title: 'Order Placed', desc: 'We have received your order. Awaiting kitchen accept.' },
        { title: 'Preparing Food', desc: 'Kitchen accepted & preparing your meal.' },
        { title: 'Out for Delivery', desc: 'Delivery partner claimed order and is on the way.' },
        { title: 'Delivered', desc: 'Food delivered safely! Enjoy your meal.' }
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
                
                {/* Progress Map Area (OpenStreetMap + Live Animated Delivery Route Integration) */}
                {isDelivery && (() => {
                    const isDelivered = order.status === 'Delivered' || order.status === 'Completed' || order.deliveryStatus === 'Delivered';
                    const isRiderMoving = ['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status) || ['Picked Up', 'On the Way'].includes(order.deliveryStatus);
                    const isRiderAssigned = Boolean(order.deliveryPartner || order.deliveryStatus === 'Accepted');
                    const currentProgress = isDelivered ? 100 : (isRiderMoving ? 65 : isRiderAssigned ? 25 : 0);

                    const pT = currentProgress / 100;
                    const invT = 1 - pT;
                    const riderLeft = invT * invT * 15 + 2 * invT * pT * 50 + pT * pT * 85;
                    const riderTop = invT * invT * 35 + 2 * invT * pT * 80 + pT * pT * 65;

                    return (
                        <div className="bg-slate-950 rounded-3xl h-80 relative overflow-hidden shadow-2xl flex flex-col border border-slate-800 w-full">
                            {/* OpenStreetMap Interactive Tile Layer */}
                            <iframe
                                title="OpenStreetMap Live Tracking"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=80.25%2C13.06%2C80.29%2C13.10&layer=mapnik&marker=13.0827%2C80.2707`}
                                className="w-full h-full opacity-50 filter invert-[0.9] hue-rotate-180 contrast-125"
                            />

                            {/* Dynamic Animated Route Path & Polyline Grid */}
                            <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                {/* Curved Planned Delivery Route */}
                                <path 
                                    d="M 150 210 Q 500 480 850 390" 
                                    stroke="#334155" 
                                    strokeWidth="8" 
                                    fill="none" 
                                    strokeDasharray="12,12" 
                                    strokeLinecap="round" 
                                />
                                {/* Active Dynamic Green Traveled Route */}
                                <path 
                                    d="M 150 210 Q 500 480 850 390" 
                                    stroke="#10b981" 
                                    strokeWidth="8" 
                                    fill="none" 
                                    strokeDasharray="800"
                                    strokeDashoffset={`${800 - (currentProgress / 100) * 800}`}
                                    strokeLinecap="round" 
                                    className="transition-all duration-700 ease-linear shadow-lg"
                                />
                            </svg>

                            {/* Restaurant Store Hub Pin */}
                            <div className="absolute top-[35%] left-[15%] -translate-x-1/2 -translate-y-1/2 text-center group z-20">
                                <div className="relative flex h-10 w-10 items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-xl border-2 border-slate-950 cursor-pointer hover:scale-110 transition-transform">
                                    <div className="absolute inset-0 rounded-2xl bg-orange-500 animate-ping opacity-30"></div>
                                    <Store size={18} />
                                </div>
                                <span className="block text-[8px] font-black text-white bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded shadow-md mt-1 uppercase tracking-widest leading-none">Hub Shop</span>
                            </div>

                            {/* Customer Home Pin */}
                            <div className="absolute top-[65%] left-[85%] -translate-x-1/2 -translate-y-1/2 text-center group z-20">
                                <div className="relative flex h-10 w-10 items-center justify-center bg-purple-600 text-white rounded-full shadow-xl border-2 border-slate-950 cursor-pointer hover:scale-110 transition-transform">
                                    <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-30"></div>
                                    <MapPin size={18} />
                                </div>
                                <span className="block text-[8px] font-black text-white bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded shadow-md mt-1 uppercase tracking-widest leading-none">Home</span>
                            </div>

                            {/* Moving Delivery Partner Marker */}
                            {(isRiderAssigned || isRiderMoving || isDelivered) ? (
                                <div 
                                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center z-30 transition-all duration-700 ease-out"
                                    style={{
                                        left: `${riderLeft}%`,
                                        top: `${riderTop}%`
                                    }}
                                >
                                    <div className="relative flex h-12 w-12 items-center justify-center bg-emerald-500 text-white rounded-full shadow-2xl border-2 border-slate-950">
                                        <div className="absolute -inset-1 rounded-full bg-emerald-400 animate-ping opacity-40"></div>
                                        <Bike size={20} className="animate-bounce" />
                                        <div className="absolute -bottom-1 -right-1 bg-slate-950 border border-slate-800 rounded-full p-0.5 text-emerald-400 shadow-md">
                                            <User size={9} className="fill-emerald-400/20" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/95 border border-emerald-500/40 px-2 py-0.5 rounded-xl shadow-2xl mt-1 whitespace-nowrap text-left flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wide">
                                            {(order.deliveryPartner && typeof order.deliveryPartner === 'object') ? (order.deliveryPartner.name || 'Rider') : 'Rider'} {isDelivered ? '• Arrived!' : isRiderMoving ? `• En Route (${Math.round(currentProgress)}%)` : '• Assigned'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 backdrop-blur shadow-2xl">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                    </span>
                                    <span className="text-xs text-slate-300 font-black uppercase tracking-wider">
                                        {order.status === 'Preparing' || order.status === 'Accepted' ? 'Kitchen Preparing Order...' : 'Awaiting Kitchen & Driver Dispatch...'}
                                    </span>
                                </div>
                            )}

                            {/* Live HUD Card (Top‑Left) */}
                            <div className="absolute top-4 left-4 z-30 bg-slate-900/95 border border-slate-800 p-3 rounded-2xl backdrop-blur text-left shadow-2xl flex flex-col gap-0.5 min-w-[140px]">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Live Tracking</span>
                                <h4 className="text-sm font-extrabold text-white leading-none mt-1">
                                    {isDelivered ? 'Arrived' : `${Math.max(1, Math.ceil(((order.deliveryDistance || 3.2) * 3) * (1 - currentProgress / 100)))} mins`}
                                </h4>
                                <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                    {isDelivered ? '0.0 km remaining' : `${Math.max(0.1, Number(((order.deliveryDistance || 3.2) * (1 - currentProgress / 100)).toFixed(1)))} km remaining`}
                                </p>
                            </div>
                        </div>
                    );
                })()}

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
                    <div className="relative pl-8 space-y-8">
                        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                        <div 
                            className="absolute left-3.5 top-2 w-0.5 bg-orange-500 transition-all duration-700 ease-in-out"
                            style={{ height: `${Math.min(100, (currentStep / (stepsList.length - 1)) * 100)}%` }}
                        ></div>
                        {stepsList.map((step, idx) => {
                            const isDone = idx < currentStep;
                            const isCurrent = idx === currentStep;
                            const isActiveOrDone = idx <= currentStep;

                            return (
                                <div key={idx} className="relative">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isDone 
                                        ? 'bg-green-600 border-green-600 text-white' 
                                        : isCurrent
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20 animate-pulse'
                                        : 'bg-white border-gray-200 text-gray-300'
                                    }`}>
                                        <CheckCircle2 size={14} className={isActiveOrDone ? 'opacity-100' : 'opacity-30'} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black transition-colors ${isCurrent ? 'text-orange-600' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</h4>
                                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Delivery Security Code (OTP) Card for Home Delivery */}
                {isDelivery && order.deliveryOtp && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 shadow-sm space-y-3 text-center backdrop-blur">
                        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <h3 className="font-black text-sm uppercase tracking-wider">Delivery Security Code</h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold">Share this 4-digit PIN with the delivery executive upon arrival to confirm delivery:</p>
                        <div className="bg-white dark:bg-slate-900 border border-amber-500/40 text-amber-600 dark:text-amber-400 py-3.5 px-6 rounded-2xl font-mono text-3xl font-black tracking-[0.4em] inline-block shadow-md">
                            {order.deliveryOtp}
                        </div>
                    </div>
                )}

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
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-orange-50 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 shrink-0 shadow-inner">
                                <User size={28} className="fill-orange-500/10" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Rider</p>
                                <h4 className="font-bold text-gray-900 text-lg">
                                    {(order.deliveryPartner && typeof order.deliveryPartner === 'object' ? order.deliveryPartner.name : order.deliveryPartner) || 'Delivery Executive'}
                                </h4>
                                <p className="text-sm text-gray-500">Vehicle: Bike • 4.9 ★</p>
                            </div>
                        </div>
                        <a 
                            href={`tel:${(order.deliveryPartner && typeof order.deliveryPartner === 'object' ? order.deliveryPartner.phoneNumber : null) || '1234567890'}`}
                            className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
                        >
                            <PhoneCall size={20} />
                        </a>
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
