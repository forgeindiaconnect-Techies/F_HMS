import { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Filter, AlertTriangle, ArrowRight, ClipboardList, 
    Edit2, Trash2, X, DollarSign, Package, ShoppingCart, History, 
    TrendingDown, Calendar, CheckCircle2, Clock, FileText, ChevronRight,
    RefreshCw, Layers, ShieldAlert, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'dozen', 'box', 'packet', 'can'];
const CATEGORIES = ['Vegetables', 'Dairy', 'Meat & Poultry', 'Seafood', 'Spices & Seasoning', 'Grains & Flour', 'Bakery', 'Beverages', 'Packaging', 'Dry Goods', 'Cleaning & Sanitation', 'Other'];

const getStatusBadge = (quantity, minStock) => {
    if (quantity === 0) return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Out of Stock</span>;
    if (quantity <= minStock) return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Low Stock</span>;
    return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">In Stock</span>;
};

const getPaymentBadge = (status) => {
    switch (status) {
        case 'Paid':
            return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Paid</span>;
        case 'Partially Paid':
            return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">Partially Paid</span>;
        case 'Pending':
            return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
        default:
            return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
};

const InventoryManagement = () => {
    const { api } = useAuth();
    const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'purchases' | 'movements' | 'valuation'
    const [inventory, setInventory] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [movements, setMovements] = useState([]);
    const [valuationData, setValuationData] = useState(null);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setCategoryFilter] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterBranch, setFilterBranch] = useState('All');
    const [purchaseDatePreset, setPurchaseDatePreset] = useState('thismonth');

    // Modals
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState(null);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [movementItem, setMovementItem] = useState(null);

    // Form: Raw Material / Item
    const [itemForm, setItemForm] = useState({
        itemName: '',
        category: 'Vegetables',
        quantity: 0,
        unit: 'kg',
        minStockLevel: 10,
        lastPurchasePrice: 0,
        branch: ''
    });

    // Form: Material Purchase
    const [purchaseForm, setPurchaseForm] = useState({
        supplier: { name: '', contactPerson: '', phone: '', email: '' },
        invoiceNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        branchId: '',
        items: [{ materialId: '', name: '', quantity: 1, unit: 'kg', unitPrice: 0, total: 0 }],
        taxAmount: 0,
        amountPaid: 0,
        paymentMethod: 'Cash',
        paymentReference: '',
        notes: ''
    });

    // Form: Payment Record
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'Bank Transfer',
        paymentReference: '',
        notes: ''
    });

    // Form: Stock Adjustment / Wastage
    const [movementForm, setMovementForm] = useState({
        materialId: '',
        movementType: 'Wastage', // 'Damaged' | 'Wastage' | 'Stock Adjustment'
        quantity: 1,
        reason: '',
        unitCost: 0
    });

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, branchesRes, purchasesRes, movementsRes, valRes] = await Promise.all([
                api.get('/inventory').catch(() => ({ data: [] })),
                api.get('/branches').catch(() => ({ data: [] })),
                api.get('/inventory/purchases', { params: { period: purchaseDatePreset } }).catch(() => ({ data: [] })),
                api.get('/inventory/stock-movements', { params: { limit: 100 } }).catch(() => ({ data: [] })),
                api.get('/inventory/valuation').catch(() => ({ data: null }))
            ]);

            setInventory(invRes.data || []);
            setBranches(branchesRes.data || []);
            setPurchases(purchasesRes.data || []);
            setMovements(movementsRes.data || []);
            setValuationData(valRes.data || null);

            if (branchesRes.data?.length > 0 && !itemForm.branch) {
                setItemForm(prev => ({ ...prev, branch: branchesRes.data[0]._id }));
                setPurchaseForm(prev => ({ ...prev, branchId: branchesRes.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch inventory data', error);
            toast.error('Failed to load inventory records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [purchaseDatePreset]);

    // Handle Item CRUD
    const handleSaveItem = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...itemForm,
                quantity: Number(itemForm.quantity),
                minStockLevel: Number(itemForm.minStockLevel),
                lastPurchasePrice: Number(itemForm.lastPurchasePrice) || 0
            };

            if (editingItem) {
                await api.put(`/inventory/${editingItem}`, payload);
                toast.success('Material updated successfully');
            } else {
                await api.post('/inventory', payload);
                toast.success('Raw material added successfully');
            }
            setIsItemModalOpen(false);
            setEditingItem(null);
            fetchData();
        } catch (error) {
            console.error('Failed to save item', error);
            toast.error(error.response?.data?.message || 'Error saving material');
        }
    };

    const handleDeleteItem = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Material',
            message: 'Are you sure you want to delete this material item? This will remove its tracking history.',
            onConfirm: async () => {
                try {
                    await api.delete(`/inventory/${id}`);
                    fetchData();
                    toast.success('Material deleted successfully');
                } catch (error) {
                    console.error('Failed to delete item', error);
                    toast.error('Failed to delete item');
                }
            },
            isDestructive: true
        });
    };

    // Handle Material Purchase
    const handleAddPurchaseItemRow = () => {
        setPurchaseForm(prev => ({
            ...prev,
            items: [...prev.items, { materialId: '', name: '', quantity: 1, unit: 'kg', unitPrice: 0, total: 0 }]
        }));
    };

    const handleRemovePurchaseItemRow = (idx) => {
        setPurchaseForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const handlePurchaseItemChange = (idx, field, val) => {
        setPurchaseForm(prev => {
            const newItems = [...prev.items];
            const row = { ...newItems[idx], [field]: val };
            
            if (field === 'materialId') {
                const found = inventory.find(i => i._id === val);
                if (found) {
                    row.name = found.itemName;
                    row.unit = found.unit || 'kg';
                    row.unitPrice = found.lastPurchasePrice || 0;
                }
            }

            if (field === 'quantity' || field === 'unitPrice' || field === 'materialId') {
                const q = Number(field === 'quantity' ? val : row.quantity) || 0;
                const p = Number(field === 'unitPrice' ? val : row.unitPrice) || 0;
                row.total = Math.round(q * p * 100) / 100;
            }

            newItems[idx] = row;
            return { ...prev, items: newItems };
        });
    };

    const calculatePurchaseTotals = () => {
        const subtotal = purchaseForm.items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
        const tax = Number(purchaseForm.taxAmount) || 0;
        const total = Math.round((subtotal + tax) * 100) / 100;
        return { subtotal, total };
    };

    const handleSavePurchase = async (e) => {
        e.preventDefault();
        const { subtotal, total } = calculatePurchaseTotals();
        
        if (purchaseForm.items.length === 0 || !purchaseForm.items[0].name) {
            toast.error('Please add at least one material item');
            return;
        }

        try {
            const payload = {
                ...purchaseForm,
                branchId: purchaseForm.branchId || branches[0]?._id,
                supplierName: purchaseForm.supplier?.name || 'General Supplier',
                supplierPhone: purchaseForm.supplier?.phone || '',
                subtotal,
                totalAmount: total,
                paidAmount: Number(purchaseForm.amountPaid) || 0,
                amountPaid: Number(purchaseForm.amountPaid) || 0,
                items: purchaseForm.items.map(it => ({
                    material: it.materialId || undefined,
                    materialId: it.materialId || undefined,
                    itemName: it.name,
                    name: it.name,
                    quantity: Number(it.quantity) || 1,
                    unit: it.unit || 'kg',
                    unitPrice: Number(it.unitPrice) || 0,
                    totalCost: Number(it.total) || 0,
                    total: Number(it.total) || 0
                }))
            };

            await api.post('/inventory/purchases', payload);
            toast.success('Purchase invoice recorded! Stock levels updated automatically.');
            setIsPurchaseModalOpen(false);
            setPurchaseForm({
                supplier: { name: '', contactPerson: '', phone: '', email: '' },
                invoiceNumber: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                branchId: branches[0]?._id || '',
                items: [{ materialId: '', name: '', quantity: 1, unit: 'kg', unitPrice: 0, total: 0 }],
                taxAmount: 0,
                amountPaid: 0,
                paymentMethod: 'Cash',
                paymentReference: '',
                notes: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to record purchase', error);
            toast.error(error.response?.data?.message || 'Error recording purchase');
        }
    };

    // Handle Purchase Payment Recording
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedPurchaseForPayment) return;
        const amt = Number(paymentForm.amount);
        if (amt <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }
        if (amt > selectedPurchaseForPayment.balanceDue) {
            toast.error(`Payment cannot exceed outstanding balance of ₹${selectedPurchaseForPayment.balanceDue}`);
            return;
        }

        try {
            await api.post(`/inventory/purchases/${selectedPurchaseForPayment._id}/pay`, {
                amount: amt,
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                notes: paymentForm.notes
            });
            toast.success(`Payment of ₹${amt} recorded successfully!`);
            setIsPaymentModalOpen(false);
            setSelectedPurchaseForPayment(null);
            setPaymentForm({ amount: '', paymentMethod: 'Bank Transfer', paymentReference: '', notes: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to record payment', error);
            toast.error(error.response?.data?.message || 'Error recording payment');
        }
    };

    // Handle Stock Movement / Wastage
    const handleSaveMovement = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/stock-adjustments', {
                materialId: movementForm.materialId,
                movementType: movementForm.movementType,
                quantity: Number(movementForm.quantity),
                unitCost: Number(movementForm.unitCost),
                reason: movementForm.reason
            });
            toast.success(`${movementForm.movementType} logged and stock updated!`);
            setIsMovementModalOpen(false);
            setMovementItem(null);
            fetchData();
        } catch (error) {
            console.error('Failed to log stock movement', error);
            toast.error(error.response?.data?.message || 'Error recording movement');
        }
    };

    // Filtered Materials
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (item._id && item._id.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
            const bId = item.branch?._id || item.branch;
            const matchesBranch = filterBranch === 'All' || bId === filterBranch;

            let matchesStatus = true;
            if (filterStatus === 'Critical') {
                matchesStatus = item.quantity === 0 || item.quantity <= (item.minStockLevel * 0.5);
            } else if (filterStatus === 'Low') {
                matchesStatus = item.quantity > (item.minStockLevel * 0.5) && item.quantity <= item.minStockLevel;
            } else if (filterStatus === 'In Stock') {
                matchesStatus = item.quantity > item.minStockLevel;
            }
            return matchesSearch && matchesCategory && matchesBranch && matchesStatus;
        });
    }, [inventory, searchQuery, filterCategory, filterBranch, filterStatus]);

    // Critical Alerts
    const criticalItems = inventory.filter(i => i.quantity === 0 || i.quantity <= (i.minStockLevel * 0.5));
    const lowStockItems = inventory.filter(i => i.quantity > (i.minStockLevel * 0.5) && i.quantity <= i.minStockLevel);

    const totalValuation = valuationData?.totalValuation || 
        inventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.lastPurchasePrice || 0)), 0);

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <Package size={14} /> Material & Inventory Management
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Material Management
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Track raw materials, supplier purchases, stock movements, wastage, and weighted-average inventory valuation.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                        onClick={() => {
                            setEditingItem(null);
                            setItemForm({
                                itemName: '',
                                category: 'Vegetables',
                                quantity: 0,
                                unit: 'kg',
                                minStockLevel: 10,
                                lastPurchasePrice: 0,
                                branch: branches[0]?._id || ''
                            });
                            setIsItemModalOpen(true);
                        }}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-xs"
                    >
                        <Plus size={16} /> Add Material
                    </button>
                    <button 
                        onClick={() => {
                            setPurchaseForm({
                                supplier: { name: '', contactPerson: '', phone: '', email: '' },
                                invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                                purchaseDate: new Date().toISOString().split('T')[0],
                                branchId: branches[0]?._id || '',
                                items: [{ materialId: inventory[0]?._id || '', name: inventory[0]?.itemName || '', quantity: 1, unit: inventory[0]?.unit || 'kg', unitPrice: inventory[0]?.lastPurchasePrice || 0, total: inventory[0]?.lastPurchasePrice || 0 }],
                                taxAmount: 0,
                                amountPaid: 0,
                                paymentMethod: 'Cash',
                                paymentReference: '',
                                notes: ''
                            });
                            setIsPurchaseModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-md shadow-emerald-900/10"
                    >
                        <ShoppingCart size={16} /> Record Purchase
                    </button>
                </div>
            </div>

            {/* Quick KPI Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
                        <DollarSign size={18} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Weighted average costing</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Raw Materials</span>
                        <Layers size={18} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {inventory.length}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Across all branches</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-amber-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Low Stock Items</span>
                        <AlertTriangle size={18} />
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        {lowStockItems.length}
                    </div>
                    <div className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">Below minimum threshold</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-red-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                        <ShieldAlert size={18} />
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        {criticalItems.filter(i => i.quantity === 0).length}
                    </div>
                    <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Requires immediate purchase</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'materials'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Package size={16} /> Raw Materials & Stock ({inventory.length})
                </button>
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'purchases'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <ShoppingCart size={16} /> Material Purchases & Invoices ({purchases.length})
                </button>
                <button
                    onClick={() => setActiveTab('movements')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'movements'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <History size={16} /> Stock Movements & Audit ({movements.length})
                </button>
                <button
                    onClick={() => setActiveTab('valuation')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'valuation'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <DollarSign size={16} /> Valuation & Alerts
                </button>
            </div>

            {/* TAB 1: RAW MATERIALS */}
            {activeTab === 'materials' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search raw material..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <select 
                                value={filterCategory}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden"
                            >
                                <option value="All">All Categories</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden"
                            >
                                <option value="All">All Stock Levels</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Low">Low Stock</option>
                                <option value="Critical">Critical & Out of Stock</option>
                            </select>

                            {branches.length > 1 && (
                                <select 
                                    value={filterBranch}
                                    onChange={(e) => setFilterBranch(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden"
                                >
                                    <option value="All">All Branches</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Material Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Material Name</th>
                                        <th className="py-4 px-6">Category</th>
                                        <th className="py-4 px-6">Current Stock</th>
                                        <th className="py-4 px-6">Min. Threshold</th>
                                        <th className="py-4 px-6">Last Price</th>
                                        <th className="py-4 px-6">Valuation</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {filteredInventory.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-400">
                                                No raw materials found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInventory.map(item => {
                                            const val = Math.round((item.quantity || 0) * (item.lastPurchasePrice || 0) * 100) / 100;
                                            return (
                                                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                        {item.itemName}
                                                        {item.branch?.name && (
                                                            <span className="block text-[11px] font-normal text-slate-400">
                                                                {item.branch.name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-black text-slate-900 dark:text-white">
                                                        {item.quantity} {item.unit}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500">
                                                        {item.minStockLevel} {item.unit}
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold">
                                                        ₹{item.lastPurchasePrice || 0} / {item.unit}
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400">
                                                        ₹{val.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {getStatusBadge(item.quantity, item.minStockLevel)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button 
                                                                onClick={() => {
                                                                    setMovementItem(item);
                                                                    setMovementForm({
                                                                        materialId: item._id,
                                                                        movementType: 'Wastage',
                                                                        quantity: 1,
                                                                        reason: '',
                                                                        unitCost: item.lastPurchasePrice || 0
                                                                    });
                                                                    setIsMovementModalOpen(true);
                                                                }}
                                                                title="Log Wastage / Adjust Stock"
                                                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                                            >
                                                                <TrendingDown size={14} /> Wastage
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingItem(item._id);
                                                                    setItemForm({
                                                                        itemName: item.itemName,
                                                                        category: item.category,
                                                                        quantity: item.quantity,
                                                                        unit: item.unit,
                                                                        minStockLevel: item.minStockLevel,
                                                                        lastPurchasePrice: item.lastPurchasePrice || 0,
                                                                        branch: item.branch?._id || item.branch || ''
                                                                    });
                                                                    setIsItemModalOpen(true);
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteItem(item._id)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: PURCHASES & INVOICES */}
            {activeTab === 'purchases' && (
                <div className="space-y-4">
                    {/* Filter bar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Purchases & Supplier Invoices ({purchases.length})
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400">Date Period:</span>
                            <select 
                                value={purchaseDatePreset}
                                onChange={(e) => setPurchaseDatePreset(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="last7days">Last 7 Days</option>
                                <option value="thismonth">This Month</option>
                                <option value="lastmonth">Last Month</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Invoice #</th>
                                        <th className="py-4 px-6">Supplier</th>
                                        <th className="py-4 px-6">Date</th>
                                        <th className="py-4 px-6">Items Purchased</th>
                                        <th className="py-4 px-6">Total Amount</th>
                                        <th className="py-4 px-6">Paid Amount</th>
                                        <th className="py-4 px-6">Balance Due</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {purchases.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-slate-400">
                                                No material purchases recorded for this period. Click "Record Purchase" above to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.map(p => (
                                            <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    {p.invoiceNumber || 'No Invoice'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {p.supplierName || p.supplier?.name || 'General Supplier'}
                                                    </div>
                                                    {(p.supplierPhone || p.supplier?.phone) && (
                                                        <div className="text-xs text-slate-400">{p.supplierPhone || p.supplier?.phone}</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                                                    {new Date(p.purchaseDate).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-xs max-w-xs truncate">
                                                        {p.items?.map(it => `${it.itemName || it.name} (${it.quantity} ${it.unit})`).join(', ')}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    ₹{p.totalAmount?.toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-emerald-600 dark:text-emerald-400">
                                                    ₹{p.paidAmount?.toLocaleString('en-IN') || 0}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-amber-600 dark:text-amber-400">
                                                    ₹{p.balanceDue?.toLocaleString('en-IN') || 0}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getPaymentBadge(p.paymentStatus)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {p.balanceDue > 0 ? (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedPurchaseForPayment(p);
                                                                setPaymentForm({
                                                                    amount: p.balanceDue,
                                                                    paymentMethod: 'Bank Transfer',
                                                                    paymentReference: '',
                                                                    notes: `Settlement for invoice ${p.invoiceNumber}`
                                                                });
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                                        >
                                                            <CreditCard size={13} /> Pay Balance
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-semibold flex items-center justify-end gap-1">
                                                            <CheckCircle2 size={14} className="text-emerald-500" /> Settled
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: STOCK MOVEMENTS & AUDIT */}
            {activeTab === 'movements' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Auditable Stock Movement Log</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Complete tracking of all stock additions, sales consumption, wastage, damages, and manual adjustments.</p>
                        </div>
                        <button 
                            onClick={fetchData}
                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Timestamp</th>
                                        <th className="py-4 px-6">Material</th>
                                        <th className="py-4 px-6">Movement Type</th>
                                        <th className="py-4 px-6">Quantity Changed</th>
                                        <th className="py-4 px-6">Unit Cost</th>
                                        <th className="py-4 px-6">Total Value</th>
                                        <th className="py-4 px-6">Reason / Ref</th>
                                        <th className="py-4 px-6">Logged By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {movements.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-400">
                                                No stock movements logged yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.map(m => {
                                            const isPositive = m.quantityChanged > 0;
                                            return (
                                                <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                                                        {new Date(m.createdAt || m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                        {m.materialName || m.materialId?.itemName || 'Material Item'}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                                            m.movementType === 'Purchase Received' ? 'bg-emerald-100 text-emerald-800' :
                                                            m.movementType === 'Wastage' ? 'bg-amber-100 text-amber-800' :
                                                            m.movementType === 'Damaged' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {m.movementType}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 px-6 font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {isPositive ? `+${m.quantityChanged}` : m.quantityChanged} {m.unit || 'units'}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500">
                                                        ₹{m.unitCost || 0}
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                                                        ₹{m.totalValue ? Math.round(m.totalValue * 100) / 100 : 0}
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                                                        {m.reason || m.reference || '-'}
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-500">
                                                        {m.performedBy?.name || 'System'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: VALUATION & ALERTS */}
            {activeTab === 'valuation' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Total Inventory Asset Value</h3>
                            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                                ₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                Calculated using the <strong>Weighted Average Costing</strong> method based on supplier purchase prices and current verified physical stock quantities.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-6 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Critical Stock Items</h3>
                            <div className="text-3xl font-black text-red-600 dark:text-red-400 mt-2">
                                {criticalItems.length}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Items with zero stock or below 50% of the minimum threshold level.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-6 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reorder Alerts</h3>
                            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                                {lowStockItems.length}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Items requiring purchase orders to prevent operational disruption.
                            </p>
                        </div>
                    </div>

                    {/* Low Stock Reorder List */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-6 shadow-xs">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={20} /> Action Required: Reorder List
                        </h4>
                        {[...criticalItems, ...lowStockItems].length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-sm">
                                All inventory materials are well-stocked above minimum thresholds!
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                {[...criticalItems, ...lowStockItems].map(item => (
                                    <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                {item.itemName}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Current: <span className="font-bold text-red-600">{item.quantity} {item.unit}</span> | Min: {item.minStockLevel} {item.unit}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setPurchaseForm({
                                                    supplier: { name: '', contactPerson: '', phone: '', email: '' },
                                                    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                                                    purchaseDate: new Date().toISOString().split('T')[0],
                                                    branchId: item.branch?._id || item.branch || branches[0]?._id || '',
                                                    items: [{ 
                                                        materialId: item._id, 
                                                        name: item.itemName, 
                                                        quantity: item.minStockLevel * 2, 
                                                        unit: item.unit, 
                                                        unitPrice: item.lastPurchasePrice || 0, 
                                                        total: (item.minStockLevel * 2) * (item.lastPurchasePrice || 0) 
                                                    }],
                                                    taxAmount: 0,
                                                    amountPaid: 0,
                                                    paymentMethod: 'Cash',
                                                    paymentReference: '',
                                                    notes: `Auto-reorder for low stock ${item.itemName}`
                                                });
                                                setIsPurchaseModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                                        >
                                            <ShoppingCart size={13} /> Order Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 1: ADD / EDIT RAW MATERIAL */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingItem ? 'Edit Raw Material' : 'Add Raw Material'}
                            </h3>
                            <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveItem} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Material Name *</label>
                                <input 
                                    type="text"
                                    required
                                    value={itemForm.itemName}
                                    onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    placeholder="e.g. Tomatoes, Basmati Rice, Chicken"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                                    <select 
                                        value={itemForm.category}
                                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unit</label>
                                    <select 
                                        value={itemForm.unit}
                                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Current Stock</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        required
                                        value={itemForm.quantity}
                                        onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Min Threshold</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        required
                                        value={itemForm.minStockLevel}
                                        onChange={(e) => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price (₹/unit)</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        value={itemForm.lastPurchasePrice}
                                        onChange={(e) => setItemForm({ ...itemForm, lastPurchasePrice: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            {branches.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Branch</label>
                                    <select 
                                        value={itemForm.branch}
                                        onChange={(e) => setItemForm({ ...itemForm, branch: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsItemModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                >
                                    {editingItem ? 'Update Material' : 'Save Material'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: RECORD MATERIAL PURCHASE */}
            {isPurchaseModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Material Purchase Invoice</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Stock quantities and purchase expenses will be updated automatically.</p>
                            </div>
                            <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePurchase} className="space-y-4">
                            {/* Supplier Details */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Supplier Information</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Supplier / Vendor Name *</label>
                                        <input 
                                            type="text"
                                            required
                                            value={purchaseForm.supplier.name}
                                            onChange={(e) => setPurchaseForm({
                                                ...purchaseForm,
                                                supplier: { ...purchaseForm.supplier, name: e.target.value }
                                            })}
                                            placeholder="e.g. Metro Wholesale, Farm Fresh"
                                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Contact Phone</label>
                                        <input 
                                            type="text"
                                            value={purchaseForm.supplier.phone}
                                            onChange={(e) => setPurchaseForm({
                                                ...purchaseForm,
                                                supplier: { ...purchaseForm.supplier, phone: e.target.value }
                                            })}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Invoice Number *</label>
                                        <input 
                                            type="text"
                                            required
                                            value={purchaseForm.invoiceNumber}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Purchase Date *</label>
                                        <input 
                                            type="date"
                                            required
                                            value={purchaseForm.purchaseDate}
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                    {branches.length > 0 && (
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 mb-1">Branch</label>
                                            <select 
                                                value={purchaseForm.branchId}
                                                onChange={(e) => setPurchaseForm({ ...purchaseForm, branchId: e.target.value })}
                                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                            >
                                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Items to Purchase</span>
                                    <button 
                                        type="button"
                                        onClick={handleAddPurchaseItemRow}
                                        className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Another Item
                                    </button>
                                </div>

                                {purchaseForm.items.map((row, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/60 grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-4">
                                            <select 
                                                value={row.materialId}
                                                onChange={(e) => handlePurchaseItemChange(idx, 'materialId', e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                                            >
                                                <option value="">Select Material</option>
                                                {inventory.map(inv => (
                                                    <option key={inv._id} value={inv._id}>{inv.itemName} ({inv.unit})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number"
                                                step="any"
                                                min="0.1"
                                                placeholder="Qty"
                                                value={row.quantity}
                                                onChange={(e) => handlePurchaseItemChange(idx, 'quantity', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="Price ₹"
                                                value={row.unitPrice}
                                                onChange={(e) => handlePurchaseItemChange(idx, 'unitPrice', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="col-span-3 font-bold text-xs text-slate-800 dark:text-slate-200 text-right">
                                            ₹{row.total || 0}
                                        </div>
                                        <div className="col-span-1 text-right">
                                            {purchaseForm.items.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemovePurchaseItemRow(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Taxes & Settlement */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Tax Amount (₹)</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={purchaseForm.taxAmount}
                                        onChange={(e) => setPurchaseForm({ ...purchaseForm, taxAmount: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount Paid Now (₹)</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={purchaseForm.amountPaid}
                                        onChange={(e) => setPurchaseForm({ ...purchaseForm, amountPaid: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Method</label>
                                    <select 
                                        value={purchaseForm.paymentMethod}
                                        onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Credit Card">Credit Card</option>
                                    </select>
                                </div>
                            </div>

                            {/* Totals Summary */}
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between font-bold text-sm">
                                <span>Total Invoice Amount:</span>
                                <span className="text-emerald-600 text-lg">
                                    ₹{calculatePurchaseTotals().total.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsPurchaseModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                >
                                    Record Purchase & Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: RECORD PURCHASE PAYMENT */}
            {isPaymentModalOpen && selectedPurchaseForPayment && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Bill Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 mb-4">
                            Invoice: <strong>{selectedPurchaseForPayment.invoiceNumber}</strong><br />
                            Outstanding Balance Due: <strong>₹{selectedPurchaseForPayment.balanceDue?.toLocaleString('en-IN')}</strong>
                        </div>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Amount (₹) *</label>
                                <input 
                                    type="number"
                                    step="any"
                                    max={selectedPurchaseForPayment.balanceDue}
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                                <select 
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit Card">Credit Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Transaction Ref / Cheque #</label>
                                <input 
                                    type="text"
                                    value={paymentForm.paymentReference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                                    placeholder="e.g. UTR12345678 or Chq# 8890"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                >
                                    Submit Payment Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: LOG WASTAGE / STOCK ADJUSTMENT */}
            {isMovementModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Wastage or Stock Adjustment</h3>
                            <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveMovement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Material</label>
                                <select 
                                    value={movementForm.materialId}
                                    onChange={(e) => {
                                        const mat = inventory.find(i => i._id === e.target.value);
                                        setMovementForm({
                                            ...movementForm,
                                            materialId: e.target.value,
                                            unitCost: mat?.lastPurchasePrice || 0
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                >
                                    {inventory.map(i => (
                                        <option key={i._id} value={i._id}>{i.itemName} (Current: {i.quantity} {i.unit})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Adjustment Type</label>
                                    <select 
                                        value={movementForm.movementType}
                                        onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        <option value="Wastage">Kitchen Wastage</option>
                                        <option value="Damaged">Damaged / Expired</option>
                                        <option value="Stock Adjustment">Physical Stock Correction</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Quantity</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        required
                                        value={movementForm.quantity}
                                        onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Reason / Description *</label>
                                <textarea 
                                    rows="2"
                                    required
                                    value={movementForm.reason}
                                    onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                                    placeholder="e.g. Spoilage due to power failure, prep error"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsMovementModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                                >
                                    Record Stock Movement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
