import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, ShieldOff, ShieldCheck, UserCog, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
    SuperAdmin: 'bg-red-100 text-red-700 border-red-200',
    RestaurantAdmin: 'bg-blue-100 text-blue-700 border-blue-200',
    Admin: 'bg-blue-100 text-blue-700 border-blue-200',
    BranchManager: 'bg-purple-100 text-purple-700 border-purple-200',
    Waiter: 'bg-green-100 text-green-700 border-green-200',
    Chef: 'bg-orange-100 text-orange-700 border-orange-200',
    Cashier: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    SupportAgent: 'bg-teal-100 text-teal-700 border-teal-200',
    DeliveryPartner: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const UserManagement = () => {
    const { api } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/super-admin/users');
                setUsers(res.data);
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [api]);

    const handleToggleStatus = async (userId, currentStatus) => {
        setTogglingId(userId);
        try {
            const res = await api.put(`/super-admin/users/${userId}/status`);
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: res.data.isActive } : u));
            toast.success(`User ${res.data.isActive ? 'activated' : 'deactivated'} successfully!`);
        } catch (error) {
            toast.error('Failed to update user status');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`)) {
            return;
        }
        setDeletingId(userId);
        try {
            await api.delete(`/super-admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
            toast.success(`User "${userName}" deleted successfully!`);
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Failed to delete user';
            toast.error(errMsg);
        } finally {
            setDeletingId(null);
        }
    };

    const allRoles = ['All', ...new Set(users.map(u => u.role))];

    const filtered = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const activeCount = users.filter(u => u.isActive).length;
    const inactiveCount = users.filter(u => !u.isActive).length;

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight">User Management</h2>
                <p className="text-gray-500 mt-1">Manage all platform users across every restaurant and role.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Users', value: activeCount, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Inactive Users', value: inactiveCount, icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md transition-all">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color} shrink-0`}>
                                <Icon size={26} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><UserCog size={20} /> All Platform Users</h3>
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full sm:w-56"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                        >
                            {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-5 font-bold">User</th>
                                <th className="p-5 font-bold">Role</th>
                                <th className="p-5 font-bold">Restaurant</th>
                                <th className="p-5 font-bold">Joined</th>
                                <th className="p-5 font-bold">Status</th>
                                <th className="p-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50/80 transition-colors text-sm">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {user.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">{user.name}</span>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-5 text-gray-500 font-medium text-xs">
                                        {user.restaurantId?.name || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="p-5 text-gray-500 text-xs font-medium">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                                            user.isActive 
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right flex items-center justify-end gap-2.5">
                                        <button
                                            onClick={() => handleToggleStatus(user._id, user.isActive)}
                                            disabled={togglingId === user._id}
                                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 ${
                                                user.isActive
                                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                                : 'bg-green-50 hover:bg-green-100 text-green-600'
                                            }`}
                                        >
                                            {togglingId === user._id ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user._id, user.name)}
                                            disabled={deletingId === user._id}
                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all active:scale-[0.95] disabled:opacity-50 flex items-center justify-center shrink-0"
                                            title="Delete User"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center">
                                        <Users className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-500 font-medium text-lg">No users match your filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
