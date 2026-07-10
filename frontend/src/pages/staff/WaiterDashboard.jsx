import { useState, useEffect } from 'react';
import { 
    Coffee, CheckCircle, Clock, UtensilsCrossed, AlertTriangle, 
    Plus, Minus, X, Send, Receipt, Users, MessageSquare 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WaiterDashboard = () => {
    const { api } = useAuth();
    const [menu, setMenu] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [dbTables, setDbTables] = useState([]);
    const [activeTable, setActiveTable] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Order Panel State
    const [cart, setCart] = useState([]);
    const [partySize, setPartySize] = useState(2);
    const [orderNote, setOrderNote] = useState('');

    const fetchData = async () => {
        try {
            const [menuRes, ordersRes, tablesRes] = await Promise.all([
                api.get('/menu'),
                api.get('/orders'),
                api.get('/tables').catch(() => ({ data: [] }))
            ]);
            setMenu(menuRes.data);
            setActiveOrders(ordersRes.data.filter(o => o.orderType === 'Dine In' && !['Delivered'].includes(o.status)));
            setDbTables(tablesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [api]);

    const tables = dbTables.length > 0 ? dbTables.map(t => {
        const order = activeOrders.find(o => String(o.tableNumber) === String(t.tableNumber));
        let displayStatus = t.status;
        if (order) {
            displayStatus = 'Occupied';
            if (order.status === 'Served') displayStatus = 'Billing';
        }
        return { id: String(t.tableNumber), status: displayStatus, seats: t.capacity || t.seats || 4, orders: order, dbId: t._id };
    }) : [1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
        const id = `T-${num}`;
        const order = activeOrders.find(o => o.tableNumber === id || o.tableNumber === String(num));
        if (order) {
            let status = 'Occupied';
            if (order.status === 'Served') status = 'Billing';
            return { id, status, seats: 4, orders: order };
        }
        return { id, status: 'Available', seats: 4 };
    });

    const filteredTables = statusFilter === 'All' 
        ? tables 
        : tables.filter(t => t.status === statusFilter);

    const openTablePanel = (table) => {
        setActiveTable(table);
        setPartySize(table.seats);
        setCart([]);
        setOrderNote('');
        setPanelOpen(true);
    };

    const handleAssignCustomer = () => {
        // Just open the menu for them
        setActiveTable({ ...activeTable, status: 'Occupied' });
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
                taxPrice: 0
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
                
                // Update table status in DB if using dynamic tables
                if (activeTable.dbId) {
                    await api.put(`/tables/${activeTable.dbId}/status`, { status: 'Occupied', customers: partySize });
                }
            }
            
            setPanelOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to send order', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to send order: ${errorMsg}`);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            fetchData();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-50 border-green-200 text-green-700';
            case 'Occupied': return 'bg-orange-50 border-orange-200 text-orange-700';
            case 'Reserved': return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'Cleaning': return 'bg-gray-100 border-gray-200 text-gray-500';
            case 'Billing': return 'bg-purple-50 border-purple-200 text-purple-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const activeTableOrders = tables.filter(t => t.orders && t.orders.status !== 'Served' && t.orders.status !== 'Delivered');

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 relative h-full flex flex-col">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Table Layout */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Table Layout</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setStatusFilter('All')} 
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusFilter === 'All' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                All
                            </button>
                            {['Available', 'Occupied', 'Reserved', 'Cleaning'].map(status => (
                                <button 
                                    key={status} 
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${statusFilter === status ? getStatusColor(status) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        {filteredTables.map(table => (
                            <button 
                                key={table.id}
                                onClick={() => openTablePanel(table)}
                                className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-2 h-32 ${getStatusColor(table.status)} ${table.status === 'Occupied' ? 'shadow-md shadow-orange-500/10' : ''}`}
                            >
                                <span className="text-2xl font-bold font-sans">{table.id}</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold">{table.status}</span>
                                    {table.status === 'Occupied' ? (
                                        <span className="text-xs font-medium opacity-80 flex items-center gap-1 mt-1">
                                            <Users size={12} /> {table.customers} Guests
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium opacity-75">{table.seats} seats</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Orders Sidebar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>Active Orders</h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-4">
                        {activeTableOrders.length === 0 ? (
                            <div className="text-center text-gray-400 py-10 font-medium">No active orders right now.</div>
                        ) : (
                            activeTableOrders.map(table => (
                                <div key={table.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Table {table.id}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1 truncate max-w-[150px]">
                                                {table.orders.orderItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            table.orders.status === 'Ready' ? 'bg-green-100 text-green-700' :
                                            table.orders.status === 'In Kitchen' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {table.orders.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                            <Clock size={12} /> 12m ago
                                        </span>
                                        {table.orders.status === 'Ready' ? (
                                            <button onClick={() => handleUpdateStatus(table.orders._id, 'Served')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5">
                                                <CheckCircle size={14} /> Serve
                                            </button>
                                        ) : table.orders.status === 'Served' ? (
                                            <button 
                                                onClick={async () => {
                                                    await handleUpdateStatus(table.orders._id, 'Billing Requested');
                                                    if (table.dbId) await api.put(`/tables/${table.dbId}/status`, { status: 'Billing' });
                                                    fetchData();
                                                }}
                                                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                                            >
                                                <Receipt size={14} /> Request Bill
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => openTablePanel(table)}
                                                className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Slide-out Order Entry Panel */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl border-l border-gray-100 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Panel Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 font-sans">Table {activeTable?.id}</h2>
                        <p className="text-sm text-gray-500 font-medium capitalize mt-1">Status: <span className="text-gray-900">{activeTable?.status}</span></p>
                    </div>
                    <button 
                        onClick={() => setPanelOpen(false)}
                        className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Panel Content based on Status */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col">
                    
                    {activeTable?.status === 'Available' ? (
                        <div className="p-8 flex flex-col items-center justify-center h-full space-y-6 text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                                <Users size={32} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Assign Customers</h3>
                                <p className="text-gray-500 text-sm mt-2 max-w-[250px] mx-auto">This table is currently clean and available for seating.</p>
                            </div>
                            
                            <div className="w-full max-w-xs space-y-2 text-left">
                                <label className="text-sm font-bold text-gray-700">Party Size (Max {activeTable.seats})</label>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"><Minus size={18} /></button>
                                    <span className="text-2xl font-bold w-12 text-center">{partySize}</span>
                                    <button onClick={() => setPartySize(Math.min(activeTable.seats, partySize + 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"><Plus size={18} /></button>
                                </div>
                            </div>

                            <button onClick={handleAssignCustomer} className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95">
                                Seat Customers
                            </button>
                        </div>
                    ) : (
                        
                        <div className="flex flex-col h-full">
                            {/* Menu Section */}
                            <div className="p-6 border-b border-gray-100 shrink-0">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Menu</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {menu.map(item => (
                                        <button 
                                            key={item._id}
                                            onClick={() => addToCart(item)}
                                            className="p-3 text-left border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md hover:bg-green-50/50 transition-all group"
                                        >
                                            <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                                            <p className="text-green-600 font-bold text-xs mt-1">${item.price}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Cart Section */}
                            <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Current Order</h3>
                                {cart.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic text-center mt-10">Tap items above to add to order.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item._id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-500 font-medium">${item.price} each</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => removeFromCart(item._id)} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100"><Minus size={14} /></button>
                                                    <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                                                    <button onClick={() => addToCart(item)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100"><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="pt-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                <MessageSquare size={14} /> Kitchen Notes (Optional)
                                            </label>
                                            <textarea 
                                                value={orderNote}
                                                onChange={(e) => setOrderNote(e.target.value)}
                                                placeholder="e.g. Table 2 wants no onions on the burger..."
                                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                                <button 
                                    onClick={handleSendToKitchen}
                                    disabled={cart.length === 0}
                                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                                        cart.length > 0 
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-95' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Send size={18} /> {activeTable?.orders ? 'Add Items to Kitchen' : 'Send Order to Kitchen'}
                                </button>
                                
                                {activeTable?.orders && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-bold text-gray-700">Already Sent Items</p>
                                            <span className="text-blue-600 font-bold">{activeTable.orders.status}</span>
                                        </div>
                                        <ul className="text-gray-500 list-disc list-inside space-y-1">
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
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setPanelOpen(false)}
                />
            )}
        </div>
    );
};

export default WaiterDashboard;
