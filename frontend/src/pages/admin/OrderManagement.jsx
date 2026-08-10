import { useState } from 'react';
import { Search, Clock, CheckCircle2, ChefHat, Motorbike, Eye, Package } from 'lucide-react';

const activeOrders = [
    { id: '#ORD-092', type: 'Dine-in', table: 'T-04', items: 3, total: '₹45.00', status: 'New', time: '10 mins ago', customer: 'Walk-in' },
    { id: '#ORD-093', type: 'Delivery', address: '123 Main St', items: 2, total: '₹32.50', status: 'Preparing', time: '15 mins ago', customer: 'John Doe' },
    { id: '#ORD-094', type: 'Takeaway', items: 1, total: '₹14.99', status: 'Ready', time: '25 mins ago', customer: 'Sarah Smith' },
    { id: '#ORD-095', type: 'Dine-in', table: 'T-12', items: 5, total: '₹89.00', status: 'Preparing', time: '8 mins ago', customer: 'Walk-in' },
    { id: '#ORD-096', type: 'Delivery', address: '456 Elm St', items: 4, total: '₹65.00', status: 'On the way', time: '35 mins ago', customer: 'Mike Johnson' },
];

const getStatusColor = (status) => {
    switch(status) {
        case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Preparing': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'Ready': return 'bg-green-100 text-green-700 border-green-200';
        case 'On the way': return 'bg-purple-100 text-purple-700 border-purple-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const OrderManagement = () => {
    const [view, setView] = useState('kanban'); // 'kanban' or 'list'
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOrders = activeOrders.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Active Orders</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage current dine-in, takeaway, and delivery orders.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
                        <button onClick={() => setView('kanban')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}>Board</button>
                        <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}>List</button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search order ID or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" />
                </div>
            </div>

            {/* Kanban Board */}
            {view === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    {/* Column: New */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
                            New Orders <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">1</span>
                        </h3>
                        <div className="space-y-4">
                            {filteredOrders.filter(o => o.status === 'New').map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>

                    {/* Column: Preparing */}
                    <div className="bg-orange-50/30 rounded-xl p-4 border border-orange-100/50 min-h-[500px]">
                        <h3 className="font-bold text-orange-800 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
                            Preparing <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">2</span>
                        </h3>
                        <div className="space-y-4">
                            {filteredOrders.filter(o => o.status === 'Preparing').map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>

                    {/* Column: Ready */}
                    <div className="bg-green-50/30 rounded-xl p-4 border border-green-100/50 min-h-[500px]">
                        <h3 className="font-bold text-green-800 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
                            Ready <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full">1</span>
                        </h3>
                        <div className="space-y-4">
                            {filteredOrders.filter(o => o.status === 'Ready').map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>

                    {/* Column: Dispatch */}
                    <div className="bg-purple-50/30 rounded-xl p-4 border border-purple-100/50 min-h-[500px]">
                        <h3 className="font-bold text-purple-800 mb-4 flex items-center justify-between uppercase text-xs tracking-wider">
                            Out for Delivery <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">1</span>
                        </h3>
                        <div className="space-y-4">
                            {filteredOrders.filter(o => o.status === 'On the way').map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* List View placeholder for brevity */}
            {view === 'list' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                    List view table goes here.
                </div>
            )}
        </div>
    );
};

// Helper component for Kanban card
const OrderCard = ({ order }) => (
    <div className="relative bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-3">
            <span className="font-bold text-gray-900">{order.id}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                {order.type}
            </span>
        </div>
        
        <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600 font-medium">{order.customer}</p>
            {order.table && <p className="text-xs text-gray-500 flex items-center gap-1"><ChefHat size={14}/> Table {order.table}</p>}
            {order.address && <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><Motorbike size={14}/> {order.address}</p>}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-400 flex items-center gap-1 font-medium"><Clock size={12} /> {order.time}</span>
            <span className="font-bold text-green-600 text-sm">{order.total}</span>
        </div>

        {/* Hover action */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 border border-green-500">
             <button className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors" title="View Details"><Eye size={18} /></button>
             <button className="bg-yellow-600 p-2 rounded-full text-white hover:bg-yellow-700 transition-colors" title="Self Pickup" onClick={() => {/* TODO: implement self-pickup logic */}}><Package size={18} /></button>
             <button className="bg-green-600 p-2 rounded-full text-white hover:bg-green-700 transition-colors" title="Advance Status"><CheckCircle2 size={18} /></button>
        </div>
    </div>
);

export default OrderManagement;
