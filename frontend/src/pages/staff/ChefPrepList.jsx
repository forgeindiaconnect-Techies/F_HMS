import { useState, useEffect } from 'react';
import { CheckSquare, Square, Clock, Flame, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ChefPrepList = () => {
    const { api } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            // Filter accepted or preparing orders
            const activeOrders = res.data.filter(o => o.status === 'Accepted' || o.status === 'Preparing');
            
            // Consolidate identical items needing preparation
            const itemMap = {};
            activeOrders.forEach(order => {
                order.orderItems.forEach(item => {
                    if (itemMap[item.name]) {
                        itemMap[item.name].qty += item.qty;
                        itemMap[item.name].orders.push(order._id);
                    } else {
                        itemMap[item.name] = {
                            name: item.name,
                            qty: item.qty,
                            completed: order.status === 'Preparing' && order.orderItems.every(oi => oi.name !== item.name), // partial status simulation
                            priority: order.orderType === 'Delivery' ? 'High' : 'Medium',
                            time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            orders: [order._id]
                        };
                    }
                });
            });
            setTasks(Object.values(itemMap));
        } catch (err) {
            console.error('Failed to fetch prep tasks', err);
            toast.error('Failed to load kitchen tasks');
        } finally {
            setLoading(false);
        }
    };

    const toggleComplete = async (task) => {
        try {
            // Settle all related orders to Ready
            await Promise.all(task.orders.map(orderId => 
                api.put(`/orders/${orderId}/status`, { status: 'Ready' })
            ));
            toast.success(`Preparation for ${task.name} completed!`);
            fetchTasks();
        } catch (err) {
            console.error('Failed to update prep status', err);
            toast.error('Failed to update prep status');
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const completionRate = tasks.length > 0 
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
        : 0;

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Kitchen Prep List</h2>
                    <p className="text-slate-600 dark:text-gray-400 text-sm mt-1">Consolidated dish preparations compiled from active orders.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Completion</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-green-400">{completionRate}%</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1e2330] rounded-2xl shadow-sm border border-slate-200 dark:border-[#2a3040] overflow-hidden">
                    <div className="p-5 border-b border-slate-200 dark:border-[#2a3040] flex justify-between items-center bg-slate-50 dark:bg-[#1a1e2a]">
                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Active Orders Prep</h3>
                        <button onClick={fetchTasks} className="text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors border border-orange-200 dark:border-orange-500/20">
                            Refresh List
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#2a3040]">
                        {tasks.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 dark:text-gray-400">
                                No active preparations. Add test orders to compile tasks.
                            </div>
                        ) : (
                            tasks.map((task, i) => (
                                <div key={i} className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#252b3b] transition-colors ${task.completed ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => toggleComplete(task)} className={`${task.completed ? 'text-green-500' : 'text-slate-400 dark:text-gray-500'} hover:text-green-500 dark:hover:text-green-400 transition-colors`}>
                                            {task.completed ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </button>
                                        <div>
                                            <h4 className={`font-bold text-lg ${task.completed ? 'text-slate-400 dark:text-gray-500 line-through' : 'text-slate-800 dark:text-gray-200'}`}>{task.name}</h4>
                                            <div className="flex items-center gap-3 text-sm mt-1">
                                                <span className="text-slate-500 dark:text-gray-400">Target Qty: <span className="font-bold text-slate-900 dark:text-white">{task.qty} servings</span></span>
                                                <span className="flex items-center gap-1 text-slate-500 dark:text-gray-400"><Clock size={14} /> Received {task.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {task.priority === 'High' && !task.completed && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded border border-red-200 dark:border-red-500/20">
                                                <Flame size={14} /> High Priority (Delivery)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChefPrepList;
