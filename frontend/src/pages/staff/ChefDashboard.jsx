import { useState, useEffect, useRef } from 'react';
import { 
    ChefHat, Timer, CheckCircle, AlertTriangle, 
    Flame, AlertOctagon, Check, MessageSquare, 
    Sliders, Star, Plus, Trash2, LayoutGrid, Columns,
    Search, Clock, ArrowRight, Utensils, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

const ChefDashboard = () => {
    const { api } = useAuth();
    
    // Core State
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
    const [selectedStation, setSelectedStation] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'oldest' | 'newest'
    
    // 86 List (Out of Stock Ingredients)
    const [outOfStock, setOutOfStock] = useState(['Avocado (Haas)', 'Fresh Basil', 'Truffle Oil']);
    const [newIngredient, setNewIngredient] = useState('');
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    
    // Priorities and item completion checklists (local ticket overrides)
    const [manualPriority, setManualPriority] = useState({}); // orderId -> boolean
    const [completedItems, setCompletedItems] = useState({}); // `${orderId}-${itemIdx}` -> boolean
    const [currentTime, setCurrentTime] = useState(new Date());

    const stations = [
        'All',
        '🔥 Grill & Fryer',
        '🍕 Pizza & Oven',
        '🥗 Cold & Salads',
        '🍰 Desserts & Bakery',
        '☕ Beverages & Bar'
    ];

    // Poll live orders
    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch kitchen orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const pollInterval = setInterval(fetchOrders, 5000);
        
        // Ticking stopwatch timer every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(timeInterval);
        };
    }, [api]);

    // Update order status on backend
    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });
            toast.success(`Ticket status updated to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Failed to update order status', error);
            toast.error('Failed to update status.');
        }
    };

    // Toggle individual dish item completion checklist
    const toggleItemDone = (orderId, itemIdx) => {
        const key = `${orderId}-${itemIdx}`;
        setCompletedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Toggle VIP Priority Flag
    const togglePriority = (orderId) => {
        setManualPriority(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
        toast.success('VIP Priority status toggled!');
    };

    // Add ingredient to 86 list
    const handleAddIngredient = (e) => {
        e.preventDefault();
        if (!newIngredient.trim()) return;
        if (outOfStock.some(i => i.toLowerCase() === newIngredient.trim().toLowerCase())) {
            toast.error('Ingredient is already on the 86 List');
            return;
        }
        setOutOfStock([...outOfStock, newIngredient.trim()]);
        setNewIngredient('');
        toast.success('Ingredient added to 86 Out-of-Stock list');
    };

    // Remove ingredient from 86 list
    const handleRemoveIngredient = (ing) => {
        setOutOfStock(outOfStock.filter(i => i !== ing));
        toast.success('Ingredient restored to active inventory!');
    };

    // Priority Score Calculation
    const getOrderPriorityScore = (order) => {
        const timeDiffMinutes = Math.floor((currentTime - new Date(order.createdAt)) / 60000);
        let score = 0;
        if (manualPriority[order._id]) score += 100;
        if (timeDiffMinutes > 15) score += 80;
        else if (timeDiffMinutes > 10) score += 40;
        if (order.orderType === 'Dine In') score += 15;
        return score;
    };

    // Station item classification helper
    const isItemInStation = (item, stationName) => {
        if (!stationName || stationName === 'All') return true;
        
        const sName = stationName.toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        const category = (item.category || item.product?.category || item.categoryName || '').toLowerCase();
        const station = (item.station || item.product?.station || '').toLowerCase();

        // 1. Direct explicit station property match
        if (station && (sName.includes(station) || station.includes(sName))) return true;

        // 2. Category & Name Matchers
        const isMilkDessert = /milk\s*(cake|peda|sweet|pudding|halwa|barfi)|tres\s*leches|rabri|rasmalai|basundi|kheer/i.test(itemName);
        const isMilkDrink = /milk|milkshake|badam\s*milk|chocolate\s*milk|hot\s*milk|cold\s*milk|flavored\s*milk|turmeric\s*milk/i.test(itemName) && !isMilkDessert;

        const isBeverage = 
            category.includes('beverage') || category.includes('drink') || category.includes('bar') || category.includes('juice') || category.includes('coffee') || category.includes('tea') || (category.includes('milk') && !isMilkDessert) ||
            isMilkDrink ||
            /coffee|shake|latte|tea|drink|juice|soda|beverage|water|mocktail|cocktail|beer|chai|espresso|cappuccino|mojito|smoothie|coke|pepsi|lassi|lemonade|wine|whiskey|vodka|rum|brew|boba|milk/i.test(itemName);

        const isDessert = 
            category.includes('dessert') || category.includes('sweet') || category.includes('bakery') || category.includes('cake') ||
            isMilkDessert ||
            /cake|brownie|ice cream|icecream|pie|sweet|dessert|halwa|jamun|pastry|waffle|pudding|kheer|cookie|chocolate|donut|tiramisu|sundae|custard|gulab|peda|rasgulla|barfi|mithai|kulfi/i.test(itemName);

        const isPizzaOven = 
            category.includes('pizza') || category.includes('oven') || category.includes('italian') || category.includes('baked') ||
            /pizza|bread|calzone|pasta|baked|oven|garlic|lasagna|risotto|spaghetti|macaroni|panini/i.test(itemName);

        const isColdSalad = 
            category.includes('salad') || category.includes('cold') || category.includes('sushi') ||
            /salad|roll|sushi|wrap|tacos|taco|cold|ice|soup|starter|appetizer|raita|curd|dip|hummus|kimchi|slaw/i.test(itemName);

        const isGrillFryer = 
            category.includes('grill') || category.includes('fry') || category.includes('main') || category.includes('chinese') || category.includes('indian') || category.includes('tandoor') || category.includes('bbq') ||
            /burger|steak|fry|fries|chicken|bbq|grill|tikka|kebab|paneer|main|rice|biryani|noodle|curry|dal|roti|naan|thali|dosa|sandwich|manchurian|momos|bhatura|samosa|crispy|wings|patty/i.test(itemName);

        if (sName.includes('beverage')) return isBeverage;
        if (sName.includes('dessert')) return isDessert;
        if (sName.includes('pizza')) return isPizzaOven;
        if (sName.includes('cold')) return isColdSalad;
        if (sName.includes('grill')) {
            return isGrillFryer || (!isBeverage && !isDessert && !isPizzaOven && !isColdSalad);
        }

        return true;
    };

    // Filter Logic
    const filterOrder = (order) => {
        // Tab Filter
        if (activeTab === 'Pending' && order.status !== 'Pending') return false;
        if (activeTab === 'Accepted' && order.status !== 'Accepted') return false;
        if (activeTab === 'Preparing' && order.status !== 'Preparing') return false;
        if (activeTab === 'Ready' && !['Ready', 'Ready for Pickup'].includes(order.status)) return false;
        if (activeTab === 'Completed' && !['Completed', 'Served', 'Delivered'].includes(order.status)) return false;

        // Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const idMatch = order._id.toLowerCase().includes(q);
            const tableMatch = String(order.tableNumber || '').toLowerCase().includes(q);
            const itemMatch = order.orderItems?.some(i => i.name.toLowerCase().includes(q));
            if (!idMatch && !tableMatch && !itemMatch) return false;
        }

        // Station Filter
        if (selectedStation !== 'All') {
            const hasStationItem = order.orderItems?.some(item => isItemInStation(item, selectedStation));
            if (!hasStationItem) return false;
        }

        return true;
    };

    // Sort Logic
    const sortedOrders = [...orders].filter(filterOrder).sort((a, b) => {
        if (sortBy === 'priority') {
            return getOrderPriorityScore(b) - getOrderPriorityScore(a);
        }
        if (sortBy === 'oldest') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortBy === 'newest') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });

    // Kitchen KDS Summary Metrics
    const totalLive = orders.filter(o => !['Completed', 'Served', 'Cancelled', 'Delivered'].includes(o.status)).length;
    const pendingCount = orders.filter(o => o.status === 'Pending').length;
    const preparingCount = orders.filter(o => o.status === 'Preparing').length;
    const readyCount = orders.filter(o => ['Ready', 'Ready for Pickup'].includes(o.status)).length;
    const overdueCount = orders.filter(o => {
        if (['Completed', 'Served', 'Delivered'].includes(o.status)) return false;
        const mins = Math.floor((currentTime - new Date(o.createdAt)) / 60000);
        return mins >= 15;
    }).length;

    // Helper for Timer Color Badges
    const getTimerColorClass = (mins) => {
        if (mins >= 15) return 'bg-red-600 text-white animate-pulse border-red-400';
        if (mins >= 10) return 'bg-amber-500 text-slate-950 border-amber-300';
        return 'bg-emerald-600 text-white border-emerald-400';
    };

    return (
        <div className="w-full max-w-[1700px] mx-auto font-sans space-y-6 pb-24 text-slate-900 dark:text-slate-100 transition-colors">
            
            {/* Shift Attendance Clock In / Clock Out Status Bar */}
            <StaffShiftClockWidget userRole="Head Chef / Kitchen Lead" userName="Master Chef" />

            {/* 1. Live Ingredient 86-List Warning Banner */}
            {outOfStock.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-red-950 dark:via-slate-900 dark:to-red-950 border border-red-200 dark:border-red-500/40 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl dark:shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3.5 z-10">
                        <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-500/30 shrink-0">
                            <AlertOctagon className="animate-bounce" size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-red-700 dark:text-red-400 font-black text-xs uppercase tracking-widest bg-red-100 dark:bg-red-500/20 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-500/30">
                                    Active 86 List (Out of Stock)
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">({outOfStock.length} items flagged)</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mt-1">
                                Flagged ingredients: <span className="text-red-600 dark:text-red-300 font-extrabold">{outOfStock.join(' · ')}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                        <button 
                            onClick={() => setIsAlertModalOpen(true)}
                            className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        >
                            <Sliders size={16} /> Manage 86 List
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Top KDS Kitchen Command Header */}
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                
                {/* Header Title & Station Selector */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 shrink-0">
                            <ChefHat size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Kitchen Display System (KDS)
                                </h1>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold mt-0.5">
                                Real-time order routing, cooking timers, priority queueing, and station management.
                            </p>
                        </div>
                    </div>

                    {/* Station Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">Station:</span>
                        {stations.map(st => (
                            <button
                                key={st}
                                onClick={() => setSelectedStation(st)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                                    selectedStation === st
                                    ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/25 scale-105'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                            <Utensils size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Live Queue</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalLive}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
                        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">In Preparation</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{preparingCount}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Ready to Serve</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{readyCount}</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                        overdueCount > 0 ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/40 animate-pulse' : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80'
                    }`}>
                        <div className={`p-3 rounded-xl ${overdueCount > 0 ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Rush / Overdue (&gt;15m)</p>
                            <p className={`text-2xl font-black ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-300'}`}>{overdueCount}</p>
                        </div>
                    </div>
                </div>

                {/* Queue Filter Tabs & View Controls */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-2">
                    
                    {/* Status Tabs */}
                    <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/90 gap-1 w-full lg:w-auto">
                        {[
                            { id: 'All', label: 'All Orders', count: totalLive },
                            { id: 'Pending', label: '📥 Incoming', count: pendingCount },
                            { id: 'Preparing', label: '🍳 Cooking', count: preparingCount },
                            { id: 'Ready', label: '✨ Ready', count: readyCount },
                            { id: 'Completed', label: '✅ Completed', count: orders.filter(o => ['Completed', 'Served'].includes(o.status)).length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === tab.id
                                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Controls: Search, Sort & View Mode Switcher */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search ticket #, table, dish..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        {/* Sort Selector */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 cursor-pointer shrink-0"
                        >
                            <option value="priority">🔥 Priority Score</option>
                            <option value="oldest">⏱️ Oldest First</option>
                            <option value="newest">⚡ Newest First</option>
                        </select>

                        {/* View Switcher Buttons */}
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'kanban' ? 'bg-orange-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                title="Kanban Queue Columns View"
                            >
                                <Columns size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. KDS Orders Display Container */}
            {viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {sortedOrders.length === 0 ? (
                        <div className="col-span-full py-28 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <CheckCircle size={52} className="text-slate-300 dark:text-slate-800 mb-4" />
                            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No active kitchen tickets</p>
                            <p className="text-xs text-slate-500 mt-1">Waiting for incoming customer orders...</p>
                        </div>
                    ) : (
                        sortedOrders.map((order) => {
                            const timeDiffMinutes = Math.floor((currentTime - new Date(order.createdAt)) / 60000);
                            const timeDiffSeconds = Math.floor((currentTime - new Date(order.createdAt)) / 1000) % 60;
                            const isOverdue = timeDiffMinutes >= 15;
                            const isStarred = manualPriority[order._id];
                            const isPriority = isOverdue || isStarred;

                            // Calculate Checklist progress
                            const totalItemsCount = order.orderItems?.length || 0;
                            const doneItemsCount = order.orderItems?.filter((_, idx) => completedItems[`${order._id}-${idx}`]).length || 0;
                            const progressPercent = totalItemsCount > 0 ? Math.round((doneItemsCount / totalItemsCount) * 100) : 0;

                            return (
                                <div 
                                    key={order._id} 
                                    className={`bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl dark:shadow-2xl flex flex-col overflow-hidden border-2 transition-all duration-300 ${
                                        isPriority ? 'border-red-500 shadow-red-500/10' : 'border-slate-200 dark:border-slate-800/90'
                                    }`}
                                >
                                    {/* Ticket Top Header */}
                                    <div className={`px-5 py-4 flex justify-between items-center ${
                                        isPriority ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800'
                                    }`}>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-lg text-slate-900 dark:text-white">#{order._id.substring(order._id.length - 5).toUpperCase()}</span>
                                                <button 
                                                    onClick={() => togglePriority(order._id)}
                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                        isStarred ? 'text-amber-500 dark:text-amber-300 bg-amber-100 dark:bg-white/20' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                                    title="Pin as VIP Priority"
                                                >
                                                    <Star size={16} fill={isStarred ? "currentColor" : "none"} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white px-2.5 py-0.5 rounded-full">
                                                    {order.orderType === 'Dine In' ? `📍 Table ${order.tableNumber || 'Any'}` : `🛵 ${order.orderType}`}
                                                </span>
                                                {isOverdue && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Flame size={12} /> OVERDUE
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cooking Timer Stopwatch */}
                                        <div className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs border flex items-center gap-1.5 shadow-md ${getTimerColorClass(timeDiffMinutes)}`}>
                                            <Timer size={14} className={isOverdue ? 'animate-spin' : ''} />
                                            <span>{timeDiffMinutes.toString().padStart(2, '0')}:{timeDiffSeconds.toString().padStart(2, '0')}</span>
                                        </div>
                                    </div>

                                    {/* Prep Checklist Progress Bar */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5">
                                        <div 
                                            className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    {/* Ticket Items Checklist Body */}
                                    <div className="flex-1 p-5 space-y-3.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-800">
                                            <span>Dish Checklist ({doneItemsCount}/{totalItemsCount})</span>
                                            <span className="text-orange-600 dark:text-orange-400 font-mono">{progressPercent}% Ready</span>
                                        </div>

                                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                            {order.orderItems?.map((item, idx) => {
                                                const isItemDone = completedItems[`${order._id}-${idx}`];
                                                
                                                // Check for 86 ingredient stock out match
                                                const hasIngredientAlert = outOfStock.some(ing => 
                                                    item.name.toLowerCase().includes(ing.toLowerCase())
                                                );

                                                return (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => toggleItemDone(order._id, idx)}
                                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                            isItemDone 
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300' 
                                                            : hasIngredientAlert
                                                            ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-200 animate-pulse'
                                                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                            <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                                                isItemDone ? 'bg-emerald-500 border-emerald-400 text-white dark:text-slate-950' : 'border-slate-300 dark:border-slate-600'
                                                            }`}>
                                                                {isItemDone && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={`font-extrabold text-xs truncate ${isItemDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                                    {item.qty}× {item.name}
                                                                </p>
                                                                {hasIngredientAlert && (
                                                                    <p className="text-[10px] font-black text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                                                                        <AlertTriangle size={10} /> 86 Alert: Check Stock
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {item.price && (
                                                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold shrink-0">
                                                                ₹{item.price}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Notes Section */}
                                        {order.notes && (
                                            <div className="p-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                                                <p className="font-black flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                                    <MessageSquare size={12} /> Chef Notes / Customization:
                                                </p>
                                                <p className="font-semibold">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons Footer */}
                                    <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 shrink-0">
                                        {order.status === 'Pending' && (
                                            <button 
                                                onClick={() => updateStatus(order._id, 'Accepted')} 
                                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3 rounded-2xl transition-all shadow-lg shadow-orange-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                            >
                                                <span>Accept Order Ticket</span>
                                                <ArrowRight size={16} />
                                            </button>
                                        )}
                                        {order.status === 'Accepted' && (
                                            <button 
                                                onClick={() => updateStatus(order._id, 'Preparing')} 
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                            >
                                                <ChefHat size={16} />
                                                <span>Start Preparation</span>
                                            </button>
                                        )}
                                        {order.status === 'Preparing' && (
                                            <button 
                                                onClick={() => {
                                                    const isSelf = order.orderType === 'Self-Pickup' || order.orderType === 'Self Pickup';
                                                    updateStatus(order._id, isSelf ? 'Ready for Pickup' : 'Ready');
                                                }} 
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2 text-xs cursor-pointer active:scale-95"
                                            >
                                                <Check size={16} />
                                                <span>Mark Ticket Ready</span>
                                            </button>
                                        )}
                                        {['Ready', 'Ready for Pickup'].includes(order.status) && (
                                            <button 
                                                onClick={() => updateStatus(order._id, 'Completed')}
                                                className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-extrabold py-3 rounded-2xl transition-all border border-emerald-500/30 text-xs flex justify-center items-center gap-2 cursor-pointer"
                                            >
                                                <Sparkles size={14} /> Bump to Completed
                                            </button>
                                        )}
                                        {['Completed', 'Served', 'Delivered'].includes(order.status) && (
                                            <div className="text-center py-2 text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
                                                <CheckCircle size={14} className="text-emerald-500" /> Served &amp; Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* KANBAN QUEUE COLUMNS VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { title: '📥 Incoming (Pending)', statusKey: 'Pending', accent: 'from-amber-600 to-orange-600', border: 'border-amber-500/30' },
                        { title: '👨‍🍳 Accepted Queue', statusKey: 'Accepted', accent: 'from-blue-600 to-cyan-600', border: 'border-blue-500/30' },
                        { title: '🍳 Cooking (Preparing)', statusKey: 'Preparing', accent: 'from-purple-600 to-indigo-600', border: 'border-purple-500/30' },
                        { title: '✨ Plated & Ready', statusKey: 'Ready', accent: 'from-emerald-600 to-teal-600', border: 'border-emerald-500/30' }
                    ].map(column => {
                        const colOrders = sortedOrders.filter(o => {
                            if (column.statusKey === 'Ready') return ['Ready', 'Ready for Pickup'].includes(o.status);
                            return o.status === column.statusKey;
                        });

                        return (
                            <div key={column.statusKey} className="bg-white dark:bg-slate-900/70 rounded-3xl border border-slate-200 dark:border-slate-800/90 flex flex-col min-h-[600px] overflow-hidden shadow-lg">
                                {/* Column Header */}
                                <div className={`p-4 bg-gradient-to-r ${column.accent} text-white font-extrabold flex justify-between items-center shadow-md`}>
                                    <h3 className="text-sm tracking-wide">{column.title}</h3>
                                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">{colOrders.length}</span>
                                </div>

                                {/* Column Cards */}
                                <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                    {colOrders.length === 0 ? (
                                        <div className="py-16 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            Queue empty
                                        </div>
                                    ) : (
                                        colOrders.map(order => {
                                            const timeDiffMinutes = Math.floor((currentTime - new Date(order.createdAt)) / 60000);
                                            return (
                                                <div key={order._id} className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">#{order._id.substring(order._id.length - 4).toUpperCase()}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${getTimerColorClass(timeDiffMinutes)}`}>
                                                            {timeDiffMinutes}m
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        {order.orderItems?.slice(0, 3).map((it, idx) => (
                                                            <p key={idx} className="text-xs text-slate-800 dark:text-slate-300 font-bold truncate">
                                                                {it.qty}× {it.name}
                                                            </p>
                                                        ))}
                                                        {order.orderItems?.length > 3 && (
                                                            <p className="text-[10px] text-slate-500 font-bold">+{order.orderItems.length - 3} more items...</p>
                                                        )}
                                                    </div>

                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                                                        {column.statusKey === 'Pending' && (
                                                            <button onClick={() => updateStatus(order._id, 'Accepted')} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                                                                Accept
                                                            </button>
                                                        )}
                                                        {column.statusKey === 'Accepted' && (
                                                            <button onClick={() => updateStatus(order._id, 'Preparing')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                                                                Start Cooking
                                                            </button>
                                                        )}
                                                        {column.statusKey === 'Preparing' && (
                                                            <button onClick={() => updateStatus(order._id, 'Ready')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                                                                Mark Ready
                                                            </button>
                                                        )}
                                                        {column.statusKey === 'Ready' && (
                                                            <button onClick={() => updateStatus(order._id, 'Completed')} className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold py-2 rounded-xl text-xs cursor-pointer">
                                                                Bump Complete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 4. Manage 86 List (Out-of-Stock Ingredients) Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsAlertModalOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/80">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-500/30">
                                    <Sliders size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Kitchen 86-List Management</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Flag items out-of-stock to warn kitchen staff on incoming tickets.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAlertModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Add Item form */}
                            <form onSubmit={handleAddIngredient} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter ingredient name (e.g. Cheese, Truffle Oil)..." 
                                    value={newIngredient}
                                    onChange={(e) => setNewIngredient(e.target.value)}
                                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                                />
                                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-2xl px-5 flex items-center justify-center transition-colors shadow-lg shadow-red-600/30 cursor-pointer">
                                    <Plus size={18} /> Add
                                </button>
                            </form>

                            {/* List of currently stockout ingredients */}
                            <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Flagged Ingredients</p>
                                {outOfStock.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-xs font-semibold bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                                        All ingredients are currently in stock!
                                    </div>
                                ) : (
                                    outOfStock.map((ing) => (
                                        <div key={ing} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="font-extrabold text-slate-800 dark:text-slate-200">{ing}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveIngredient(ing)}
                                                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-red-500/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                                title="Mark Restored In-Stock"
                                            >
                                                <Trash2 size={13} /> Restored
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button 
                                onClick={() => setIsAlertModalOpen(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer"
                            >
                                Done &amp; Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChefDashboard;
