import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Folder, Tag, GripVertical, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CategoryManagement = () => {
    const { api } = useAuth();
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        branch: '',
        isActive: true
    });

    const fetchData = async () => {
        try {
            const [catRes, branchesRes] = await Promise.all([
                api.get('/categories'),
                api.get('/branches')
            ]);
            setCategories(catRes.data);
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
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/categories/${id}`);
                fetchData();
            } catch (error) {
                console.error('Failed to delete category', error);
                alert('Failed to delete category');
            }
        }
    };

    const handleAddClick = () => {
        setFormData({
            name: '',
            description: '',
            branch: branches.length > 0 ? branches[0]._id : '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/categories', formData);
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to create category', error);
            alert('Failed to create category');
        }
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group categories by branch
    const categoriesByBranch = filteredCategories.reduce((acc, cat) => {
        const branchName = cat.branch ? cat.branch.name : 'Unknown Branch';
        if (!acc[branchName]) {
            acc[branchName] = [];
        }
        acc[branchName].push(cat);
        return acc;
    }, {});

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Menu Categories</h2>
                    <p className="text-gray-500 text-sm mt-1">Organize your menu into categories and subcategories.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={18} /> New Category
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                </div>
                <button className="bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-green-100 transition-colors">
                    Expand All
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">Category Name</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="flex justify-center p-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : Object.keys(categoriesByBranch).length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No categories found.</div>
                    ) : (
                        Object.entries(categoriesByBranch).map(([branchName, branchCategories]) => (
                            <div key={branchName}>
                                {/* Branch Header as "Category" */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-gray-50/30">
                                    <div className="col-span-6 flex items-center gap-3">
                                        <GripVertical size={16} className="text-gray-300 cursor-grab" />
                                        <button className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                            <ChevronDown size={14} className="text-gray-600" />
                                        </button>
                                        <Folder size={18} className="text-green-600" />
                                        <span className="font-bold text-gray-900">{branchName}</span>
                                    </div>
                                    <div className="col-span-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-green-100 text-green-700">
                                            Active
                                        </span>
                                    </div>
                                    <div className="col-span-3"></div>
                                </div>
                                
                                {/* Actual Categories */}
                                <div>
                                    {branchCategories.map((cat, idx) => (
                                        <div key={cat._id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center group hover:bg-gray-50/50 transition-colors pl-14">
                                            <div className="col-span-6 flex items-center gap-3">
                                                <GripVertical size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity" />
                                                <Tag size={16} className="text-gray-400" />
                                                <span className="font-medium text-gray-700">{cat.name}</span>
                                                {cat.description && (
                                                    <span className="text-xs text-gray-400 truncate ml-2 max-w-[200px]">- {cat.description}</span>
                                                )}
                                            </div>
                                            <div className="col-span-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {cat.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="col-span-3 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleDelete(cat._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">New Category</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        placeholder="e.g. Main Course, Desserts"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                    <select 
                                        value={formData.branch}
                                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        required
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                    <textarea 
                                        rows="2"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                                        placeholder="Brief description..."
                                    />
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
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Active Category
                                    </label>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 mt-6 -mx-6 -mb-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                    >
                                        Create Category
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

export default CategoryManagement;
