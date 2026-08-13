import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, CheckCircle2, ChefHat, Bike, Eye, Package, X, RefreshCw, UtensilsCrossed, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['Pending', 'Preparing', 'Ready', 'On the way', 'Delivered'];

const getStatusColor = (status) => {
    switch(status) {
        case 'Pending':    return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Preparing':  return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'Ready':      return 'bg-green-100 text-green-700 border-green-200';
        case 'On the way': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Delivered':  return 'bg-gray-100 text-gray-600 border-gray-200';
        default:           return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
};

/* ── Order Detail Modal ─────────────────────────────────────────── */
const OrderDetailModal = ({ order, onClose, onAdvance, onPickup }) => {
    const nextStatus = getNextStatus(order.status);
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{order.orderNumber || order._id?.slice(-6)}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{order.orderType} · {order.status}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Items */}
                <div className="p-5 space-y-2 max-h-60 overflow-y-auto">
                    {(order.orderItems || []).map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{item.name}</p>
                                {item.addons?.length > 0 && <p className="text-xs text-gray-400">+{item.addons.join(', ')}</p>}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">×{item.quantity}</p>
                                <p className="text-sm font-bold text-green-600">₹{(item.price * item.quantity).toFixed(0)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="font-black text-lg text-green-600">₹{(order.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                        {order.orderType === 'Takeaway' && order.status !== 'Delivered' && (
                            <button
                                onClick={() => { onPickup(order); onClose(); }}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <Package size={16} /> Mark Picked Up
                            </button>
                        )}
                        {nextStatus && (
                            <button
                                onClick={() => { onAdvance(order, nextStatus); onClose(); }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} /> → {nextStatus}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Kanban Card ────────────────────────────────────────────────── */
const OrderCard = ({ order, onView, onAdvance, onPickup }) => {
    const nextStatus = getNextStatus(order.status);
    return (
        <div 
            onClick={() => onView(order)}
            className="relative bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer"
        >
            <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                    #{order.orderNumber || (order._id || '').slice(-6)}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                    {order.orderType || 'Dine-in'}
                </span>
            </div>

            <div className="space-y-1.5 mb-4">
                <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">
                    {order.customerName || order.customerId?.name || 'Walk-in'}
                </p>
                {order.tableNumber && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <ChefHat size={13} /> Table {order.tableNumber}
                    </p>
                )}
                {order.deliveryAddress && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <Bike size={13} /> {order.deliveryAddress}
                    </p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                    <UtensilsCrossed size={12} /> {order.orderItems?.length || 0} items
                </p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-slate-700">
                <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                    <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-bold text-green-600 text-sm">₹{(order.totalPrice || 0).toFixed(0)}</span>
            </div>
        </div>
    );

};

/* ── Main Component ─────────────────────────────────────────────── */
const OrderManagement = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await api.get('/orders?limit=200');
            // Show only active orders (not delivered/cancelled)
            const active = (res.data?.orders || res.data || []).filter(
                o => !['Delivered', 'Cancelled'].includes(o.status)
            );
            setOrders(active);
        } catch (error) {
            console.error('Failed to fetch orders', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleAdvanceStatus = async (order, nextStatus) => {
        try {
            await api.put(`/orders/${order._id}/status`, { status: nextStatus });
            toast.success(`Order moved to "${nextStatus}"`);
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update order status');
        }
    };

    const handlePickup = async (order) => {
        try {
            await api.put(`/orders/${order._id}/status`, { status: 'Delivered' });
            toast.success('Order marked as picked up!');
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark as picked up');
        }
    };

    const filteredOrders = orders.filter(o => {
        const query = searchQuery.toLowerCase();
        return (
            (o._id || '').toLowerCase().includes(query) ||
            (o.orderNumber || '').toLowerCase().includes(query) ||
            (o.customerName || '').toLowerCase().includes(query) ||
            (o.customerId?.name || '').toLowerCase().includes(query)
        );
    });

    const getColumn = (status) => filteredOrders.filter(o => o.status === status);

    const columns = [
        { key: 'Pending',    label: 'New Orders',      color: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',   headerColor: 'text-blue-800 dark:text-blue-300',   countBg: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
        { key: 'Preparing',  label: 'Preparing',        color: 'bg-orange-50/30 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-900/30', headerColor: 'text-orange-800 dark:text-orange-300', countBg: 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200' },
        { key: 'Ready',      label: 'Ready',            color: 'bg-green-50/30 dark:bg-green-950/20 border-green-100/50 dark:border-green-900/30',   headerColor: 'text-green-800 dark:text-green-300',   countBg: 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200' },
        { key: 'On the way', label: 'Out for Delivery', color: 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-100/50 dark:border-purple-900/30', headerColor: 'text-purple-800 dark:text-purple-300', countBg: 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Active Orders</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Live view — updates every 30 seconds</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchOrders}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} />
                    </button>
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex">
                        <button onClick={() => setView('kanban')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Board</button>
                        <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>List</button>
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search order ID or customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-green-500 transition-all text-gray-900 dark:text-white"
                    />
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{filteredOrders.length} active orders</span>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Kanban Board */}
            {!loading && view === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                    {columns.map(col => {
                        const colOrders = getColumn(col.key);
                        return (
                            <div key={col.key} className={`rounded-xl p-4 border min-h-[400px] ${col.color}`}>
                                <h3 className={`font-bold mb-4 flex items-center justify-between uppercase text-xs tracking-wider ${col.headerColor}`}>
                                    {col.label}
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.countBg}`}>{colOrders.length}</span>
                                </h3>
                                <div className="space-y-4">
                                    {colOrders.length === 0 && (
                                        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-8">No orders here</p>
                                    )}
                                    {colOrders.map(order => (
                                        <OrderCard
                                            key={order._id}
                                            order={order}
                                            onView={setSelectedOrder}
                                            onAdvance={handleAdvanceStatus}
                                            onPickup={handlePickup}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {!loading && view === 'list' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                <th className="text-left px-5 py-3 font-semibold">Order</th>
                                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                                <th className="text-left px-5 py-3 font-semibold">Type</th>
                                <th className="text-left px-5 py-3 font-semibold">Status</th>
                                <th className="text-right px-5 py-3 font-semibold">Total</th>
                                <th className="text-right px-5 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredOrders.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400 dark:text-slate-500">No active orders found</td></tr>
                            )}
                            {filteredOrders.map(order => {
                                const nextStatus = getNextStatus(order.status);
                                return (
                                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">
                                            #{order.orderNumber || (order._id || '').slice(-6)}
                                        </td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-slate-300">
                                            {order.customerName || order.customerId?.name || 'Walk-in'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{order.orderType}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>{order.status}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-green-600">₹{(order.totalPrice || 0).toFixed(0)}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors" title="View Details">
                                                    <Eye size={15} />
                                                </button>
                                                {nextStatus && (
                                                    <button onClick={() => handleAdvanceStatus(order, nextStatus)} className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors">
                                                        → {nextStatus}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onAdvance={handleAdvanceStatus}
                    onPickup={handlePickup}
                />
            )}
        </div>
    );
};

export default OrderManagement;
