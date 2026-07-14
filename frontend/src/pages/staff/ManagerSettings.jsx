import { Settings, Save, Bell, Lock, User, Store } from 'lucide-react';

const ManagerSettings = () => {
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage local branch preferences, notifications, and profile.</p>
                </div>
                <button onClick={() => alert('Saving settings...')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md">
                    <Save size={18} /> Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { name: 'My Profile', icon: User, active: true },
                        { name: 'Branch Details', icon: Store, active: false },
                        { name: 'Notifications', icon: Bell, active: false },
                        { name: 'Security', icon: Lock, active: false },
                    ].map((item, i) => (
                        <button key={i} onClick={() => alert(`Selected ${item.name}`)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${item.active ? 'bg-green-50 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
                            <item.icon size={18} className={item.active ? 'text-green-600' : 'text-gray-400'} /> {item.name}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2 space-y-6">
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
                </div>
            </div>
        </div>
    );
};

export default ManagerSettings;
