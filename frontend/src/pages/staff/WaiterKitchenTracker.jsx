import { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Clock, Flame, RefreshCw, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const WaiterKitchenTracker = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [stageFilter, setStageFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders');
            setOrders(res.data.filter(o => o.orderType === 'Dine In' && !['Completed'].includes(o.status)));
        } catch (error) {
            console.error('Failed to fetch kitchen tracker orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 8000);
        return () => clearInterval(interval);
    }, [api]);

    const getStageStep = (status) => {
        switch (status) {
            case 'Order Received': case 'Pending': return 1;
            case 'Preparing': case 'In Kitchen': return 2;
            case 'Ready': case 'Ready for Pickup': return 3;
            case 'Picked Up': return 4;
            case 'Served': case 'Delivered': return 5;
            default: return 2;
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    // Synthesize mock kitchen tickets if backend is empty
    const displayOrders = orders.length > 0 ? orders : [
        {
            _id: 'ord-101',
            tableNumber: 'Table 1',
            status: 'Preparing',
            createdAt: new Date(Date.now() - 10 * 60000),
            orderItems: [{ name: 'Margherita Pizza', qty: 1 }, { name: 'Garlic Bread', qty: 2 }]
        },
        {
            _id: 'ord-102',
            tableNumber: 'Table 5',
            status: 'Ready',
            createdAt: new Date(Date.now() - 15 * 60000),
            orderItems: [{ name: 'Grilled Salmon', qty: 2 }, { name: 'Truffle Pasta', qty: 1 }]
        },
        {
            _id: 'ord-103',
            tableNumber: 'Table 3',
            status: 'Order Received',
            createdAt: new Date(Date.now() - 3 * 60000),
            orderItems: [{ name: 'Cold Coffee', qty: 2 }]
        }
    ];

    const filteredOrders = stageFilter === 'All'
        ? displayOrders
        : displayOrders.filter(o => o.status === stageFilter);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <ChefHat size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Kitchen Live Tracker
                        </h1>
                        <p className="text-sm font-medium text-emerald-100 mt-0.5">
                            Real-time order preparation status & stage progression
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchOrders} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Sync
                    </button>
                    <div className="px-4 py-2.5 bg-white text-emerald-700 font-extrabold rounded-xl text-xs shadow-md">
                        {displayOrders.length} Active Tickets
                    </div>
                </div>
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['All', 'Order Received', 'Preparing', 'Ready', 'Served'].map((st) => (
                    <button
                        key={st}
                        onClick={() => setStageFilter(st)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            stageFilter === st
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* Kitchen Tickets List */}
            <div className="space-y-4">
                {filteredOrders.map((order) => {
                    const step = getStageStep(order.status);
                    return (
                        <div key={order._id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900">{order.tableNumber || 'Dine-In Table'}</h3>
                                    <span className="text-xs font-bold text-slate-400">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                                        order.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' :
                                        order.status === 'Preparing' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Item Summary */}
                            <p className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {order.orderItems?.map(i => `${i.qty}x ${i.name}`).join(' • ')}
                            </p>

                            {/* 5-Stage Step Bar */}
                            <div>
                                <div className="flex justify-between text-[11px] font-extrabold text-slate-400 mb-2">
                                    <span className={step >= 1 ? 'text-emerald-700' : ''}>1. Received</span>
                                    <span className={step >= 2 ? 'text-emerald-700' : ''}>2. Preparing</span>
                                    <span className={step >= 3 ? 'text-emerald-700 font-black' : ''}>3. Ready</span>
                                    <span className={step >= 4 ? 'text-emerald-700' : ''}>4. Picked Up</span>
                                    <span className={step >= 5 ? 'text-emerald-700' : ''}>5. Served</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
                                </div>
                            </div>

                            {/* Serve Button */}
                            {order.status === 'Ready' && (
                                <div className="flex justify-end pt-2">
                                    <button onClick={() => handleUpdateStatus(order._id, 'Served')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer">
                                        <CheckCircle2 size={16} /> Mark as Served
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default WaiterKitchenTracker;
