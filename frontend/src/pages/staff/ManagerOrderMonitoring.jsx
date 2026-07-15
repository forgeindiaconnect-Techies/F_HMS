import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle2, ChevronRight, ShoppingBag, Truck, Utensils, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const getTypeIcon = (type) => {
    switch (type) {
        case 'Dine-in': return <Utensils size={16} />;
        case 'Delivery': return <Truck size={16} />;
        default: return <ShoppingBag size={16} />; // Takeaway
    }
};

const getStatusColor = (status, isDelayed) => {
    if (isDelayed) return 'bg-red-50 border-red-200';
    switch (status) {
        case 'Pending':
        case 'New': return 'bg-blue-50 border-blue-200';
        case 'Preparing': return 'bg-orange-50 border-orange-200';
        case 'Ready': return 'bg-green-50 border-green-200';
        case 'Dispatched': return 'bg-purple-50 border-purple-200';
        default: return 'bg-gray-50 border-gray-200';
    }
};

const ManagerOrderMonitoring = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            // Fetch all active orders (we can filter out Completed here or on backend, we'll do it here for now)
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch live orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Optional: Polling every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to update status', error);
            toast.success('Failed to update order status');
        }
    };

    // Calculate derived data
    const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
    const completedTodayCount = orders.filter(o => o.status === 'Completed').length; // Ideally filter by today's date

    // Enhance active orders with "delayed" calculation and formatted time
    const enhancedOrders = activeOrders.map(order => {
        const orderTime = new Date(order.createdAt);
        const diffMins = Math.floor((new Date() - orderTime) / 60000);
        const isDelayed = diffMins > 20 && ['Pending', 'Preparing'].includes(order.status);
        
        return {
            ...order,
            diffMins,
            isDelayed,
            displayTime: `${diffMins} mins ago`,
            itemsCount: order.orderItems ? order.orderItems.reduce((acc, item) => acc + item.quantity, 0) : 0
        };
    });

    const delayedCount = enhancedOrders.filter(o => o.isDelayed).length;

    // Filtering
    const filteredOrders = enhancedOrders.filter(o => {
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Delayed') return o.isDelayed;
        return o.status === filterStatus || (filterStatus === 'New' && o.status === 'Pending');
    });

    // Counts for tabs
    const counts = {
        All: enhancedOrders.length,
        New: enhancedOrders.filter(o => o.status === 'Pending' || o.status === 'New').length,
        Preparing: enhancedOrders.filter(o => o.status === 'Preparing').length,
        Ready: enhancedOrders.filter(o => o.status === 'Ready').length,
        Dispatched: enhancedOrders.filter(o => o.status === 'Dispatched').length,
        Delayed: delayedCount
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans relative">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Live Order Monitoring</h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time view of all branch orders and fulfillment bottlenecks.</p>
                </div>
                <div className="flex gap-2">
                    <span className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg border ${delayedCount > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                        <AlertCircle size={16} /> {delayedCount} Delayed Order{delayedCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <CheckCircle2 size={16} /> {completedTodayCount} Completed Today
                    </span>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                {['All', 'New', 'Preparing', 'Ready', 'Dispatched', 'Delayed'].map((filter, i) => (
                    <button 
                        key={filter} 
                        onClick={() => setFilterStatus(filter)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filterStatus === filter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {filter === 'All' ? 'All Active' : filter} ({counts[filter] || 0})
                    </button>
                ))}
            </div>

            {/* Active Orders Grid */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500 font-medium">No live orders matching this filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredOrders.map((order) => (
                        <div key={order._id} className={`rounded-2xl border p-5 shadow-sm relative overflow-hidden group ${getStatusColor(order.status, order.isDelayed)}`}>
                            {order.isDelayed && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                                    Delayed
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-gray-700">
                                        {getTypeIcon(order.orderType)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">#{order._id.substring(order._id.length - 6).toUpperCase()}</h3>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            {order.orderType || 'Dine-in'} 
                                            {order.table && ` • Table ${order.table.number || order.table}`}
                                        </p>
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">${(order.totalPrice || 0).toFixed(2)}</h3>
                            </div>

                            <div className="flex items-center justify-between mb-4 bg-white/60 rounded-xl p-3 border border-white/40">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${order.status === 'Pending' ? 'bg-blue-500' : order.status === 'Preparing' ? 'bg-orange-500' : order.status === 'Ready' ? 'bg-green-500' : 'bg-purple-500'}`}></span>
                                    <span className="text-sm font-bold text-gray-700">{order.status}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                                    <Clock size={14} className={order.isDelayed ? 'text-red-500' : 'text-gray-400'} /> {order.displayTime}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-sm font-medium text-gray-600">{order.itemsCount} Items</p>
                                <button 
                                    onClick={() => setSelectedOrder(order)}
                                    className="text-sm font-bold text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1"
                                >
                                    Action <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Order #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}</h3>
                                <p className="text-sm text-gray-500">{selectedOrder.orderType}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Update Status</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {['Pending', 'Preparing', 'Ready', 'Dispatched', 'Completed', 'Cancelled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                                        disabled={selectedOrder.status === status}
                                        className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                                            selectedOrder.status === status 
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                                : status === 'Cancelled'
                                                    ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900 shadow-sm hover:shadow'
                                        }`}
                                    >
                                        Mark {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerOrderMonitoring;
