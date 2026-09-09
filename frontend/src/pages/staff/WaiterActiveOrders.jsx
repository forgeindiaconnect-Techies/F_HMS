import { Clock, CheckCircle, Flame, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WaiterActiveOrders = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            // Filter only active Dine In orders that are not Delivered
            const activeOrders = res.data.filter(o => 
                o.orderType === 'Dine In' && !['Served', 'Delivered', 'Paid'].includes(o.status)
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

    const handleServe = async (orderId) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'Served' });
            fetchOrders();
        } catch (error) {
            console.error('Failed to serve order', error);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>All Active Orders</h2>
                    <p className="text-sm text-gray-500 mt-1">Track everything currently in progress.</p>
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
                orders.map(order => (
                    <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-sans">Table {order.tableNumber}</h3>
                                <p className="text-sm font-medium text-gray-400">Order {order._id.substring(order._id.length - 6)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'Ready' ? 'bg-green-100 text-green-700' :
                                order.status === 'In Kitchen' ? 'bg-orange-100 text-orange-700' :
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
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                                <Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                            </span>
                            {order.status === 'Ready' ? (
                                <button 
                                    onClick={() => handleServe(order._id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Serve Now
                                </button>
                            ) : (
                                <button className="bg-gray-100 text-gray-400 cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <Flame size={16} /> Cooking...
                                </button>
                            )}
                        </div>
                    </div>
                )))}
            </div>
        </div>
    );
};

export default WaiterActiveOrders;
