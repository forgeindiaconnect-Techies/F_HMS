import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ChefHat, Bike, PackageOpen, ChevronLeft, Phone, MapPin, Store } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const OrderTracking = () => {
    const { id } = useParams();
    const { api } = useCustomerAuth();
    const [order, setOrder] = useState(null);
    const [progress, setProgress] = useState(1); // 1: Received, 2: Preparing, 3: Next Step, 4: Final Step

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
                
                // Map status to progress dynamically
                const isSelf = data.orderType === 'Self-Pickup' || data.orderType === 'Self Pickup';
                if (isSelf) {
                    if (['Completed', 'Picked Up'].includes(data.status)) setProgress(4);
                    else if (['Ready for Pickup', 'Ready'].includes(data.status)) setProgress(3);
                    else if (data.status === 'Preparing') setProgress(2);
                    else setProgress(1);
                } else {
                    if (['Served', 'Delivered', 'Completed'].includes(data.status)) setProgress(4);
                    else if (['Ready', 'Out for Delivery'].includes(data.status)) setProgress(3);
                    else if (data.status === 'Preparing') setProgress(2);
                    else setProgress(1);
                }
            } catch (error) {
                console.error('Failed to fetch order', error);
            }
        };

        fetchOrder();
        const interval = setInterval(fetchOrder, 5000); // Poll every 5s for live tracking
        return () => clearInterval(interval);
    }, [id, api]);

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
        <div className="bg-gray-50 min-h-screen py-10 pb-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/profile" className="p-2 bg-white rounded-xl shadow-sm hover:text-orange-600 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Track Order #{id ? id.substring(id.length - 6).toUpperCase() : 'ORD-8824'}</h1>
                        <p className="text-gray-500">
                            {isSelfPickup ? 'Order Method: ' : 'Estimated Delivery: '}
                            <span className="font-bold text-gray-900">{isSelfPickup ? 'Self-Pickup at Counter' : '45 mins'}</span>
                        </p>
                    </div>
                </div>

                {!order ? (
                    <div className="text-center py-20 text-gray-500">Loading tracking data...</div>
                ) : (
                <>

                {/* Progress Map Area (Visual flair) */}
                <div className="bg-gray-900 rounded-3xl h-64 mb-8 relative overflow-hidden shadow-lg flex flex-col items-center justify-center">
                    <style>{`
                        @keyframes bikeRide {
                            0% { left: 10%; transform: scaleX(1) translateY(-50%); }
                            45% { left: 82%; transform: scaleX(1) translateY(-50%); }
                            50% { left: 82%; transform: scaleX(-1) translateY(-50%); }
                            95% { left: 10%; transform: scaleX(-1) translateY(-50%); }
                            100% { left: 10%; transform: scaleX(1) translateY(-50%); }
                        }
                        @keyframes dash {
                            to { stroke-dashoffset: -20; }
                        }
                    `}</style>
                    <div className="absolute inset-0 opacity-30">
                        {/* Mock Map Background */}
                        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" alt="Map" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    
                    {!isSelfPickup && progress === 3 ? (
                        <div className="w-full max-w-lg px-8 relative h-28 flex items-center justify-between z-10">
                            {/* Route Path (dashed line) */}
                            <div className="absolute left-12 right-12 h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full animate-pulse" 
                                    style={{ 
                                        backgroundImage: 'linear-gradient(90deg, #f97316 50%, transparent 50%)',
                                        backgroundSize: '15px 100%',
                                        animation: 'dash 1.2s linear infinite'
                                    }}
                                />
                            </div>

                            {/* Restaurant Starting Node */}
                            <div className="flex flex-col items-center gap-1 z-10">
                                <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Store size={18} />
                                </div>
                                <span className="text-[10px] font-black text-white bg-orange-650 px-2 py-0.5 rounded-full uppercase tracking-wider">Restaurant</span>
                            </div>

                            {/* Moving Delivery Partner (Bike) */}
                            <div 
                                className="absolute w-12 h-12 bg-white text-orange-600 rounded-full shadow-xl flex items-center justify-center border border-orange-200 z-20"
                                style={{
                                    animation: 'bikeRide 8s linear infinite',
                                    top: '50%'
                                }}
                            >
                                <Bike size={24} className="animate-bounce" />
                            </div>

                            {/* Customer Ending Node */}
                            <div className="flex flex-col items-center gap-1 z-10">
                                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                                    <MapPin size={18} />
                                </div>
                                <span className="text-[10px] font-black text-white bg-green-650 px-2 py-0.5 rounded-full uppercase tracking-wider">Home</span>
                            </div>
                        </div>
                    ) : (
                        /* Floating Tracker Card */
                        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex items-center gap-6">
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(249,115,22,0.6)] animate-pulse">
                                {progress === 1 && <PackageOpen size={32} />}
                                {progress === 2 && <ChefHat size={32} />}
                                {progress === 3 && <Bike size={32} />}
                                {progress === 4 && <CheckCircle size={32} />}
                            </div>
                            <div className="text-white">
                                <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Current Status</p>
                                <h2 className="text-2xl font-bold font-sans">{steps[progress - 1].title}</h2>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[23px] top-[40px] bottom-[40px] w-1 bg-gray-100 rounded-full"></div>
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
                                            isCompleted ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold font-sans ${isCurrent ? 'text-orange-600' : 'text-gray-900'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-gray-500 mt-1">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Delivery Driver (Only shows if on the way) */}
                {!isSelfPickup && progress >= 3 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-orange-500 p-1">
                                <div className="w-full h-full rounded-full bg-gray-300 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" alt="Driver" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Rider</p>
                                <h4 className="font-bold text-gray-900 text-lg">Michael T.</h4>
                                <p className="text-sm text-gray-500">Honda Vision • 4.9 ★</p>
                            </div>
                        </div>
                        <button className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                            <Phone size={20} />
                        </button>
                    </div>
                )}
                </>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
