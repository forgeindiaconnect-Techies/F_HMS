import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MenuManagement = () => {
    const { api } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        isActive: true,
        image: '',
        tags: ''
    });

    const fetchMenu = async () => {
        try {
            const [menuRes, catRes] = await Promise.all([
                api.get('/menu'),
                api.get('/categories')
            ]);
            setMenuItems(menuRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error('Failed to fetch menu items', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, [api]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to completely remove this menu item?')) {
            try {
                await api.delete(`/menu/${id}`);
                fetchMenu();
            } catch (error) {
                console.error('Failed to delete item', error);
                alert('Failed to delete item');
            }
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item._id);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category,
            isActive: item.isActive,
            image: item.image || '',
            tags: item.tags ? item.tags.join(', ') : ''
        });
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: categories.length > 0 ? categories[0].name : 'Meal',
            isActive: true,
            image: '',
            tags: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            price: Number(formData.price),
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        };

        try {
            if (editingItem) {
                await api.put(`/menu/${editingItem}`, payload);
            } else {
                await api.post('/menu', payload);
            }
            fetchMenu();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save menu item', error);
            alert('Failed to save menu item');
        }
    };

    const filteredMenu = menuItems.filter(item => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query || 
                              (item.name && String(item.name).toLowerCase().includes(query)) || 
                              (item.description && String(item.description).toLowerCase().includes(query)) ||
                              (item.tags && Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase().includes(query)));
        const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
        let matchesStatus = true;
        if (statusFilter === 'Available') matchesStatus = item.isActive;
        if (statusFilter === 'Unavailable') matchesStatus = !item.isActive;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Menu Items</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your restaurant's digital menu offering.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={18} /> Add Menu Item
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search menu items..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500">
                        <option>All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500">
                        <option>All Statuses</option>
                        <option>Available</option>
                        <option>Unavailable</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredMenu.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">No menu items found.</td>
                                </tr>
                            ) : filteredMenu.map(item => (
                                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/> : <ImageIcon size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.name}</p>
                                                {item.tags && item.tags.length > 0 && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white bg-green-600`}>
                                                        {item.tags[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                                            <Tag size={14} className="text-gray-400" />
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        ${item.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                            {item.isActive ? '● Available' : '○ Unavailable'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => handleEditClick(item)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors" 
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors" 
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">{editingItem ? 'Edit Menu Item' : 'Add New Item'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form id="menu-form" onSubmit={handleSubmit} className="flex flex-col max-h-full">
                            <div className="overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        placeholder="e.g. Margherita Pizza"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea 
                                        rows="2"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                                        placeholder="Brief description of the dish..."
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            min="0"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        >
                                            {categories.length === 0 && (
                                                <>
                                                    <option value="Meal">Meal</option>
                                                    <option value="Starters">Starters</option>
                                                    <option value="Pizza">Pizza</option>
                                                    <option value="Burger">Burger</option>
                                                    <option value="Desserts">Desserts</option>
                                                </>
                                            )}
                                            {categories.map(c => (
                                                <option key={c._id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                                    <input 
                                        type="url" 
                                        value={formData.image}
                                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
                                    <input 
                                        type="text" 
                                        value={formData.tags}
                                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        placeholder="e.g. Vegetarian, Spicy, Best Seller"
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
                                        Item is Available (Active)
                                    </label>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0">
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
                                    {editingItem ? 'Save Changes' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
