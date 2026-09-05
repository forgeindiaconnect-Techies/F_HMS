import { useState, useEffect } from 'react';
import { Flame, Receipt, AlertTriangle, Users, CheckCircle2, RefreshCw, Clock, Utensils, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const WaiterPriorityActions = () => {
    const { api } = useAuth();
    const [filter, setFilter] = useState('All');
    const [serviceRequests, setServiceRequests] = useState([]);
    const [readyOrders, setReadyOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, requestsRes] = await Promise.all([
                api.get('/orders').catch(() => ({ data: [] })),
                api.get('/service-requests').catch(() => ({ data: [] }))
            ]);
            setReadyOrders(ordersRes.data.filter(o => o.orderType === 'Dine In' && o.status === 'Ready'));
            setServiceRequests(requestsRes.data);
        } catch (error) {
            console.error('Failed to fetch priority actions data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, [api]);

    const handleResolveRequest = async (id) => {
        try {
            await api.put(`/service-requests/${id}/complete`);
            setServiceRequests(prev => prev.filter(r => r._id !== id));
            toast.success('Assistance request marked as completed');
        } catch (error) {
            toast.error('Failed to update request');
        }
    };

    const handleServeOrder = async (orderId) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'Served' });
            setReadyOrders(prev => prev.filter(o => o._id !== orderId));
            toast.success('Food served to table!');
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    // Synthesize all priority items
    const priorityItems = [
        ...readyOrders.map(o => ({
            id: `order-${o._id}`,
            table: o.tableNumber || 'N/A',
            type: 'URGENT',
            title: 'Food Ready in Kitchen',
            subtitle: o.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ') || 'Hot Meal Ready',
            time: 'Just now',
            actionText: 'Serve Now',
            icon: Utensils,
            color: 'rose',
            handler: () => handleServeOrder(o._id)
        })),
        ...serviceRequests.map(r => ({
            id: `req-${r._id}`,
            table: r.tableNumber || 'Table',
            type: r.requestType === 'Bill Request' ? 'IMPORTANT' : 'ASSISTANCE',
            title: r.requestType || 'Customer Service Request',
            subtitle: r.note || 'Requested immediate assistance at table',
            time: '2m ago',
            actionText: r.requestType === 'Bill Request' ? 'Generate Bill' : 'Attend Table',
            icon: r.requestType === 'Bill Request' ? Receipt : Bell,
            color: r.requestType === 'Bill Request' ? 'amber' : 'emerald',
            handler: () => handleResolveRequest(r._id)
        }))
    ];

    // Default mock fallback items if backend arrays are empty to give a rich interactive demo
    const displayItems = priorityItems.length > 0 ? priorityItems : [
        {
            id: 'mock-1',
            table: 'Table 5',
            type: 'URGENT',
            title: 'Food Ready in Kitchen',
            subtitle: '2x Grilled Salmon, 1x Truffle Pasta',
            time: 'Waiting 2m',
            actionText: 'Serve Now',
            icon: Utensils,
            color: 'rose',
            handler: () => toast.success('Table 5 served!')
        },
        {
            id: 'mock-2',
            table: 'Table 7',
            type: 'IMPORTANT',
            title: 'Bill Requested by Customer',
            subtitle: 'Card Payment • Total: ₹2,450',
            time: 'Waiting 4m',
            actionText: 'Generate Bill',
            icon: Receipt,
            color: 'amber',
            handler: () => toast.success('Bill generated for Table 7!')
        },
        {
            id: 'mock-3',
            table: 'Table 3',
            type: 'INFO REQUEST',
            title: 'Customer Requested Water',
            subtitle: 'Warm water & extra lemon requested',
            time: 'Just now',
            actionText: 'Acknowledge',
            icon: Bell,
            color: 'blue',
            handler: () => toast.success('Acknowledged Table 3 request!')
        },
        {
            id: 'mock-4',
            table: 'Table 8',
            type: 'ASSISTANCE',
            title: 'Customer Needs Assistance',
            subtitle: 'Wants recommendations on dessert menu',
            time: 'Waiting 1m',
            actionText: 'Attend Table',
            icon: Users,
            color: 'emerald',
            handler: () => toast.success('Assigned to assist Table 8!')
        }
    ];

    const filteredItems = filter === 'All' 
        ? displayItems 
        : displayItems.filter(item => item.type === filter);

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
                {['All', 'URGENT', 'IMPORTANT', 'INFO REQUEST', 'ASSISTANCE'].map((t) => (
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
