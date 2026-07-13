import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, Bell, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
    const { api } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    
    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        currency: 'USD',
        timezone: 'America/New_York (EST)',
        features: {
            onlineOrdering: true,
            tableReservations: true
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/restaurants/mine');
                if (res.data) {
                    setFormData({
                        name: res.data.name || '',
                        contactEmail: res.data.contactEmail || '',
                        currency: res.data.currency || 'USD',
                        timezone: res.data.timezone || 'America/New_York (EST)',
                        features: {
                            onlineOrdering: res.data.features?.onlineOrdering ?? true,
                            tableReservations: res.data.features?.tableReservations ?? true
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFeatureToggle = (featureName) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [featureName]: !prev.features[featureName]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/restaurants/mine', formData);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>System Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage global preferences and configurations for RestoSys.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="flex flex-col gap-1">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'general' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Store size={18} /> General
                        </button>
                        <button 
                            onClick={() => setActiveTab('payments')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'payments' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <CreditCard size={18} /> Payments & Tax
                        </button>
                        <button 
                            onClick={() => setActiveTab('notifications')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'notifications' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Bell size={18} /> Notifications
                        </button>
                        <button 
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'security' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Lock size={18} /> Security
                        </button>
                    </nav>
                </div>

                {/* Settings Form Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        </div>
                        
                        {activeTab === 'general' && (
                            <>
                                <h3 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>General Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Restaurant Name</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Email</label>
                                        <input 
                                            type="email" 
                                            name="contactEmail"
                                            value={formData.contactEmail}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Currency</label>
                                        <select 
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Timezone</label>
                                        <select 
                                            name="timezone"
                                            value={formData.timezone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                        >
                                            <option value="America/New_York (EST)">America/New_York (EST)</option>
                                            <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                                            <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
                                    <div className="space-y-4">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div>
                                                <p className="font-medium text-sm text-gray-800">Enable Online Ordering</p>
                                                <p className="text-xs text-gray-500">Allow customers to place orders via the customer app.</p>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={formData.features.onlineOrdering}
                                                    onChange={() => handleFeatureToggle('onlineOrdering')}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </div>
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div>
                                                <p className="font-medium text-sm text-gray-800">Table Reservations</p>
                                                <p className="text-xs text-gray-500">Accept advance bookings for dine-in.</p>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={formData.features.tableReservations}
                                                    onChange={() => handleFeatureToggle('tableReservations')}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'payments' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Payments & Tax</h3>
                                <p className="text-gray-500 text-sm">Payment gateway and taxation settings will be configured here.</p>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Notifications</h3>
                                <p className="text-gray-500 text-sm">Email and SMS notification preferences will be configured here.</p>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Security</h3>
                                <p className="text-gray-500 text-sm">Password policies and Two-Factor Authentication (2FA) will be configured here.</p>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-md shadow-green-900/10 disabled:opacity-70"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Save size={16} /> 
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
