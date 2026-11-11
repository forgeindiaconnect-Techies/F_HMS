import { useState, useEffect } from 'react';
import { Settings, Save, Bell, Lock, User, Store, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerSettings = () => {
    const { api, user, restaurant } = useAuth();
    const [activeTab, setActiveTab] = useState('My Profile');
    const [saving, setSaving] = useState(false);
    const [loadingBranch, setLoadingBranch] = useState(true);
    const [branchId, setBranchId] = useState('');

    const [branchForm, setBranchForm] = useState({
        name: '',
        address: '',
        openingTime: '08:00',
        closingTime: '22:00'
    });

    const [profileForm, setProfileForm] = useState({
        firstName: (user?.name || 'Branch Manager').split(' ')[0] || '',
        lastName: (user?.name || '').split(' ').slice(1).join(' ') || 'Manager',
        phone: user?.phoneNumber || user?.phone || ''
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        setProfileForm({
            firstName: (user?.name || 'Branch Manager').split(' ')[0] || '',
            lastName: (user?.name || '').split(' ').slice(1).join(' ') || 'Manager',
            phone: user?.phoneNumber || user?.phone || ''
        });
    }, [user]);

    useEffect(() => {
        const fetchBranchDetails = async () => {
            try {
                setLoadingBranch(true);
                const res = await api.get('/branches');
                const branches = Array.isArray(res.data) ? res.data : [];
                const userBranchId = user?.branchId?._id || user?.branchId;
                const targetBranch =
                    branches.find(b => userBranchId && String(b._id) === String(userBranchId)) ||
                    branches.find(b => b.manager && String(b.manager?._id || b.manager) === String(user?._id)) ||
                    branches[0];

                if (targetBranch) {
                    setBranchId(targetBranch._id);
                    setBranchForm({
                        name: targetBranch.name || restaurant?.name || 'Main Branch',
                        address: targetBranch.location?.address || restaurant?.address || '',
                        openingTime: targetBranch.operatingHours?.open || '08:00',
                        closingTime: targetBranch.operatingHours?.close || '22:00'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch branch details', error);
            } finally {
                setLoadingBranch(false);
            }
        };
        fetchBranchDetails();
    }, [api, user?._id, user?.branchId, restaurant?.name, restaurant?.address]);

    const handleSaveChanges = async () => {
        if (activeTab === 'Security') {
            await handlePasswordUpdate();
            return;
        }
        setSaving(true);
        try {
            if (branchId) {
                const res = await api.put(`/branches/${branchId}`, {
                    name: branchForm.name,
                    location: { address: branchForm.address },
                    operatingHours: {
                        open: branchForm.openingTime || '08:00',
                        close: branchForm.closingTime || '22:00'
                    }
                });
                const saved = res.data;
                if (saved) {
                    setBranchForm({
                        name: saved.name || branchForm.name,
                        address: saved.location?.address ?? branchForm.address,
                        openingTime: saved.operatingHours?.open || branchForm.openingTime,
                        closingTime: saved.operatingHours?.close || branchForm.closingTime
                    });
                }
                toast.success('Branch settings saved successfully!');
            } else {
                toast.error('No branch record linked to save');
            }
        } catch (error) {
            console.error('Failed to save branch settings', error);
            toast.error(error.response?.data?.message || 'Failed to save branch settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }
        setUpdatingPassword(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            toast.success('Password updated successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-4 sm:space-y-6 pb-12 font-sans">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Settings</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Manage local branch preferences, operating hours, and profile.</p>
                </div>
                <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving || updatingPassword}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-70"
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { name: 'My Profile', icon: User },
                        { name: 'Branch Details', icon: Store },
                        
                        { name: 'Security', icon: Lock },
                    ].map((item, i) => (
                        <button key={i} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm cursor-pointer ${activeTab === item.name ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200'}`}>
                            <item.icon size={18} className={activeTab === item.name ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} /> {item.name}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2 space-y-6">
                    
                    
                    {activeTab === 'My Profile' && (
                        <>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile Information</h3>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">First Name</label>
                                            <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors font-semibold" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Last Name</label>
                                            <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors font-semibold" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Email Address</label>
                                        <input type="email" value={user?.email || "manager@foodnest.com"} disabled className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 focus:outline-none opacity-70 cursor-not-allowed font-mono" />
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Phone Number</label>
                                        <input type="tel" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }} value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors font-mono" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Assignment</h3>
                                
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Current Branch</label>
                                        <input type="text" value={branchForm.name || user?.branchId?.name || restaurant?.name || "Main Branch"} disabled className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-600 dark:text-slate-300 font-semibold cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Role</label>
                                        <input type="text" value="Branch Manager" disabled className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-500 dark:text-slate-400 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Branch Details' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Details</h3>
                                {loadingBranch && <span className="text-xs text-gray-400 font-semibold">Loading branch...</span>}
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Branch Name</label>
                                    <input
                                        type="text"
                                        value={branchForm.name}
                                        onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Address</label>
                                    <textarea
                                        rows="2"
                                        value={branchForm.address}
                                        onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors resize-none"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Opening Time</label>
                                        <input
                                            type="time"
                                            value={branchForm.openingTime}
                                            onChange={(e) => setBranchForm(prev => ({ ...prev, openingTime: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Closing Time</label>
                                        <input
                                            type="time"
                                            value={branchForm.closingTime}
                                            onChange={(e) => setBranchForm(prev => ({ ...prev, closingTime: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleSaveChanges}
                                        disabled={saving}
                                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-sm cursor-pointer disabled:opacity-70"
                                    >
                                        <Save size={16} /> {saving ? 'Saving...' : 'Save Branch Hours'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {activeTab === 'Security' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Change Password</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Current Password</label>
                                    <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))} placeholder="Enter current password" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">New Password</label>
                                    <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="Enter new password" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Confirm New Password</label>
                                    <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Confirm new password" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="pt-2">
                                    <button type="button" onClick={handlePasswordUpdate} disabled={updatingPassword} className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm shadow-md cursor-pointer disabled:opacity-70">
                                        {updatingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ManagerSettings;
