import { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Phone, Mail, ExternalLink, Edit2, Trash2, X, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SupplierManagement = () => {
    const { api } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Vegetables & Fruits',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        branch: '',
        isActive: true
    });

    const fetchData = async () => {
        try {
            const [suppRes, branchesRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/branches')
            ]);
            setSuppliers(suppRes.data);
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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this supplier?')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchData();
            } catch (error) {
                console.error('Failed to delete supplier', error);
                alert('Failed to delete supplier');
            }
        }
    };

    const handleEditClick = (supplier) => {
        setEditingSupplier(supplier._id);
        setFormData({
            name: supplier.name,
            category: supplier.category || 'General',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone,
            email: supplier.email || '',
            address: supplier.address || '',
            branch: supplier.branch?._id || '',
            isActive: supplier.isActive
        });
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            category: 'Vegetables & Fruits',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            branch: branches.length > 0 ? branches[0]._id : '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save supplier', error);
            alert('Failed to save supplier');
        }
    };

    const filteredSuppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (supplier.category && supplier.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans relative">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Supplier Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage vendor details and purchase orders.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md shadow-green-900/10"
                >
                    <Plus size={18} /> Add Supplier
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search suppliers by name or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    No suppliers found. Click "+ Add Supplier" to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map(supplier => (
                        <div key={supplier._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                            {/* Status Badge */}
                            <div className="absolute top-0 right-0 m-4 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {supplier.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            {/* Delete Button (Hover) */}
                            <div className="absolute top-4 right-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleDelete(supplier._id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Supplier"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mb-4 pr-12">
                                <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                                <p className="text-sm font-medium text-green-600 mt-1">{supplier.category}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {supplier.contactPerson && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 flex justify-center"><Search size={16} className="text-gray-400" /></div>
                                        <span>Contact: {supplier.contactPerson}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-6 flex justify-center"><Phone size={16} className="text-gray-400" /></div>
                                    <span>{supplier.phone}</span>
                                </div>
                                {supplier.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-6 flex justify-center"><Mail size={16} className="text-gray-400" /></div>
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start gap-3 text-sm text-gray-600">
                                        <div className="w-6 flex justify-center mt-0.5"><MapPin size={16} className="text-gray-400" /></div>
                                        <span className="line-clamp-2">{supplier.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                                    <ExternalLink size={16} /> View Orders
                                </button>
                                <button 
                                    onClick={() => handleEditClick(supplier)}
                                    className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    Edit Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="supplier-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Supplier Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        >
                                            <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                                            <option value="Meat & Poultry">Meat & Poultry</option>
                                            <option value="Dairy Products">Dairy Products</option>
                                            <option value="Dry Goods">Dry Goods</option>
                                            <option value="Beverages">Beverages</option>
                                            <option value="Packaging & Supplies">Packaging & Supplies</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Contact Person</label>
                                        <input 
                                            type="text" 
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number *</label>
                                        <input 
                                            type="tel" 
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Physical Address</label>
                                    <textarea 
                                        rows="2"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium resize-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign to Branch *</label>
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

                                <div className="flex items-center gap-3 pt-2">
                                    <label className="relative flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                                        Active Supplier
                                    </label>
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
                                        {editingSupplier ? 'Save Changes' : 'Add Supplier'}
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

export default SupplierManagement;
