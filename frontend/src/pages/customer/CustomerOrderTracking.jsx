import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Clock, RefreshCw, ChevronLeft, PhoneCall, Coffee, Utensils, 
    FileText, CheckCircle2, AlertCircle, ShoppingBag, BellRing 
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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
            let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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

    const getStatusStep = (status) => {
        // Pending, Accepted, Preparing, Ready, Served
        const steps = ['Pending', 'Preparing', 'Ready', 'Served'];
        // Let's map schema status to these steps
        if (status === 'Pending') return 0;
        if (status === 'Preparing') return 1;
        if (status === 'Ready') return 2;
        if (['Served', 'Billing Requested', 'Delivered'].includes(status)) return 3;
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
    const stepsList = [
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

                {/* Table Quick Requests */}
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
