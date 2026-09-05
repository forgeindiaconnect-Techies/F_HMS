import { useState, useEffect } from 'react';
import { PackageSearch, AlertTriangle, ArrowDown, RefreshCw, ShoppingCart, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerInventory = () => {
    const { api, user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [selectedItemForAction, setSelectedItemForAction] = useState(null);
    const [actionType, setActionType] = useState(''); // 'reorder' or 'adjust'
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [quantityInput, setQuantityInput] = useState('');
    const [reasonInput, setReasonInput] = useState('Manual Count Correction');

    // Create item inputs
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('Meat');
    const [newItemQty, setNewItemQty] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('lbs');
    const [newItemMin, setNewItemMin] = useState('');

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory');
            // Filter by branch
            const filtered = res.data.filter(item => {
                if (user.role === 'RestaurantAdmin' || user.role === 'SuperAdmin' || !user.branchId) {
                    return true;
                }
                const itemBranchId = item.branch?._id || item.branch;
                const managerBranchId = user.branchId?._id || user.branchId;
                return itemBranchId && managerBranchId && itemBranchId.toString() === managerBranchId.toString();
            });
            setInventory(filtered);
        } catch (err) {
            console.error('Failed to fetch inventory', err);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleCreateItem = async () => {
        if (!newItemName || !newItemQty || !newItemMin) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await api.post('/inventory', {
                itemName: newItemName,
                category: newItemCategory,
                quantity: Number(newItemQty),
                unit: newItemUnit,
                minStockLevel: Number(newItemMin)
            });
            toast.success('Inventory item created!');
            setShowCreateModal(false);
            setNewItemName('');
            setNewItemQty('');
            setNewItemMin('');
            fetchInventory();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create inventory item');
        }
    };

    const handleActionSubmit = async () => {
        if (actionType === 'adjust') {
            if (!selectedItemForAction) return;
            const itemId = selectedItemForAction._id;
            try {
                if (reasonInput === 'Spoilage / Waste') {
                    // Log wastage
                    await api.post('/inventory/wastage', {
                        ingredientName: selectedItemForAction.itemName,
                        quantity: Math.max(0, selectedItemForAction.quantity - Number(quantityInput)),
                        unit: selectedItemForAction.unit,
                        reason: 'Spoilage'
                    });
                }
                
                await api.put(`/inventory/${itemId}`, {
                    quantity: Number(quantityInput)
                });
                
                toast.success('Inventory updated successfully!');
                setShowReorderModal(false);
                fetchInventory();
            } catch (err) {
                console.error(err);
                toast.error('Failed to adjust stock');
            }
        } else {
            // Simulated reorder request
            toast.success('Restock requisition submitted successfully!');
            setShowReorderModal(false);
        }
    };

    const mappedInventory = inventory.map(item => {
        const ratio = item.quantity / item.minStockLevel;
        let status = 'In Stock';
        if (ratio <= 0.2) status = 'Critical';
        else if (ratio <= 1.0) status = 'Low Stock';

        return {
            _id: item._id,
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            minStockLevel: item.minStockLevel,
            stockStr: `${item.quantity} ${item.unit}`,
            minStr: `${item.minStockLevel} ${item.unit}`,
            status
        };
    });

    const filteredInventory = mappedInventory.filter(item => 
        categoryFilter === 'All Categories' || item.category === categoryFilter
    );

    const criticalCount = mappedInventory.filter(item => item.status === 'Critical' || item.status === 'Low Stock').length;
    const healthyCount = mappedInventory.filter(item => item.status === 'In Stock').length;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Inventory Monitor</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Track local branch stock levels and manage reorder requests.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowCreateModal(true)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm cursor-pointer">
                        + Create Item
                    </button>
                    <button onClick={() => { setSelectedItemForAction(null); setActionType('reorder'); setShowReorderModal(true); }} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer">
                        <ShoppingCart size={18} /> New Reorder
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Critical / Low Stock</p>
                        <h3 className="text-2xl font-extrabold text-red-900 dark:text-red-300">{criticalCount} Items</h3>
                    </div>
                </div>
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase tracking-wider">Healthy Stock</p>
                        <h3 className="text-2xl font-extrabold text-green-900 dark:text-green-300">{healthyCount} Items</h3>
                    </div>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl"><ArrowDown size={24} /></div>
                    <div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">Active Inventory Records</p>
                        <h3 className="text-2xl font-extrabold text-blue-900 dark:text-blue-300">{inventory.length} total</h3>
                    </div>
                </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Stock Alerts & Status</h3>
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500"
                    >
                        <option value="All Categories">All Categories</option>
                        <option value="Meat">Meat</option>
                        <option value="Produce">Produce</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Pantry">Pantry</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 dark:text-slate-400">
                        No inventory items found. Add items to track stock.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Item Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Current Stock</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Min Required</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {filteredInventory.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">{item.itemName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{item.category}</td>
                                        <td className={`px-6 py-4 font-extrabold text-sm ${item.status === 'Critical' ? 'text-red-600 dark:text-red-400' : item.status === 'Low Stock' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                                            {item.stockStr}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{item.minStr}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                item.status === 'In Stock' ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400' :
                                                item.status === 'Critical' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' :
                                                'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status !== 'In Stock' ? (
                                                <button onClick={() => { setSelectedItemForAction(item); setActionType('reorder'); setQuantityInput(''); setShowReorderModal(true); }} className="text-sm font-bold text-white bg-green-600 px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm cursor-pointer">
                                                    Reorder
                                                </button>
                                            ) : (
                                                <button onClick={() => { setSelectedItemForAction(item); setActionType('adjust'); setQuantityInput(item.quantity.toString()); setShowReorderModal(true); }} className="text-sm font-bold text-gray-500 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-4 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                                                    Adjust
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reorder / Adjust Modal */}
            {showReorderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                {actionType === 'reorder' ? <ShoppingCart size={20} className="text-green-600" /> : <PackageSearch size={20} className="text-orange-600" />}
                                {actionType === 'reorder' ? (selectedItemForAction ? 'Reorder Item' : 'New Reorder') : 'Adjust Stock'}
                            </h3>
                            <button onClick={() => setShowReorderModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                                {selectedItemForAction ? (
                                    <input type="text" readOnly value={selectedItemForAction.itemName} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 focus:outline-none" />
                                ) : (
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                                        <option value="">Select Item...</option>
                                        {inventory.map(item => (
                                            <option key={item._id} value={item._id}>{item.itemName}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            
                            {actionType === 'reorder' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                                            <input type="number" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                            <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                                                <option>lbs</option>
                                                <option>kg</option>
                                                <option>units</option>
                                                <option>boxes</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Urgency</label>
                                        <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                                            <option>Standard Delivery</option>
                                            <option>Express (Next Day)</option>
                                            <option>Emergency (Today)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {actionType === 'adjust' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Current Stock</label>
                                            <input type="text" readOnly value={selectedItemForAction?.stockStr || ''} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">New Stock</label>
                                            <input type="number" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Reason for Adjustment</label>
                                        <select value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                            <option value="Manual Count Correction">Manual Count Correction</option>
                                            <option value="Spoilage / Waste">Spoilage / Waste</option>
                                            <option value="Damage">Damage</option>
                                            <option value="Internal Use">Internal Use</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowReorderModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleActionSubmit} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${actionType === 'reorder' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                                {actionType === 'reorder' ? 'Submit Order' : 'Update Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Item Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">Create New Inventory Item</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. Avocado" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option>Meat</option>
                                    <option>Produce</option>
                                    <option>Bakery</option>
                                    <option>Dairy</option>
                                    <option>Pantry</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                                    <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                    <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                                        <option>lbs</option>
                                        <option>kg</option>
                                        <option>units</option>
                                        <option>boxes</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Min Stock Level</label>
                                <input type="number" value={newItemMin} onChange={(e) => setNewItemMin(e.target.value)} placeholder="e.g. 10" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleCreateItem} className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors">Create Item</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerInventory;
