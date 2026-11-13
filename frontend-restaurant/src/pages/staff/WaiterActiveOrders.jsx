import { Clock, CheckCircle, Flame, MessageSquare, ChefHat, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWaiterSearch, matchesOrderSearch } from '../../hooks/useWaiterSearch';
import toast from 'react-hot-toast';

const WaiterActiveOrders = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const searchQuery = useWaiterSearch();

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
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [api]);

    const handleUpdateStatus = async (orderId, nextStatus) => {
        setUpdatingId(orderId);
        try {
            await api.put(`/orders/${orderId}/status`, { status: nextStatus });
            toast.success(`Order marked as ${nextStatus} & KOT updated!`);
            fetchOrders();
        } catch (error) {
            console.error('Failed to update order status', error);
            toast.error(error.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleServe = async (orderId, targetStatus) => {
        const nextStatus = typeof targetStatus === 'string' ? targetStatus : (targetStatus ? 'Picked Up' : 'Served');
        await handleUpdateStatus(orderId, nextStatus);
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
                {(() => {
                    const visibleOrders = orders.filter((o) => matchesOrderSearch(o, searchQuery));
                    if (visibleOrders.length === 0) {
                        return <div className="col-span-full text-center text-gray-500 py-10">{searchQuery.trim() ? `No active orders matching "${searchQuery}".` : 'No active orders found.'}</div>;
                    }
                    return visibleOrders.map(order => {
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Action 1: If Order is Pending / Received, Waiter can send to Kitchen (KOT) */}
                                    {(!order.status || ['Pending', 'Placed', 'Order Received', 'Accepted'].includes(order.status)) && (
                                        <button 
                                            onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                                            disabled={updatingId === order._id}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                            title="Send ticket to kitchen & set KOT to Preparing"
                                        >
                                            <ChefHat size={14} /> Send to Kitchen (KOT)
                                        </button>
                                    )}

                                    {/* Action 2: If Order is in Kitchen / Cooking, Waiter can mark Ready or directly Serve */}
                                    {(order.status === 'Preparing' || order.status === 'In Kitchen') && (
                                        <>
                                            <button 
                                                onClick={() => handleUpdateStatus(order._id, 'Ready')}
                                                disabled={updatingId === order._id}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                                                title="Mark dish ready for pickup/serving"
                                            >
                                                <Flame size={14} /> Mark Ready
                                            </button>
                                            <button 
                                                onClick={() => handleServe(order._id, 'Served')}
                                                disabled={updatingId === order._id}
                                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer"
                                                title="Directly deliver to table"
                                            >
                                                <CheckCircle size={13} /> Serve
                                            </button>
                                        </>
                                    )}

                                    {/* Action 3: If Order is Ready, Waiter serves to Table or Picked Up */}
                                    {isReady && (
                                        hasTable ? (
                                            <>
                                                <button 
                                                    onClick={() => handleServe(order._id, 'Served')}
                                                    disabled={updatingId === order._id}
                                                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                                                    title={`Deliver and mark served to ${tableDisplay}`}
                                                >
                                                    <CheckCircle size={15} /> Serve to {tableDisplay}
                                                </button>
                                                {order.serviceType === 'Self Dine-In (KFC Style)' && (
                                                    <button 
                                                        onClick={() => handleServe(order._id, 'Picked Up')}
                                                        disabled={updatingId === order._id}
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
                                                disabled={updatingId === order._id}
                                                className="px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                            >
                                                <CheckCircle size={16} /> Transfer to Cashier
                                            </button>
                                        )
                                    )}

                                    {/* Action 4: Quick Status Selector for floor flexibility */}
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                        disabled={updatingId === order._id}
                                        className="text-[11px] font-bold py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-none"
                                        title="Quick update order status & sync KOT"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Preparing">Preparing</option>
                                        <option value="Ready">Ready</option>
                                        <option value="Served">Served</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    );
                });
                })()}
            </div>
        </div>
    );
};

export default WaiterActiveOrders;
