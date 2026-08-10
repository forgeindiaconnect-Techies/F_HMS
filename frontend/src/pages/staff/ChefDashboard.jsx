import { useState, useEffect } from 'react';
import { 
    ChefHat, Timer, CheckCircle, AlertTriangle, 
    Flame, AlertOctagon, Check, MessageSquare, 
    Sliders, Star, Plus, Trash2, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChefDashboard = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('Pending');
    const [station, setStation] = useState('Hot Station');
    const [outOfStock, setOutOfStock] = useState(['Avocado (Haas)', 'Fresh Basil']);
    const [newIngredient, setNewIngredient] = useState('');
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [manualPriority, setManualPriority] = useState({}); // orderId -> boolean
    const [currentTime, setCurrentTime] = useState(new Date());

    const tabs = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed'];
    const stations = ['Hot Station', 'Grill Station', 'Cold/Salad Station', 'Desserts & Bakery'];

    // Poll live orders
    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const pollInterval = setInterval(fetchOrders, 10000);
        
        // Timer ticking every second for the KDS cooking clocks
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(timeInterval);
        };
    }, [api]);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            toast.success(`Order moved to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update order status');
        }
    };

    // Toggle out of stock ingredient (86 list)
    const handleAddIngredient = (e) => {
        e.preventDefault();
        if (!newIngredient.trim()) return;
        if (outOfStock.includes(newIngredient.trim())) {
            toast.error('Ingredient already flagged');
            return;
        }
        setOutOfStock([...outOfStock, newIngredient.trim()]);
        setNewIngredient('');
        toast.success('Ingredient added to out-of-stock list');
    };

    const handleRemoveIngredient = (ing) => {
        setOutOfStock(outOfStock.filter(i => i !== ing));
        toast.success('Ingredient restored to stock');
    };

    // Toggle priority manually
    const togglePriority = (orderId) => {
        setManualPriority(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
        toast.success('Priority status updated');
    };

    // Filter and Sort orders
    // Priority orders (time passed > 15m or manually starred) are sorted to the front!
    const getOrderPriorityScore = (order) => {
        const timeDiffMinutes = Math.floor((currentTime - new Date(order.createdAt)) / 60000);
        if (manualPriority[order._id]) return 100;
        if (timeDiffMinutes > 15) return 80;
        if (order.orderType === 'Dine In') return 10;
        return 0;
    };

    const filteredOrders = orders
        .filter(order => {
            if (activeTab === 'Ready') return ['Ready', 'Ready for Pickup', 'Picked Up'].includes(order.status);
            if (activeTab === 'Completed') return ['Completed', 'Served', 'Out for Delivery', 'Delivered'].includes(order.status);
            return order.status === activeTab;
        })
        .sort((a, b) => getOrderPriorityScore(b) - getOrderPriorityScore(a));

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans space-y-6 pb-20 text-gray-100">
            
            {/* Live Ingredient Alert Banner */}
            {outOfStock.length > 0 && (
                <div className="bg-red-950/80 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg animate-pulse">
                    <div className="flex items-center gap-3">
                        <AlertOctagon className="text-red-500 shrink-0 animate-bounce" size={24} />
                        <div>
                            <p className="text-red-400 font-extrabold text-sm uppercase tracking-wider">KDS Ingredient Stock Out (86 List)</p>
                            <p className="text-gray-300 text-xs mt-0.5 font-medium">
                                The following items are out-of-stock: <span className="text-white font-bold">{outOfStock.join(', ')}</span>. Do not accept orders containing these.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsAlertModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-colors whitespace-nowrap"
                    >
                        Manage 86 List
                    </button>
                </div>
            )}

            {/* Header, Station Toggle, and Queue selection */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl shadow-xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 text-orange-500">
                        <ChefHat size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>Kitchen Display System (KDS)</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-gray-400">Active Station:</span>
                            <select 
                                value={station} 
                                onChange={(e) => setStation(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-orange-500 text-xs font-bold rounded-lg px-2 py-0.5 focus:outline-none"
                            >
                                {stations.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Queue Tabs */}
                <div className="flex flex-wrap bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800 gap-1">
                    {tabs.map(tab => {
                        const count = orders.filter(o => {
                            if (tab === 'Ready') return ['Ready', 'Ready for Pickup', 'Picked Up'].includes(o.status);
                            if (tab === 'Completed') return ['Completed', 'Served', 'Out for Delivery', 'Delivered'].includes(o.status);
                            return o.status === tab;
                        }).length;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab 
                                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                                {tab === 'Pending' ? 'Incoming' : tab === 'Preparing' ? 'Cooking' : tab}
                                {count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-800 text-gray-300'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-gray-500 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                        <CheckCircle size={48} className="text-slate-800 mb-4" />
                        <p className="text-lg font-bold text-gray-400">All caught up!</p>
                        <p className="text-sm text-gray-500">Waiting for incoming order tickets...</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const timeDiffMinutes = Math.floor((currentTime - new Date(order.createdAt)) / 60000);
                        const timeDiffSeconds = Math.floor((currentTime - new Date(order.createdAt)) / 1000) % 60;
                        const isLate = timeDiffMinutes >= 15;
                        const isStarred = manualPriority[order._id];
                        const isPriority = isLate || isStarred;

                        return (
                            <div 
                                key={order._id} 
                                className={`bg-slate-900/90 rounded-2xl shadow-xl flex flex-col overflow-hidden border-2 transition-all ${
                                    isPriority ? 'border-red-600 shadow-red-950/20' : 'border-slate-800'
                                }`}
                            >
                                {/* Ticket Header */}
                                <div className={`px-5 py-3.5 flex justify-between items-center ${
                                    isPriority ? 'bg-red-700 text-white' : 'bg-slate-950 text-gray-200'
                                }`}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg font-mono">#{order._id.substring(order._id.length - 4).toUpperCase()}</span>
                                            <button 
                                                onClick={() => togglePriority(order._id)}
                                                className={`p-1 rounded-lg transition-colors ${
                                                    isStarred ? 'text-yellow-400 bg-white/10' : 'text-gray-400 hover:text-white'
                                                }`}
                                                title="Flag Priority"
                                            >
                                                <Star size={16} fill={isStarred ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">
                                                {order.orderType === 'Dine In' ? `Table ${order.tableNumber || 'Any'}` : order.orderType}
                                            </span>
                                            {isLate && (
                                                <span className="text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Flame size={12} /> Late
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cooking timer */}
                                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                                        <Timer size={14} className={isLate ? 'animate-spin' : ''} />
                                        <span>{timeDiffMinutes.toString().padStart(2, '0')}:{timeDiffSeconds.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>

                                {/* Ticket Body */}
                                <div className="flex-1 p-5 space-y-3">
                                    <div className="space-y-2">
                                        {order.orderItems.map((item, idx) => {
                                            // Check if any ingredient of this item is flagged outOfStock
                                            const hasOutOfStockWarning = outOfStock.some(ing => 
                                                item.name.toLowerCase().includes(ing.toLowerCase())
                                            );
                                            
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`rounded-xl p-3 flex justify-between gap-4 items-start border transition-all ${
                                                        activeTab === 'Completed' || activeTab === 'Ready' ? 'border-green-800/40 bg-green-950/20' : 
                                                        activeTab === 'Preparing' ? 'border-orange-850/40 bg-orange-950/25' : 
                                                        'border-slate-800 bg-slate-950/40'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-extrabold text-sm text-white">
                                                            {item.qty}× {item.name}
                                                        </p>
                                                        {hasOutOfStockWarning && (
                                                            <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                                                <AlertTriangle size={12} /> Ingredient Alert
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {order.notes && (
                                        <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-950/20 text-yellow-250 text-xs">
                                            <p className="font-bold mb-1 flex items-center gap-1"><MessageSquare size={12} /> Chef Notes:</p>
                                            <p>{order.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 border-t border-slate-800 bg-slate-950/45">
                                    {activeTab === 'Pending' && (
                                        <button onClick={() => updateStatus(order._id, 'Accepted')} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all text-xs">
                                            Accept Ticket
                                        </button>
                                    )}
                                    {activeTab === 'Accepted' && (
                                        <button onClick={() => updateStatus(order._id, 'Preparing')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all text-xs">
                                            Start Cooking
                                        </button>
                                    )}
                                    {activeTab === 'Preparing' && (
                                        <button 
                                            onClick={() => {
                                                const isSelfPickup = order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup';
                                                updateStatus(order._id, isSelfPickup ? 'Ready for Pickup' : 'Ready');
                                            }} 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-xs"
                                        >
                                            <Check size={16} /> Mark as Ready
                                        </button>
                                    )}
                                    {activeTab === 'Ready' && (
                                        <p className="text-center text-xs font-bold text-gray-550">
                                            {order.status === 'Ready for Pickup' ? 'Waiting at pickup counter...' : 'Dine-in Order Ready to Serve.'}
                                        </p>
                                    )}
                                    {activeTab === 'Completed' && (
                                        <p className="text-center text-xs font-bold text-gray-555">Served & Finalized.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 86 List Ingredient Management Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAlertModalOpen(false)}></div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2"><Sliders size={20} className="text-red-500" /> Out-of-Stock Ingredients</h3>
                            <button onClick={() => setIsAlertModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Add Item form */}
                            <form onSubmit={handleAddIngredient} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter ingredient name..." 
                                    value={newIngredient}
                                    onChange={(e) => setNewIngredient(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                                />
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-4 flex items-center justify-center transition-colors">
                                    <Plus size={16} />
                                </button>
                            </form>

                            {/* List of currently stockout ingredients */}
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active out-of-stock items</p>
                                {outOfStock.length === 0 ? (
                                    <p className="text-gray-450 text-xs py-4 text-center">No ingredients currently out of stock.</p>
                                ) : (
                                    outOfStock.map((ing) => (
                                        <div key={ing} className="flex justify-between items-center p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
                                            <span className="font-semibold text-gray-200">{ing}</span>
                                            <button 
                                                onClick={() => handleRemoveIngredient(ing)}
                                                className="p-1 hover:bg-red-550/20 text-red-500 hover:text-red-400 rounded-lg transition-all"
                                                title="In Stock"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                            <button 
                                onClick={() => setIsAlertModalOpen(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
                            >
                                Close Manager
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChefDashboard;
