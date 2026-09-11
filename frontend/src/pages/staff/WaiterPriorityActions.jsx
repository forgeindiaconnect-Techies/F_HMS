import { useState, useEffect } from 'react';
import { Flame, Receipt, AlertTriangle, Users, CheckCircle2, RefreshCw, Clock, Utensils, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const WaiterPriorityActions = () => {
    const { api, user } = useAuth();
    const [filter, setFilter] = useState('All');
    const [serviceRequests, setServiceRequests] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, requestsRes] = await Promise.all([
                api.get('/orders').catch(() => ({ data: [] })),
                api.get('/service-requests').catch(() => ({ data: [] }))
            ]);
            const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
            const reqsData = Array.isArray(requestsRes.data) ? requestsRes.data : [];

            // Include all active orders that are not completed or cancelled
            setActiveOrders(ordersData.filter(o => !['Completed', 'Cancelled', 'Delivered', 'Served', 'Picked Up'].includes(o.status)));
            setServiceRequests(reqsData);
        } catch (error) {
            console.error('Failed to fetch priority actions data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);

        let ws;
        const connectWS = () => {
            try {
                let baseURL = getApiUrl();
                let wsURL = baseURL.replace(/^http/, 'ws').replace(/\/api$/, '');
                ws = new WebSocket(wsURL);

                ws.onopen = () => {
                    const rawRestId = user?.restaurantId;
                    const cleanRestId = (rawRestId && typeof rawRestId === 'object') ? (rawRestId._id || rawRestId.id) : rawRestId;
                    ws.send(JSON.stringify({
                        type: 'register',
                        restaurantId: cleanRestId || null,
                        role: 'waiter'
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (['new_order', 'order_updated', 'order_status_updated', 'ready_to_serve', 'new_notification'].includes(msg.type)) {
                            fetchData();

                            const orderData = msg.data?.orderData || msg.data;
                            if (msg.type === 'order_status_updated' || msg.type === 'new_notification' || msg.type === 'ready_to_serve') {
                                const ticketNum = orderData?._id ? String(orderData._id).substring(String(orderData._id).length - 5).toUpperCase() : 'ALERT';
                                
                                try {
                                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                    const osc = audioCtx.createOscillator();
                                    const gain = audioCtx.createGain();
                                    osc.type = 'sine';
                                    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                                    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);
                                    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
                                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                                    osc.connect(gain);
                                    gain.connect(audioCtx.destination);
                                    osc.start();
                                    osc.stop(audioCtx.currentTime + 0.4);
                                } catch (e) {}

                                toast.success(`🔔 KITCHEN TRANSFER: Order #${ticketNum} ready for pickup!`, {
                                    id: `ready-${orderData?._id || Date.now()}`,
                                    duration: 8000,
                                    position: 'top-right'
                                });
                            }
                        }
                    } catch (e) {}
                };

                ws.onclose = () => {
                    setTimeout(connectWS, 5000);
                };
            } catch (err) {}
        };

        connectWS();

        return () => {
            clearInterval(interval);
            if (ws) ws.close();
        };
    }, [api, user]);

    const handleResolveRequest = async (id) => {
        try {
            await api.put(`/service-requests/${id}/complete`);
            setServiceRequests(prev => prev.filter(r => r._id !== id));
            toast.success('Assistance request marked as completed');
        } catch (error) {
            toast.error('Failed to update request');
        }
    };

    const handleServeOrder = async (orderId, isSelf) => {
        try {
            const nextStatus = isSelf ? 'Picked Up' : 'Served';
            await api.put(`/orders/${orderId}/status`, { status: nextStatus });
            setActiveOrders(prev => prev.filter(o => o._id !== orderId));
            toast.success(isSelf ? 'Transferred order to Cashier counter!' : 'Food served to table!');
            fetchData();
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    // Helper function for self pickup
    const isSelfOrder = (o) => {
        if (!o) return false;
        const type = String(o.orderType || '').toLowerCase();
        return type.includes('pickup') || type.includes('takeaway') || type.includes('takeout') || type.includes('self') || (!o.tableNumber && type !== 'dine in' && type !== 'dine-in');
    };

    // Synthesize all priority items
    const priorityItems = [
        ...activeOrders.map(o => {
            const isSelf = isSelfOrder(o);
            const status = String(o.status || '').trim();
            const isReady = ['Ready', 'Ready for Pickup'].includes(status);
            
            let cardType = 'URGENT';
            let cardTitle = 'Food Ready in Kitchen';
            let actionText = 'Serve Now';
            let color = 'rose';

            if (isSelf && isReady) {
                cardType = 'PICKUP READY';
                cardTitle = 'Self-Pickup Ready in Kitchen';
                actionText = 'Collect & Transfer to Cashier Counter';
                color = 'amber';
            } else if (!isSelf && isReady) {
                cardType = 'URGENT';
                cardTitle = 'Dine-In Order Ready to Serve';
                actionText = 'Mark Food as Served';
                color = 'rose';
            } else {
                cardType = 'KITCHEN PREP';
                cardTitle = isSelf ? 'Self-Pickup Preparing in Kitchen' : 'Dine-In Order Cooking in Kitchen';
                actionText = 'Transfer to Pickup Counter';
                color = 'blue';
            }

            return {
                id: `order-${o._id}`,
                table: isSelf ? '📦 Self-Pickup Counter' : (o.tableNumber ? (o.tableNumber.startsWith('Table') ? o.tableNumber : `Table ${o.tableNumber}`) : 'Takeout'),
                type: cardType,
                title: cardTitle,
                subtitle: o.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ') || 'Order Ticket',
                time: 'Live',
                actionText: actionText,
                icon: Utensils,
                color: color,
                handler: async () => {
                    if (isReady) {
                        await handleServeOrder(o._id, isSelf);
                    } else {
                        try {
                            const nextStatus = isSelf ? 'Ready for Pickup' : 'Ready';
                            await api.put(`/orders/${o._id}/status`, { status: nextStatus });
                            toast.success('Transferred ticket to Pickup Counter!');
                            fetchData();
                        } catch (e) {
                            toast.error('Failed to update ticket status');
                        }
                    }
                }
            };
        }),
        ...serviceRequests.map(r => ({
            id: `req-${r._id}`,
            table: r.tableNumber || 'Table',
            type: r.requestType === 'Bill Request' ? 'IMPORTANT' : 'ASSISTANCE',
            title: r.requestType || 'Customer Service Request',
            subtitle: r.note || 'Requested immediate assistance at table',
            time: 'Live',
            actionText: r.requestType === 'Bill Request' ? 'Generate Bill' : 'Attend Table',
            icon: r.requestType === 'Bill Request' ? Receipt : Bell,
            color: r.requestType === 'Bill Request' ? 'amber' : 'emerald',
            handler: () => handleResolveRequest(r._id)
        }))
    ];

    const displayItems = priorityItems;

    const filteredItems = filter === 'All' 
        ? displayItems 
        : (filter === 'URGENT' 
            ? displayItems.filter(item => item.type === 'URGENT' || item.type === 'PICKUP READY')
            : displayItems.filter(item => item.type === filter));

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <Flame size={30} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Priority Action Center
                        </h1>
                        <p className="text-sm font-medium text-rose-100 mt-0.5">
                            Real-time floor alerts ranked by urgency & wait time
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Alerts
                    </button>
                    <div className="px-4 py-2.5 bg-white text-rose-600 font-extrabold rounded-xl text-xs shadow-md">
                        {displayItems.length} Critical Items
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['All', 'PICKUP READY', 'KITCHEN PREP', 'URGENT', 'IMPORTANT', 'ASSISTANCE'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            filter === t
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Priority Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div 
                            key={item.id} 
                            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group"
                        >
                            <div className={`absolute top-0 left-0 w-2 h-full ${
                                item.color === 'rose' ? 'bg-rose-500' :
                                item.color === 'amber' ? 'bg-amber-500' :
                                item.color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} />

                            <div className="pl-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                                        item.color === 'rose' ? 'bg-rose-100 text-rose-800' :
                                        item.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                                        item.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {item.type}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                        <Clock size={12} /> {item.time}
                                    </span>
                                </div>

                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                    {item.table}
                                </h3>
                                <p className="text-xs font-bold text-slate-700 mt-1">{item.title}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.subtitle}</p>
                            </div>

                            <div className="pl-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={item.handler}
                                    className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
                                        item.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                                        item.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                                        item.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{item.actionText}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default WaiterPriorityActions;
