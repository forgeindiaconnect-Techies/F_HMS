import { useState, useEffect } from 'react';
import { CheckSquare, Check, Plus, AlertCircle, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const WaiterTasks = () => {
    const { api, user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    const fetchLiveTasks = async () => {
        try {
            setLoading(true);
            const [ordersRes, requestsRes] = await Promise.all([
                api.get('/orders').catch(() => ({ data: [] })),
                api.get('/service-requests').catch(() => ({ data: [] }))
            ]);

            const liveTasks = [];

            // 1. Food Ready Tasks
            ordersRes.data.forEach(o => {
                if (['Ready', 'Ready for Pickup'].includes(o.status)) {
                    liveTasks.push({
                        id: `order-${o._id}`,
                        text: `Serve Table ${o.tableNumber || 'Takeout'} - ${o.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ')}`,
                        done: false,
                        urgent: true,
                        category: 'Service',
                        orderId: o._id
                    });
                }
            });

            // 2. Service Requests Tasks
            requestsRes.data.forEach(r => {
                liveTasks.push({
                    id: `req-${r._id}`,
                    text: `Table ${r.tableNumber || 'N/A'}: ${r.requestType || 'Assistance Needed'} ${r.note ? `(${r.note})` : ''}`,
                    done: false,
                    urgent: r.requestType === 'Bill Request',
                    category: r.requestType === 'Bill Request' ? 'Billing' : 'Assistance',
                    requestId: r._id
                });
            });

            // Merge with local personal tasks stored in localStorage
            let localPersonal = [];
            try {
                localPersonal = JSON.parse(localStorage.getItem(`waiter_personal_tasks_${user?._id}`) || '[]');
            } catch (e) {}

            setTasks([...liveTasks, ...localPersonal]);
        } catch (error) {
            console.error('Failed to fetch waiter tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveTasks();
        const interval = setInterval(fetchLiveTasks, 3000);
        return () => clearInterval(interval);
    }, [api, user]);

    const toggleTask = async (task) => {
        if (task.orderId) {
            try {
                await api.put(`/orders/${task.orderId}/status`, { status: 'Served' });
                toast.success('Food marked as served!');
                fetchLiveTasks();
            } catch (e) {
                toast.error('Failed to update order status');
            }
            return;
        }

        if (task.requestId) {
            try {
                await api.put(`/service-requests/${task.requestId}/complete`);
                toast.success('Service request completed!');
                fetchLiveTasks();
            } catch (e) {
                toast.error('Failed to complete request');
            }
            return;
        }

        // Toggle local personal task
        const updated = tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t);
        setTasks(updated);
        const personalOnly = updated.filter(t => !t.orderId && !t.requestId);
        localStorage.setItem(`waiter_personal_tasks_${user?._id}`, JSON.stringify(personalOnly));
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask = {
            id: `custom-${Date.now()}`,
            text: newTaskText.trim(),
            done: false,
            urgent: isUrgent,
            category: 'Personal'
        };
        const updated = [newTask, ...tasks];
        setTasks(updated);
        setNewTaskText('');
        setIsUrgent(false);
        const personalOnly = updated.filter(t => !t.orderId && !t.requestId);
        localStorage.setItem(`waiter_personal_tasks_${user?._id}`, JSON.stringify(personalOnly));
        toast.success('Task added to shift checklist!');
    };

    const deleteTask = (id) => {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        const personalOnly = updated.filter(t => !t.orderId && !t.requestId);
        localStorage.setItem(`waiter_personal_tasks_${user?._id}`, JSON.stringify(personalOnly));
        toast.success('Task removed');
    };

    const completedCount = tasks.filter(t => t.done).length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    const filteredTasks = filter === 'All'
        ? tasks
        : filter === 'Pending' ? tasks.filter(t => !t.done)
        : filter === 'Completed' ? tasks.filter(t => t.done)
        : tasks.filter(t => t.urgent && !t.done);

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <CheckSquare size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Live Shift Tasks &amp; Checklist
                        </h1>
                        <p className="text-sm font-medium text-blue-100 mt-0.5">
                            Real-time floor duties, ready meals, and customer requests
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchLiveTasks} className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
                        <div className="text-2xl font-black">{progressPercent}%</div>
                        <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">{completedCount}/{tasks.length} Completed</div>
                    </div>
                </div>
            </div>

            {/* Quick Task Add Form */}
            <form onSubmit={handleAddTask} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="text"
                    placeholder="Add a custom floor task or reminder..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 w-full bg-slate-50 dark:bg-slate-950 text-xs font-bold px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="w-4 h-4 accent-rose-600" />
                    <span>Urgent</span>
                </label>
                <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <Plus size={16} /> Add Task
                </button>
            </form>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {['All', 'Pending', 'Completed', 'Urgent'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            filter === f
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-md'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        No active shift tasks. Add a custom task or wait for incoming floor alerts!
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => toggleTask(task)}
                            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                                task.done
                                ? 'bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 opacity-60 line-through text-slate-400'
                                : task.urgent
                                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-900 dark:text-white hover:border-rose-300'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                                    task.done
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                }`}>
                                    {task.done && <Check size={14} strokeWidth={3} />}
                                </div>
                                <div>
                                    <p className="font-extrabold text-sm">{task.text}</p>
                                    <span className="text-[10px] font-bold text-slate-400">{task.category}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {task.urgent && !task.done && (
                                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-950 dark:text-rose-400 px-2.5 py-1 rounded-lg">
                                        Urgent
                                    </span>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

export default WaiterTasks;
