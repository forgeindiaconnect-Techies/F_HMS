import { useState, useEffect } from 'react';
import { Search, Plus, Filter, AlertTriangle, ArrowRight, ClipboardList, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const getStatusBadge = (quantity, minStock) => {
    if (quantity === 0) return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Out of Stock</span>;
    if (quantity <= minStock) return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Low Stock</span>;
    return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">In Stock</span>;
};

const InventoryManagement = () => {
    const { api } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setCategoryFilter] = useState('All Categories');
    const [filterStatus, setFilterStatus] = useState('All');
    
    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Vegetables',
        quantity: 0,
        unit: 'kg',
        minStockLevel: 10,
        branch: ''
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    const fetchData = async () => {
        try {
            const [invRes, branchesRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/branches')
            ]);
            setInventory(invRes.data);
            setBranches(branchesRes.data);
            
            if (branchesRes.data.length > 0 && !formData.branch) {
                setFormData(prev => ({ ...prev, branch: branchesRes.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Inventory Item',
            message: 'Are you sure you want to delete this inventory item?',
            onConfirm: async () => {
                try {
                    await api.delete(`/inventory/${id}`);
                    fetchData();
                    toast.success('Inventory item deleted successfully');
                } catch (error) {
                    console.error('Failed to delete item', error);
                    toast.error('Failed to delete item');
                }
            },
            isDestructive: true
        });
    };

    const handleEditClick = (item) => {
        setEditingItem(item._id);
        setFormData({
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            minStockLevel: item.minStockLevel,
            branch: item.branch?._id || item.branch || ''
        });
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingItem(null);
        setFormData({
            itemName: '',
            category: 'Vegetables',
            quantity: 0,
            unit: 'kg',
            minStockLevel: 10,
            branch: branches.length > 0 ? branches[0]._id : ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            quantity: Number(formData.quantity),
            minStockLevel: Number(formData.minStockLevel)
        };

        try {
            if (editingItem) {
                await api.put(`/inventory/${editingItem}`, payload);
            } else {
                await api.post('/inventory', payload);
            }
            fetchData();
            setIsModalOpen(false);
            toast.success(editingItem ? 'Inventory item updated' : 'Inventory item added');
        } catch (error) {
            console.error('Failed to save item', error);
            toast.error(error.response?.data?.message || 'Failed to save item');
        }
    };

    // Calculate Alerts
    const criticalItems = inventory.filter(item => item.quantity === 0 || item.quantity <= (item.minStockLevel * 0.5));
    const lowStockItems = inventory.filter(item => item.quantity > (item.minStockLevel * 0.5) && item.quantity <= item.minStockLevel);

    // Apply Filters
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (item._id && item._id.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = filterCategory === 'All Categories' || item.category === filterCategory;
        let matchesStatus = true;
        if (filterStatus === 'Critical') {
            matchesStatus = item.quantity === 0 || item.quantity <= (item.minStockLevel * 0.5);
        } else if (filterStatus === 'Low') {
            matchesStatus = item.quantity > (item.minStockLevel * 0.5) && item.quantity <= item.minStockLevel;
        }
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans relative">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Inventory Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Track stock levels, wastage, and ingredient usage.</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">

                    <button 
                        onClick={handleAddClick}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md shadow-green-900/10"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </div>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 text-lg">Critical Stock Alerts ({criticalItems.length})</h3>
                        {criticalItems.length > 0 ? (
                            <p className="text-sm text-red-700 mt-1">
                                {criticalItems.slice(0, 2).map(i => i.itemName).join(', ')} 
                                {criticalItems.length > 2 && ' and others '} 
                                are critically low.
                            </p>
                        ) : (
                            <p className="text-sm text-red-700 mt-1">No critical alerts right now.</p>
                        )}
                        <button 
                            onClick={() => setFilterStatus(filterStatus === 'Critical' ? 'All' : 'Critical')}
                            className="mt-3 text-red-700 font-bold text-sm flex items-center gap-1 hover:text-red-800"
                        >
                            {filterStatus === 'Critical' ? 'Clear Filter' : 'Reorder Now'} <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-orange-900 text-lg">Low Stock Warnings ({lowStockItems.length})</h3>
                        {lowStockItems.length > 0 ? (
                            <p className="text-sm text-orange-700 mt-1">
                                {lowStockItems.slice(0, 2).map(i => i.itemName).join(', ')} 
                                {lowStockItems.length > 2 && ' and others '}
                                are below minimum limits.
                            </p>
                        ) : (
                            <p className="text-sm text-orange-700 mt-1">Stock levels look good.</p>
                        )}
                        <button 
                            onClick={() => setFilterStatus(filterStatus === 'Low' ? 'All' : 'Low')}
                            className="mt-3 text-orange-700 font-bold text-sm flex items-center gap-1 hover:text-orange-800"
                        >
                            {filterStatus === 'Low' ? 'Clear Filter' : 'View Items'} <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search inventory items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                </div>
                <div className="flex gap-3">
                    <select 
                        value={filterCategory}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-green-500"
                    >
                        <option value="All Categories">All Categories</option>
                        <option value="Meat">Meat</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Produce">Produce</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Dry Goods">Dry Goods</option>
                        <option value="Beverages">Beverages</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">In Stock</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Min Stock</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500">No inventory items found.</td>
                                </tr>
                            ) : filteredInventory.map(item => (
                                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">{item.itemName}</span>
                                            <span className="text-xs font-medium text-gray-400 mt-0.5">#{item._id.substring(18).toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-gray-600">{item.category}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-lg font-extrabold ${item.quantity <= item.minStockLevel ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            <span className="text-sm font-bold text-gray-500">{item.unit}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-gray-500">{item.minStockLevel} {item.unit}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {getStatusBadge(item.quantity, item.minStockLevel)}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 transition-opacity">
                                            <button 
                                                onClick={() => handleEditClick(item)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg" 
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg" 
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">{editingItem ? 'Edit Item' : 'New Inventory Item'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="inventory-form" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Item Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.itemName}
                                        onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        placeholder="e.g. Premium Ground Beef"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        >
                                            <option value="Vegetables">Vegetables</option>
                                            <option value="Meat">Meat</option>
                                            <option value="Dairy">Dairy</option>
                                            <option value="Dry Goods">Dry Goods</option>
                                            <option value="Packaging">Packaging</option>
                                            <option value="Beverages">Beverages</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Branch</label>
                                        <select 
                                            value={formData.branch}
                                            onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                            required
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Unit</label>
                                        <select 
                                            value={formData.unit}
                                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        >
                                            <option value="kg">kg</option>
                                            <option value="lbs">lbs</option>
                                            <option value="ltr">ltr</option>
                                            <option value="pcs">pcs</option>
                                            <option value="boxes">boxes</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Current Stock</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="any"
                                            required
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-bold"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Min Alert Level</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="any"
                                            required
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-bold"
                                        />
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 mt-8 -mx-6 -mb-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                    >
                                        {editingItem ? 'Save Changes' : 'Add to Inventory'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
