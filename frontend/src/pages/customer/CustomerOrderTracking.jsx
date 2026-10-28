import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Clock, RefreshCw, ChevronLeft, PhoneCall, Coffee, Utensils, 
    FileText, CheckCircle2, AlertCircle, ShoppingBag, BellRing, Star,
    Bike, MapPin, Store, User, MessageSquare, Printer, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/axiosInstance';
import LiveOrderMap from '../../components/LiveOrderMap';
import { getOrderReadyTimeInfo } from '../../utils/orderReadyHelper';

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
                    } else if (msg.type === 'delivery_location_updated') {
                        setOrder(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                deliveryPartnerLocation: {
                                    latitude: msg.data.latitude,
                                    longitude: msg.data.longitude,
                                    updatedAt: msg.data.updatedAt
                                }
                            };
                        });
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
    const isSelfPickup = order?.orderType === 'Self-Pickup' || order?.orderType === 'Self Pickup' || order?.source === 'Self-Pickup' || order?.serviceType === 'Self-Pickup' || String(order?.orderType || '').toLowerCase().includes('pickup');
    const isSelfDineIn = !isSelfPickup && (order?.serviceType === 'Self Dine-In (KFC Style)' || String(order?.serviceType || '').toLowerCase().includes('self dine-in'));

    // Distinguish KDS orders vs physical KOT ticket-based orders
    const isKdsEnabled = order?.isKdsEnabled ?? (order?.restaurantId?.restaurantConfig?.orderKitchen?.kdsEnabled !== false);
    const isKdsOrder = !isDelivery && isKdsEnabled;
    const isKotOrder = !isDelivery && !isKdsEnabled;

    const handlePrintCustomerBill = () => {
        if (!order) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to view/print your bill receipt.');
            return;
        }
        const items = order.orderItems || [];
        const itemsHtml = items.map(item => `
            <tr style="border-bottom: 1px dashed #ddd;">
                <td style="padding: 6px 0; font-weight: bold;">${item.qty}x ${item.name}</td>
                <td style="text-align: right; padding: 6px 0; font-family: monospace;">₹${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
            </tr>
        `).join('');

        const subtotal = items.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0);
        const tax = order.taxPrice || 0;
        const tip = order.tipAmount || 0;
        const total = order.totalPrice || (subtotal + tax + tip);
        const ticketNum = order._id ? String(order._id).slice(-5).toUpperCase() : 'ORDER';
        const kotNum = order.kotNumbers?.[0] || order.kots?.[0]?.kotNumber || `KOT-${ticketNum}`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Bill Receipt #${ticketNum}</title>
                    <style>
                        @page { size: 80mm auto; margin: 4mm; }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 78mm;
                            max-width: 78mm;
                            margin: 0 auto;
                            padding: 8px 4px;
                            font-size: 13px;
                            line-height: 1.3;
                        }
                        .center { text-align: center; }
                        .line { border-bottom: 1px dashed #000; margin: 8px 0; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h2 style="margin: 0; font-size: 18px; font-weight: 900;">RESTOSYS DINING</h2>
                        <p style="margin: 3px 0; font-weight: bold;">CUSTOMER BILL RECEIPT</p>
                        <p style="margin: 2px 0;">Order #${ticketNum} • ${kotNum}</p>
                        <p style="margin: 2px 0; font-weight: bold;">${order.orderType || 'Dine In'} ${order.tableNumber ? `• Table ${order.tableNumber}` : ''}</p>
                        ${order.customerName ? `<p style="margin: 2px 0;">Guest: ${order.customerName}</p>` : ''}
                    </div>
                    <div class="line"></div>
                    <table>
                        ${itemsHtml}
                    </table>
                    <div class="line"></div>
                    <table>
                        <tr><td>Subtotal</td><td style="text-align: right;">₹${subtotal.toFixed(2)}</td></tr>
                        ${tax > 0 ? `<tr><td>Tax</td><td style="text-align: right;">₹${tax.toFixed(2)}</td></tr>` : ''}
                        ${tip > 0 ? `<tr><td>Staff Gratuity / Tip</td><td style="text-align: right;">₹${tip.toFixed(2)}</td></tr>` : ''}
                        <tr style="font-weight: 900; font-size: 15px;"><td>Total Amount</td><td style="text-align: right;">₹${total.toFixed(2)}</td></tr>
                    </table>
                    <div class="line"></div>
                    <div class="center" style="font-size: 11px;">
                        Payment Method: ${order.paymentMethod || 'Pay at Counter / Waiter'}<br/>
                        Settlement: ${order.isPaid ? 'PAID & SETTLED' : 'PAYMENT DUE'}<br/>
                        Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}<br/><br/>
                        Thank you for dining with us!
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getStatusStep = (status, deliveryStatus) => {
        if (isDelivery) {
            const st = String(status || '').trim();
            const delSt = String(deliveryStatus || '').trim();

            if (st === 'Delivered' || delSt === 'Delivered') return 3; // Step 4 (index 3): Delivered
            if (st === 'Out for Delivery' || delSt === 'On the Way' || delSt === 'Picked Up' || st === 'Picked Up') return 2; // Step 3 (index 2): Out for Delivery
            if (st === 'Preparing' || st === 'Accepted' || st === 'Ready' || st === 'Ready for Pickup' || st === 'Ready for Dispatch') return 1; // Step 2 (index 1): Preparing
            return 0; // Step 1 (index 0): Order Placed
        }
        if (isSelfPickup || isSelfDineIn) {
            if (status === 'Completed') return 5;
            if (status === 'Picked Up' || status === 'Served') return 4;
            if (['Ready for Pickup', 'Ready', 'Ready at Counter'].includes(status)) return 3;
            if (status === 'Preparing') return 2;
            if (status === 'Accepted') return 1;
            return 0;
        }
        if (['Served', 'Billing Requested', 'Delivered', 'Completed'].includes(status)) return 3;
        if (['Ready', 'Ready for Pickup', 'Ready for Dispatch'].includes(status)) return 2;
        if (['Preparing', 'Accepted'].includes(status)) return 1;
        return 0;
    };

    const handleBack = () => {
        const hasCustomerToken = localStorage.getItem('restosys_customer_user');
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else if (hasCustomerToken) {
            navigate('/profile');
        } else if (restaurantId) {
            navigate(`/customer/menu?restaurantId=${restaurantId}&branchId=${branchId || ''}&tableNumber=${tableNumber || ''}`);
        } else {
            navigate('/');
        }
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
                    onClick={handleBack}
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
        { title: 'Preparing Food', desc: 'Chef is cooking your takeaway meal' },
        { title: 'Food Packed', desc: 'Food packed & waiting at pickup counter' },
        { title: 'Ready for Pickup', desc: 'Please collect it from the pickup counter!' },
        { title: 'Collected', desc: 'Enjoy your takeaway meal!' }
    ] : isSelfDineIn ? [
        { title: 'Order Received', desc: 'Awaiting kitchen accept' },
        { title: 'Accepted', desc: 'Chef accepted your order' },
        { title: 'Preparing Food', desc: 'Chef is cooking and plating your tray' },
        { title: 'Tray Plated', desc: 'Food tray ready at counter' },
        { title: 'Ready at Counter', desc: 'Token called! Collect your food tray from counter' },
        { title: 'Collected & Seated', desc: 'Enjoy your dine-in meal!' }
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
                    onClick={handleBack}
                    className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50"
                    title="Go Back"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-sm font-black text-gray-950">Live Order Status</h1>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Order: #{order._id.substring(order._id.length - 4).toUpperCase()}</p>
                    {order.customerName && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1 inline-block">
                            Guest: {order.customerName}
                        </span>
                    )}
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
                
                {/* Dining Service Mode Banner */}
                {!isDelivery && (
                    <div className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between gap-3 ${
                        isSelfPickup 
                            ? 'bg-amber-50/90 border-amber-200 text-amber-900' 
                            : isSelfDineIn
                            ? 'bg-orange-50/90 border-orange-200 text-orange-950'
                            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    }`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                isSelfPickup 
                                    ? 'bg-amber-500 text-white' 
                                    : isSelfDineIn
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-emerald-600 text-white'
                            }`}>
                                {isSelfPickup ? <Store size={20} /> : isSelfDineIn ? <ShoppingBag size={20} /> : <Utensils size={20} />}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-xs truncate">
                                        {isSelfPickup 
                                            ? 'Self-Pickup (Takeaway)' 
                                            : isSelfDineIn 
                                            ? 'Self Dine-In (KFC Style)' 
                                            : (order.serviceType || 'Waiter Table Service')}
                                    </span>
                                    {order.tableNumber && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-current shrink-0">
                                            Table {order.tableNumber}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                                    {isSelfPickup 
                                        ? 'Please collect your packed order from the pickup counter when ready.' 
                                        : isSelfDineIn
                                        ? 'Please collect your tray from the food counter when your token is called.'
                                        : 'Relax at your table. Our waiter will bring your food to you.'}
                                </p>
                            </div>
                        </div>
                        {order.isPaid ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                                Paid ({order.paymentMethod || 'Online'})
                            </span>
                        ) : (
                            <span className="text-[10px] bg-white text-slate-700 font-black px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
                                {order.paymentMethod || 'Pay Later'}
                            </span>
                        )}
                    </div>
                )}
                
                {/* Progress Map Area (Leaflet + OpenStreetMap + Real OSRM Road Routing) */}
                {isDelivery && (
                    <LiveOrderMap
                        customerLocation={order.customerLocation}
                        restaurantLocation={order.restaurantLocation}
                        deliveryPartnerLocation={order.deliveryPartnerLocation}
                        orderStatus={order.status}
                        deliveryStatus={order.deliveryStatus}
                        deliveryPartnerName={(order.deliveryPartner && typeof order.deliveryPartner === 'object') ? order.deliveryPartner.name : 'Rider'}
                        height="340px"
                    />
                )}

                {/* Estimated Order Ready Time Live Widget (For KDS / Delivery) */}
                {(isDelivery || isKdsOrder) && (() => {
                    const readyInfo = getOrderReadyTimeInfo(order);
                    if (!readyInfo) return null;

                    if (readyInfo.isReady) {
                        return (
                            <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-3xl p-5 shadow-lg border border-emerald-400/40 animate-pulse flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                                        <BellRing size={24} className="text-white animate-bounce" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 block">
                                            Order is Ready
                                        </span>
                                        <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                                            {readyInfo.label}
                                        </h3>
                                        <p className="text-xs text-emerald-100/90 mt-0.5 font-medium">
                                            {readyInfo.pickupPrompt}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white text-emerald-900 px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 shadow-sm">
                                    Ready Now
                                </div>
                            </div>
                        );
                    }

                    if (readyInfo.isPreparing) {
                        return (
                            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-3xl p-5 border border-amber-300/80 shadow-sm space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                                            <Clock size={22} className="animate-spin" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                                                Estimated Order Ready Time
                                            </span>
                                            <h3 className="text-base sm:text-lg font-black text-amber-950">
                                                {readyInfo.label}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs">
                                        <span className="text-[9px] text-amber-800/80 font-bold uppercase tracking-wider block">Ready By</span>
                                        <span className="text-xs sm:text-sm font-black text-amber-950 font-mono">
                                            {readyInfo.exactReadyTime}
                                        </span>
                                    </div>
                                </div>

                                {/* Preparation Progress Bar */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                                            style={{ width: `${readyInfo.progressPercent}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-amber-800 font-semibold px-0.5">
                                        <span>Cooking in Kitchen</span>
                                        <span>Estimated Prep: ~{readyInfo.prepMinutes} mins</span>
                                        <span className="font-bold text-amber-950">{readyInfo.exactReadyTime}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80">
                                    {readyInfo.pickupPrompt}
                                </p>
                            </div>
                        );
                    }

                    return null;
                })()}

                {/* Digital Interactive Steps Timeline */}
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

                {/* Counter Pickup / Verification Card (for Takeaway & Self Dine-In) */}
                {(isSelfPickup || isSelfDineIn) && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 text-center">
                        <div className="border-b border-gray-100 pb-3">
                            <h3 className="font-black text-gray-900 text-sm">
                                {isSelfPickup ? 'Self-Pickup Counter Token' : 'Self Dine-In Token'}
                            </h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {isSelfPickup 
                                    ? 'Present this Order ID or QR Code at the pickup counter to collect your takeaway.' 
                                    : 'Present this Order ID or QR Code at the counter when your token is called to collect your tray.'}
                            </p>
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
                            TOKEN / ORDER ID: #{String(order._id).slice(-6).toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Table Quick Requests (Only for Waiter Table Service) */}
                {!isDelivery && !isSelfPickup && !isSelfDineIn && (
                    <div className="space-y-3 min-w-0 pr-1.5 flex-1">
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

                {/* Rider Support Live Updates */}
                {Array.isArray(order.supportMessages) && order.supportMessages.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 shadow-sm space-y-3 animate-in slide-in-from-bottom-4 text-left">
                        <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm uppercase tracking-wider">
                            <MessageSquare size={18} className="text-purple-600 animate-pulse" />
                            <span>Rider Live Updates</span>
                        </div>
                        <div className="space-y-2 min-w-0 pr-1.5 flex-1">
                            {order.supportMessages.map((msg, mIdx) => (
                                <div key={mIdx} className="bg-white/80 backdrop-blur p-3 rounded-2xl border border-purple-100 flex items-start justify-between gap-3 shadow-xs">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{msg.message}</p>
                                        <span className="text-[10px] text-purple-600 font-semibold">From Delivery Partner</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery Star Rating Form */}
                {isDelivery && order.status === 'Delivered' && (!order.deliveryRating || order.deliveryRating.overall === 0) && (
                    <form onSubmit={handleSubmitRating} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Rate your Delivery</h3>
                            <p className="text-[10px] text-gray-400">Share your feedback to help us improve service quality.</p>
                        </div>
                        
                        <div className="space-y-3 min-w-0 pr-1.5 flex-1">
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
                    <div className="space-y-3 min-w-0 pr-1.5 flex-1">
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
