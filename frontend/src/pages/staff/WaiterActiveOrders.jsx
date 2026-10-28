import { Clock, CheckCircle, Flame, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WaiterActiveOrders = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);

    const isSelfOrder = (o) => {
        if (!o) return false;
        const type = String(o.orderType || '').toLowerCase();
        return type.includes('pickup') || type.includes('takeaway') || type.includes('takeout') || type.includes('self') || (!o.tableNumber && type !== 'dine in' && type !== 'dine-in');
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            // Filter all active orders that are not Completed/Delivered/Served
            const activeOrders = res.data.filter(o => 
                !['Served', 'Delivered', 'Completed', 'Paid'].includes(o.status)
            );
            setOrders(activeOrders);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [api]);

    const handleServe = async (orderId, targetStatus) => {
        try {
            const nextStatus = typeof targetStatus === 'string' ? targetStatus : (targetStatus ? 'Picked Up' : 'Served');
            await api.put(`/orders/${orderId}/status`, { status: nextStatus });
            fetchOrders();
        } catch (error) {
            console.error('Failed to serve order', error);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>All Active Orders</h2>
                    <p className="text-sm text-gray-500 mt-1">Track everything currently in progress on the floor and at pickup counters.</p>
                </div>
                <div className="flex gap-3">
                    <span className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-sm border border-blue-100 flex items-center gap-2">
                        Total: {orders.length}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-10">No active orders found.</div>
                ) : (
                orders.map(order => {
                    const hasTable = order.tableNumber && order.tableNumber !== 'Any' && order.tableNumber !== 'Takeout';
                    const tableDisplay = hasTable ? (order.tableNumber.startsWith('Table') ? order.tableNumber : `Table ${order.tableNumber}`) : null;
                    const isSelfService = order.serviceType === 'Self Dine-In (KFC Style)' || (!hasTable && isSelfOrder(order));
                    const isReady = ['Ready', 'Ready for Pickup'].includes(order.status);

                    return (
                        <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-xl font-bold text-gray-900 font-sans">
                                                {tableDisplay || '📦 Self-Pickup Counter'}
                                            </h3>
                                            {hasTable && (
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                                    order.serviceType === 'Self Dine-In (KFC Style)'
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {order.serviceType === 'Self Dine-In (KFC Style)' ? 'Self Dine-In' : 'Waiter Service'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <p className="text-xs font-medium text-gray-400">Order #{order._id.substring(order._id.length - 6).toUpperCase()}</p>
                                            {order.kotNumbers && order.kotNumbers.length > 0 && (
                                                <span className="text-[10px] font-black font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-xs">
                                                    {order.kotNumbers.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                        {order.customerName && (
                                            <p className="text-xs font-semibold text-slate-700 mt-1">
                                                👤 Guest: <span className="text-slate-900">{order.customerName}</span>
                                            </p>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                                        isReady ? 'bg-green-100 text-green-700 border border-green-200 animate-pulse' :
                                        order.status === 'Preparing' || order.status === 'In Kitchen' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <ul className="text-sm text-gray-700 font-medium space-y-1 list-disc list-inside">
                                        {order.orderItems?.map((item, idx) => <li key={idx}>{item.qty}x {item.name}</li>)}
                                    </ul>
                                    
                                    {order.note && (
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2">
                                            <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-gray-600 font-medium italic">"{order.note}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100 gap-2">
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                    <Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                </span>
                                {isReady ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {hasTable ? (
                                            <>
                                                <button 
                                                    onClick={() => handleServe(order._id, 'Served')}
                                                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                                                    title={`Deliver and mark served to ${tableDisplay}`}
                                                >
                                                    <CheckCircle size={15} /> Serve to {tableDisplay}
                                                </button>
                                                {order.serviceType === 'Self Dine-In (KFC Style)' && (
                                                    <button 
                                                        onClick={() => handleServe(order._id, 'Picked Up')}
                                                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all border border-amber-300 active:scale-95 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800"
                                                        title="Customer collected their tray directly from counter"
                                                    >
                                                        Customer Picked Up
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => handleServe(order._id, 'Picked Up')}
                                                className="px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                            >
                                                <CheckCircle size={16} /> Transfer to Cashier
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button className="bg-gray-100 text-gray-400 cursor-not-allowed px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                        <Flame size={14} /> Cooking...
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
};

export default WaiterActiveOrders;
