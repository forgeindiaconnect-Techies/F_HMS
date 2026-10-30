import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    CheckCircle, ChefHat, Bike, PackageOpen, ChevronLeft, Phone, 
    Store, User, ShieldCheck, KeyRound, MessageSquare, Clock, BellRing, 
    Utensils, PhoneCall, Droplets, ShoppingBag, RefreshCw, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import LiveOrderMap from '../../components/LiveOrderMap';
import { getOrderReadyTimeInfo } from '../../utils/orderReadyHelper';

const OrderTracking = () => {
    const { id } = useParams();
    const { api } = useCustomerAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [progress, setProgress] = useState(1); // 1: Received, 2: Preparing, 3: Next Step, 4: Final Step
    const [requestLoading, setRequestLoading] = useState(null);

    const fetchOrder = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const { data } = await api.get(`/orders/${id}`);
            setOrder(data);

            const isDeliveryOrder = data.orderType === 'Delivery';
            const isSelfOrder = data.orderType === 'Self-Pickup' || data.orderType === 'Self Pickup' || data.serviceType === 'Self Dine-In (KFC Style)';
            const isDineInOrder = !isDeliveryOrder && !isSelfOrder;

            if (isDineInOrder) {
                if (['Served', 'Billing Requested', 'Completed', 'Delivered'].includes(data.status)) setProgress(4);
                else if (['Ready', 'Ready for Pickup', 'Food Prepared'].includes(data.status)) setProgress(3);
                else if (['Preparing', 'Accepted', 'In the Kitchen'].includes(data.status)) setProgress(2);
                else setProgress(1);
            } else if (isSelfOrder) {
                if (data.status === 'Completed' || data.status === 'Picked Up') setProgress(4);
                else if (['Ready for Pickup', 'Ready', 'Food Prepared'].includes(data.status)) setProgress(3);
                else if (['Preparing', 'Accepted'].includes(data.status)) setProgress(2);
                else setProgress(1);
            } else {
                const st = String(data.status || '').trim();
                const delSt = String(data.deliveryStatus || '').trim();

                if (st === 'Delivered' || delSt === 'Delivered') {
                    setProgress(4);
                } else if (st === 'Out for Delivery' || delSt === 'On the Way' || delSt === 'Picked Up' || st === 'Picked Up') {
                    setProgress(3);
                } else if (st === 'Preparing' || st === 'Accepted' || st === 'Ready' || st === 'Ready for Pickup') {
                    setProgress(2);
                } else {
                    setProgress(1);
                }
            }
        } catch (error) {
            console.error('Failed to fetch order details', error);
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    }, [id, api]);

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(() => fetchOrder(false), 5000);
        return () => clearInterval(interval);
    }, [fetchOrder]);

    const handleServiceRequest = async (requestType) => {
        if (!order) return;
        const rId = order.restaurantId?._id || order.restaurantId;
        const bId = order.branchId?._id || order.branchId;
        const tableNum = order.tableNumber || 1;

        if (!rId) {
            toast.error("Restaurant details not found.");
            return;
        }

        setRequestLoading(requestType);
        try {
            await api.post('/service-requests', {
                restaurantId: rId,
                branchId: bId,
                tableNumber: tableNum,
                requestType
            });
            toast.success(`${requestType} sent to service staff!`);
        } catch (error) {
            console.error("Service request error", error);
            toast.error("Could not notify staff. Please call a server.");
        } finally {
            setRequestLoading(null);
        }
    };

    const st = String(order?.status || '').trim();
    const delSt = String(order?.deliveryStatus || '').trim();

    const isDelivery = order?.orderType === 'Delivery';
    const isSelfPickup = order && (order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup' || order.serviceType === 'Self Dine-In (KFC Style)');
    const isDineIn = !isDelivery && !isSelfPickup;
    const isCod = ['cash on delivery', 'cod', 'cash'].some(m => String(order?.paymentMethod || '').toLowerCase().includes(m));
    const isCounter = ['counter', 'pay at counter'].some(m => String(order?.paymentMethod || '').toLowerCase().includes(m));

    const isDelivered = st === 'Delivered' || delSt === 'Delivered';
    const riderName = (order?.deliveryPartner && typeof order.deliveryPartner === 'object') ? (order.deliveryPartner.name || 'Delivery Partner') : 'Delivery Partner';
    const vehicleModel = (order?.deliveryPartner && typeof order.deliveryPartner === 'object') ? (order.deliveryPartner.vehicleDetails?.model || '') : '';

    const steps = isDineIn ? [
        { num: 1, title: 'Order Received', desc: 'Your order is confirmed and sent to the kitchen.', icon: PackageOpen },
        { num: 2, title: 'In the Kitchen', desc: 'Our chefs are cooking your fresh dishes.', icon: ChefHat },
        { num: 3, title: 'Ready to Serve', desc: 'Dishes are plated and being served to your table.', icon: Utensils },
        { num: 4, title: 'Served on Table', desc: 'Food served! Enjoy your delicious meal.', icon: CheckCircle }
    ] : isSelfPickup ? [
        { num: 1, title: 'Order Received', desc: 'We have received your order.', icon: PackageOpen },
        { num: 2, title: 'Preparing Food', desc: 'The kitchen is preparing your meal.', icon: ChefHat },
        { num: 3, title: 'Ready for Pickup', desc: 'Please collect it from the Pickup Counter.', icon: PackageOpen },
        { num: 4, title: 'Completed', desc: 'Thank you! Enjoy your meal.', icon: CheckCircle }
    ] : [
        { num: 1, title: 'Order Placed', desc: 'We have received your order. Awaiting kitchen accept.', icon: PackageOpen },
        { num: 2, title: 'Preparing Food', desc: 'Kitchen accepted & preparing your meal.', icon: ChefHat },
        { num: 3, title: 'Out for Delivery', desc: 'Delivery partner claimed order and is on the way.', icon: Bike },
        { num: 4, title: 'Delivered', desc: 'Food delivered safely! Enjoy your meal.', icon: CheckCircle }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-gray-500 dark:text-slate-400">Loading live order tracking...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Not Found</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">We couldn't retrieve the live details for order #{id}.</p>
                <Link 
                    to="/profile"
                    className="mt-6 bg-gray-950 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm"
                >
                    Back to My Account
                </Link>
            </div>
        );
    }

    const readyInfo = getOrderReadyTimeInfo(order);

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-10 pb-24 text-gray-800 dark:text-slate-100 transition-colors">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Top Header */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/profile" 
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:text-orange-600 dark:hover:text-orange-400 transition-colors shrink-0"
                            title="Back to Customer Dashboard"
                        >
                            <ChevronLeft size={22} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-sans tracking-tight">
                                    Track Order #{order._id.substring(order._id.length - 6).toUpperCase()}
                                </h1>
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                    isDelivery 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' 
                                        : isSelfPickup 
                                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                }`}>
                                    {isDelivery ? 'Home Delivery' : isSelfPickup ? 'Self-Pickup' : `Dine-In • Table ${order.tableNumber || 'Assigned'}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap mt-1">
                                <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm">
                                    {isDineIn ? 'Dining Service: ' : isSelfPickup ? 'Order Method: ' : 'Estimated Delivery: '}
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {isDineIn 
                                            ? `Table Service (${order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'})` 
                                            : isSelfPickup 
                                            ? 'Pickup at Counter' 
                                            : `${order.deliveryDistance ? Math.max(5, Math.ceil(order.deliveryDistance * 3)) : 15} mins`}
                                    </span>
                                </p>
                                {readyInfo && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                        readyInfo.isReady 
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
                                            : readyInfo.isPreparing
                                            ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
                                            : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}>
                                        <Clock size={12} className={readyInfo.isPreparing ? 'text-amber-600 animate-spin' : ''} />
                                        {readyInfo.isReady ? 'Food Ready Now' : `Ready: ${readyInfo.label} (by ${readyInfo.exactReadyTime})`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => fetchOrder(true)}
                        className={`p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors shrink-0 ${refreshing ? 'animate-spin text-orange-600' : ''}`}
                        title="Refresh Status"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Kitchen Order Ready Time Live Widget */}
                {(() => {
                    if (!readyInfo || readyInfo.isCompleted || readyInfo.isCancelled) return null;

                    if (readyInfo.isReady) {
                        return (
                            <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-3xl p-5 mb-8 shadow-lg border border-emerald-400/40 animate-pulse flex items-center justify-between gap-4">
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

                    return (
                        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl p-5 mb-8 border border-amber-300/80 dark:border-amber-500/30 shadow-sm space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                                        <Clock size={22} className="animate-spin" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                                            Estimated Order Ready Time
                                        </span>
                                        <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-100">
                                            {readyInfo.label}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-right bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-slate-700 shadow-xs">
                                    <span className="text-[9px] text-amber-800/80 dark:text-amber-400 font-bold uppercase tracking-wider block">Ready By</span>
                                    <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 font-mono">
                                        {readyInfo.exactReadyTime}
                                    </span>
                                </div>
                            </div>

                            {/* Preparation Progress Bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="h-2 w-full bg-amber-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                                        style={{ width: `${readyInfo.progressPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-amber-800 dark:text-amber-400 font-semibold px-0.5">
                                    <span>Chef Preparing in Kitchen</span>
                                    <span>Total Prep: ~{readyInfo.prepMinutes} mins</span>
                                    <span className="font-bold text-amber-950 dark:text-amber-200">{readyInfo.exactReadyTime}</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-amber-800/90 dark:text-amber-300 font-medium leading-relaxed bg-amber-50/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-amber-100/80 dark:border-slate-700">
                                {readyInfo.pickupPrompt}
                            </p>
                        </div>
                    );
                })()}

                {/* Delivery Verification OTP Banner */}
                {isDelivery && order.deliveryOtp && !isDelivered && (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 mb-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-300/40 relative overflow-hidden">
                        <div className="flex items-center gap-4 text-left relative z-10">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
                                <ShieldCheck size={30} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 flex items-center gap-1">
                                    <KeyRound size={12} /> Delivery Security Code
                                </span>
                                <h3 className="text-lg font-black text-white mt-0.5">Share OTP Upon Delivery</h3>
                                <p className="text-xs text-amber-50 opacity-90">Give this 4-digit code to your delivery executive when your food arrives.</p>
                            </div>
                        </div>
                        <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-3xl tracking-[0.35em] shadow-lg shrink-0 border-2 border-amber-200 font-mono relative z-10">
                            {order.deliveryOtp}
                        </div>
                    </div>
                )}

                {/* Hero Status Card (Tailored to order category) */}
                <div className="mb-8">
                    {isDelivery ? (
                        <LiveOrderMap
                            customerLocation={order.customerLocation}
                            restaurantLocation={order.restaurantLocation}
                            deliveryPartnerLocation={order.deliveryPartnerLocation}
                            orderStatus={order.status}
                            deliveryStatus={order.deliveryStatus}
                            deliveryPartnerName={riderName}
                            height="340px"
                        />
                    ) : isSelfPickup ? (
                        /* Self-Pickup Hero */
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex items-center justify-center gap-6 shadow-md">
                            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse shrink-0">
                                {progress === 1 && <PackageOpen size={32} />}
                                {progress === 2 && <ChefHat size={32} />}
                                {progress === 3 && <Store size={32} />}
                                {progress === 4 && <CheckCircle size={32} />}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Self-Pickup Status</p>
                                <h2 className="text-xl font-bold text-white font-sans">{steps[progress - 1].title}</h2>
                                <p className="text-xs text-slate-300 mt-1">{steps[progress - 1].desc}</p>
                            </div>
                        </div>
                    ) : (
                        /* Dine-In Hero Card */
                        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-7 rounded-3xl shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-5">
                            <div className="flex items-center gap-5 w-full sm:w-auto">
                                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                                    {progress === 1 && <PackageOpen size={32} />}
                                    {progress === 2 && <ChefHat size={32} className="animate-bounce" />}
                                    {progress === 3 && <Utensils size={32} className="animate-pulse" />}
                                    {progress === 4 && <CheckCircle size={32} className="text-emerald-400" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                                            Table Service • {order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-white font-sans">{steps[progress - 1].title}</h2>
                                    <p className="text-xs text-slate-300 mt-1 max-w-sm">{steps[progress - 1].desc}</p>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur border border-white/10 px-4 py-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Restaurant Outlet</span>
                                <span className="text-sm font-bold text-white block mt-0.5">{order.restaurantId?.name || 'Restaurant Dining'}</span>
                                <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                                    {order.isPaid ? '✓ Bill Paid' : (isCod ? '💵 Cash on Delivery' : 'Payment at Counter / Waiter')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dine-In Assistance Controls */}
                {isDineIn && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-8 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">Need Table Assistance?</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Alert your service waiter directly from your mobile screen.</p>
                            </div>
                            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                Table {order.tableNumber || '1'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => handleServiceRequest('Call Waiter')}
                                disabled={requestLoading !== null}
                                className="p-3.5 bg-gray-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 border border-gray-200 dark:border-slate-700 rounded-2xl transition-all flex items-center justify-center gap-2.5 font-bold text-xs text-gray-800 dark:text-slate-200 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                                <PhoneCall size={16} className="text-orange-600" />
                                <span>{requestLoading === 'Call Waiter' ? 'Alerting...' : 'Call Waiter'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleServiceRequest('Need Water')}
                                disabled={requestLoading !== null}
                                className="p-3.5 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 border border-gray-200 dark:border-slate-700 rounded-2xl transition-all flex items-center justify-center gap-2.5 font-bold text-xs text-gray-800 dark:text-slate-200 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                                <Droplets size={16} className="text-blue-600" />
                                <span>{requestLoading === 'Need Water' ? 'Requesting...' : 'Request Water'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
                    <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-slate-800">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 block">Live Progress</span>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white font-sans mt-0.5">Order Status Steps</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[23px] top-[24px] bottom-[24px] w-1 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                        <div 
                            className="absolute left-[23px] top-[24px] bottom-[24px] w-1 bg-gradient-to-b from-orange-500 to-emerald-500 rounded-full transition-all duration-700 ease-in-out overflow-hidden"
                            style={{ height: `${Math.max(0, Math.min(100, (progress - 1) * 33.33))}%` }}
                        ></div>

                        <div className="space-y-10 min-w-0 pr-1.5 flex-1">
                            {steps.map((step, idx) => {
                                const isCompleted = progress > step.num;
                                const isCurrent = progress === step.num;
                                const isActiveOrDone = progress >= step.num;
                                const Icon = step.icon;
                                
                                return (
                                    <div key={idx} className={`relative flex gap-6 ${isActiveOrDone ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative z-10 transition-colors duration-500 ${
                                            isCompleted 
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                            : isCurrent
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700'
                                        }`}>
                                            <Icon size={22} />
                                        </div>
                                        <div>
                                            <h3 className={`text-base font-bold font-sans ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Delivery Driver Info Card */}
                {isDelivery && order.deliveryPartner && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between mb-8 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/40 rounded-2xl border border-orange-200 dark:border-orange-800/40 flex items-center justify-center text-orange-500 shrink-0 shadow-inner">
                                <User size={28} className="fill-orange-500/10" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Your Rider</p>
                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{(order.deliveryPartner && typeof order.deliveryPartner === 'object' ? order.deliveryPartner.name : order.deliveryPartner) || 'Delivery Executive'}</h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {vehicleModel ? `Vehicle: ${vehicleModel} • 4.9 ★` : 'Assigned Delivery Partner • 4.9 ★'}
                                </p>
                            </div>
                        </div>
                        <a 
                            href={`tel:${(order.deliveryPartner && typeof order.deliveryPartner === 'object' ? order.deliveryPartner.phoneNumber : null) || '1234567890'}`}
                            className="w-12 h-12 bg-green-50 dark:bg-green-950/60 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors shadow-xs"
                        >
                            <Phone size={20} />
                        </a>
                    </div>
                )}

                {/* Rider Support Live Updates */}
                {Array.isArray(order.supportMessages) && order.supportMessages.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/40 rounded-3xl p-6 shadow-sm space-y-3 mb-8 animate-in slide-in-from-bottom-4 text-left">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-extrabold text-sm uppercase tracking-wider">
                            <MessageSquare size={18} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                            <span>Rider Live Updates</span>
                        </div>
                        <div className="space-y-2 min-w-0 pr-1.5 flex-1">
                            {order.supportMessages.map((msg, mIdx) => (
                                <div key={mIdx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur p-3 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex items-start justify-between gap-3 shadow-xs">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{msg.message}</p>
                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">From Delivery Partner</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ordered Items Summary Card */}
                {Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-8 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={18} className="text-orange-600" />
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Items Ordered ({order.orderItems.length})</h3>
                            </div>
                            {order.isPaid ? (
                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    ✓ Paid & Settled
                                </span>
                            ) : isCod ? (
                                <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                                    💵 Cash on Delivery (₹{(order.totalPrice || 0).toFixed(2)} Due)
                                </span>
                            ) : isCounter || isSelfPickup ? (
                                <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                                    💳 Pay at Counter (₹{(order.totalPrice || 0).toFixed(2)} Due)
                                </span>
                            ) : (
                                <span className="text-xs font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                                    Payment Due: ₹{(order.totalPrice || 0).toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {order.orderItems.map((item, idx) => (
                                <div key={idx} className="py-2.5 flex justify-between items-start text-xs sm:text-sm">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{item.qty}x {item.name}</p>
                                        {item.notes && <p className="text-[11px] text-orange-500 italic mt-0.5">Note: {item.notes}</p>}
                                    </div>
                                    <span className="font-mono font-bold text-gray-700 dark:text-slate-300">
                                        ₹{((item.price || 0) * (item.qty || 1)).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-1.5 text-xs text-gray-500 dark:text-slate-400">
                            <div className="flex justify-between items-center">
                                <span>Payment Method</span>
                                <span className="font-bold text-gray-900 dark:text-white">{order.paymentMethod || (isDelivery ? 'Cash on Delivery' : 'Pay at Counter')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Payment Status</span>
                                <span className={`font-bold ${order.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {order.isPaid ? 'Paid & Settled' : (isCod ? 'Pay in Cash upon Delivery' : 'Payment Due at Counter')}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
                            <span>Total Bill</span>
                            <span className="text-base text-orange-600 font-mono">₹{(order.totalPrice || 0).toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        to="/profile"
                        className="flex-1 py-3.5 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all text-center text-xs sm:text-sm shadow-sm"
                    >
                        Back to My Account
                    </Link>
                    <Link
                        to="/explore"
                        className="flex-1 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all text-center text-xs sm:text-sm shadow-lg shadow-orange-600/20"
                    >
                        Order More Food
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default OrderTracking;
