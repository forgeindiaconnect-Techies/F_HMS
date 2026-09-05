import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Coffee, CheckCircle2, Clock, Utensils, AlertTriangle, 
    Plus, Minus, X, Send, Receipt, Users, MessageSquare, Bell, Check, Star, RefreshCw,
    Search, Flame, ShieldAlert, Sparkles, UserCheck, DollarSign, ArrowRightLeft, 
    HelpCircle, ChevronRight, Award, Layers, TrendingUp, CheckSquare, HeartPulse, Filter, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';
import ThemeSettingCard from '../../components/ThemeToggle';

const WaiterDashboard = () => {
    const location = useLocation();
    const { api, user } = useAuth();
    const [menu, setMenu] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [viewMode, setViewMode] = useState('DineIn'); // 'DineIn' or 'SelfPickup'
    const [dbTables, setDbTables] = useState([]);
    const [activeTable, setActiveTable] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [serviceRequests, setServiceRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [fabOpen, setFabOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Live Date & Time Clock
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Smooth Scroll to Section Hash
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const el = document.getElementById(id);
            if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        }
    }, [location.hash]);

    // Assigned Tables state (stored in localStorage per waiter)
    const [assignedIds, setAssignedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`waiter_assigned_tables_${user?._id}`) || '[]');
        } catch (e) {
            return [];
        }
    });
    const [assignedOnly, setAssignedOnly] = useState(false);

    // Checklist Tasks state
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Serve Table 5 - Main Course', done: false, urgent: true },
        { id: 2, text: 'Collect Payment for Table 7', done: false, urgent: true },
        { id: 3, text: 'Refill Water at Table 3', done: false, urgent: false },
        { id: 4, text: 'Deliver Dessert to Table 12', done: true, urgent: false },
        { id: 5, text: 'Clean & Sanitize Table 8', done: false, urgent: false },
        { id: 6, text: 'Restock Cutlery & Napkins', done: false, urgent: false },
    ]);

    // Priority Actions state for Priority Action Center
    const [priorityActions, setPriorityActions] = useState([
        {
            id: 'pa-1',
            type: 'urgent',
            table: 'Table 5',
            tableNumber: 5,
            label: 'URGENT',
            time: 'Waiting 2m',
            title: 'Food Ready in Kitchen',
            details: '2x Grilled Salmon, 1x Truffle Pasta',
            buttonLabel: 'Serve Now',
            icon: Utensils,
            color: 'rose',
            action: (id) => {
                toast.success("Table 5 food served!");
                setPriorityActions(prev => prev.filter(item => item.id !== id));
            }
        },
        {
            id: 'pa-2',
            type: 'important',
            table: 'Table 7',
            tableNumber: 7,
            label: 'IMPORTANT',
            time: 'Waiting 4m',
            title: 'Bill Requested by Customer',
            details: 'Card Payment • Total: ₹2,450',
            buttonLabel: 'Generate Bill',
            icon: Receipt,
            color: 'amber',
            action: (id) => {
                toast.success("Bill generated for Table 7");
                setPriorityActions(prev => prev.filter(item => item.id !== id));
            }
        },
        {
            id: 'pa-3',
            type: 'info',
            table: 'Table 3',
            tableNumber: 3,
            label: 'INFO REQUEST',
            time: 'Just now',
            title: 'Customer Requested Water',
            details: 'Warm water & extra lemon requested',
            buttonLabel: 'Acknowledge',
            icon: CheckCircle2,
            color: 'blue',
            action: (id) => {
                toast.success("Acknowledged water request for Table 3");
                setPriorityActions(prev => prev.filter(item => item.id !== id));
            }
        },
        {
            id: 'pa-4',
            type: 'assistance',
            table: 'Table 8',
            tableNumber: 8,
            label: 'ASSISTANCE',
            time: 'Waiting 1m',
            title: 'Customer Needs Assistance',
            details: 'Wants recommendations on dessert menu',
            buttonLabel: 'Attend Table',
            icon: Users,
            color: 'emerald',
            action: (id) => {
                toast.success("Assigned to assist Table 8");
                setPriorityActions(prev => prev.filter(item => item.id !== id));
            }
        }
    ]);

    // Order Panel State
    const [cart, setCart] = useState([]);
    const [partySize, setPartySize] = useState(2);
    const [orderNote, setOrderNote] = useState('');

    const fetchData = async () => {
        try {
            const [menuRes, ordersRes, tablesRes, requestsRes] = await Promise.all([
                api.get('/menu'),
                api.get('/orders'),
                api.get('/tables').catch(() => ({ data: [] })),
                api.get('/service-requests').catch(() => ({ data: [] }))
            ]);
            setMenu(menuRes.data);
            setAllOrders(ordersRes.data);
            setActiveOrders(ordersRes.data.filter(o => o.orderType === 'Dine In' && !['Delivered', 'Completed'].includes(o.status)));
            setDbTables(tablesRes.data);
            setServiceRequests(requestsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchData();

        let ws;
        const connectWS = () => {
            let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            let wsURL = baseURL.replace(/^http/, 'ws').replace(/\/api$/, '');
            
            ws = new WebSocket(wsURL);

            ws.onopen = () => {
                if (user && user.restaurantId) {
                    ws.send(JSON.stringify({
                        type: 'register',
                        restaurantId: user.restaurantId,
                        role: 'waiter'
                    }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'new_order' || msg.type === 'order_updated' || msg.type === 'ready_to_serve') {
                        fetchData();

                        if (msg.data && (msg.data.orderType === 'Self-Pickup' || msg.data.orderType === 'Self Pickup') && msg.data.status === 'Ready for Pickup') {
                            toast.success(`Self-Pickup Order #${msg.data._id.substring(msg.data._id.length - 6).toUpperCase()} is ready!`, {
                                duration: 8000,
                                position: 'top-right',
                                icon: '📦'
                            });
                        }
                    } else if (msg.type === 'new_service_request') {
                        setServiceRequests(prev => {
                            if (prev.some(r => r._id === msg.data._id)) return prev;
                            return [msg.data, ...prev];
                        });
                        toast(`New Customer Request at Table ${msg.data.tableNumber}!`, { icon: '🔔' });
                    } else if (msg.type === 'service_request_updated') {
                        if (msg.data.status === 'Completed') {
                            setServiceRequests(prev => prev.filter(r => r._id !== msg.data._id));
                        }
                    }
                } catch (e) {
                    console.error("Error parsing websocket message", e);
                }
            };

            ws.onclose = () => {
                setTimeout(connectWS, 5000);
            };
        };

        connectWS();

        return () => {
            if (ws) ws.close();
        };
    }, [api, user]);

    const handleToggleAssignment = (tableId) => {
        let updated;
        if (assignedIds.includes(tableId)) {
            updated = assignedIds.filter(id => id !== tableId);
            toast.success(`Unassigned Table ${tableId} from your list`);
        } else {
            updated = [...assignedIds, tableId];
            toast.success(`Assigned Table ${tableId} to you! ⭐`);
        }
        setAssignedIds(updated);
        localStorage.setItem(`waiter_assigned_tables_${user?._id}`, JSON.stringify(updated));
    };

    const handleCompleteRequest = async (requestId) => {
        try {
            await api.put(`/service-requests/${requestId}/complete`);
            setServiceRequests(prev => prev.filter(r => r._id !== requestId));
            toast.success('Assistance request resolved');
        } catch (error) {
            console.error('Failed to complete request', error);
        }
    };

    const handleTableStatusChange = async (newStatus) => {
        if (!activeTable || !activeTable.dbId) {
            toast.error("Table model reference missing");
            return;
        }
        try {
            await api.put(`/tables/${activeTable.dbId}/status`, { status: newStatus });
            toast.success(`Table ${activeTable.id} is now ${newStatus}`);
            fetchData();
            setActiveTable(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            toast.error("Failed to change table status");
        }
    };

    const toggleTask = (taskId) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    };

    // Calculate processed tables list
    const tables = dbTables.length > 0 ? dbTables.map(t => {
        const order = activeOrders.find(o => String(o.tableNumber) === String(t.tableNumber));
        let displayStatus = t.status || 'Available';
        if (order) {
            displayStatus = 'Occupied';
            if (order.status === 'Served') displayStatus = 'Billing';
            else if (order.status === 'Ready') displayStatus = 'Needs Attention';
            else if (order.status === 'In Kitchen' || order.status === 'Preparing') displayStatus = 'Waiting for Food';
        }
        return { 
            id: String(t.tableNumber), 
            status: displayStatus, 
            seats: t.capacity || t.seats || 4, 
            orders: order, 
            dbId: t._id, 
            customers: t.customers || (order ? 2 : 0),
            timeAgo: order ? '18m ago' : '5m ago'
        };
    }) : [1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
        const id = `T-${num}`;
        const order = activeOrders.find(o => o.tableNumber === id || o.tableNumber === String(num));
        let status = 'Available';
        if (num === 5) status = 'Needs Attention';
        else if (num === 7) status = 'Billing';
        else if (num === 3) status = 'Waiting for Food';
        else if (num === 8) status = 'Reserved';
        else if (order) status = order.status === 'Served' ? 'Billing' : 'Occupied';

        return { 
            id: `Table ${num}`, 
            rawId: String(num), 
            status: status, 
            seats: 4, 
            orders: order, 
            customers: status !== 'Available' ? 3 : 0,
            timeAgo: `${10 + num * 2}m ago`
        };
    });

    // Apply Filter, Search & Assigned Tables
    let filteredTables = statusFilter === 'All' 
        ? tables 
        : tables.filter(t => t.status === statusFilter);

    if (assignedOnly) {
        filteredTables = filteredTables.filter(t => assignedIds.includes(t.id) || assignedIds.includes(t.rawId));
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredTables = filteredTables.filter(t => 
            t.id.toLowerCase().includes(q) || 
            t.status.toLowerCase().includes(q)
        );
    }

    const openTablePanel = (table) => {
        setActiveTable(table);
        setPartySize(table.seats);
        setCart([]);
        setOrderNote('');
        setPanelOpen(true);
    };

    const handleAssignCustomer = async () => {
        if (activeTable?.dbId) {
            try {
                await api.put(`/tables/${activeTable.dbId}/status`, { status: 'Occupied', customers: partySize });
                fetchData();
                setActiveTable({ ...activeTable, status: 'Occupied', customers: partySize });
            } catch (e) {
                console.error(e);
            }
        } else {
            setActiveTable({ ...activeTable, status: 'Occupied', customers: partySize });
        }
    };

    const addToCart = (item) => {
        const existing = cart.find(c => c._id === item._id);
        if (existing) {
            setCart(cart.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c));
        } else {
            setCart([...cart, { ...item, qty: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        const existing = cart.find(c => c._id === id);
        if (!existing) return;
        if (existing.qty === 1) setCart(cart.filter(c => c._id !== id));
        else setCart(cart.map(c => c._id === id ? { ...c, qty: c.qty - 1 } : c));
    };

    const handleSendToKitchen = async () => {
        try {
            const orderData = {
                orderItems: cart.map(item => ({
                    name: item.name,
                    qty: item.qty,
                    image: item.image || 'https://via.placeholder.com/150',
                    price: item.price,
                    product: item._id
                })),
                totalPrice: cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0),
                taxPrice: 0,
                notes: orderNote
            };

            if (activeTable.orders) {
                await api.put(`/orders/${activeTable.orders._id}/items`, orderData);
            } else {
                orderData.orderType = 'Dine In';
                orderData.tableNumber = activeTable.id;
                orderData.paymentMethod = 'Card';
                await api.post('/orders', orderData);
                
                if (activeTable.dbId) {
                    await api.put(`/tables/${activeTable.dbId}/status`, { status: 'Occupied', customers: partySize });
                }
            }
            
            setPanelOpen(false);
            setCart([]);
            setOrderNote('');
            fetchData();
            toast.success('Order sent to kitchen successfully!');
        } catch (error) {
            console.error('Failed to send order', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Failed to send order: ${errorMsg}`);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            fetchData();
            toast.success(`Order status updated to: ${status}`);
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update status');
        }
    };

    // Color map for table statuses
    const getTableBadgeStyle = (status) => {
        switch (status) {
            case 'Available': 
                return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:shadow-emerald-150';
            case 'Waiting for Food': 
            case 'Occupied': 
                return 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400 hover:shadow-amber-150';
            case 'Billing': 
                return 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400 hover:shadow-blue-150';
            case 'Reserved': 
                return 'bg-purple-50 border-purple-200 text-purple-800 hover:border-purple-400 hover:shadow-purple-150';
            case 'Needs Attention': 
                return 'bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400 hover:shadow-rose-150';
            default: 
                return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    const getStatusPill = (status) => {
        switch (status) {
            case 'Available': return <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Available</span>;
            case 'Waiting for Food': return <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Waiting for Food</span>;
            case 'Billing': return <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Billing</span>;
            case 'Reserved': return <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Reserved</span>;
            case 'Needs Attention': return <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Needs Attention</span>;
            default: return <span className="bg-slate-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">{status}</span>;
        }
    };

    // Helper for Live Order Stage progress step count (1 to 5)
    const getOrderStageStep = (status) => {
        switch (status) {
            case 'Order Received': case 'Pending': return 1;
            case 'Preparing': case 'In Kitchen': return 2;
            case 'Ready': case 'Ready for Pickup': return 3;
            case 'Picked Up': return 4;
            case 'Served': case 'Completed': case 'Delivered': return 5;
            default: return 2;
        }
    };

    // Calculate quick counts
    const foodReadyCount = activeOrders.filter(o => o.status === 'Ready').length + serviceRequests.length;
    const activeOrdersCount = activeOrders.length;
    const assignedTablesCount = assignedIds.length || 8;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 selection:bg-emerald-100 selection:text-emerald-900">
            
            <main className="max-w-[1700px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
                
                {/* -------------------------------------------------- */}
                {/* SHIFT SUMMARY CARDS */}
                {/* -------------------------------------------------- */}
                <section id="shift-status" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                    
                    {/* Card 1: Shift Status */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Shift Status</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="font-extrabold text-sm text-emerald-700 flex items-center gap-1.5">
                            <UserCheck size={16} className="text-emerald-600" /> On Duty
                        </div>
                        <div className="mt-2 text-[10px] font-semibold text-slate-400 flex items-center gap-1 border-t border-slate-100 pt-2">
                            <Clock size={11} /> 5h 32m (In: 09:00 AM)
                        </div>
                    </div>

                    {/* Card 2: Tables Assigned */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Tables Assigned</span>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Utensils size={14} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {assignedTablesCount} <span className="text-xs font-bold text-slate-400">Tables</span>
                        </div>
                        <div className="mt-1.5 text-[10px] font-bold text-emerald-600">
                            Active Floor Zone A
                        </div>
                    </div>

                    {/* Card 3: Active Orders */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Active Orders</span>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Layers size={14} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {activeOrdersCount || 12} <span className="text-xs font-bold text-slate-400">Orders</span>
                        </div>
                        <div className="mt-1.5 text-[10px] font-semibold text-blue-600">
                            4 preparing in kitchen
                        </div>
                    </div>

                    {/* Card 4: Food Ready */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Food Ready</span>
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
                                <Flame size={14} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-amber-600 tracking-tight flex items-center gap-1.5">
                            {foodReadyCount || 3} <span className="text-xs font-bold text-slate-400">Waiting</span>
                        </div>
                        <div className="mt-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                            Serve Immediately 🔥
                        </div>
                    </div>

                    {/* Card 5: Customer Rating */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Customer Rating</span>
                            <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-xl">
                                <Star size={14} className="fill-yellow-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            4.9 <span className="text-xs font-extrabold text-slate-400">/ 5.0</span>
                        </div>
                        <div className="mt-1.5 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                            <Award size={11} className="text-emerald-600" /> Top Server Today
                        </div>
                    </div>

                    {/* Card 6: Today's Tips */}
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Today's Tips</span>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <DollarSign size={14} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-700 tracking-tight">
                            ₹1,850
                        </div>
                        <div className="mt-1.5 text-[10px] font-bold text-emerald-600">
                            +₹450 last hour
                        </div>
                    </div>

                </section>

                {/* -------------------------------------------------- */}
                {/* PRIORITY ACTION CENTER */}
                {/* -------------------------------------------------- */}
                <section id="priority-actions" className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                                <Flame size={18} />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-base text-slate-900 tracking-tight">Priority Action Center</h2>
                                <p className="text-xs text-slate-400 font-medium">Urgent tasks ranked by priority level</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {priorityActions.length} Critical {priorityActions.length === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    {priorityActions.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                            <p className="font-bold text-slate-800 text-sm">All priority actions completed!</p>
                            <p className="text-xs text-slate-400 mt-1">Great job! No pending urgent requests.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {priorityActions.map((item) => {
                                const IconComponent = item.icon;
                                const styleConfig = {
                                    rose: {
                                        bg: 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/80',
                                        bar: 'bg-rose-500',
                                        badge: 'text-rose-700 bg-rose-200/60',
                                        time: 'text-rose-600',
                                        title: 'text-rose-950',
                                        sub: 'text-rose-800',
                                        detail: 'text-rose-700/80',
                                        btn: 'bg-rose-600 hover:bg-rose-700 text-white'
                                    },
                                    amber: {
                                        bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/80',
                                        bar: 'bg-amber-500',
                                        badge: 'text-amber-800 bg-amber-200/60',
                                        time: 'text-amber-700',
                                        title: 'text-amber-950',
                                        sub: 'text-amber-900',
                                        detail: 'text-amber-800/80',
                                        btn: 'bg-amber-600 hover:bg-amber-700 text-white'
                                    },
                                    blue: {
                                        bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/80',
                                        bar: 'bg-blue-500',
                                        badge: 'text-blue-800 bg-blue-200/60',
                                        time: 'text-blue-700',
                                        title: 'text-blue-950',
                                        sub: 'text-blue-900',
                                        detail: 'text-blue-800/80',
                                        btn: 'bg-blue-600 hover:bg-blue-700 text-white'
                                    },
                                    emerald: {
                                        bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/80',
                                        bar: 'bg-emerald-500',
                                        badge: 'text-emerald-800 bg-emerald-200/60',
                                        time: 'text-emerald-700',
                                        title: 'text-emerald-950',
                                        sub: 'text-emerald-900',
                                        detail: 'text-emerald-800/80',
                                        btn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }
                                }[item.color] || {
                                    bg: 'bg-slate-50 border-slate-200',
                                    bar: 'bg-slate-400',
                                    badge: 'text-slate-700 bg-slate-200',
                                    time: 'text-slate-600',
                                    title: 'text-slate-900',
                                    sub: 'text-slate-800',
                                    detail: 'text-slate-600',
                                    btn: 'bg-slate-800 text-white'
                                };

                                return (
                                    <div key={item.id} className={`${styleConfig.bg} border p-4 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${styleConfig.bar}`}></div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${styleConfig.badge}`}>
                                                    {item.type === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
                                                    {item.label}
                                                </span>
                                                <span className={`text-[10px] font-semibold ${styleConfig.time}`}>{item.time}</span>
                                            </div>
                                            <h3 className={`font-extrabold text-base flex items-center gap-1.5 ${styleConfig.title}`}>
                                                {item.table}
                                            </h3>
                                            <p className={`text-xs font-bold mt-1 ${styleConfig.sub}`}>{item.title}</p>
                                            <p className={`text-[11px] mt-0.5 ${styleConfig.detail}`}>{item.details}</p>
                                        </div>
                                        <button 
                                            onClick={() => item.action(item.id)}
                                            className={`w-full ${styleConfig.btn} font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
                                        >
                                            <IconComponent size={14} /> {item.buttonLabel}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* -------------------------------------------------- */}
                {/* MAIN LAYOUT: LEFT (70%) & RIGHT (30%) */}
                {/* -------------------------------------------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN (70%) - Restaurant Floor & Order Tracker */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Interactive Restaurant Floor Layout */}
                        <div id="floor-plan" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                            
                            {/* Layout Header & Filters */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Interactive Floor Plan</h3>
                                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                            {filteredTables.length} Tables
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Click any table card to view details, take orders, or alter status</p>
                                </div>

                                {/* Status Filters & Assigned Toggle */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setAssignedOnly(!assignedOnly)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                            assignedOnly 
                                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs' 
                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                                        }`}
                                    >
                                        <Star size={13} className={assignedOnly ? 'fill-white' : ''} />
                                        My Tables ({assignedIds.length})
                                    </button>

                                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                                        {['All', 'Available', 'Waiting for Food', 'Billing', 'Needs Attention'].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => setStatusFilter(st)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                                    statusFilter === st 
                                                    ? 'bg-white text-slate-900 shadow-xs' 
                                                    : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                {st === 'Waiting for Food' ? 'Waiting' : st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tables Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {filteredTables.map((t) => {
                                    const isAssigned = assignedIds.includes(t.id) || assignedIds.includes(t.rawId);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => openTablePanel(t)}
                                            className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative flex flex-col justify-between h-36 group hover:scale-[1.02] hover:shadow-md ${getTableBadgeStyle(t.status)}`}
                                        >
                                            {/* Top Row: Table Name & Star */}
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-base tracking-tight">{t.id}</span>
                                                <div className="flex items-center gap-1">
                                                    {isAssigned && (
                                                        <Star size={14} className="fill-amber-400 text-amber-500" title="Assigned to you" />
                                                    )}
                                                    <span className="text-[10px] font-bold opacity-75">{t.seats} seats</span>
                                                </div>
                                            </div>

                                            {/* Middle Row: Guest Count & Time */}
                                            <div className="my-auto">
                                                {t.customers > 0 ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                                        <Users size={13} /> {t.customers} Guests seated
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-semibold opacity-70">Ready for Seating</span>
                                                )}
                                                <p className="text-[10px] opacity-75 font-medium mt-0.5">{t.timeAgo}</p>
                                            </div>

                                            {/* Bottom Row: Status Badge */}
                                            <div className="flex items-center justify-between border-t border-black/5 pt-2">
                                                {getStatusPill(t.status)}
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredTables.length === 0 && (
                                <div className="text-center py-12 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl border border-slate-100">
                                    No floor tables matching current filters.
                                </div>
                            )}

                        </div>

                        {/* Live Order Tracker Section */}
                        <div id="kitchen-tracker" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Live Kitchen Order Tracker</h3>
                                    <p className="text-xs text-slate-400 font-medium">Real-time status progression of active kitchen orders</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                    {activeOrders.length} Active Kitchen Tickets
                                </span>
                            </div>

                            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                                {activeOrders.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 font-medium text-xs">
                                        All active orders have been served!
                                    </div>
                                ) : (
                                    activeOrders.map((order) => {
                                        const currentStep = getOrderStageStep(order.status);
                                        return (
                                            <div key={order._id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                                                
                                                {/* Header Row */}
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="font-black text-sm text-slate-900">
                                                            {order.tableNumber ? (order.tableNumber.startsWith('Table') ? order.tableNumber : `Table ${order.tableNumber}`) : 'Takeout'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                                            #{order._id.substring(order._id.length - 5).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                                            <Clock size={12} /> ETA: 8-12m
                                                        </span>
                                                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                                            order.status === 'Ready' 
                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' 
                                                            : 'bg-amber-100 text-amber-800 border-amber-300'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Ordered Items Summary */}
                                                <p className="text-xs font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60">
                                                    {order.orderItems.map(i => `${i.qty}x ${i.name}`).join(' • ')}
                                                </p>

                                                {/* Animated 5-Stage Progress Bar */}
                                                <div className="pt-1">
                                                    <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 mb-1.5">
                                                        <span className={currentStep >= 1 ? 'text-emerald-700' : ''}>1. Received</span>
                                                        <span className={currentStep >= 2 ? 'text-emerald-700' : ''}>2. Preparing</span>
                                                        <span className={currentStep >= 3 ? 'text-emerald-700 font-black' : ''}>3. Ready</span>
                                                        <span className={currentStep >= 4 ? 'text-emerald-700' : ''}>4. Picked Up</span>
                                                        <span className={currentStep >= 5 ? 'text-emerald-700' : ''}>5. Served</span>
                                                    </div>
                                                    
                                                    {/* Progress Track */}
                                                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden relative">
                                                        <div 
                                                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
                                                            style={{ width: `${(currentStep / 5) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Serve Quick Action Button */}
                                                {order.status === 'Ready' && (
                                                    <div className="flex justify-end pt-1">
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'Served')}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <CheckCircle2 size={14} /> Mark as Served
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (30%) - Notifications, Tasks, Performance */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Live Notifications Feed */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Live Floor Feed</h3>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Realtime</span>
                            </div>

                            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                                    <Flame size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-extrabold text-xs text-emerald-950">Kitchen Order Ready</p>
                                        <p className="text-[11px] text-emerald-700 mt-0.5">Table 5: 2x Grilled Salmon ready for pickup</p>
                                        <span className="text-[9px] text-emerald-500 font-semibold mt-1 block">1m ago</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                                    <Receipt size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-extrabold text-xs text-amber-950">Bill Requested</p>
                                        <p className="text-[11px] text-amber-700 mt-0.5">Table 7 requested final invoice check</p>
                                        <span className="text-[9px] text-amber-500 font-semibold mt-1 block">3m ago</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5">
                                    <Bell size={15} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-extrabold text-xs text-blue-950">Water Request</p>
                                        <p className="text-[11px] text-blue-700 mt-0.5">Table 3 customer requested refill</p>
                                        <span className="text-[9px] text-blue-500 font-semibold mt-1 block">5m ago</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-start gap-2.5">
                                    <Users size={15} className="text-purple-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-extrabold text-xs text-purple-950">Reservation Arrived</p>
                                        <p className="text-[11px] text-purple-700 mt-0.5">Party of 4 for Table 8 arrived at host station</p>
                                        <span className="text-[9px] text-purple-500 font-semibold mt-1 block">8m ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Tasks Checklist */}
                        <div id="shift-tasks" className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={18} className="text-emerald-600" />
                                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Today's Tasks</h3>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {tasks.filter(t => t.done).length}/{tasks.length} Done
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {tasks.map((task) => (
                                    <div 
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                            task.done 
                                            ? 'bg-slate-50 border-slate-200/60 opacity-65 line-through text-slate-400' 
                                            : task.urgent
                                            ? 'bg-rose-50/40 border-rose-200/60 text-slate-800 hover:border-rose-300'
                                            : 'bg-white border-slate-200/70 text-slate-800 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                task.done 
                                                ? 'bg-emerald-600 border-emerald-600 text-white' 
                                                : 'bg-white border-slate-300'
                                            }`}>
                                                {task.done && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <span className="text-xs font-bold">{task.text}</span>
                                        </div>
                                        {task.urgent && !task.done && (
                                            <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                                                Urgent
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Panel */}
                        <div id="performance" className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className="text-emerald-600" />
                                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Shift Performance</h3>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                    Top 5%
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center mb-4">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-xl font-black text-slate-900">28</div>
                                    <div className="text-[10px] font-bold text-slate-400">Orders Served</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-xl font-black text-slate-900">14m</div>
                                    <div className="text-[10px] font-bold text-slate-400">Avg Serve Time</div>
                                </div>
                            </div>

                            {/* Circular Ring Metric */}
                            <div className="flex items-center justify-around bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    {/* SVG Progress Ring */}
                                    <div className="relative w-14 h-14 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-emerald-200" fill="transparent" />
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-emerald-600" fill="transparent" strokeDasharray="138" strokeDashoffset="14" strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute font-black text-xs text-emerald-950">98%</span>
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-xs text-emerald-950">Accuracy Score</p>
                                        <p className="text-[10px] text-emerald-700 font-medium">0 order mistakes today</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </main>

            {/* -------------------------------------------------- */}
            {/* TABLE DETAILS PANEL (Slide-out) */}
            {/* -------------------------------------------------- */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-out z-50 flex flex-col ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Panel Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeTable?.id}</h2>
                            <button
                                onClick={() => handleToggleAssignment(activeTable?.id)}
                                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all border ${
                                    assignedIds.includes(activeTable?.id) || assignedIds.includes(activeTable?.rawId)
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-300'
                                }`}
                            >
                                <Star size={11} className={assignedIds.includes(activeTable?.id) || assignedIds.includes(activeTable?.rawId) ? 'fill-amber-500 text-amber-500' : ''} />
                                {assignedIds.includes(activeTable?.id) || assignedIds.includes(activeTable?.rawId) ? 'Assigned' : 'Assign to Me'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                            Status: <span className="font-extrabold text-slate-800">{activeTable?.status}</span>
                        </p>
                    </div>
                    <button 
                        onClick={() => setPanelOpen(false)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Table Tags / Special Customer Notes */}
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 overflow-x-auto text-[10px] font-bold">
                    <span className="bg-pink-100 text-pink-800 border border-pink-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        🎂 Birthday Celebration
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        ⭐ VIP Customer
                    </span>
                    <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        ⚠️ Allergy: Nuts
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        🧅 No Onion / Garlic
                    </span>
                </div>

                {/* Panel Scroll Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    
                    {/* Status Adjustment */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Set Table Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['Available', 'Occupied', 'Waiting for Food', 'Billing', 'Reserved'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => handleTableStatusChange(st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        activeTable?.status === st
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Menu Selection */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Menu Quick Add</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {menu.slice(0, 8).map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => addToCart(item)}
                                    className="p-3 text-left border border-slate-200/80 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer"
                                >
                                    <p className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-700 truncate">{item.name}</p>
                                    <p className="text-emerald-600 font-black text-[11px] mt-0.5">₹{item.price}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cart / Selected Items */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Cart / Draft Order</h3>
                        {cart.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">No items added yet. Click menu items above.</p>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((c) => (
                                    <div key={c._id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/60">
                                        <div>
                                            <p className="font-bold text-xs text-slate-800">{c.name}</p>
                                            <p className="text-[10px] text-slate-400">₹{c.price} each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => removeFromCart(c._id)} className="w-6 h-6 bg-slate-100 rounded-md text-slate-600 font-bold text-xs hover:bg-slate-200">-</button>
                                            <span className="font-bold text-xs w-4 text-center">{c.qty}</span>
                                            <button onClick={() => addToCart(c)} className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-md font-bold text-xs hover:bg-emerald-200">+</button>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-xs text-slate-900">
                                    <span>Total:</span>
                                    <span>₹{cart.reduce((a, b) => a + (b.price * b.qty), 0)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                        <button
                            onClick={handleSendToKitchen}
                            disabled={cart.length === 0}
                            className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                cart.length > 0
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <Send size={14} /> Send to Kitchen
                        </button>

                        <button
                            onClick={() => toast.success(`Bill generated for ${activeTable?.id}`)}
                            className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            <Receipt size={14} /> Generate Bill
                        </button>

                        <button
                            onClick={() => toast.success(`Transfer initiate for ${activeTable?.id}`)}
                            className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                            <ArrowRightLeft size={14} /> Transfer Table
                        </button>

                        <button
                            onClick={() => toast.success("Manager notified for assistance")}
                            className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                            <ShieldAlert size={14} /> Call Manager
                        </button>
                    </div>

                </div>
            </div>

            {/* Backdrop overlay for side panel */}
            {panelOpen && (
                <div 
                    onClick={() => setPanelOpen(false)}
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40"
                />
            )}

            {/* -------------------------------------------------- */}
            {/* BOTTOM FLOATING ACTION BUTTON (FAB) */}
            {/* -------------------------------------------------- */}
            <div className="fixed bottom-6 right-6 z-40">
                
                {/* FAB Quick Action Menu Popover */}
                {fabOpen && (
                    <div className="absolute bottom-16 right-0 w-52 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <button 
                            onClick={() => { setFabOpen(false); if(tables[0]) openTablePanel(tables[0]); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                            <Plus size={14} className="text-emerald-600" /> Take New Order
                        </button>
                        <button 
                            onClick={() => { setFabOpen(false); toast.success("Bill generation window opened"); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                            <Receipt size={14} className="text-blue-600" /> Generate Bill
                        </button>
                        <button 
                            onClick={() => { setFabOpen(false); toast.success("Transfer table modal opened"); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                            <ArrowRightLeft size={14} className="text-purple-600" /> Transfer Table
                        </button>
                        <button 
                            onClick={() => { setFabOpen(false); toast.success("Split bill options opened"); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                            <DollarSign size={14} className="text-amber-600" /> Split Bill
                        </button>
                        <button 
                            onClick={() => { setFabOpen(false); toast.success("Manager called to Floor"); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                            <ShieldAlert size={14} className="text-rose-600" /> Call Manager
                        </button>
                        <button 
                            onClick={() => { setFabOpen(false); setSettingsOpen(true); }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                        >
                            <Settings size={14} className="text-slate-600" /> Dashboard Settings
                        </button>
                    </div>
                )}

                {/* FAB Main Button */}
                <button
                    onClick={() => setFabOpen(!fabOpen)}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Quick Actions"
                >
                    <Plus size={26} className={`transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`} />
                </button>
            </div>

            {/* -------------------------------------------------- */}
            {/* SETTINGS MODAL */}
            {/* -------------------------------------------------- */}
            {settingsOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                                    <Settings size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Waiter Dashboard Settings</h2>
                                    <p className="text-xs text-slate-400">Configure appearance, notifications, theme mode, and POS alerts.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSettingsOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 text-slate-500 transition-all cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Theme & Appearance Card */}
                        <ThemeSettingCard />

                        {/* POS Alerts & Hardware Preferences */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Bell size={16} className="text-emerald-600" /> Waiter Alert & Audio Preferences
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Play Audio Chime on Food Ready</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Popup Alert for Customer Water / Assistance Calls</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Auto-refresh Live Floor Layout Grid (WebSocket Sync)</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                                </label>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => {
                                    toast.success("Waiter Dashboard settings saved!");
                                    setSettingsOpen(false);
                                }}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                            >
                                Save Preferences
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default WaiterDashboard;
