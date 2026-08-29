import { useState, useEffect } from 'react';
import { 
    Coffee, CheckCircle, Clock, UtensilsCrossed, AlertTriangle, 
    Plus, Minus, X, Send, Receipt, Users, MessageSquare, Bell, Check, Star, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

const WaiterDashboard = () => {
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
    
    // Assigned Tables state (stored in localStorage per waiter)
    const [assignedIds, setAssignedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`waiter_assigned_tables_${user?._id}`) || '[]');
        } catch (e) {
            return [];
        }
    });
    const [assignedOnly, setAssignedOnly] = useState(false);

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

                        // Fire toast and sound if a self-pickup order is ready
                        if (msg.data && (msg.data.orderType === 'Self-Pickup' || msg.data.orderType === 'Self Pickup') && msg.data.status === 'Ready for Pickup') {
                            toast.success(`Self-Pickup Order #${msg.data._id.substring(msg.data._id.length - 6).toUpperCase()} is ready! Move it to the pickup counter.`, {
                                duration: 8000,
                                position: 'top-right',
                                icon: '📦'
                            });
                            try {
                                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
                                audio.volume = 0.5;
                                audio.play();
                            } catch (e) {
                                console.log("Autoplay chime blocked by browser policy");
                            }
                        }
                    } else if (msg.type === 'new_service_request') {
                        setServiceRequests(prev => {
                            if (prev.some(r => r._id === msg.data._id)) return prev;
                            return [msg.data, ...prev];
                        });
                        toast(`New Customer Assistance Request at Table ${msg.data.tableNumber}!`, { icon: '🔔' });
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

    const tables = dbTables.length > 0 ? dbTables.map(t => {
        const order = activeOrders.find(o => String(o.tableNumber) === String(t.tableNumber));
        let displayStatus = t.status;
        if (order) {
            displayStatus = 'Occupied';
            if (order.status === 'Served') displayStatus = 'Billing';
        }
        return { id: String(t.tableNumber), status: displayStatus, seats: t.capacity || t.seats || 4, orders: order, dbId: t._id, customers: t.customers || 0 };
    }) : [1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
        const id = `T-${num}`;
        const order = activeOrders.find(o => o.tableNumber === id || o.tableNumber === String(num));
        if (order) {
            let status = 'Occupied';
            if (order.status === 'Served') status = 'Billing';
            return { id, status, seats: 4, orders: order, customers: 2 };
        }
        return { id, status: 'Available', seats: 4, customers: 0 };
    });

    // Apply Filter & Assigned Tables
    let filteredTables = statusFilter === 'All' 
        ? tables 
        : tables.filter(t => t.status === statusFilter);

    if (assignedOnly) {
        filteredTables = filteredTables.filter(t => assignedIds.includes(t.id));
    }

    const openTablePanel = (table) => {
        setActiveTable(table);
        setPartySize(table.seats);
        setCart([]);
        setOrderNote('');
        setPanelOpen(true);
    };

    const handleAssignCustomer = async () => {
        if (activeTable.dbId) {
            try {
                await api.put(`/tables/${activeTable.dbId}/status`, { status: 'Occupied', customers: partySize });
                fetchData();
                setActiveTable({ ...activeTable, status: 'Occupied', customers: partySize });
            } catch (e) {
                console.error(e);
            }
        } else {
            setActiveTable({ ...activeTable, status: 'Occupied' });
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
                // Append to existing order
                await api.put(`/orders/${activeTable.orders._id}/items`, orderData);
            } else {
                // Create new order
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50';
            case 'Occupied': return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100/50';
            case 'Reserved': return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-50';
            case 'Cleaning': return 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200/50';
            case 'Billing': return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/50';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const activeTableOrders = tables.filter(t => t.orders && t.orders.status !== 'Served' && t.orders.status !== 'Delivered' && t.orders.status !== 'Completed');
    const selfPickupOrders = allOrders.filter(o => (o.orderType === 'Self-Pickup' || o.orderType === 'Self Pickup') && ['Ready for Pickup', 'Ready'].includes(o.status));

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 relative h-full flex flex-col">
            
            {/* Shift Attendance Clock In / Clock Out Status Bar */}
            <StaffShiftClockWidget userRole="Waiter / Server" userName={user?.name || "Server"} />

            {/* View Mode Switcher */}
            <div className="flex gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                <button
                    onClick={() => setViewMode('DineIn')}
                    className={`flex-1 py-3 text-center rounded-xl font-bold transition-all cursor-pointer text-sm md:text-base flex items-center justify-center gap-2 ${
                        viewMode === 'DineIn'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    🍽️ Dine-in Table Service
                </button>
                <button
                    onClick={() => setViewMode('SelfPickup')}
                    className={`flex-1 py-3 text-center rounded-xl font-bold transition-all relative cursor-pointer text-sm md:text-base flex items-center justify-center gap-2 ${
                        viewMode === 'SelfPickup'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    📦 Self-Pickup Runner Queue
                    {selfPickupOrders.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {selfPickupOrders.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Main panel - Table Layout or Self-Pickup Queue */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
                    {viewMode === 'DineIn' ? (
                        <>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 border-b border-slate-50 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Table Layout Status</h3>
                                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Control layout grids, seat guests, and initiate bill checks.</p>
                                </div>
                                
                                {/* Assigned Toggle & filters */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setAssignedOnly(!assignedOnly)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-black border transition-all flex items-center gap-1 ${
                                            assignedOnly 
                                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Star size={12} className={assignedOnly ? 'fill-white' : ''} />
                                        My Tables ({assignedIds.length})
                                    </button>

                                    <button 
                                        onClick={() => setStatusFilter('All')} 
                                        className={`px-3 py-1.5 rounded-full text-xs font-black border transition-colors ${statusFilter === 'All' ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        All Statuses
                                    </button>
                                    {['Available', 'Occupied', 'Reserved', 'Cleaning', 'Billing'].map(status => (
                                        <button 
                                            key={status} 
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-black border transition-colors ${statusFilter === status ? getStatusColor(status) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 flex-1">
                                {filteredTables.map(table => {
                                    const isAssigned = assignedIds.includes(table.id);
                                    return (
                                        <button 
                                            key={table.id}
                                            onClick={() => openTablePanel(table)}
                                            className={`p-5 rounded-3xl border-2 transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-2.5 h-36 relative ${getStatusColor(table.status)} ${table.status === 'Occupied' ? 'shadow-sm shadow-orange-500/10' : ''}`}
                                        >
                                            {isAssigned && (
                                                <Star size={14} className="fill-amber-500 text-amber-500 absolute top-3 right-3 animate-pulse" />
                                            )}

                                            <span className="text-2xl font-black font-sans tracking-tight">{table.id}</span>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-extrabold uppercase tracking-wider">{table.status}</span>
                                                {table.status === 'Occupied' ? (
                                                    <span className="text-[10px] font-bold opacity-80 flex items-center gap-1 mt-1">
                                                        <Users size={10} /> {table.customers} Guests
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold opacity-75 mt-1">{table.seats} seats</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                {filteredTables.length === 0 && (
                                    <div className="col-span-full text-center py-20 text-slate-400 font-semibold text-sm bg-slate-50/50 rounded-3xl border border-slate-100">
                                        No tables match the selected status filters.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 shrink-0">
                                <h3 className="text-lg font-black text-gray-900 animate-in fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>Self-Pickup Runner Queue</h3>
                                <p className="text-xs text-gray-400 font-semibold mt-1">Collect prepared orders from the kitchen and move them to the Pickup Counter.</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
                                {selfPickupOrders.length === 0 ? (
                                    <div className="text-center py-20 text-slate-400 font-semibold text-sm bg-slate-50/50 rounded-3xl border border-slate-100">
                                        <CheckCircle className="mx-auto text-slate-200 mb-4" size={48} />
                                        No self-pickup orders waiting in the kitchen.
                                    </div>
                                ) : (
                                    selfPickupOrders.map(order => {
                                        const timeDiffMinutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
                                        return (
                                            <div key={order._id} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-shadow">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-gray-900 text-lg">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                                                        <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 uppercase tracking-wider">Self-Pickup</span>
                                                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Clock size={12}/> {timeDiffMinutes}m ago</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {order.orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                                    </p>
                                                    {order.notes && <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit italic">Note: {order.notes}</p>}
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateStatus(order._id, 'Picked Up')}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3 rounded-2xl transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer text-xs shrink-0 flex items-center gap-1.5"
                                                >
                                                    <CheckCircle size={14} /> Move to Counter
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Active Orders Sidebar & Service Requests */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0 space-y-6">
                    {/* Self-Pickup Transfer Alerts */}
                    {selfPickupOrders.length > 0 && (
                        <div className="border-b border-slate-100 pb-5 shrink-0">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                </span>
                                <h3 className="text-xs font-black text-orange-600 tracking-wider uppercase flex items-center gap-1.5">
                                    <UtensilsCrossed size={14} /> Counter Transfers ({selfPickupOrders.length})
                                </h3>
                            </div>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {selfPickupOrders.map((order) => (
                                    <div key={order._id} className="flex justify-between items-center bg-orange-50/70 border border-orange-100 p-3 rounded-2xl shadow-inner">
                                        <div>
                                            <p className="font-black text-orange-950 text-xs">Order #{order._id.substring(order._id.length - 6).toUpperCase()}</p>
                                            <p className="text-[10px] text-orange-700 font-bold truncate max-w-[150px] mt-0.5">
                                                {order.orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleUpdateStatus(order._id, 'Picked Up')}
                                            className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors flex items-center justify-center shadow-sm cursor-pointer"
                                            title="Move to Counter"
                                        >
                                            <Check size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assistance Alerts / Call Requests / Customer Requests */}
                    {serviceRequests.length > 0 && (
                        <div className="border-b border-slate-100 pb-5 shrink-0">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                                <h3 className="text-xs font-black text-red-600 tracking-wider uppercase flex items-center gap-1.5">
                                    <Bell size={14} /> Call & Assistance Alerts ({serviceRequests.length})
                                </h3>
                            </div>
                            <div className="space-y-2 max-h-[185px] overflow-y-auto pr-1">
                                {serviceRequests.map((req) => (
                                    <div key={req._id} className="flex justify-between items-center bg-red-50/70 border border-red-100 p-3 rounded-2xl shadow-inner">
                                        <div>
                                            <p className="font-black text-red-950 text-xs">Table {req.tableNumber}</p>
                                            <p className="text-[10px] text-red-700 font-bold mt-0.5">{req.requestType}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCompleteRequest(req._id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center justify-center shadow-sm cursor-pointer"
                                            title="Resolve Request"
                                        >
                                            <Check size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Orders List */}
                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                        <h3 className="text-base font-black text-slate-900 shrink-0">Active Table Orders</h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {activeTableOrders.length === 0 ? (
                                <div className="text-center text-slate-400 py-10 font-semibold text-xs bg-slate-50/50 rounded-2xl border border-slate-100">
                                    No active dine-in orders currently.
                                </div>
                            ) : (
                                activeTableOrders.map(table => (
                                    <div key={table.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                                    Table {table.id}
                                                    {assignedIds.includes(table.id) && (
                                                        <Star size={10} className="fill-amber-500 text-amber-500" />
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-1 truncate max-w-[150px]">
                                                    {table.orders.orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                table.orders.status === 'Ready' ? 'bg-green-100 text-green-700 border-green-200 animate-pulse' :
                                                table.orders.status === 'In Kitchen' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                                {table.orders.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/50">
                                            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                                <Clock size={10} /> Active order
                                            </span>
                                            {table.orders.status === 'Ready' ? (
                                                <button 
                                                    onClick={() => handleUpdateStatus(table.orders._id, 'Served')} 
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                                                >
                                                    <CheckCircle size={12} /> Serve Food
                                                </button>
                                            ) : table.orders.status === 'Served' ? (
                                                <button 
                                                    onClick={async () => {
                                                        await handleUpdateStatus(table.orders._id, 'Billing Requested');
                                                        if (table.dbId) await api.put(`/tables/${table.dbId}/status`, { status: 'Billing' });
                                                        fetchData();
                                                    }}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Receipt size={12} /> Request Bill
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => openTablePanel(table)}
                                                    className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-extrabold hover:bg-slate-50 transition-colors"
                                                >
                                                    View Table Details
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-out Order Entry Panel */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl border-l border-slate-100 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Panel Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">Table {activeTable?.id}</h2>
                            <button
                                onClick={() => handleToggleAssignment(activeTable?.id)}
                                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border ${
                                    assignedIds.includes(activeTable?.id)
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-200 shadow-sm'
                                }`}
                            >
                                <Star size={10} className={assignedIds.includes(activeTable?.id) ? 'fill-amber-500 text-amber-500' : ''} />
                                {assignedIds.includes(activeTable?.id) ? 'Assigned' : 'Assign to Me'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-1 capitalize">Current State: <span className="font-extrabold text-slate-800">{activeTable?.status}</span></p>
                    </div>
                    <button 
                        onClick={() => setPanelOpen(false)}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Manual Table Status Adjuster */}
                {activeTable && (
                    <div className="p-6 border-b border-slate-100 bg-slate-50/20 shrink-0">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">Set Table Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['Available', 'Occupied', 'Reserved', 'Cleaning', 'Billing'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => handleTableStatusChange(st)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                        activeTable.status === st
                                        ? getStatusColor(st) + ' border-2 shadow-inner'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Panel Content based on Status */}
                <div className="flex-1 overflow-y-auto bg-white flex flex-col">
                    
                    {activeTable?.status === 'Available' ? (
                        <div className="p-8 flex flex-col items-center justify-center h-full space-y-6 text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-inner">
                                <Users size={32} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Assign Guests & Customers</h3>
                                <p className="text-slate-450 text-xs mt-2 max-w-[280px] mx-auto leading-relaxed">Seating is currently available for this table. Update the headcount to check menu details.</p>
                            </div>
                            
                            <div className="w-full max-w-xs space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Party Size headcount (Max {activeTable.seats})</label>
                                <div className="flex items-center justify-between mt-2.5">
                                    <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><Minus size={16} /></button>
                                    <span className="text-2xl font-black w-12 text-center text-slate-800">{partySize}</span>
                                    <button onClick={() => setPartySize(Math.min(activeTable.seats, partySize + 1))} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><Plus size={16} /></button>
                                </div>
                            </div>

                            <button onClick={handleAssignCustomer} className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 text-xs">
                                Seat Customers
                            </button>
                        </div>
                    ) : (
                        
                        <div className="flex flex-col h-full">
                            {/* Menu Section */}
                            <div className="p-6 border-b border-slate-100 shrink-0">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Quick Menu Items</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {menu.map(item => (
                                        <button 
                                            key={item._id}
                                            onClick={() => addToCart(item)}
                                            className="p-3.5 text-left border border-slate-200 rounded-2xl hover:border-green-500 hover:shadow-sm hover:bg-green-50/20 transition-all group"
                                        >
                                            <p className="font-black text-slate-800 text-xs truncate group-hover:text-green-700">{item.name}</p>
                                            <p className="text-green-600 font-extrabold text-[11px] mt-1">₹{item.price}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Cart Section */}
                            <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Selected Items</h3>
                                {cart.length === 0 ? (
                                    <p className="text-slate-400 text-xs italic text-center mt-10 font-medium">No items added yet. Click menu buttons above.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item._id} className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-800 text-xs">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">₹{item.price} each</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => removeFromCart(item._id)} className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-100/50"><Minus size={12} /></button>
                                                    <span className="font-black text-xs w-4 text-center text-slate-800">{item.qty}</span>
                                                    <button onClick={() => addToCart(item)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100/50"><Plus size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="pt-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                <MessageSquare size={14} className="text-slate-400" /> Kitchen Notes / Custom Request
                                            </label>
                                            <textarea 
                                                value={orderNote}
                                                onChange={(e) => setOrderNote(e.target.value)}
                                                placeholder="e.g., Table 2 wants no onions on the burger, extra water..."
                                                className="w-full border border-slate-200 rounded-2xl p-3.5 text-xs focus:outline-none focus:border-green-500 resize-none font-semibold"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                                <button 
                                    onClick={handleSendToKitchen}
                                    disabled={cart.length === 0}
                                    className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-xs ${
                                        cart.length > 0 
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg shadow-orange-100 active:scale-95' 
                                        : 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200'
                                    }`}
                                >
                                    <Send size={14} /> {activeTable?.orders ? 'Add Items to Kitchen' : 'Send Order to Kitchen'}
                                </button>
                                
                                {activeTable?.orders && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-black text-slate-700">Already Sent Items</p>
                                            <span className="text-indigo-600 font-black uppercase text-[10px]">{activeTable.orders.status}</span>
                                        </div>
                                        <ul className="text-slate-500 list-disc list-inside space-y-1 font-semibold">
                                            {activeTable.orders.orderItems.map((i, idx) => (
                                                <li key={idx}>{i.qty}× {i.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Overlay for panel */}
            {panelOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setPanelOpen(false)}
                />
            )}
        </div>
    );
};

export default WaiterDashboard;
