import { useState } from 'react';
import { CheckSquare, Check, Plus, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const WaiterTasks = () => {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Serve Table 5 - Main Course', done: false, urgent: true, category: 'Service' },
        { id: 2, text: 'Collect Payment for Table 7', done: false, urgent: true, category: 'Billing' },
        { id: 3, text: 'Refill Water at Table 3', done: false, urgent: false, category: 'Service' },
        { id: 4, text: 'Deliver Dessert to Table 12', done: true, urgent: false, category: 'Service' },
        { id: 5, text: 'Clean & Sanitize Table 8', done: false, urgent: false, category: 'Hygiene' },
        { id: 6, text: 'Restock Cutlery & Napkins at Station A', done: false, urgent: false, category: 'Station Setup' },
        { id: 7, text: 'Verify Menu Specials with Executive Chef', done: true, urgent: false, category: 'Briefing' },
    ]);

    const [newTaskText, setNewTaskText] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [filter, setFilter] = useState('All');

    const toggleTask = (id) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask = {
            id: Date.now(),
            text: newTaskText,
            done: false,
            urgent: isUrgent,
            category: 'Personal'
        };
        setTasks([newTask, ...tasks]);
        setNewTaskText('');
        setIsUrgent(false);
        toast.success('Task added to shift checklist!');
    };

    const deleteTask = (id) => {
        setTasks(prev => prev.filter(t => t.id !== id));
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
                            Today's Shift Tasks & Checklist
                        </h1>
                        <p className="text-sm font-medium text-blue-100 mt-0.5">
                            Track daily floor duties, urgent customer requests & station setup
                        </p>
                    </div>
                </div>

                <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
                    <div className="text-2xl font-black">{progressPercent}%</div>
                    <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">{completedCount}/{tasks.length} Completed</div>
                </div>
            </div>

            {/* Quick Task Add Form */}
            <form onSubmit={handleAddTask} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="text"
                    placeholder="Add a new shift task or floor reminder..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 w-full bg-slate-50 text-xs font-bold px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
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
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {filteredTasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                            task.done
                            ? 'bg-slate-50 border-slate-200/60 opacity-60 line-through text-slate-400'
                            : task.urgent
                            ? 'bg-rose-50/50 border-rose-200 text-slate-900 hover:border-rose-300'
                            : 'bg-white border-slate-200/80 text-slate-900 hover:border-slate-300'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                                task.done
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300'
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
                                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg">
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
                ))}
            </div>

        </div>
    );
};

export default WaiterTasks;
