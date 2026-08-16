import { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, CheckCircle, AlertTriangle, ChefHat, Flame, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const getStationForItem = (itemName) => {
    const name = (itemName || '').toLowerCase();
    const isMilkDessert = /milk\s*(cake|peda|sweet|pudding|halwa|barfi)|tres\s*leches|rabri|rasmalai|basundi|kheer/i.test(name);
    
    if (isMilkDessert || name.includes('dessert') || name.includes('cake') || name.includes('ice cream') || name.includes('sweet') || name.includes('brownie') || name.includes('waffle')) {
        return 'Dessert';
    }
    if (name.includes('milk') || name.includes('drink') || name.includes('soda') || name.includes('juice') || name.includes('tea') || name.includes('coffee') || name.includes('beverage') || name.includes('salad') || name.includes('cold') || name.includes('avocado') || name.includes('bruschetta')) {
        return 'Salad/Cold';
    }
    if (name.includes('fries') || name.includes('fry') || name.includes('chicken wings') || name.includes('nuggets') || name.includes('chips')) {
        return 'Fryer';
    }
    if (name.includes('burger') || name.includes('steak') || name.includes('beef') || name.includes('ribeye') || name.includes('grill') || name.includes('taco')) {
        return 'Grill';
    }
    return 'Grill'; // Default station fallback
};

const ManagerKitchenStatus = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [api]);

    // Initialize Stations Map
    const stationsData = {
        'Grill': { name: 'Grill', load: 'Low', tickets: 0, sold: 0, avgTime: '12m', chef: 'Marcus W.', delay: false },
        'Fryer': { name: 'Fryer', load: 'Low', tickets: 0, sold: 0, avgTime: '8m', chef: 'Jessica L.', delay: false },
        'Salad/Cold': { name: 'Salad/Cold', load: 'Low', tickets: 0, sold: 0, avgTime: '4m', chef: 'Sarah K.', delay: false },
        'Dessert': { name: 'Dessert', load: 'Low', tickets: 0, sold: 0, avgTime: '6m', chef: 'Tom H.', delay: false },
    };

    orders.forEach(order => {
        const isActive = ['Pending', 'Preparing', 'Ready'].includes(order.status);
        const isCompleted = ['Served', 'Out for Delivery', 'Delivered'].includes(order.status);
        
        order.orderItems.forEach(item => {
            const station = getStationForItem(item.name);
            if (stationsData[station]) {
                if (isActive) {
                    stationsData[station].tickets += item.qty;
                } else if (isCompleted) {
                    stationsData[station].sold += item.qty;
                }
            }
        });
    });

    // Update loads and delays based on actual active ticket load
    Object.keys(stationsData).forEach(key => {
        const station = stationsData[key];
        if (station.tickets > 5) {
            station.load = 'High';
            station.delay = true;
            station.avgTime = '18m';
        } else if (station.tickets > 2) {
            station.load = 'Normal';
            station.avgTime = '10m';
        } else if (station.tickets > 0) {
            station.load = 'Low';
            station.avgTime = '5m';
        } else {
            station.load = 'Low';
            station.avgTime = '0m';
        }
    });

    const stationsList = Object.values(stationsData);

    // Compute Delayed Tickets from active orders older than 15 minutes
    const delayedTickets = [];
    orders.forEach(order => {
        const isPendingOrPreparing = ['Pending', 'Preparing'].includes(order.status);
        if (isPendingOrPreparing) {
            const timeDiffMinutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
            if (timeDiffMinutes > 15) {
                const itemsDesc = order.orderItems.map(item => `${item.qty}x ${item.name}`).join(', ');
                const primaryStation = order.orderItems.length > 0 ? getStationForItem(order.orderItems[0].name) : 'Grill';
                delayedTickets.push({
                    id: `#ORD-${order._id.substring(order._id.length - 4).toUpperCase()}`,
                    station: primaryStation,
                    time: `${timeDiffMinutes}m`,
                    item: itemsDesc,
                    status: order.status
                });
            }
        }
    });

    // Calculate Overall Avg Prep Time (from completed orders or dynamic fallback)
    const completedOrders = orders.filter(o => ['Served', 'Out for Delivery', 'Delivered'].includes(o.status));
    let overallAvgTime = '12m 45s';
    if (completedOrders.length > 0) {
        let totalDiff = 0;
        completedOrders.forEach(o => {
            const diff = new Date(o.updatedAt) - new Date(o.createdAt);
            totalDiff += diff;
        });
        const avgMinutes = Math.floor((totalDiff / completedOrders.length) / 60000);
        const avgSeconds = Math.floor(((totalDiff / completedOrders.length) % 60000) / 1000);
        overallAvgTime = `${avgMinutes > 0 ? `${avgMinutes}m ` : ''}${avgSeconds}s`;
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Kitchen Status Monitor</h2>
                    <p className="text-gray-500 text-sm mt-1">Live view of kitchen load, station performance, and ticket times.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Avg Prep Time (Overall)</p>
                        <p className="text-2xl font-bold text-gray-900">{overallAvgTime}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { fetchOrders(); toast.success('Display refreshed!'); }} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
                            <RefreshCw size={16} /> Refresh Display
                        </button>
                    </div>
                </div>
            </div>

            {/* Station Load Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stationsList.map((station, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden ${station.delay ? 'border-red-200' : 'border-gray-100'}`}>
                        {station.delay && <div className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg"><AlertTriangle size={14} /></div>}
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${station.delay ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                {station.name === 'Grill' ? <Flame size={20} /> : <ChefHat size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{station.name}</h3>
                                <p className="text-xs text-gray-500">{station.chef}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Active Tickets</span>
                                    <span className="font-bold text-gray-900">{station.tickets}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${station.load === 'High' ? 'bg-red-500 w-[90%]' : station.load === 'Normal' ? 'bg-green-500 w-[50%]' : 'bg-blue-500 w-[20%]'}`}></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Avg Time</span>
                                <span className={`font-bold ${station.delay ? 'text-red-600' : 'text-gray-900'}`}>{station.avgTime}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2.5 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">Sold Today</span>
                                <span className="font-extrabold text-green-600">{station.sold} items</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delayed Tickets Attention */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                <div className="p-5 border-b border-red-100 bg-red-50/30 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-600" />
                    <h3 className="font-bold text-red-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Delayed Tickets Attention</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {delayedTickets.map((ticket, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex flex-col items-center justify-center text-red-600 border border-red-100">
                                    <span className="text-[10px] font-bold uppercase">Time</span>
                                    <span className="text-sm font-extrabold">{ticket.time}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-gray-900">{ticket.id}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded uppercase">{ticket.station}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{ticket.item}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-orange-600">{ticket.status}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => toast.success('Expediting order...')} className="bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors border border-red-200">
                                        Expedite
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {delayedTickets.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                            <p>No delayed tickets in the kitchen. Great job!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerKitchenStatus;
