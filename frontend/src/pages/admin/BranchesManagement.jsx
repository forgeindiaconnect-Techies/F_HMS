import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Phone, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const BranchesManagement = () => {
    const { api, restaurant } = useAuth();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    const planName = restaurant?.subscription?.plan || 'Basic';
    const maxBranches = (planName === 'Basic' || planName === 'Starter') ? 1 : (planName === 'Pro' || planName === 'Professional') ? 3 : 'Unlimited';
    
    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [branchToDelete, setBranchToDelete] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        isActive: true
    });

    const fetchBranches = async () => {
        try {
            const { data } = await api.get('/branches');
            setBranches(data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleOpenModal = (branch = null) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                address: branch.location?.address || '',
                phone: branch.contact?.phone || '',
                isActive: branch.isActive
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            name: formData.name,
            location: { address: formData.address },
            contact: { phone: formData.phone },
            isActive: formData.isActive
        };

        try {
            if (editingBranch) {
                await api.put(`/branches/${editingBranch._id}`, payload);
                toast.success('Branch updated successfully');
            } else {
                await api.post('/branches', payload);
                toast.success('Branch created successfully');
            }
            fetchBranches();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save branch', error);
            const errMsg = error.response?.data?.message || 'Error saving branch';
            toast.error(errMsg);
        }
    };

    const handleDeleteClick = (branch) => {
        setBranchToDelete(branch);
    };

    const confirmDelete = async () => {
        if (!branchToDelete) return;
        try {
            await api.delete(`/branches/${branchToDelete._id}`);
            toast.success('Branch deleted successfully');
            fetchBranches();
        } catch (error) {
            console.error('Failed to delete branch', error);
            toast.error('Error deleting branch');
        } finally {
            setBranchToDelete(null);
        }
    };

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = !searchQuery || branch.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All Statuses' || 
                              (statusFilter === 'Active' && branch.isActive) || 
                              (statusFilter === 'Inactive' && !branch.isActive);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Branches</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your restaurant locations ({branches.length} / {maxBranches} branch{maxBranches === 1 ? '' : 'es'} used on <span className="font-semibold text-green-700">{planName}</span> plan).
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={18} /> Add Branch
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search branches..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                    >
                        <option value="All Statuses">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Branch Grid */}
            {loading ? (
                <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500">No branches found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map(branch => (
                        <div key={branch._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                            <div className="p-5 border-b border-gray-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${branch.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{branch.name}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {branch.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mt-4 text-sm text-gray-500">
                                    <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {branch.location?.address || 'No address'}</p>
                                    <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {branch.contact?.phone || 'No phone'}</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50/50 p-5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">Manager</p>
                                    <p className="text-sm font-semibold text-gray-800">{branch.manager?.name || 'Unassigned'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-medium mb-1">Monthly Rev</p>
                                    <p className="text-sm font-bold text-green-600" style={{ fontFamily: 'Manrope, sans-serif' }}>₹0</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white px-5 py-3 border-t border-gray-100 flex justify-end gap-3 opacity-100">
                                <button 
                                    onClick={() => handleOpenModal(branch)}
                                    className="text-sm flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors font-medium"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(branch)}
                                    className="text-sm flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors font-medium"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. Downtown Main"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input 
                                    type="text" 
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="Full address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Branch is Active
                                </label>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    {editingBranch ? 'Save Changes' : 'Create Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {branchToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setBranchToDelete(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Delete Branch?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <strong>{branchToDelete.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setBranchToDelete(null)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm shadow-red-600/20 transition-colors text-sm"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchesManagement;
