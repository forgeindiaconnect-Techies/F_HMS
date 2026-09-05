import { useState, useEffect, useRef } from 'react';
import { Save, Upload, User, ArrowRight, Camera, X, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ThemeSettingCard } from '../../components/ThemeToggle';

const Settings = () => {
    const { api, fetchRestaurant } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [subscription, setSubscription] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const logoInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        phone: '',
        address: ''
    });

    // Build full URL for a logo path from the backend
    const getLogoUrl = (logoPath) => {
        if (!logoPath) return null;
        if (logoPath.startsWith('http') || logoPath.startsWith('data:')) return logoPath;
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        try {
            const origin = new URL(apiBase).origin;
            return `${origin}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
        } catch (e) {
            return logoPath;
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/restaurants/mine');
                if (res.data) {
                    setFormData({
                        name: res.data.name || '',
                        contactEmail: res.data.contactEmail || '',
                        phone: res.data.phone || '',
                        address: res.data.address || ''
                    });
                    setSubscription(res.data.subscription);
                    if (res.data.logo) {
                        setCurrentLogo(getLogoUrl(res.data.logo));
                    }
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [logoBase64, setLogoBase64] = useState(null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Logo must be under 5 MB');
            return;
        }
        setLogoFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoBase64(reader.result);
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const clearLogoSelection = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setLogoBase64(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Send as JSON — the backend accepts logoBase64 as a string in req.body
            const payload = {
                name: formData.name,
                contactEmail: formData.contactEmail,
                phone: formData.phone,
                address: formData.address,
            };
            if (logoBase64) {
                payload.logoBase64 = logoBase64;
            }

            const res = await api.put('/restaurants/mine', payload);

            // Update local preview to the saved logo
            if (res.data?.logo) {
                const savedUrl = getLogoUrl(res.data.logo);
                setCurrentLogo(savedUrl);
                setLogoPreview(null);
                setLogoFile(null);
                setLogoBase64(null);
            }

            // Refresh global restaurant context so sidebar logo updates
            if (fetchRestaurant) await fetchRestaurant();

            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
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

    const displayLogo = logoPreview || currentLogo;

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
                            type="button"
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'profile' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <User size={18} /> Profile
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('appearance')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'appearance' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Sun size={18} /> Appearance & Theme
                        </button>
                    </nav>
                </div>

                {/* Settings Form Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    {activeTab === 'appearance' ? (
                        <div className="space-y-6">
                            <ThemeSettingCard />
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit}>
                        
                        {activeTab === 'profile' && (
                            <>
                                <h3 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile Information</h3>

                                {/* Logo Upload Section */}
                                <div className="mb-8">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Restaurant Logo</label>
                                    <div className="flex items-center gap-5">
                                        {/* Logo Preview */}
                                        <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                            {displayLogo ? (
                                                <>
                                                    <img
                                                        src={displayLogo}
                                                        alt="Restaurant Logo"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                    {logoPreview && (
                                                        <button
                                                            type="button"
                                                            onClick={clearLogoSelection}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow hover:bg-red-600 transition"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <Camera size={28} className="text-gray-300" />
                                            )}
                                        </div>

                                        {/* Upload Controls */}
                                        <div>
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                                                className="hidden"
                                                id="logo-upload"
                                                onChange={handleLogoChange}
                                            />
                                            <label
                                                htmlFor="logo-upload"
                                                className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
                                            >
                                                <Upload size={15} />
                                                {logoPreview ? 'Change Logo' : (currentLogo ? 'Replace Logo' : 'Upload Logo')}
                                            </label>
                                            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WebP or SVG · Max 5 MB</p>
                                            {logoPreview && (
                                                <p className="text-xs text-green-600 mt-1 font-medium">✓ New logo selected — save to apply</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

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
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                        <input 
                                            type="text" 
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                            placeholder="e.g. +1 234 567 890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                                        <input 
                                            type="text" 
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                            placeholder="e.g. 123 Main St, City"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 border-t border-gray-100 pt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Subscription Plan</h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Plan</p>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <p className="text-2xl font-black text-gray-900">{subscription?.plan || 'Basic'}</p>
                                                    {subscription?.status && (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                            subscription.status === 'Active'
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : subscription.status === 'Frozen'
                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                : subscription.status === 'Inactive'
                                                                ? 'bg-gray-100 text-gray-500 border-gray-200'
                                                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                subscription.status === 'Active' ? 'bg-green-500' :
                                                                subscription.status === 'Frozen' ? 'bg-red-500' :
                                                                'bg-gray-400'
                                                            }`}></span>
                                                            {subscription.status}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Dates grid */}
                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {subscription?.billingCycle && (
                                                        <div className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Billing Cycle</p>
                                                            <p className="text-sm font-bold text-gray-700 capitalize">{subscription.billingCycle}</p>
                                                        </div>
                                                    )}
                                                    {subscription?.startDate && (
                                                        <div className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Start Date</p>
                                                            <p className="text-sm font-bold text-gray-700">
                                                                {new Date(subscription.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {subscription?.expiryDate ? (
                                                        <div className={`rounded-lg px-3 py-2.5 border ${
                                                            new Date(subscription.expiryDate) < new Date()
                                                                ? 'bg-red-50 border-red-200'
                                                                : 'bg-white border-gray-100'
                                                        }`}>
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                                                                {new Date(subscription.expiryDate) < new Date() ? '⚠ Expired On' : 'Renews On'}
                                                            </p>
                                                            <p className={`text-sm font-bold ${new Date(subscription.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                                                                {new Date(subscription.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Renews On</p>
                                                            <p className="text-sm font-bold text-gray-400 italic">Not set</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Link to="/admin/billing" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-sm self-start">
                                                Upgrade Plan <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                            </>
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
