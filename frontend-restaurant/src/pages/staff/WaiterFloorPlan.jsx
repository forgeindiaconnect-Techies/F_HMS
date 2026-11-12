import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Star, Search, Plus, CheckCircle2, ChevronRight, X, Send, Receipt, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const WaiterFloorPlan = () => {
    const navigate = useNavigate();
    const { api, user } = useAuth();
    const [dbTables, setDbTables] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState(() => {
        try { return sessionStorage.getItem('waiter_search_query') || ''; } catch { return ''; }
    });
    const [activeTable, setActiveTable] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);

    useEffect(() => {
        const onWaiterSearch = (e) => setSearchQuery(e.detail || '');
        window.addEventListener('waiter-search', onWaiterSearch);
        return () => window.removeEventListener('waiter-search', onWaiterSearch);
    }, []);

    const [assignedIds, setAssignedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`waiter_assigned_tables_${user?._id}`) || '[]');
        } catch (e) {
            return [];
        }
    });

    const fetchData = async () => {
        try {
            const [tablesRes, ordersRes] = await Promise.all([
                api.get('/tables').catch(() => ({ data: [] })),
                api.get('/orders').catch(() => ({ data: [] }))
            ]);
            setDbTables(Array.isArray(tablesRes.data) ? tablesRes.data : []);
            const ordersArr = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.orders || []);
            setActiveOrders(ordersArr.filter(o => o.orderType === 'Dine In' && !['Completed', 'Cancelled', 'Refunded'].includes(o.status)));
        } catch (error) {
            console.error('Failed to fetch floor data', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [api]);

    const handleToggleAssignment = (tableId) => {
        let updated;
        if (assignedIds.includes(tableId)) {
            updated = assignedIds.filter(id => id !== tableId);
            toast.success(`Unassigned Table ${tableId}`);
        } else {
            updated = [...assignedIds, tableId];
            toast.success(`Assigned Table ${tableId} to your duty list!`);
        }
        setAssignedIds(updated);
        localStorage.setItem(`waiter_assigned_tables_${user?._id}`, JSON.stringify(updated));
    };

    const tables = dbTables.map(t => {
        const order = activeOrders.find(o => String(o.tableNumber) === String(t.tableNumber));
        let displayStatus = t.status || 'Available';
        if (order) {
            displayStatus = 'Occupied';
            if (order.status === 'Served' || order.status === 'Billing Requested') displayStatus = 'Billing';
            else if (order.status === 'Ready') displayStatus = 'Needs Attention';
            else if (order.status === 'Pending' || order.status === 'Preparing') displayStatus = 'Waiting for Food';
        }
        return { 
            id: `Table ${t.tableNumber}`, 
            rawId: String(t.tableNumber),
            status: displayStatus, 
            seats: t.capacity || 4, 
            orders: order, 
            dbId: t._id 
        };
    });

    const filteredTables = tables.filter(t => {
        const q = searchQuery.trim().toLowerCase();
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
        const matchesSearch = !q || 
            t.id.toLowerCase().includes(q) ||
            String(t.rawId || '').toLowerCase().includes(q) ||
            t.status.toLowerCase().includes(q) ||
            (t.orders?._id && t.orders._id.toLowerCase().includes(q)) ||
            (t.orders?.customerName && t.orders.customerName.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
    });

    const openTablePanel = (t) => {
        setActiveTable(t);
        setPanelOpen(true);
    };

    const handleRequestBill = async () => {
        if (!activeTable?.orders?._id) {
            toast.error(`No active order found on ${activeTable?.id}`);
            return;
        }
        try {
            await api.put(`/orders/${activeTable.orders._id}/status`, { status: 'Billing Requested' });
            toast.success(`Bill requested for ${activeTable.id} & sent to Cashier!`);
            setPanelOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to request bill');
        }
    };

    const getTableStyle = (status) => {
        switch (status) {
            case 'Available': return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500';
            case 'Waiting for Food': case 'Occupied': return 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500';
            case 'Billing': return 'bg-blue-50 border-blue-300 text-blue-900 hover:border-blue-500';
            case 'Reserved': return 'bg-purple-50 border-purple-300 text-purple-900 hover:border-purple-500';
            case 'Needs Attention': return 'bg-rose-50 border-rose-300 text-rose-900 hover:border-rose-500 animate-pulse';
            default: return 'bg-slate-50 border-slate-200 text-slate-800';
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Interactive Floor Plan
                    </h1>
                    <p className="text-xs text-slate-400 font-medium mt-1">Real-time table status grid & order management</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs">
                        {tables.length} Total Floor Tables
                    </span>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                {['All', 'Available', 'Occupied', 'Waiting for Food', 'Billing', 'Reserved', 'Needs Attention'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            statusFilter === s
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Floor Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredTables.map((t) => {
                    const isAssigned = assignedIds.includes(t.id) || assignedIds.includes(t.rawId);
                    return (
                        <div
                            key={t.id}
                            onClick={() => openTablePanel(t)}
                            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-xl flex flex-col justify-between h-44 relative group ${getTableStyle(t.status)}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-base tracking-tight">{t.id}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleAssignment(t.id); }}
                                    className="p-1 rounded-lg hover:bg-black/10"
                                >
                                    <Star size={16} className={isAssigned ? 'fill-amber-500 text-amber-500' : 'opacity-40'} />
                                </button>
                            </div>

                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">{t.seats} Seats</span>
                                <p className="text-xs font-bold mt-1 truncate">{t.status}</p>
                            </div>

                            <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                                <span className="text-[10px] font-bold opacity-60">Tap for details</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Side Drawer Panel */}
            {panelOpen && (
                <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl border-l border-slate-200 z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right-4">
                    <div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-900">{activeTable?.id}</h2>
                            <button onClick={() => setPanelOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="py-4 space-y-3 overflow-y-auto max-h-[60vh]">
                        <p className="text-xs font-semibold text-slate-500">Current Status: <span className="font-bold text-slate-900">{activeTable?.status}</span> · {activeTable?.seats} Seats</p>
                        {activeTable?.orders ? (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-700">Order #{String(activeTable.orders._id).slice(-5).toUpperCase()}</span>
                                    <span className="text-emerald-600">₹{Number(activeTable.orders.totalPrice || 0).toFixed(2)}</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-500">Status: {activeTable.orders.status}</p>
                                <div className="divide-y divide-slate-200/70 pt-1">
                                    {(activeTable.orders.orderItems || []).map((it, idx) => (
                                        <div key={idx} className="py-1.5 flex justify-between text-xs text-slate-700">
                                            <span>{it.qty || it.quantity || 1}× {it.name}</span>
                                            <span className="font-semibold">₹{((it.price || 0) * (it.qty || it.quantity || 1)).toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 font-medium">
                                Table is currently idle. Use POS Desk below to open an order for {activeTable?.id}.
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => { setPanelOpen(false); navigate(`/waiter?table=${encodeURIComponent(activeTable?.rawId || '')}`); }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Plus size={16} /> Open POS &amp; Take Order
                        </button>
                        {activeTable?.orders && (
                            <button
                                onClick={handleRequestBill}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Receipt size={16} /> Request Bill for Cashier
                            </button>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default WaiterFloorPlan;
