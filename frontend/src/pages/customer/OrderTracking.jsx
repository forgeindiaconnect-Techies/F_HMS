import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ChefHat, Bike, PackageOpen, ChevronLeft, Phone, MapPin, Store, User, ShieldCheck, KeyRound } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

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
                
                // Map status to progress dynamically
                const isSelf = data.orderType === 'Self-Pickup' || data.orderType === 'Self Pickup';
                if (isSelf) {
                    if (['Completed', 'Picked Up', 'Delivered', 'Served'].includes(data.status)) setProgress(4);
                    else if (['Ready for Pickup', 'Ready'].includes(data.status)) setProgress(3);
                    else if (data.status === 'Preparing') setProgress(2);
                    else setProgress(1);
                } else {
                    if (['Delivered', 'Completed'].includes(data.status) || data.deliveryStatus === 'Delivered') {
                        setProgress(4);
                    } else if (['Out for Delivery', 'On the Way'].includes(data.status) || ['Picked Up', 'On the Way'].includes(data.deliveryStatus)) {
                        setProgress(3);
                    } else if (['Preparing', 'Ready'].includes(data.status)) {
                        setProgress(2);
                    } else {
                        setProgress(1);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch order', error);
            }
        };

        fetchOrder();
        const interval = setInterval(fetchOrder, 5000); // Poll every 5s for live tracking
        return () => clearInterval(interval);
    }, [id, api]);

    useEffect(() => {
        if (!order) return;
        
        const isSelf = order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup';
        const isMoving = !isSelf && ['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status);
        
        if (!isMoving) {
            setRiderProgress(0);
            return;
        }

        const timer = setInterval(() => {
            setRiderProgress(p => {
                if (p >= 95) return 10;
                return p + 2;
            });
        }, 800);

        return () => clearInterval(timer);
    }, [order?.status, order?.orderType]);

    const isSelfPickup = order && (order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup');

    const steps = isSelfPickup ? [
        { num: 1, title: 'Order Received', desc: 'We have received your order.', icon: PackageOpen },
        { num: 2, title: 'Preparing', desc: 'The kitchen is preparing your food.', icon: ChefHat },
        { num: 3, title: 'Ready for Pickup', desc: 'Please collect it from the Pickup Counter.', icon: PackageOpen },
        { num: 4, title: 'Completed', desc: 'Thank you! Enjoy your meal.', icon: CheckCircle }
    ] : [
        { num: 1, title: 'Order Received', desc: 'We have received your order.', icon: PackageOpen },
        { num: 2, title: 'Preparing', desc: 'The kitchen is preparing your food.', icon: ChefHat },
        { num: 3, title: 'On the Way', desc: 'Your order is out for delivery.', icon: Bike },
        { num: 4, title: 'Delivered', desc: 'Enjoy your meal!', icon: CheckCircle }
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">Track Order #{id ? id.substring(id.length - 6).toUpperCase() : 'ORD-8824'}</h1>
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
                {!isSelfPickup && (order.deliveryOtp || order.status !== 'Completed') && (
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
                            {order.deliveryOtp || '4829'}
                        </div>
                    </div>
                )}

                {/* Progress Map Area */}
                <div className="bg-slate-950 rounded-3xl h-80 mb-8 relative overflow-hidden shadow-lg flex flex-col border border-slate-900">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:25px_25px]"></div>
                    
                    {!isSelfPickup ? (
                        <>
                            {/* SVG Route lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <line x1="20%" y1="40%" x2="80%" y2="70%" stroke="#334155" strokeWidth="3" strokeDasharray="6,6" strokeLinecap="round" />
                                <line 
                                    x1="20%" 
                                    y1="40%" 
                                    x2={`${20 + (['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status) ? riderProgress : 0) * 0.6}%`} 
                                    y2={`${40 + (['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status) ? riderProgress : 0) * 0.3}%`} 
                                    stroke="#10b981" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                />
                            </svg>

                            {/* Restaurant Store Hub Pin */}
                            <div className="absolute top-[40%] left-[20%] -translate-x-1/2 -translate-y-1/2 text-center group z-10">
                                <div className="relative flex h-10 w-10 items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-xl border-2 border-slate-900 cursor-pointer hover:scale-110 transition-transform">
                                    <div className="absolute inset-0 rounded-2xl bg-orange-500 animate-ping opacity-25"></div>
                                    <Store size={18} />
                                </div>
                                <span className="block text-[8px] font-black text-white bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded shadow-md mt-2 uppercase tracking-widest leading-none">Hub Shop</span>
                            </div>

                            {/* Customer Home Pin */}
                            <div className="absolute top-[70%] left-[80%] -translate-x-1/2 -translate-y-1/2 text-center group z-10">
                                <div className="relative flex h-10 w-10 items-center justify-center bg-purple-600 text-white rounded-full shadow-xl border-2 border-slate-900 cursor-pointer hover:scale-110 transition-transform">
                                    <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-25"></div>
                                    <MapPin size={18} />
                                </div>
                                <span className="block text-[8px] font-black text-white bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded shadow-md mt-2 uppercase tracking-widest leading-none">Home</span>
                            </div>

                            {/* Moving Delivery Partner (Bike) */}
                            {['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status) ? (
                                <div 
                                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center z-25 transition-all duration-300 ease-out"
                                    style={{
                                        left: `${20 + riderProgress * 0.6}%`,
                                        top: `${40 + riderProgress * 0.3}%`
                                    }}
                                >
                                    <div className="relative flex h-12 w-12 items-center justify-center bg-emerald-500 text-white rounded-full shadow-2xl border-2 border-slate-950">
                                        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-35"></div>
                                        <Bike size={20} className="animate-bounce" />
                                        <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 rounded-full p-0.5 text-emerald-400 shadow-md">
                                            <User size={10} className="fill-emerald-400/20" />
                                        </div>
                                    </div>
                                    <span className="block text-[8px] font-black text-emerald-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded shadow-lg mt-1 whitespace-nowrap leading-none">
                                        {order.deliveryPartner?.name || 'Partner'} (Out for Delivery)
                                    </span>
                                </div>
                            ) : (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 backdrop-blur shadow-xl">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                    </span>
                                    <span className="text-xs text-slate-350 font-black uppercase tracking-wider">
                                        {order.status === 'Preparing' ? 'Preparing Food in Kitchen' : 'Awaiting Delivery Assignment'}
                                    </span>
                                </div>
                            )}

                            {/* Live HUD Card (Top‑Left) */}
                            {['Picked Up', 'On the Way', 'Out for Delivery'].includes(order.status) && (
                                <div className="absolute top-4 left-4 z-20 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl backdrop-blur text-left shadow-lg flex flex-col gap-1 min-w-[140px]">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Live Tracking</span>
                                    <h4 className="text-base font-extrabold text-white leading-none mt-1">
                                        {Math.max(1, Math.ceil(((order.deliveryDistance || 3.2) * 3) * (1 - riderProgress / 100)))} mins
                                    </h4>
                                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                        {Math.max(0.1, Number(((order.deliveryDistance || 3.2) * (1 - riderProgress / 100)).toFixed(1)))} km remaining
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Self-Pickup Tracking Area */
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
                            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex items-center gap-6 max-w-sm">
                                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(249,115,22,0.6)] animate-pulse shrink-0">
                                    {progress === 1 && <PackageOpen size={32} />}
                                    {progress === 2 && <ChefHat size={32} />}
                                    {progress === 3 && <Store size={32} />}
                                    {progress === 4 && <CheckCircle size={32} />}
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Self-Pickup Status</p>
                                    <h2 className="text-xl font-bold text-white font-sans">{steps[progress - 1].title}</h2>
                                    <p className="text-xs text-slate-400 mt-1">{steps[progress - 1].desc}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[23px] top-[40px] bottom-[40px] w-1 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                        <div 
                            className="absolute left-[23px] top-[40px] w-1 bg-orange-500 rounded-full transition-all duration-1000 ease-in-out"
                            style={{ height: `${(progress - 1) * 33}%` }}
                        ></div>

                        <div className="space-y-12">
                            {steps.map((step, idx) => {
                                const isCompleted = progress >= step.num;
                                const isCurrent = progress === step.num;
                                const Icon = step.icon;
                                
                                return (
                                    <div key={idx} className={`relative flex gap-6 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors duration-500 ${
                                            isCompleted ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                        }`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold font-sans ${isCurrent ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
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
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{order.deliveryPartner.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Vehicle: Bike • 4.9 ★</p>
                            </div>
                        </div>
                        <a 
                            href={`tel:${order.deliveryPartner.phoneNumber || '1234567890'}`}
                            className="w-12 h-12 bg-green-50 dark:bg-green-950/60 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
                        >
                            <Phone size={20} />
                        </a>
                    </div>
                )}
                </>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
