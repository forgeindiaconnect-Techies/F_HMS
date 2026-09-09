import { CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WaiterPendingServes = () => {
    const { api } = useAuth();
    const [pending, setPending] = useState([]);

    const fetchPendingOrders = async () => {
        try {
            const res = await api.get('/orders');
            // Filter only Dine In orders that are Ready to be served
            const pendingOrders = res.data.filter(o => 
                o.orderType === 'Dine In' && o.status === 'Ready'
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

    const handleServe = async (orderId) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'Served' });
            fetchPendingOrders();
        } catch (error) {
            console.error('Failed to serve order', error);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-green-200">
                <div>
                    <h2 className="text-2xl font-bold text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Pending Serves</h2>
                    <p className="text-sm text-green-600/80 mt-1">These orders are ready at the kitchen counter for pickup!</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                    <span className="text-xl font-bold text-green-700">{pending.length}</span>
                </div>
            </div>

            <div className="space-y-4">
                {pending.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium text-lg">No pending serves right now. Great job!</div>
                ) : (
                    pending.map(order => (
                        <div key={order._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                            
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-green-50 rounded-2xl flex flex-col items-center justify-center border border-green-100 shrink-0">
                                    <span className="text-sm font-bold text-green-600 uppercase">Table</span>
                                    <span className="text-2xl font-bold text-gray-900 font-sans">{order.tableNumber}</span>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-medium text-gray-400 mb-1">Order {order._id.substring(order._id.length - 6)}</p>
                                    <ul className="text-base text-gray-800 font-bold space-y-1">
                                        {order.orderItems?.map((item, idx) => <li key={idx}>{item.qty}x {item.name}</li>)}
                                    </ul>
                                    {order.note && (
                                        <p className="text-sm text-gray-500 italic mt-2">Note: {order.note}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 justify-between md:justify-end border-t border-gray-100 md:border-0 pt-4 md:pt-0">
                                <span className="text-sm font-bold text-orange-500 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                                    <Clock size={16} /> Waiting {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                </span>
                                
                                <button 
                                    onClick={() => handleServe(order._id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle size={18} /> Mark as Served
                                </button>
                            </div>
                            
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WaiterPendingServes;
