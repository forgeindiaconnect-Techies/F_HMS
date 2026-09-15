import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ChefHat, Bike, PackageOpen, ChevronLeft, Phone, MapPin, Store, User, ShieldCheck, KeyRound, MessageSquare } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import LiveOrderMap from '../../components/LiveOrderMap';

const OrderTracking = () => {
    const { id } = useParams();
    const { api } = useCustomerAuth();
    const [order, setOrder] = useState(null);
    const [progress, setProgress] = useState(1); // 1: Received, 2: Preparing, 3: Next Step, 4: Final Step
    const [riderProgress, setRiderProgress] = useState(0);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
                
                // Map status to progress dynamically step-by-step
                const isSelf = data.orderType === 'Self-Pickup' || data.orderType === 'Self Pickup';
                if (isSelf) {
                    if (data.status === 'Completed') setProgress(4);
                    else if (data.status === 'Picked Up' || data.status === 'Ready for Pickup' || data.status === 'Ready') setProgress(3);
                    else if (data.status === 'Preparing' || data.status === 'Accepted') setProgress(2);
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
                        // Step 1: Order Placed (Pending)
                        setProgress(1);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch order details', error);
            }
        };

        fetchOrder();
        const interval = setInterval(fetchOrder, 5000); // Poll every 5s for live tracking
        return () => clearInterval(interval);
    }, [id, api]);

    const st = String(order?.status || '').trim();
    const delSt = String(order?.deliveryStatus || '').trim();

    const isSelfPickup = order && (order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup');
    const isRiderAssigned = Boolean(order?.deliveryPartner || delSt === 'Accepted');
    const isRiderMoving = ['Picked Up', 'On the Way', 'Out for Delivery'].includes(st) || ['Picked Up', 'On the Way'].includes(delSt);
    const isDelivered = st === 'Delivered' || delSt === 'Delivered';
    const riderName = (order?.deliveryPartner && typeof order.deliveryPartner === 'object') ? (order.deliveryPartner.name || 'Delivery Partner') : 'Delivery Partner';
    const vehicleModel = (order?.deliveryPartner && typeof order.deliveryPartner === 'object') ? (order.deliveryPartner.vehicleDetails?.model || '') : '';
    
    // Exact progress percent for map polyline and rider pin position
    const currentProgress = isDelivered ? 100 : (isRiderMoving ? 65 : isRiderAssigned ? 25 : 0);

    // Calculate Bezier curve (15, 35) -> (50, 80) -> (85, 65) position for rider bike marker
    const pT = currentProgress / 100;
    const invT = 1 - pT;
    const riderLeft = invT * invT * 15 + 2 * invT * pT * 50 + pT * pT * 85;
    const riderTop = invT * invT * 35 + 2 * invT * pT * 80 + pT * pT * 65;

    const steps = isSelfPickup ? [
        { num: 1, title: 'Order Received', desc: 'We have received your order.', icon: PackageOpen },
        { num: 2, title: 'Preparing', desc: 'The kitchen is preparing your food.', icon: ChefHat },
        { num: 3, title: 'Ready for Pickup', desc: 'Please collect it from the Pickup Counter.', icon: PackageOpen },
        { num: 4, title: 'Completed', desc: 'Thank you! Enjoy your meal.', icon: CheckCircle }
    ] : [
        { num: 1, title: 'Order Placed', desc: 'We have received your order. Awaiting kitchen accept.', icon: PackageOpen },
        { num: 2, title: 'Preparing Food', desc: 'Kitchen accepted & preparing your meal.', icon: ChefHat },
        { num: 3, title: 'Out for Delivery', desc: 'Delivery partner claimed order and is on the way.', icon: Bike },
        { num: 4, title: 'Delivered', desc: 'Food delivered safely! Enjoy your meal.', icon: CheckCircle }
    ];

    return (
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-10 pb-24 text-gray-800 dark:text-slate-100 transition-colors">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/profile" className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">
                            Track Order #{order ? order._id.substring(order._id.length - 6).toUpperCase() : (id ? id.substring(id.length - 6).toUpperCase() : '')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400">
                            {isSelfPickup ? 'Order Method: ' : 'Estimated Delivery: '}
                            <span className="font-bold text-gray-900 dark:text-white">
                                {isSelfPickup ? 'Self-Pickup at Counter' : `${order?.deliveryDistance ? Math.max(5, Math.ceil(order.deliveryDistance * 3)) : 15} mins`}
                            </span>
                        </p>
                    </div>
                </div>

                {!order ? (
                    <div className="text-center py-20 text-gray-500 dark:text-slate-400">Loading tracking data...</div>
                ) : (
                <>

                {/* Delivery Verification OTP Banner */}
                {!isSelfPickup && order.deliveryOtp && !isDelivered && (
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

                {/* Progress Map Area (Leaflet + OpenStreetMap + Real OSRM Road Routing) */}
                <div className="mb-8">
                    {!isSelfPickup ? (
                        <LiveOrderMap
                            customerLocation={order.customerLocation}
                            restaurantLocation={order.restaurantLocation}
                            deliveryPartnerLocation={order.deliveryPartnerLocation}
                            orderStatus={order.status}
                            deliveryStatus={order.deliveryStatus}
                            deliveryPartnerName={riderName}
                            height="340px"
                        />
                    ) : (
                        /* Self-Pickup Tracking Area */
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex items-center justify-center gap-6">
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse shrink-0">
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
                    )}
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
                    <div className="relative">
                        {/* Connecting Line - Anchored exactly between top and bottom step circle centers */}
                        <div className="absolute left-[23px] top-[24px] bottom-[24px] w-1 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                        <div 
                            className="absolute left-[23px] top-[24px] bottom-[24px] w-1 bg-orange-500 rounded-full transition-all duration-700 ease-in-out overflow-hidden"
                            style={{ height: `${Math.max(0, Math.min(100, (progress - 1) * 33.33))}%` }}
                        ></div>

                        <div className="space-y-12">
                            {steps.map((step, idx) => {
                                const isCompleted = progress > step.num;
                                const isCurrent = progress === step.num;
                                const isActiveOrDone = progress >= step.num;
                                const Icon = step.icon;
                                
                                return (
                                    <div key={idx} className={`relative flex gap-6 ${isActiveOrDone ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors duration-500 ${
                                            isCompleted 
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                            : isCurrent
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                        }`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold font-sans ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-slate-400 mt-1">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>



                {/* Delivery Driver Info Card */}
                {!isSelfPickup && order.deliveryPartner && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/40 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 shrink-0 shadow-inner">
                                <User size={28} className="fill-orange-500/10" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Your Rider</p>
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{(order.deliveryPartner && typeof order.deliveryPartner === 'object' ? order.deliveryPartner.name : order.deliveryPartner) || 'Delivery Executive'}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Vehicle: Bike • 4.9 ★</p>
                            </div>
                        </div>
                        <a 
                            href={`tel:${(order.deliveryPartner && typeof order.deliveryPartner === 'object' ? order.deliveryPartner.phoneNumber : null) || '1234567890'}`}
                            className="w-12 h-12 bg-green-50 dark:bg-green-950/60 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
                        >
                            <Phone size={20} />
                        </a>
                    </div>
                )}

                {/* Rider Support Live Updates */}
                {Array.isArray(order.supportMessages) && order.supportMessages.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/40 rounded-3xl p-6 shadow-sm space-y-3 animate-in slide-in-from-bottom-4 text-left">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-extrabold text-sm uppercase tracking-wider">
                            <MessageSquare size={18} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                            <span>Rider Live Updates</span>
                        </div>
                        <div className="space-y-2">
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
                </>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
