import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Shield, MoreVertical, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
    'RestaurantAdmin': 'bg-purple-100 text-purple-700',
    'BranchManager': 'bg-blue-100 text-blue-700',
    'Chef': 'bg-orange-100 text-orange-700',
    'Waiter': 'bg-green-100 text-green-700',
    'Cashier': 'bg-teal-100 text-teal-700',
    'Customer': 'bg-gray-100 text-gray-700'
};

const UsersManagement = () => {
    const { api, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'RestaurantAdmin',
        branchId: ''
    });

    const fetchData = async () => {
        try {
            const [usersRes, branchesRes] = await Promise.all([
                api.get('/users'),
                api.get('/branches')
            ]);
            setUsers(usersRes.data);
            setBranches(branchesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({ name: '', email: '', role: 'RestaurantAdmin', branchId: '' });
        } catch (error) {
            console.error('Failed to invite user', error);
            alert(error.response?.data?.message || 'Error inviting user');
        }
    };

    const handleDelete = async (id) => {
        if (id === currentUser.id) {
            alert("You cannot delete your own account.");
            return;
        }

        if (window.confirm('Are you sure you want to completely remove this user?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchData();
            } catch (error) {
                console.error('Failed to delete user', error);
                alert(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchQuery || 
                              u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Staff & Users</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage employee access, roles, and assignments.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={18} /> Invite User
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                    >
                        <option value="All Roles">All Roles</option>
                        <option value="RestaurantAdmin">Admin</option>
                        <option value="BranchManager">Manager</option>
                        <option value="Chef">Chef</option>
                        <option value="Waiter">Waiter</option>
                        <option value="Cashier">Cashier</option>
                    </select>
                </div>
            </div>

            {/* User Cards */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500">No users found matching your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredUsers.map(u => (
                        <div key={u._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                            <button 
                                onClick={() => handleDelete(u._id)}
                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete User"
                            >
                                <Trash2 size={20} />
                            </button>
                            
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-2 border-white shadow-sm flex items-center justify-center text-green-700 font-bold text-xl uppercase">
                                    {u.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>{u.name}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                                        {u.role.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail size={16} className="text-gray-400" />
                                    <span className="truncate" title={u.email}>{u.email}</span>
                                </p>
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <Shield size={16} className="text-gray-400" />
                                    Assigned: <span className="font-medium text-gray-900">{u.branchId?.name || 'All Branches'}</span>
                                </p>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border bg-green-50 text-green-600 border-green-200`}>
                                    Active
                                </span>
                                <button className="text-sm font-medium text-green-600 hover:text-green-700">View Profile</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Invite New User</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. John Admin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="john@restosys.com"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select 
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    >
                                        <option value="RestaurantAdmin">Admin</option>
                                        <option value="BranchManager">Branch Manager</option>
                                        <option value="Chef">Chef</option>
                                        <option value="Waiter">Waiter</option>
                                        <option value="Cashier">Cashier</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Branch</label>
                                    <select 
                                        value={formData.branchId}
                                        onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;
