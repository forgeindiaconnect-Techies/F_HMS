import { useState, useEffect } from 'react';
import { CheckSquare, Receipt, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WaiterCompleted = () => {
    const { api } = useAuth();
    const [completed, setCompleted] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompletedOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            const doneOrders = res.data.filter(o => ['Served', 'Completed', 'Delivered', 'Picked Up', 'Paid'].includes(o.status));
            setCompleted(doneOrders);
        } catch (error) {
            console.error('Failed to fetch completed orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompletedOrders();
        const interval = setInterval(fetchCompletedOrders, 10000);
        return () => clearInterval(interval);
    }, [api]);

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Completed Orders</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Live record of served and completed customer orders.</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Total Served: {completed.length}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="py-12 text-center text-gray-400">Loading completed orders...</div>
                ) : completed.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 font-semibold text-sm">No completed orders yet today.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Order ID</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Table / Type</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Items</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Amount</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {completed.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold px-3 py-1 rounded-lg text-xs">
                                            {order.orderType === 'Dine In' ? `Table ${order.tableNumber || 'N/A'}` : order.orderType}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-gray-700 dark:text-slate-300">
                                        {order.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                    </td>
                                    <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">₹{order.totalPrice}</td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-gray-500 dark:text-slate-400">
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default WaiterCompleted;
