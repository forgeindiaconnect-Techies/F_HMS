import { useState } from 'react';
import { Settings, Save, Bell, Lock, User, Store, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeSettingCard } from '../../components/ThemeToggle';

const ManagerSettings = () => {
    const [activeTab, setActiveTab] = useState('My Profile');

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Settings</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Manage local branch preferences, notifications, and profile.</p>
                </div>
                <button onClick={() => toast.success('Saving settings...')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md">
                    <Save size={18} /> Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { name: 'My Profile', icon: User },
                        { name: 'Branch Details', icon: Store },
                        { name: 'Appearance & Theme', icon: Sun },
                        { name: 'Security', icon: Lock },
                    ].map((item, i) => (
                        <button key={i} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${activeTab === item.name ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200'}`}>
                            <item.icon size={18} className={activeTab === item.name ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} /> {item.name}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'Appearance & Theme' && (
                        <ThemeSettingCard />
                    )}
                    
                    {activeTab === 'My Profile' && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile Information</h3>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700">First Name</label>
                                            <input type="text" defaultValue="Sarah" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700">Last Name</label>
                                            <input type="text" defaultValue="Jenkins" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Email Address</label>
                                        <input type="email" defaultValue="sarah.j@restosys.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Phone Number</label>
                                        <input type="tel" defaultValue="+1 (555) 019-2834" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Assignment</h3>
                                
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Current Branch</label>
                                        <input type="text" defaultValue="Downtown Main" disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Role</label>
                                        <input type="text" defaultValue="Branch Manager" disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Branch Details' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Details</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Branch Name</label>
                                    <input type="text" defaultValue="Downtown Main" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Address</label>
                                    <textarea rows="2" defaultValue="123 Main St, Metro City, NY 10001" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors resize-none"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Opening Time</label>
                                        <input type="time" defaultValue="08:00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700">Closing Time</label>
                                        <input type="time" defaultValue="22:00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {activeTab === 'Security' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Change Password</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Current Password</label>
                                    <input type="password" placeholder="Enter current password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">New Password</label>
                                    <input type="password" placeholder="Enter new password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
                                    <input type="password" placeholder="Confirm new password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="pt-2">
                                    <button onClick={() => toast.success('Password updated successfully')} className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm shadow-md">
                                        Update Password
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
