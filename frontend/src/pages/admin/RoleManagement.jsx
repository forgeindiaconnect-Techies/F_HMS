import { useState, useEffect } from 'react';
import { Search, Plus, Shield, Info, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RoleManagement = () => {
    const { api } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Editing State
    const [currentPermissions, setCurrentPermissions] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ name: '', desc: '' });
    
    // Delete Modal State
    const [roleToDelete, setRoleToDelete] = useState(null);

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/roles');
            setRoles(data);
            if (data.length > 0 && !currentPermissions) {
                setCurrentPermissions(data[0].permissions);
            }
        } catch (error) {
            console.error('Failed to fetch roles', error);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const selectedRole = roles[selectedRoleIndex] || null;

    const filteredRoles = roles.filter(role => 
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (role.desc && role.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // When selected role changes, reset current permissions to that role's permissions
    useEffect(() => {
        if (selectedRole) {
            setCurrentPermissions(JSON.parse(JSON.stringify(selectedRole.permissions))); // Deep copy
        }
    }, [selectedRoleIndex, roles]);

    const handleTogglePermission = (module, permIndex) => {
        if (!selectedRole || selectedRole.isCoreRole) return;
        
        const updated = { ...currentPermissions };
        updated[module] = [...updated[module]];
        updated[module][permIndex] = !updated[module][permIndex];
        setCurrentPermissions(updated);
    };

    const handleSaveChanges = async () => {
        if (!selectedRole || selectedRole.isCoreRole) return;
        
        setIsSaving(true);
        try {
            await api.put(`/roles/${selectedRole.id}`, { permissions: currentPermissions });
            toast.success('Role permissions updated successfully');
            fetchRoles(); // Refresh
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/roles', newRoleData);
            toast.success('Custom role created successfully');
            setIsCreateModalOpen(false);
            setNewRoleData({ name: '', desc: '' });
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create role');
        }
    };

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        try {
            await api.delete(`/roles/${roleToDelete.id}`);
            toast.success('Role deleted successfully');
            setRoleToDelete(null);
            setSelectedRoleIndex(0);
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const handleActionClick = () => {
        if (selectedRole?.isCoreRole) {
            toast('Core roles cannot be modified to ensure system stability.', { icon: '🔒' });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 relative">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Role Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Create custom roles and manage system permissions.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-sm shadow-green-900/10" 
                >
                    <Plus size={18} /> Create Role
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Roles List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center mb-2">
                        <Search className="text-gray-400 ml-2 mr-3" size={18} />
                        <input type="text" placeholder="Search roles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent text-sm focus:outline-none" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 min-h-[400px]">
                        {loading ? (
                             <div className="flex justify-center p-10">
                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                             </div>
                        ) : (
                            filteredRoles.map((role, idx) => (
                                <div 
                                    key={role.id} 
                                    onClick={() => setSelectedRoleIndex(idx)}
                                    className={`p-4 cursor-pointer transition-colors ${idx === selectedRoleIndex ? 'bg-green-50/50 border-l-4 border-green-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm ${idx === selectedRoleIndex ? 'text-green-800' : 'text-gray-900'}`}>
                                            {role.name} {role.isCoreRole && <span title="Core Role">🔒</span>}
                                        </h3>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{role.users} Users</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{role.desc}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Permissions Matrix for Selected Role */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[600px]">
                    {selectedRole && currentPermissions && (
                        <>
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 text-green-700 font-bold mb-1">
                                        <Shield size={18} /> Viewing Permissions
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{selectedRole.name}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedRole.isCoreRole ? (
                                        <>
                                            <span className="text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-orange-100 font-medium">
                                                <Info size={14} /> Read Only
                                            </span>
                                            <button 
                                                onClick={handleActionClick}
                                                className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold shadow-sm cursor-not-allowed transition-colors"
                                            >
                                                Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setRoleToDelete(selectedRole)}
                                                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                            <button 
                                                onClick={handleSaveChanges}
                                                disabled={isSaving}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-green-900/10 transition-colors disabled:opacity-50"
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 flex-1 overflow-y-auto">
                                {Object.entries(currentPermissions).map(([module, permsArray], i) => (
                                    <div key={i} className="mb-6 last:mb-0">
                                        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">{module}</h4>
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                            {['View Data', 'Create Records', 'Edit Records', 'Delete Records'].map((permName, j) => {
                                                const isChecked = permsArray[j];
                                                
                                                return (
                                                    <label 
                                                        key={j} 
                                                        className={`flex items-center justify-between p-3 ${selectedRole.isCoreRole ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                                                        onClick={() => {
                                                            if (selectedRole.isCoreRole) {
                                                                handleActionClick();
                                                            }
                                                        }}
                                                    >
                                                        <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>{permName}</span>
                                                        <div className="relative flex items-center">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer" 
                                                                checked={isChecked} 
                                                                readOnly={selectedRole.isCoreRole}
                                                                onChange={() => handleTogglePermission(module, j)}
                                                            />
                                                            <div className={`w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 peer-checked:bg-green-500 transition-all ${selectedRole.isCoreRole ? 'opacity-50' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create Role Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Create Custom Role</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRole} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newRoleData.name}
                                    onChange={(e) => setNewRoleData({...newRoleData, name: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. Senior Waiter"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    value={newRoleData.desc}
                                    onChange={(e) => setNewRoleData({...newRoleData, desc: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all min-h-[80px]"
                                    placeholder="What can this role do?"
                                />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    Create Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {roleToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setRoleToDelete(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-xl mb-2">Delete Role?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete <strong>{roleToDelete.name}</strong>? Users assigned to this role will lose their permissions.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setRoleToDelete(null)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteRole}
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

export default RoleManagement;
