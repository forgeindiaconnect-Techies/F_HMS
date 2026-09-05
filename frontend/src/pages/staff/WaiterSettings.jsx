import { useState } from 'react';
import { Settings, Save, Bell, User, Sun, Sliders, Volume2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeSettingCard } from '../../components/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const WaiterSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Appearance & Theme');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [assignedZone, setAssignedZone] = useState('Zone A - Main Dining Room');

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Waiter Dashboard Settings
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                        Customize appearance, floor notification sounds, and terminal preferences.
                    </p>
                </div>
                <button 
                    onClick={() => toast.success('Settings saved successfully!')} 
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 cursor-pointer"
                >
                    <Save size={18} /> Save Settings
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { name: 'Appearance & Theme', icon: Sun },
                        { name: 'Alerts & Sounds', icon: Bell },
                        { name: 'Floor Station', icon: Sliders },
                        { name: 'My Profile', icon: User },
                    ].map((item) => (
                        <button 
                            key={item.name} 
                            onClick={() => setActiveTab(item.name)} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm cursor-pointer ${
                                activeTab === item.name 
                                ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-xs' 
                                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-850 border border-gray-100 dark:border-slate-800'
                            }`}
                        >
                            <item.icon size={18} className={activeTab === item.name ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} /> 
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Main Settings Content */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Tab 1: Appearance & Theme */}
                    {activeTab === 'Appearance & Theme' && (
                        <ThemeSettingCard />
                    )}

                    {/* Tab 2: Alerts & Sounds */}
                    {activeTab === 'Alerts & Sounds' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-6">
                            <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                    <Volume2 className="text-green-600" size={20} /> POS Alert & Notification Preferences
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    Configure audio chimes and popups for order completion and table assistance.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">Food Ready Audio Chime</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Play chime when kitchen marks order as ready</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={soundEnabled} 
                                        onChange={(e) => setSoundEnabled(e.target.checked)}
                                        className="w-5 h-5 accent-green-600 cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">Live WebSocket Auto-Sync</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Auto-update floor plan and table statuses instantly</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={autoRefresh} 
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                        className="w-5 h-5 accent-green-600 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Floor Station */}
                    {activeTab === 'Floor Station' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Station Assignment</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Preferred Service Zone</label>
                                <select 
                                    value={assignedZone}
                                    onChange={(e) => setAssignedZone(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                >
                                    <option>Zone A - Main Dining Room</option>
                                    <option>Zone B - Patio & Terrace</option>
                                    <option>Zone C - Private VIP Cabanas</option>
                                    <option>Bar & Counter Station</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: My Profile */}
                    {activeTab === 'My Profile' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Waiter Profile Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Full Name</label>
                                    <input type="text" defaultValue={user?.name || "Senior Waiter"} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Role</label>
                                    <input type="text" defaultValue="Floor Server / Captain" disabled className="w-full bg-gray-100 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-gray-500 rounded-xl px-4 py-2 text-sm cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default WaiterSettings;
