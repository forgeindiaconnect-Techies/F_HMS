import { useState, useEffect } from 'react';
import { ChefHat, Timer, CheckCircle, AlertTriangle, Flame, AlertOctagon, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ChefDashboard = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('Pending');
    const tabs = ['Pending', 'Preparing', 'Ready', 'Completed'];

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
        // Poll every 10 seconds for new orders
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [api]);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            fetchOrders();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'Completed') return ['Served', 'Out for Delivery', 'Delivered'].includes(order.status);
        return order.status === activeTab;
    });

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans space-y-6 pb-20">
            {/* Ingredient Alert Banner */}
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                <AlertOctagon className="text-red-500 shrink-0" size={20} />
                <p className="text-red-400 font-bold text-sm">86 ALERT: <span className="text-white font-normal">Avocado (Haas) is completely out of stock. Stop accepting orders.</span></p>
            </div>

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e2330] p-4 rounded-2xl shadow-lg border border-[#2a3040]">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-500/20 p-2.5 rounded-xl border border-orange-500/30">
                        <ChefHat className="text-orange-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>Kitchen Display System</h2>
                        <p className="text-gray-400 text-xs mt-0.5">Station 1 · Hot Food</p>
                    </div>
                </div>

                <div className="flex bg-[#151923] p-1.5 rounded-xl border border-[#2a3040]">
                    {tabs.map(tab => {
                        const count = orders.filter(o => {
                            if (tab === 'Completed') return ['Served', 'Out for Delivery', 'Delivered'].includes(o.status);
                            return o.status === tab;
                        }).length;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab 
                                    ? 'bg-orange-500 text-white shadow-md' 
                                    : 'text-gray-400 hover:text-white hover:bg-[#2a3040]'
                                }`}
                            >
                                {tab === 'Pending' ? 'Incoming' : tab === 'Preparing' ? 'Cooking' : tab}
                                {count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#2a3040] text-gray-300'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Order Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                        <CheckCircle size={48} className="text-[#2a3040] mb-4" />
                        <p className="text-lg font-bold">No orders in this queue.</p>
                        <p className="text-sm">Great job keeping up!</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        // Calculate time passed since order created
                        const timeDiffMinutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
                        const isLate = timeDiffMinutes > 20;

                        return (
                        <div key={order._id} className={`bg-[#1e2330] rounded-2xl shadow-xl flex flex-col overflow-hidden border ${
                            isLate ? 'border-red-500/50' : 'border-[#2a3040]'
                        }`}>
                            
                            {/* Ticket Header */}
                            <div className={`px-5 py-3 flex justify-between items-center ${
                                isLate ? 'bg-orange-600' : 'bg-[#151923]'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-white text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>#{order._id.substring(order._id.length - 4).toUpperCase()}</span>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">
                                            {order.orderType === 'Dine In' ? `Table ${order.tableNumber || 'Any'}` : order.orderType}
                                        </span>
                                        {order.source === 'Web' || order.orderType === 'Self Pickup' ? (
                                            <span className="text-[10px] font-bold text-blue-100 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
                                                🔵 Self Pickup
                                            </span>
                                        ) : order.source === 'QR' || order.orderType === 'QR' ? (
                                            <span className="text-[10px] font-bold text-purple-100 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                                                📱 QR Order
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-green-100 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                                                🟢 Walk-in
                                            </span>
                                        )}
                                        {isLate && (
                                            <span className="text-[10px] font-bold text-red-100 bg-red-500/50 px-2 py-1 rounded-full border border-red-500/50 flex items-center gap-1 ml-auto">
                                                <Flame size={12} /> High Priority
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 text-sm font-bold ${isLate ? 'text-white' : 'text-gray-300'}`}>
                                    {isLate && <Flame size={14} className="text-yellow-300 animate-pulse" />}
                                    <Timer size={14} />
                                    {timeDiffMinutes}m
                                </div>
                            </div>

                            {/* Ticket Body */}
                            <div className="flex-1 p-5 space-y-3">
                                {order.orderItems.map((item, idx) => (
                                    <div key={idx} className={`rounded-xl p-3 flex justify-between gap-4 items-start border transition-colors ${
                                        activeTab === 'Completed' || activeTab === 'Ready' ? 'border-green-500/30 bg-green-900/20' : 
                                        activeTab === 'Preparing' ? 'border-orange-500/30 bg-orange-900/20' : 
                                        'border-[#2a3040] bg-[#151923]'
                                    }`}>
                                        <div className="flex-1">
                                            <p className={`font-bold ${activeTab === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-100'}`}>{item.qty}× {item.name}</p>
                                        </div>
                                    </div>
                                ))}
                                {order.notes && (
                                    <div className="mt-3 p-3 rounded-xl border border-yellow-500/30 bg-yellow-900/20 text-yellow-200 text-sm">
                                        <p className="font-bold mb-1 flex items-center gap-1.5"><MessageSquare size={14} /> Kitchen Notes:</p>
                                        <p>{order.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Ticket Action Button based on Tab */}
                            <div className="p-4 border-t border-[#2a3040] bg-[#1a1e2a]">
                                {activeTab === 'Pending' && (
                                    <button onClick={() => updateStatus(order._id, 'Preparing')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                                        Start Cooking
                                    </button>
                                )}
                                {activeTab === 'Preparing' && (
                                    <button onClick={() => updateStatus(order._id, 'Ready')} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                                        <Check size={18} /> Mark Ticket Ready
                                    </button>
                                )}
                                {activeTab === 'Ready' && (
                                    <button className="w-full bg-gray-600 text-gray-300 font-bold py-3 rounded-xl cursor-not-allowed flex justify-center items-center gap-2">
                                        Waiting for Runner...
                                    </button>
                                )}
                                {activeTab === 'Completed' && (
                                    <p className="text-center text-sm font-bold text-gray-500">Order fulfilled successfully.</p>
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

export default ChefDashboard;
