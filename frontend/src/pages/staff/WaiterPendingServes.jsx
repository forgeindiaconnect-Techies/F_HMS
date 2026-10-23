import { CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WaiterPendingServes = () => {
    const { api } = useAuth();
    const [pending, setPending] = useState([]);

    const isSelfOrder = (o) => {
        if (!o) return false;
        const type = String(o.orderType || '').toLowerCase();
        return type.includes('pickup') || type.includes('takeaway') || type.includes('takeout') || type.includes('self') || (!o.tableNumber && type !== 'dine in' && type !== 'dine-in');
    };

    const fetchPendingOrders = async () => {
        try {
            const res = await api.get('/orders');
            // Filter all orders ready to be served or transferred
            const pendingOrders = res.data.filter(o => 
                ['Ready', 'Ready for Pickup'].includes(o.status)
            );
            setPending(pendingOrders);
        } catch (error) {
            console.error('Failed to fetch pending orders', error);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
        const interval = setInterval(fetchPendingOrders, 3000);
        return () => clearInterval(interval);
    }, [api]);

    const handleServe = async (orderId, targetStatus) => {
        try {
            const nextStatus = typeof targetStatus === 'string' ? targetStatus : (targetStatus ? 'Picked Up' : 'Served');
            await api.put(`/orders/${orderId}/status`, { status: nextStatus });
            fetchPendingOrders();
        } catch (error) {
            console.error('Failed to serve order', error);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-green-200">
                <div>
                    <h2 className="text-2xl font-bold text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Pending Serves &amp; Transfers</h2>
                    <p className="text-sm text-green-600/80 mt-1">These orders are ready at the kitchen counter for table serve or cashier transfer!</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                    <span className="text-xl font-bold text-green-700">{pending.length}</span>
                </div>
            </div>

            <div className="space-y-4">
                {pending.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium text-lg">No pending serves right now. Great job!</div>
                ) : (
                    pending.map(order => {
                        const hasTable = order.tableNumber && order.tableNumber !== 'Any' && order.tableNumber !== 'Takeout';
                        const tableNum = hasTable ? order.tableNumber.replace(/^Table\s*/i, '') : null;
                        const isSelfService = order.serviceType === 'Self Dine-In (KFC Style)' || (!hasTable && isSelfOrder(order));

                        return (
                            <div key={order._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                
                                <div className="flex items-center gap-6">
                                    <div className={`w-28 h-22 rounded-2xl flex flex-col items-center justify-center border shrink-0 ${
                                        order.serviceType === 'Self Dine-In (KFC Style)'
                                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                                            : hasTable
                                            ? 'bg-green-50 border-green-100 text-green-700'
                                            : 'bg-blue-50 border-blue-200 text-blue-800'
                                    }`}>
                                        <span className="text-[10px] font-bold uppercase">{hasTable ? 'Table' : 'Pickup'}</span>
                                        <span className="text-xl font-extrabold font-sans text-center px-1">
                                            {hasTable ? tableNum : 'Self'}
                                        </span>
                                        {hasTable && (
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 bg-white/70">
                                                {order.serviceType === 'Self Dine-In (KFC Style)' ? 'Self Dine-In' : 'Table Serv.'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-medium text-gray-400">Order #{order._id.substring(order._id.length - 6).toUpperCase()}</p>
                                            {order.customerName && (
                                                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    👤 {order.customerName}
                                                </span>
                                            )}
                                        </div>
                                        <ul className="text-base text-gray-800 font-bold space-y-1">
                                            {order.orderItems?.map((item, idx) => <li key={idx}>{item.qty}x {item.name}</li>)}
                                        </ul>
                                        {order.note && (
                                            <p className="text-sm text-gray-500 italic mt-2">Note: {order.note}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end border-t border-gray-100 md:border-0 pt-4 md:pt-0">
                                    <span className="text-sm font-bold text-orange-500 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                                        <Clock size={16} /> Ready {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                    
                                    {hasTable ? (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button 
                                                onClick={() => handleServe(order._id, 'Served')}
                                                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                                            >
                                                <CheckCircle size={17} /> Serve to Table {tableNum}
                                            </button>
                                            {order.serviceType === 'Self Dine-In (KFC Style)' && (
                                                <button 
                                                    onClick={() => handleServe(order._id, 'Picked Up')}
                                                    className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-amber-300 active:scale-95 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-800"
                                                    title="Customer collected their tray directly from counter"
                                                >
                                                    Customer Picked Up
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleServe(order._id, 'Picked Up')}
                                            className="px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                        >
                                            <CheckCircle size={18} /> Collect &amp; Transfer to Cashier
                                        </button>
                                    )}
                                </div>
                                
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WaiterPendingServes;
