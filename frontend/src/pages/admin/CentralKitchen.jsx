import { useState, useMemo } from 'react';
import { 
    ChefHat, Truck, Boxes, ShieldAlert, Plus, Search, Filter, 
    CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowDownRight, 
    X, Save, RefreshCw, Layers, FileText, PackageCheck, Flame, User, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_WAREHOUSE_STOCK = [
    { id: 'mat-1', name: 'Premium Wheat Flour', category: 'Dry Goods', stock: 1250, unit: 'Kg', minLimit: 300 },
    { id: 'mat-2', name: 'Fresh Tomato Puree Base', category: 'Sauces', stock: 680, unit: 'L', minLimit: 150 },
    { id: 'mat-3', name: 'Mozzarella Cheese Blocks', category: 'Dairy', stock: 340, unit: 'Kg', minLimit: 100 },
    { id: 'mat-4', name: 'Special Peri Peri Spice Mix', category: 'Spices', stock: 85, unit: 'Kg', minLimit: 25 },
    { id: 'mat-5', name: 'Refined Sunflower Oil', category: 'Oils', stock: 450, unit: 'L', minLimit: 100 },
    { id: 'mat-6', name: 'Eco Food Grade Packaging Boxes', category: 'Packaging', stock: 8500, unit: 'Pcs', minLimit: 2000 }
];

const INITIAL_ORDERS = [
    {
        id: 'KKO-901',
        outlet: 'Mumbai Outlet (Downtown)',
        item: 'Marinated Peri Peri Chicken',
        batchSize: 50,
        unit: 'Kg',
        priority: 'High',
        status: 'In Preparation',
        createdAt: '2026-08-12 09:30 AM',
        targetTime: '2026-08-12 02:00 PM',
        dispatch: {
            driverName: 'Ramesh Kumar',
            vehicleNo: 'MH-01-CV-4412',
            trackingCode: 'TRK-MUM-8821',
            dispatchedAt: null,
            estimatedArrival: '03:30 PM'
        },
        deductions: [
            { materialName: 'Fresh Raw Chicken', quantity: 50, unit: 'Kg' },
            { materialName: 'Special Peri Peri Spice Mix', quantity: 3.5, unit: 'Kg' },
            { materialName: 'Refined Sunflower Oil', quantity: 5, unit: 'L' }
        ]
    },
    {
        id: 'KKO-902',
        outlet: 'IGI Airport Outlet T3',
        item: 'Signature Italian Pizza Sauce Base',
        batchSize: 120,
        unit: 'L',
        priority: 'Urgent',
        status: 'Ready for Dispatch',
        createdAt: '2026-08-12 08:15 AM',
        targetTime: '2026-08-12 11:30 AM',
        dispatch: {
            driverName: 'Vikram Singh',
            vehicleNo: 'DL-01-AB-9920',
            trackingCode: 'TRK-DEL-1044',
            dispatchedAt: null,
            estimatedArrival: '01:00 PM'
        },
        deductions: [
            { materialName: 'Fresh Tomato Puree Base', quantity: 120, unit: 'L' },
            { materialName: 'Refined Sunflower Oil', quantity: 8, unit: 'L' },
            { materialName: 'Italian Oregano Spice', quantity: 1.2, unit: 'Kg' }
        ]
    },
    {
        id: 'KKO-903',
        outlet: 'CyberHub Outlet Gurugram',
        item: 'Artisanal Burger Patties',
        batchSize: 500,
        unit: 'Pcs',
        priority: 'Standard',
        status: 'Dispatched',
        createdAt: '2026-08-12 06:45 AM',
        targetTime: '2026-08-12 10:00 AM',
        dispatch: {
            driverName: 'Sunil Verma',
            vehicleNo: 'HR-26-DQ-3310',
            trackingCode: 'TRK-GUR-4091',
            dispatchedAt: '2026-08-12 10:15 AM',
            estimatedArrival: '11:45 AM'
        },
        deductions: [
            { materialName: 'Minced Meat Blend', quantity: 45, unit: 'Kg' },
            { materialName: 'Special Burger Seasoning', quantity: 2, unit: 'Kg' },
            { materialName: 'Eco Food Grade Packaging Boxes', quantity: 50, unit: 'Pcs' }
        ]
    },
    {
        id: 'KKO-904',
        outlet: 'Indiranagar Outlet Bengaluru',
        item: 'Classic Italian Dough Balls',
        batchSize: 300,
        unit: 'Pcs',
        priority: 'Standard',
        status: 'Delivered',
        createdAt: '2026-08-11 04:00 PM',
        targetTime: '2026-08-12 08:00 AM',
        dispatch: {
            driverName: 'Karthik N',
            vehicleNo: 'KA-03-MK-7711',
            trackingCode: 'TRK-BLR-0092',
            dispatchedAt: '2026-08-12 07:00 AM',
            estimatedArrival: '08:15 AM'
        },
        deductions: [
            { materialName: 'Premium Wheat Flour', quantity: 60, unit: 'Kg' },
            { materialName: 'Yeast & Sugar Mix', quantity: 1.5, unit: 'Kg' }
        ]
    }
];

const CentralKitchen = () => {
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [warehouseStock, setWarehouseStock] = useState(INITIAL_WAREHOUSE_STOCK);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'recipes'
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchTarget, setDispatchTarget] = useState(null);

    const [showDeductionsModal, setShowDeductionsModal] = useState(false);
    const [deductionTarget, setDeductionTarget] = useState(null);

    // Form state for Order Creation
    const [orderForm, setOrderForm] = useState({
        outlet: 'Mumbai Outlet (Downtown)',
        item: 'Marinated Peri Peri Chicken',
        batchSize: 50,
        unit: 'Kg',
        priority: 'Standard',
        targetTime: new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 16)
    });

    // Form state for Dispatch details update
    const [dispatchForm, setDispatchForm] = useState({
        status: 'In Preparation',
        driverName: '',
        vehicleNo: '',
        trackingCode: '',
        estimatedArrival: '02 hours'
    });

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = 
                o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.outlet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.item.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    // Metrics
    const activeOrdersCount = orders.filter(o => o.status !== 'Delivered').length;
    const inPrepCount = orders.filter(o => o.status === 'In Preparation').length;
    const readyOrDispatchedCount = orders.filter(o => o.status === 'Ready for Dispatch' || o.status === 'Dispatched').length;

    // Create Kitchen Order & Auto Deduct Stock
    const handleCreateOrder = (e) => {
        e.preventDefault();
        if (!orderForm.item || !orderForm.batchSize) {
            return toast.error('Please enter batch item and quantity.');
        }

        const newId = `KKO-${Math.floor(900 + Math.random() * 100)}`;
        
        // Compute raw material deduction estimated requirements
        let estimatedDeductions = [];
        if (orderForm.item.includes('Chicken') || orderForm.item.includes('Meat')) {
            estimatedDeductions = [
                { materialName: 'Fresh Raw Meat/Chicken', quantity: parseFloat(orderForm.batchSize), unit: orderForm.unit },
                { materialName: 'Special Peri Peri Spice Mix', quantity: Math.round(orderForm.batchSize * 0.07 * 10) / 10, unit: 'Kg' },
                { materialName: 'Refined Sunflower Oil', quantity: Math.round(orderForm.batchSize * 0.1 * 10) / 10, unit: 'L' }
            ];
        } else if (orderForm.item.includes('Sauce')) {
            estimatedDeductions = [
                { materialName: 'Fresh Tomato Puree Base', quantity: parseFloat(orderForm.batchSize), unit: orderForm.unit },
                { materialName: 'Refined Sunflower Oil', quantity: Math.round(orderForm.batchSize * 0.05 * 10) / 10, unit: 'L' }
            ];
        } else {
            estimatedDeductions = [
                { materialName: 'Premium Wheat Flour', quantity: Math.round(orderForm.batchSize * 0.2 * 10) / 10, unit: 'Kg' },
                { materialName: 'Eco Food Grade Packaging Boxes', quantity: Math.round(orderForm.batchSize * 0.5), unit: 'Pcs' }
            ];
        }

        const newOrder = {
            id: newId,
            outlet: orderForm.outlet,
            item: orderForm.item,
            batchSize: parseFloat(orderForm.batchSize),
            unit: orderForm.unit,
            priority: orderForm.priority,
            status: 'Order Received',
            createdAt: new Date().toLocaleString(),
            targetTime: new Date(orderForm.targetTime).toLocaleString(),
            dispatch: {
                driverName: '',
                vehicleNo: '',
                trackingCode: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
                dispatchedAt: null,
                estimatedArrival: 'TBD'
            },
            deductions: estimatedDeductions
        };

        // Deduct inventory from central warehouse stock
        const updatedStock = warehouseStock.map(stockItem => {
            const deductionMatch = estimatedDeductions.find(d => d.materialName === stockItem.name);
            if (deductionMatch) {
                const newQty = Math.max(0, stockItem.stock - deductionMatch.quantity);
                return { ...stockItem, stock: newQty };
            }
            return stockItem;
        });

        setWarehouseStock(updatedStock);
        setOrders([newOrder, ...orders]);
        setShowCreateOrderModal(false);

        toast.success(`Kitchen Order ${newId} created! Inventory automatically deducted.`);
    };

    // Update Status & Dispatch Tracking
    const handleOpenDispatchModal = (order) => {
        setDispatchTarget(order);
        setDispatchForm({
            status: order.status,
            driverName: order.dispatch?.driverName || '',
            vehicleNo: order.dispatch?.vehicleNo || '',
            trackingCode: order.dispatch?.trackingCode || `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
            estimatedArrival: order.dispatch?.estimatedArrival || '02 hours'
        });
        setShowDispatchModal(true);
    };

    const handleSaveDispatchStatus = (e) => {
        e.preventDefault();
        const nextStatus = dispatchForm.status;

        setOrders(orders.map(o => {
            if (o.id === dispatchTarget.id) {
                const isDispatchedNow = nextStatus === 'Dispatched' && o.status !== 'Dispatched';
                return {
                    ...o,
                    status: nextStatus,
                    dispatch: {
                        ...o.dispatch,
                        driverName: dispatchForm.driverName || o.dispatch.driverName,
                        vehicleNo: dispatchForm.vehicleNo || o.dispatch.vehicleNo,
                        trackingCode: dispatchForm.trackingCode || o.dispatch.trackingCode,
                        estimatedArrival: dispatchForm.estimatedArrival || o.dispatch.estimatedArrival,
                        dispatchedAt: isDispatchedNow ? new Date().toLocaleString() : o.dispatch.dispatchedAt
                    }
                };
            }
            return o;
        }));

        setShowDispatchModal(false);
        toast.success(`Order ${dispatchTarget.id} updated to "${nextStatus}"`);
    };

    // Helper color badge for order status
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Order Received':
                return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'In Preparation':
                return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 animate-pulse';
            case 'Ready for Dispatch':
                return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'Dispatched':
                return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            case 'Delivered':
                return 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Central Kitchen Ops
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5">
                        Manage centralized batch preparation, production status tracking, dispatch logistics, and automatic inventory stock deduction.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateOrderModal(true)}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Create Kitchen Order
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active Kitchen Orders</span>
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
                            <ChefHat size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-slate-100">{activeOrdersCount} Batches</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Currently queued or in production</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">In Batch Cooking</span>
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Flame size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">{inPrepCount} Cooking</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Active prep line operations</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Ready / Dispatched</span>
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Truck size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{readyOrDispatchedCount} Express</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">In transit to branch outlets</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Central Raw Materials</span>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Boxes size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{warehouseStock.length} Items</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Auto-deducted per kitchen order</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'orders'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-gray-100 dark:border-slate-800'
                    }`}
                >
                    <ChefHat size={16} /> Kitchen Orders & Dispatch Board ({orders.length})
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'inventory'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-gray-100 dark:border-slate-800'
                    }`}
                >
                    <Boxes size={16} /> Central Inventory Stock & Auto-Deductions
                </button>
            </div>

            {/* TAB 1: KITCHEN ORDERS & DISPATCH BOARD */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {/* Search & Status Filters */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search order code, outlet, or batch item..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                            <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Status:</span>
                            {['All', 'Order Received', 'In Preparation', 'Ready for Dispatch', 'Dispatched', 'Delivered'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        statusFilter === st
                                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                        : 'bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orders List Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {filteredOrders.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 dark:text-slate-500 font-semibold text-xs">
                                No kitchen orders found matching your search criteria.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-slate-950/60 border-b border-gray-100 dark:border-slate-800 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                            <th className="p-4">Order Code & Batch Item</th>
                                            <th className="p-4">Destination Outlet</th>
                                            <th className="p-4">Production Status</th>
                                            <th className="p-4">Dispatch & Tracking</th>
                                            <th className="p-4">Inventory Deduction</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300">
                                        {filteredOrders.map((o) => (
                                            <tr key={o.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                                {/* Batch Item & Quantity */}
                                                <td className="p-4 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-black text-xs text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{o.id}</span>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                            o.priority === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {o.priority}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-gray-900 dark:text-slate-100 text-sm">{o.item}</h4>
                                                    <p className="text-xs font-extrabold text-red-600 dark:text-red-400">Batch Size: {o.batchSize} {o.unit}</p>
                                                </td>

                                                {/* Destination Outlet */}
                                                <td className="p-4 space-y-1">
                                                    <span className="font-bold text-gray-900 dark:text-slate-100">{o.outlet}</span>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Created: {o.createdAt}</p>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4 space-y-1">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(o.status)}`}>
                                                        {o.status}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Target: {o.targetTime}</p>
                                                </td>

                                                {/* Dispatch Tracking */}
                                                <td className="p-4 space-y-1">
                                                    {o.dispatch?.driverName ? (
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1">
                                                                <Truck size={12} className="text-indigo-500" /> {o.dispatch.driverName} ({o.dispatch.vehicleNo})
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">Code: {o.dispatch.trackingCode}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 italic">No dispatch assigned</span>
                                                    )}
                                                </td>

                                                {/* Inventory Deduction */}
                                                <td className="p-4 space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            setDeductionTarget(o);
                                                            setShowDeductionsModal(true);
                                                        }}
                                                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <Boxes size={12} /> {o.deductions?.length || 0} Materials Deducted (View)
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleOpenDispatchModal(o)}
                                                        className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                                                    >
                                                        Update Status / Dispatch &rarr;
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: CENTRAL INVENTORY STOCK & DEDUCTIONS */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Boxes size={18} className="text-emerald-500" /> Warehouse Central Stock (Auto-Deducted On Kitchen Orders)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {warehouseStock.map(stock => {
                                const isLow = stock.stock <= stock.minLimit;
                                return (
                                    <div key={stock.id} className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500">{stock.category}</span>
                                            {isLow && (
                                                <span className="text-[9px] bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                    <AlertTriangle size={10} /> Low Stock Alert
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">{stock.name}</h4>
                                        <div className="flex items-baseline justify-between pt-1">
                                            <span className="text-2xl font-black text-gray-900 dark:text-white">{stock.stock.toLocaleString()} {stock.unit}</span>
                                            <span className="text-[10px] text-gray-400 font-semibold">Min Threshold: {stock.minLimit} {stock.unit}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: CREATE KITCHEN ORDER */}
            {showCreateOrderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black">Create Central Kitchen Order</h3>
                                <p className="text-xs text-slate-300">Issue batch prep order and trigger automatic stock deduction.</p>
                            </div>
                            <button onClick={() => setShowCreateOrderModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrder} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Destination Branch / Outlet *</label>
                                <select
                                    value={orderForm.outlet}
                                    onChange={(e) => setOrderForm({ ...orderForm, outlet: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                >
                                    <option value="Mumbai Outlet (Downtown)">Mumbai Outlet (Downtown)</option>
                                    <option value="IGI Airport Outlet T3">IGI Airport Outlet T3</option>
                                    <option value="CyberHub Outlet Gurugram">CyberHub Outlet Gurugram</option>
                                    <option value="Indiranagar Outlet Bengaluru">Indiranagar Outlet Bengaluru</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Prepared Batch Item Name *</label>
                                    <input
                                        type="text"
                                        value={orderForm.item}
                                        onChange={(e) => setOrderForm({ ...orderForm, item: e.target.value })}
                                        placeholder="e.g. Marinated Peri Peri Chicken"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Batch Size & Unit *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={orderForm.batchSize}
                                            onChange={(e) => setOrderForm({ ...orderForm, batchSize: e.target.value })}
                                            className="w-2/3 px-3 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                            required
                                        />
                                        <select
                                            value={orderForm.unit}
                                            onChange={(e) => setOrderForm({ ...orderForm, unit: e.target.value })}
                                            className="w-1/3 px-2 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        >
                                            <option value="Kg">Kg</option>
                                            <option value="L">L</option>
                                            <option value="Pcs">Pcs</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Priority Level</label>
                                    <select
                                        value={orderForm.priority}
                                        onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                    >
                                        <option value="Standard">Standard Priority</option>
                                        <option value="High">High Priority</option>
                                        <option value="Urgent">Urgent Express</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Target Completion Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={orderForm.targetTime}
                                        onChange={(e) => setOrderForm({ ...orderForm, targetTime: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                    <Boxes size={14} /> Auto Inventory Deduction Notice
                                </h4>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-relaxed">
                                    Creating this kitchen batch order will automatically calculate and deduct raw materials directly from the central warehouse stock inventory.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateOrderModal(false)}
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                                >
                                    <Save size={14} /> Create Order & Deduct Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: PRODUCTION STATUS & DISPATCH TRACKING */}
            {showDispatchModal && dispatchTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-black">Production & Dispatch Tracking</h3>
                                <p className="text-xs text-slate-300">{dispatchTarget.id} • {dispatchTarget.item}</p>
                            </div>
                            <button onClick={() => setShowDispatchModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDispatchStatus} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Production Status Stage *</label>
                                <select
                                    value={dispatchForm.status}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                >
                                    <option value="Order Received">1. Order Received</option>
                                    <option value="In Preparation">2. In Preparation (Cooking)</option>
                                    <option value="Ready for Dispatch">3. Ready for Dispatch</option>
                                    <option value="Dispatched">4. Dispatched (In Transit)</option>
                                    <option value="Delivered">5. Delivered to Branch</option>
                                </select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">Logistics & Dispatch Details</h4>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Driver / Transport Partner Name</label>
                                    <input
                                        type="text"
                                        value={dispatchForm.driverName}
                                        onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                                        placeholder="e.g. Ramesh Kumar"
                                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Vehicle No.</label>
                                        <input
                                            type="text"
                                            value={dispatchForm.vehicleNo}
                                            onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value })}
                                            placeholder="e.g. MH-01-CV-4412"
                                            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Tracking Code</label>
                                        <input
                                            type="text"
                                            value={dispatchForm.trackingCode}
                                            onChange={(e) => setDispatchForm({ ...dispatchForm, trackingCode: e.target.value })}
                                            placeholder="TRK-XXXX"
                                            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowDispatchModal(false)}
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-md"
                                >
                                    Update Production & Dispatch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: INVENTORY DEDUCTIONS BREAKDOWN */}
            {showDeductionsModal && deductionTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-slate-100">Stock Deductions</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{deductionTarget.id} • {deductionTarget.item}</p>
                            </div>
                            <button onClick={() => setShowDeductionsModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Raw materials automatically deducted from warehouse inventory:</p>
                            <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                {deductionTarget.deductions?.map((d, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-slate-950 flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-900 dark:text-slate-100">{d.materialName}</span>
                                        <span className="font-black text-red-600 dark:text-red-400">- {d.quantity} {d.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setShowDeductionsModal(false)}
                                className="px-5 py-2 bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CentralKitchen;
