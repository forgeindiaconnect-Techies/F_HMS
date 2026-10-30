import { useState, useEffect, useRef } from 'react';
import { 
    Save, Upload, User, ArrowRight, Camera, X, Sun, Key, Lock, Eye, EyeOff, Trash2,
    Sliders, CheckCircle2, Check, Sparkles, Utensils, QrCode, Receipt, Package, Truck, 
    Phone, Wine, Coffee, Flame, ShieldCheck, Zap, Bell, Percent, Users, Award, Store,
    Layers, RefreshCw, CreditCard, Banknote, Heart, Printer, MonitorDot, AlertTriangle, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { ThemeSettingCard } from '../../components/ThemeToggle';
import { getApiUrl } from '../../utils/axiosInstance';

const OUTLET_PRESETS = [
    {
        id: 'Fine Dine & Resto-Bar',
        title: 'Fine Dine & Resto-Bar',
        subtitle: 'Multi-Floor, Table Service & Resto-Bar',
        icon: Wine,
        badge: 'Sit-Down Dining',
        color: 'from-amber-500 to-rose-600',
        borderColor: 'border-amber-300 dark:border-amber-700/60',
        summary: 'Multi-floor zone layout, table captain ordering, course pacing, split bills, and happy hour auto-pricing.',
        config: {
            outletFormat: 'Fine Dine & Resto-Bar',
            tablesEnabled: true,
            qsrCounterMode: false,
            kdsEnabled: true,
            inventoryAutoDeduct: true,
            deliveryFleetEnabled: false,
            loyaltyPointsEnabled: true,
            whatsappPnlAlerts: true,
            happyHoursEnabled: true,
            guestQrOrdering: true,
            serviceChargePercent: 5,
            barcodeScannerEnabled: false,
        }
    },
    {
        id: 'Quick Service (QSR)',
        title: 'QSR & Fast Food',
        subtitle: 'High Velocity, Token Counter & Takeaway',
        icon: Zap,
        badge: 'Rapid Turnover',
        color: 'from-red-500 to-orange-500',
        borderColor: 'border-red-300 dark:border-red-700/60',
        summary: '2-click rapid counter punch, auto-numbered tokens, instant UPI QR display, and parcel packaging fee.',
        config: {
            outletFormat: 'Quick Service (QSR)',
            tablesEnabled: false,
            qsrCounterMode: true,
            kdsEnabled: true,
            inventoryAutoDeduct: true,
            deliveryFleetEnabled: true,
            loyaltyPointsEnabled: true,
            whatsappPnlAlerts: true,
            happyHoursEnabled: false,
            guestQrOrdering: false,
            serviceChargePercent: 0,
            barcodeScannerEnabled: false,
        }
    },
    {
        id: 'Cafe & Bakery',
        title: 'Cafe & Bakery',
        subtitle: 'Barista Counter, Desserts & Cozy Dining',
        icon: Coffee,
        badge: 'Specialty Roastery',
        color: 'from-amber-600 to-yellow-600',
        borderColor: 'border-amber-300 dark:border-amber-700/60',
        summary: 'Hybrid counter + table orders, barista beverage KDS station, bakery batch tracking, and stamp loyalty.',
        config: {
            outletFormat: 'Cafe & Bakery',
            tablesEnabled: true,
            qsrCounterMode: true,
            kdsEnabled: true,
            inventoryAutoDeduct: true,
            deliveryFleetEnabled: true,
            loyaltyPointsEnabled: true,
            whatsappPnlAlerts: true,
            happyHoursEnabled: true,
            guestQrOrdering: true,
            serviceChargePercent: 0,
            barcodeScannerEnabled: false,
        }
    },
    {
        id: 'Cloud Kitchen',
        title: 'Cloud Kitchen Hub',
        icon: Flame,
        subtitle: '100% Delivery Dispatch & Ghost Kitchen',
        badge: 'Delivery-Only',
        color: 'from-purple-600 to-indigo-600',
        borderColor: 'border-purple-300 dark:border-purple-700/60',
        summary: 'Multi-brand routing, direct website orders, in-house rider dispatch, packing timers, and automated stock-out.',
        config: {
            outletFormat: 'Cloud Kitchen',
            tablesEnabled: false,
            qsrCounterMode: false,
            kdsEnabled: true,
            inventoryAutoDeduct: true,
            deliveryFleetEnabled: true,
            loyaltyPointsEnabled: true,
            whatsappPnlAlerts: true,
            happyHoursEnabled: false,
            guestQrOrdering: false,
            serviceChargePercent: 0,
            barcodeScannerEnabled: false,
        }
    },
    {
        id: 'Pub & Brewery',
        title: 'Pub & Microbrewery',
        subtitle: 'Bar Tabs, Draught Kegs & Alcohol Tax',
        icon: Wine,
        badge: 'Bar & Lounge',
        color: 'from-blue-600 to-indigo-700',
        borderColor: 'border-blue-300 dark:border-blue-700/60',
        summary: 'Open bar tab management, dedicated Bar KDS, automated Happy Hour keg pricing, and deck/rooftop zones.',
        config: {
            outletFormat: 'Pub & Brewery',
            tablesEnabled: true,
            qsrCounterMode: false,
            kdsEnabled: true,
            inventoryAutoDeduct: true,
            deliveryFleetEnabled: false,
            loyaltyPointsEnabled: true,
            whatsappPnlAlerts: true,
            happyHoursEnabled: true,
            guestQrOrdering: true,
            serviceChargePercent: 10,
            barcodeScannerEnabled: false,
        }
    },
    {
        id: 'Sweet Shop & Retail Counter',
        title: 'Sweet Shop & Retail',
        subtitle: 'Weighing Scale, Mithai & Barcode POS',
        icon: Package,
        badge: 'Counter Sales',
        color: 'from-pink-500 to-rose-600',
        borderColor: 'border-pink-300 dark:border-pink-700/60',
        summary: 'Barcode scanning, weight-based pricing (per 250g / 500g / 1kg), speed-grid billing, and batch expiration.',
        config: {
            outletFormat: 'Sweet Shop & Retail Counter',
            tablesEnabled: false,
            qsrCounterMode: true,
            kdsEnabled: false,
            inventoryAutoDeduct: true,
            deliveryFleetEnabled: false,
            loyaltyPointsEnabled: true,
            whatsappPnlAlerts: true,
            happyHoursEnabled: false,
            guestQrOrdering: false,
            serviceChargePercent: 0,
            barcodeScannerEnabled: true,
        }
    }
];

const Settings = () => {
    const { api, fetchRestaurant } = useAuth();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'operations';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [subscription, setSubscription] = useState(null);
    const [planName, setPlanName] = useState('Basic');
    const [planFeatures, setPlanFeatures] = useState([]);
    const [logoPreview, setLogoPreview] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const logoInputRef = useRef(null);

    // Restaurant-Specific Operational Configuration
    const [restConfig, setRestConfig] = useState({
        kitchenMode: 'KDS',
        orderKitchen: { kitchenMode: 'KDS', kotEnabled: true, kdsEnabled: true, kotPrintEnabled: true },
        waiterTips: { enabled: true, allowCustomerTips: true, tipPercentages: [5, 10, 15, 20], customTipAllowed: true },
        qrOrdering: { enabled: true, allowSelfDineIn: true, allowWaiterOrdering: true },
        paymentMethods: { cash: true, upi: true, card: true, onlineGateway: true },
        setupWizardCompleted: false,
        setupStep: 1
    });
    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const handleSaveRestaurantConfig = async () => {
        const pm = restConfig.paymentMethods || {};
        if (!pm.cash && !pm.upi && !pm.card && !pm.onlineGateway) {
            toast.error('At least one payment method (Cash, UPI, Card, or Online Gateway) must remain enabled.');
            return;
        }

        setSavingConfig(true);
        try {
            const res = await api.put('/restaurants/mine/config', restConfig);
            toast.success('Restaurant operational configuration saved successfully!');
            if (res.data?.config) {
                setRestConfig(res.data.config);
            }
            if (fetchRestaurant) await fetchRestaurant();
        } catch (error) {
            console.error('Failed to save restaurant configuration', error);
            const msg = error.response?.data?.message || 'Failed to save configuration';
            toast.error(msg);
        } finally {
            setSavingConfig(false);
        }
    };

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        phone: '',
        address: ''
    });

    // POS & Outlet Operational Topics Configuration
    const [posConfig, setPosConfig] = useState({
        outletFormat: 'Fine Dine & Resto-Bar',
        tablesEnabled: true,
        qsrCounterMode: false,
        kdsEnabled: true,
        inventoryAutoDeduct: true,
        deliveryFleetEnabled: false,
        loyaltyPointsEnabled: true,
        whatsappPnlAlerts: true,
        happyHoursEnabled: true,
        serviceChargePercent: 5,
        barcodeScannerEnabled: false,
        guestQrOrdering: true
    });
    const [savingPos, setSavingPos] = useState(false);

    const handleSavePosConfig = async (overrideConfig) => {
        const configToSave = overrideConfig || posConfig;
        setSavingPos(true);
        try {
            await api.put('/restaurants/mine', { posConfig: configToSave });
            localStorage.setItem('restosys_pos_outlet_customization', JSON.stringify(configToSave));
            window.dispatchEvent(new CustomEvent('posConfigUpdated', { detail: configToSave }));
            if (fetchRestaurant) await fetchRestaurant();
            toast.success(`POS customized successfully for "${configToSave.outletFormat}"!`);
        } catch (error) {
            console.error('Failed to save POS customization', error);
            localStorage.setItem('restosys_pos_outlet_customization', JSON.stringify(configToSave));
            toast.success(`Customization saved locally for "${configToSave.outletFormat}"!`);
        } finally {
            setSavingPos(false);
        }
    };

    const handleApplyPreset = (preset) => {
        setPosConfig(preset.config);
        handleSavePosConfig(preset.config);
    };

    const handleToggleTopic = (topicKey) => {
        setPosConfig(prev => ({
            ...prev,
            [topicKey]: !prev[topicKey]
        }));
    };

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }
        setChangingPassword(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    // Build full URL for a logo path from the backend
    const getLogoUrl = (logoPath) => {
        if (!logoPath) return null;
        if (logoPath.startsWith('http') || logoPath.startsWith('data:')) return logoPath;
        const apiBase = getApiUrl();
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
                // Check local storage fallback first
                const savedLocal = localStorage.getItem('restosys_pos_outlet_customization');
                if (savedLocal) {
                    try { 
                        setPosConfig(prev => ({ ...prev, ...JSON.parse(savedLocal) })); 
                    } catch (e) {}
                }

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
                    if (res.data.posConfig) {
                        setPosConfig(res.data.posConfig);
                        localStorage.setItem('restosys_pos_outlet_customization', JSON.stringify(res.data.posConfig));
                    }
                    if (res.data.restaurantConfig) {
                        setRestConfig(prev => ({ ...prev, ...res.data.restaurantConfig }));
                    }
                }

                try {
                    const cfgRes = await api.get('/restaurants/mine/config');
                    if (cfgRes.data?.config) {
                        setRestConfig(cfgRes.data.config);
                    }
                    if (cfgRes.data?.planName) {
                        setPlanName(cfgRes.data.planName);
                    }
                    if (cfgRes.data?.planFeatures) {
                        setPlanFeatures(cfgRes.data.planFeatures);
                    }
                } catch (cfgErr) {
                    console.warn('Could not fetch operational config via dedicated endpoint', cfgErr);
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
        setRemoveLogo(false);
        
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

    const handleRemoveLogo = () => {
        clearLogoSelection();
        setCurrentLogo(null);
        setRemoveLogo(true);
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
            if (removeLogo) {
                payload.removeLogo = true;
            } else if (logoBase64) {
                payload.logoBase64 = logoBase64;
            }

            const res = await api.put('/restaurants/mine', payload);

            // Update local preview to the saved logo
            if (res.data?.logo) {
                const savedUrl = getLogoUrl(res.data.logo);
                setCurrentLogo(savedUrl);
            } else {
                setCurrentLogo(null);
            }
            setLogoPreview(null);
            setLogoFile(null);
            setLogoBase64(null);
            setRemoveLogo(false);

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
                <p className="text-gray-500 text-sm mt-1">Manage global preferences and configurations for FoodNest.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="flex flex-col gap-1">
                        <button 
                            type="button"
                            onClick={() => setActiveTab('operations')}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all text-sm ${activeTab === 'operations' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Sparkles size={18} className={activeTab === 'operations' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'} />
                                <span>Restaurant Settings</span>
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white tracking-wider">Operations</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'profile' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <User size={18} /> Profile
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('pos-customization')}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all text-sm ${activeTab === 'pos-customization' ? 'bg-gradient-to-r from-rose-50 to-orange-50 text-rose-700 font-bold border border-rose-200 shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Sliders size={18} className={activeTab === 'pos-customization' ? 'text-rose-600' : 'text-gray-500'} />
                                <span>POS &amp; Outlet Customizer</span>
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white tracking-wider">Customizer</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('appearance')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'appearance' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Sun size={18} /> Appearance & Theme
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm ${activeTab === 'security' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Lock size={18} /> Security & Password
                        </button>
                    </nav>
                </div>

                {/* Settings Form Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:p-8">
                    {activeTab === 'operations' ? (
                        <div className="space-y-8 min-w-0 pr-1.5 flex-1">
                            {/* Top Banner with Setup Wizard Launch CTA */}
                            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-md border border-emerald-800/60 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                            <Sparkles size={13} className="text-emerald-400" />
                                            <span>Restaurant-Specific Operational Engine</span>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-emerald-200 border border-white/10">
                                            Plan: {planName}
                                        </span>
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        Restaurant Operations &amp; Feature Controls
                                    </h3>
                                    <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                                        Tailor your live kitchen workflows, waiter tip ledger, customer QR dining options, and checkout payment tenders. Disabled features are instantly hidden from staff and customer screens.
                                    </p>

                                    {/* Setup Wizard Bar */}
                                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                                            <CheckCircle2 size={16} className={restConfig.setupWizardCompleted ? 'text-emerald-400' : 'text-amber-400'} />
                                            <span>
                                                {restConfig.setupWizardCompleted 
                                                    ? 'Initial 6-Step Setup Wizard Completed' 
                                                    : 'Setup Wizard Pending: Complete guided configuration'}
                                            </span>
                                        </div>
                                        <Link 
                                            to="/admin/setup-wizard" 
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
                                        >
                                            <Sparkles size={14} /> Launch 6-Step Setup Wizard
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Section A: Order and Kitchen Settings */}
                            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                                            <Utensils size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                                A. Order &amp; Kitchen Settings
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                Configure Kitchen Order Tickets (KOT), Digital Kitchen Display (KDS), and thermal ticket printing.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900">
                                        Mode: {(restConfig.orderKitchen?.kitchenMode === 'KOT_ONLY' || restConfig.kitchenMode === 'KOT_ONLY' || restConfig.orderKitchen?.kdsEnabled === false) ? 'Printed KOT Only (No KDS)' : 'Digital KDS (Interactive Screen)'}
                                    </span>
                                </div>

                                {/* Kitchen Operating Mode Selection Cards */}
                                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div>
                                        <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                            <Utensils size={16} className="text-orange-500" /> Kitchen Operating Workflow
                                        </h5>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                            Choose how kitchen food preparation is tracked and managed across your restaurant.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {/* KDS Option */}
                                        <div 
                                            onClick={() => {
                                                if (planName === 'Basic') {
                                                    toast.error('Digital KDS requires a Pro or Enterprise subscription. Please upgrade your plan.');
                                                    return;
                                                }
                                                setRestConfig(prev => ({
                                                    ...prev,
                                                    kitchenMode: 'KDS',
                                                    orderKitchen: {
                                                        ...prev.orderKitchen,
                                                        kitchenMode: 'KDS',
                                                        kdsEnabled: true,
                                                        kotEnabled: true
                                                    }
                                                }));
                                            }}
                                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                                (restConfig.orderKitchen?.kitchenMode !== 'KOT_ONLY' && restConfig.kitchenMode !== 'KOT_ONLY' && restConfig.orderKitchen?.kdsEnabled !== false)
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <MonitorDot size={18} className="text-blue-600" />
                                                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">Kitchen Display System (KDS)</span>
                                                </div>
                                                {(restConfig.orderKitchen?.kitchenMode !== 'KOT_ONLY' && restConfig.kitchenMode !== 'KOT_ONLY' && restConfig.orderKitchen?.kdsEnabled !== false) && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                Digital kitchen screen for chefs. Kitchen staff track active orders, timers, and advance cooking stages on display.
                                            </p>
                                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                                Digital Kitchen Screen Active
                                            </span>
                                        </div>

                                        {/* KOT Only Option */}
                                        <div 
                                            onClick={() => {
                                                setRestConfig(prev => ({
                                                    ...prev,
                                                    kitchenMode: 'KOT_ONLY',
                                                    orderKitchen: {
                                                        ...prev.orderKitchen,
                                                        kitchenMode: 'KOT_ONLY',
                                                        kotEnabled: true,
                                                        kotPrintEnabled: true,
                                                        kdsEnabled: false
                                                    }
                                                }));
                                            }}
                                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                                (restConfig.orderKitchen?.kitchenMode === 'KOT_ONLY' || restConfig.kitchenMode === 'KOT_ONLY' || restConfig.orderKitchen?.kdsEnabled === false)
                                                    ? 'border-orange-600 bg-orange-50/50 dark:bg-orange-950/30'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Printer size={18} className="text-orange-600" />
                                                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">KOT Printing Only</span>
                                                </div>
                                                {(restConfig.orderKitchen?.kitchenMode === 'KOT_ONLY' || restConfig.kitchenMode === 'KOT_ONLY' || restConfig.orderKitchen?.kdsEnabled === false) && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                Physical printed Kitchen Order Tickets without kitchen screens. Waiters or managers update order statuses from the floor.
                                            </p>
                                            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                                                Floor Waiter Controls Active
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* KOT Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Receipt size={16} className="text-orange-500" /> KOT System
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Generates sequential kitchen order tickets (e.g. KOT-001) for food preparation.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={restConfig.orderKitchen?.kotEnabled !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        orderKitchen: { ...prev.orderKitchen, kotEnabled: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                            </label>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.orderKitchen?.kotEnabled !== false ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {restConfig.orderKitchen?.kotEnabled !== false ? 'Enabled' : 'Disabled (Hidden from Chef)'}
                                        </span>
                                    </div>

                                    {/* KDS Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <MonitorDot size={16} className="text-blue-500" /> Digital KDS
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Live interactive kitchen display screens with timers and cooking stations.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={restConfig.orderKitchen?.kdsEnabled !== false}
                                                    onChange={(e) => {
                                                        const newVal = e.target.checked;
                                                        if (newVal && planName === 'Basic') {
                                                            toast.error('Digital KDS requires a Pro or Enterprise subscription. Please upgrade your plan.');
                                                            return;
                                                        }
                                                        setRestConfig(prev => ({
                                                            ...prev,
                                                            orderKitchen: { ...prev.orderKitchen, kdsEnabled: newVal }
                                                        }));
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.orderKitchen?.kdsEnabled !== false ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {restConfig.orderKitchen?.kdsEnabled !== false ? 'Enabled' : 'Disabled (Hidden from Chef)'}
                                            </span>
                                            {planName === 'Basic' && (
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Requires Pro</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* KOT Printing Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Printer size={16} className="text-emerald-500" /> KOT Thermal Print
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Instant 80mm ESC/POS kitchen thermal printing on order submission.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={restConfig.orderKitchen?.kotPrintEnabled !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        orderKitchen: { ...prev.orderKitchen, kotPrintEnabled: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                            </label>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.orderKitchen?.kotPrintEnabled !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {restConfig.orderKitchen?.kotPrintEnabled !== false ? 'Printing Active' : 'Digital Only'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Waiter Tips Settings */}
                            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center shrink-0">
                                            <Heart size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                                B. Waiter Tips &amp; Gratuity System
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                Enable waiter gratuity tracking, customer tip selection, and date-wise settlement reports.
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/admin/tips"
                                        className="text-xs font-bold text-pink-700 dark:text-pink-400 hover:underline flex items-center gap-1.5"
                                    >
                                        <Receipt size={14} /> View Tip Ledger &amp; Reports &rarr;
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Enable Waiter Tips Master Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    Enable Waiter Tips
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    When enabled, shows the Tips section in the Waiter Dashboard &amp; tracks shift gratuity.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={restConfig.waiterTips?.enabled !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        waiterTips: { ...prev.waiterTips, enabled: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                            </label>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.waiterTips?.enabled !== false ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {restConfig.waiterTips?.enabled !== false ? 'Tips Active' : 'Hidden from Waiter Desk'}
                                        </span>
                                    </div>

                                    {/* Customer Tip Collection Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    Customer Tip Collection
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Displays tip options during customer QR ordering &amp; mobile checkout.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    disabled={restConfig.waiterTips?.enabled === false}
                                                    checked={restConfig.waiterTips?.enabled !== false && restConfig.waiterTips?.allowCustomerTips !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        waiterTips: { ...prev.waiterTips, allowCustomerTips: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="text-[11px] text-gray-500 font-bold">Preset Chips:</span>
                                            {[5, 10, 15, 20].map(pct => (
                                                <span key={pct} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300">
                                                    {pct}%
                                                </span>
                                            ))}
                                            <span className="text-[10px] text-pink-600 font-bold ml-auto">+ Custom ₹</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C: QR Ordering and Service Mode Settings */}
                            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                                        <QrCode size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                            C. QR Ordering &amp; Service Modes
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            Control customer smartphone QR menu access, Self Dine-in (KFC style), and Waiter Table ordering.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Master QR Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    QR Ordering
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Master switch. If disabled, customers scanning table QR codes cannot place orders.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={restConfig.qrOrdering?.enabled !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        qrOrdering: { ...prev.qrOrdering, enabled: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.qrOrdering?.enabled !== false ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300'}`}>
                                            {restConfig.qrOrdering?.enabled !== false ? 'Active' : 'Customer QR Inactive'}
                                        </span>
                                    </div>

                                    {/* Self Dine-in Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    Self Dine-in Mode
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    KFC style: Customer orders at table, food prepared for pickup at counter.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    disabled={restConfig.qrOrdering?.enabled === false}
                                                    checked={restConfig.qrOrdering?.enabled !== false && restConfig.qrOrdering?.allowSelfDineIn !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        qrOrdering: { ...prev.qrOrdering, allowSelfDineIn: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.qrOrdering?.allowSelfDineIn !== false ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {restConfig.qrOrdering?.allowSelfDineIn !== false ? 'Self Pickup Shown' : 'Hidden on QR'}
                                        </span>
                                    </div>

                                    {/* Waiter Ordering Toggle */}
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    Waiter Table Service
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Sit-down service: Orders are dispatched to assigned table captains &amp; floor waiters.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                                <input 
                                                    type="checkbox" 
                                                    disabled={restConfig.qrOrdering?.enabled === false}
                                                    checked={restConfig.qrOrdering?.enabled !== false && restConfig.qrOrdering?.allowWaiterOrdering !== false}
                                                    onChange={(e) => setRestConfig(prev => ({
                                                        ...prev,
                                                        qrOrdering: { ...prev.qrOrdering, allowWaiterOrdering: e.target.checked }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${restConfig.qrOrdering?.allowWaiterOrdering !== false ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {restConfig.qrOrdering?.allowWaiterOrdering !== false ? 'Waiter Service Shown' : 'Hidden on QR'}
                                        </span>
                                    </div>
                                </div>

                                {/* Simulated Customer QR Experience */}
                                <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/60 flex items-center gap-3">
                                    <HelpCircle size={18} className="text-purple-600 shrink-0" />
                                    <p className="text-xs text-purple-900 dark:text-purple-200">
                                        <strong>Customer Experience on Table QR Scan: </strong>
                                        {restConfig.qrOrdering?.enabled === false ? (
                                            <span className="text-rose-600 font-bold">QR orders are completely disabled. Customers see a &quot;QR Ordering Disabled&quot; notice.</span>
                                        ) : (restConfig.qrOrdering?.allowSelfDineIn !== false && restConfig.qrOrdering?.allowWaiterOrdering !== false) ? (
                                            <span>Customers are prompted with 2 cards to choose either <strong>Self Dine-In (KFC Style)</strong> or <strong>Waiter Table Service</strong>.</span>
                                        ) : (restConfig.qrOrdering?.allowSelfDineIn !== false) ? (
                                            <span>Customers are directly routed into <strong>Self Dine-in</strong> ordering.</span>
                                        ) : (restConfig.qrOrdering?.allowWaiterOrdering !== false) ? (
                                            <span>Customers are directly routed into <strong>Waiter Table Service</strong>.</span>
                                        ) : (
                                            <span className="text-amber-600 font-bold">Both service modes are disabled. Customers will be unable to submit orders.</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Section D: Payment Methods Configuration */}
                            <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                                D. Payment Methods Configuration
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                Enable or disable payment tenders accepted at cashier checkout and customer QR billing.
                                            </p>
                                        </div>
                                    </div>
                                    {(!restConfig.paymentMethods?.cash && !restConfig.paymentMethods?.upi && !restConfig.paymentMethods?.card && !restConfig.paymentMethods?.onlineGateway) && (
                                        <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-lg border border-rose-300">
                                            &times; At least one payment method required!
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Cash */}
                                    <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${restConfig.paymentMethods?.cash !== false ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xs' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                                                <Banknote size={18} />
                                            </div>
                                            <input 
                                                type="checkbox"
                                                checked={restConfig.paymentMethods?.cash !== false}
                                                onChange={(e) => setRestConfig(prev => ({
                                                    ...prev,
                                                    paymentMethods: { ...prev.paymentMethods, cash: e.target.checked }
                                                }))}
                                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-gray-900 dark:text-white block">Cash Tender</span>
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">Physical currency counter settlement.</span>
                                        </div>
                                    </label>

                                    {/* UPI */}
                                    <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${restConfig.paymentMethods?.upi !== false ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xs' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                                <QrCode size={18} />
                                            </div>
                                            <input 
                                                type="checkbox"
                                                checked={restConfig.paymentMethods?.upi !== false}
                                                onChange={(e) => setRestConfig(prev => ({
                                                    ...prev,
                                                    paymentMethods: { ...prev.paymentMethods, upi: e.target.checked }
                                                }))}
                                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-gray-900 dark:text-white block">UPI / QR Code</span>
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">Instant GPay, PhonePe, Paytm QR scans.</span>
                                        </div>
                                    </label>

                                    {/* Card */}
                                    <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${restConfig.paymentMethods?.card !== false ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xs' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                                                <CreditCard size={18} />
                                            </div>
                                            <input 
                                                type="checkbox"
                                                checked={restConfig.paymentMethods?.card !== false}
                                                onChange={(e) => setRestConfig(prev => ({
                                                    ...prev,
                                                    paymentMethods: { ...prev.paymentMethods, card: e.target.checked }
                                                }))}
                                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-gray-900 dark:text-white block">Credit / Debit Card</span>
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">POS EDC swipe / chip terminal.</span>
                                        </div>
                                    </label>

                                    {/* Online Payment Gateway */}
                                    <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${restConfig.paymentMethods?.onlineGateway !== false ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xs' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                                                <Zap size={18} />
                                            </div>
                                            <input 
                                                type="checkbox"
                                                checked={restConfig.paymentMethods?.onlineGateway !== false}
                                                onChange={(e) => setRestConfig(prev => ({
                                                    ...prev,
                                                    paymentMethods: { ...prev.paymentMethods, onlineGateway: e.target.checked }
                                                }))}
                                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-gray-900 dark:text-white block">Online Gateway</span>
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">Razorpay / Stripe customer mobile checkout.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Save Action Footer */}
                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                    <span>Saved settings persist to your restaurant record and apply immediately across all staff dashboards.</span>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRestConfig({
                                                orderKitchen: { kotEnabled: true, kdsEnabled: true, kotPrintEnabled: true },
                                                waiterTips: { enabled: true, allowCustomerTips: true, tipPercentages: [5, 10, 15, 20], customTipAllowed: true },
                                                qrOrdering: { enabled: true, allowSelfDineIn: true, allowWaiterOrdering: true },
                                                paymentMethods: { cash: true, upi: true, card: true, onlineGateway: true },
                                                setupWizardCompleted: true,
                                                setupStep: 6
                                            });
                                            toast.success('Reset form to recommended settings');
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Recommended Defaults
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveRestaurantConfig}
                                        disabled={savingConfig}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-900/10 cursor-pointer disabled:opacity-70 flex-1 sm:flex-none"
                                    >
                                        {savingConfig ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        Save Restaurant Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'pos-customization' ? (
                        <div className="space-y-8 min-w-0 pr-1.5 flex-1">
                            {/* Header Banner */}
                            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-rose-950 text-white p-6 sm:p-7 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                                <div className="relative z-10 space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                                        <Sparkles size={13} className="text-rose-400" />
                                        <span>POS Topic Tailoring &amp; Preset Manager</span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        POS &amp; Outlet Format Customizer
                                    </h3>
                                    <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                                        Tailor your individual staff &amp; admin dashboards (Billing Terminal, Tables &amp; Floor Maps, KDS Kitchen screens, Inventory BOM, Direct Delivery Fleet, CRM Loyalty) to match the exact operational workflow chosen during your 1-on-1 walkthrough.
                                    </p>
                                    
                                    <div className="pt-3 flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Active Preset: <span className="font-black text-emerald-300 underline decoration-emerald-400/50 underline-offset-2">{posConfig.outletFormat}</span>
                                        </div>
                                        <div className="text-slate-400 text-xs flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-emerald-400" />
                                            <span>Real-time persistence across all staff logins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Choose 1-Click Outlet Format Preset */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Store size={18} className="text-rose-500" />
                                            Select Outlet Format Preset (From Walkthrough)
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Click any card to auto-configure all 8 operational topics to industry-standard benchmarks in 1 click.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {OUTLET_PRESETS.map((preset) => {
                                        const isSelected = posConfig.outletFormat === preset.id;
                                        const IconComp = preset.icon;
                                        return (
                                            <div 
                                                key={preset.id}
                                                className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                                    isSelected 
                                                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-400 dark:border-rose-600 shadow-md ring-2 ring-rose-400/20' 
                                                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-xs'
                                                }`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${preset.color} text-white flex items-center justify-center shadow-sm shrink-0`}>
                                                            <IconComp size={20} />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                            isSelected ? 'bg-rose-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
                                                        }`}>
                                                            {preset.badge}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {preset.title}
                                                        </h5>
                                                        <p className="text-[11px] text-gray-500 font-medium">
                                                            {preset.subtitle}
                                                        </p>
                                                    </div>

                                                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                                                        {preset.summary}
                                                    </p>
                                                </div>

                                                <div className="pt-4 mt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                                                    {isSelected ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                                            <CheckCircle2 size={16} /> Currently Applied
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Preset Available</span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyPreset(preset)}
                                                        disabled={savingPos}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                            isSelected 
                                                            ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700' 
                                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {isSelected ? 'Re-Apply Preset' : '1-Click Apply'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 2: Deep-Dive Operational Topics Customization */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <div>
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Sliders size={18} className="text-rose-500" />
                                        Granular Topic Customizations
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Fine-tune individual features across Billing, Floor Management, Kitchen KDS, Inventory, and Delivery to fit your exact store needs.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Topic 1: Floor & Table Management */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                                                <Utensils size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 1: Floor &amp; Table Management</h5>
                                                <p className="text-[11px] text-gray-500">Seating maps, floor zones, table merges &amp; QR dine-in</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Multi-Floor Seating Map &amp; Zones</span>
                                                    <span className="text-[11px] text-gray-400 block">Enables live AC dining, Rooftop, Garden &amp; Bar table layouts.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.tablesEnabled} 
                                                    onChange={() => handleToggleTopic('tablesEnabled')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>

                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Tabletop QR Digital Ordering</span>
                                                    <span className="text-[11px] text-gray-400 block">Guests scan table QR code to browse &amp; place orders directly.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.guestQrOrdering} 
                                                    onChange={() => handleToggleTopic('guestQrOrdering')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Topic 2: Billing & Counter Terminal Speed */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                                                <Receipt size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 2: Billing &amp; Counter Speed Mode</h5>
                                                <p className="text-[11px] text-gray-500">2-click rapid counter punch, service charges &amp; barcode support</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">2-Click Rapid Counter Punch (QSR Mode)</span>
                                                    <span className="text-[11px] text-gray-400 block">Skips table selection to punch orders directly to invoice.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.qsrCounterMode} 
                                                    onChange={() => handleToggleTopic('qsrCounterMode')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>

                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Barcode Scanner &amp; Weighing Integration</span>
                                                    <span className="text-[11px] text-gray-400 block">Instant scanner input for sweets, bakeries &amp; retail items.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.barcodeScannerEnabled} 
                                                    onChange={() => handleToggleTopic('barcodeScannerEnabled')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>

                                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
                                                <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Default Service Charge (%)</span>
                                                <select 
                                                    value={posConfig.serviceChargePercent}
                                                    onChange={(e) => setPosConfig(prev => ({ ...prev, serviceChargePercent: Number(e.target.value) }))}
                                                    className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-white"
                                                >
                                                    <option value={0}>0% (No charge)</option>
                                                    <option value={5}>5% (Standard)</option>
                                                    <option value={10}>10% (Fine-Dine/Bar)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Topic 3: Kitchen Display System (KDS) */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
                                                <Flame size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 3: Kitchen Display System (KDS)</h5>
                                                <p className="text-[11px] text-gray-500">Live KOT tickets, prep timers &amp; station routing</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Multi-Station KDS Screen Routing</span>
                                                    <span className="text-[11px] text-gray-400 block">Routes drinks to Bar, steaks to Grill &amp; mains to Hot Kitchen.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.kdsEnabled} 
                                                    onChange={() => handleToggleTopic('kdsEnabled')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Topic 4: Inventory & Recipe Auto-Depletion */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 4: Inventory &amp; Recipe BOM</h5>
                                                <p className="text-[11px] text-gray-500">Auto ingredient deduction, stock-out prevention &amp; POs</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Auto-Deplete Ingredients on Billing</span>
                                                    <span className="text-[11px] text-gray-400 block">Subtracts cheese, patties &amp; veggies using recipe proportions.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.inventoryAutoDeduct} 
                                                    onChange={() => handleToggleTopic('inventoryAutoDeduct')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Topic 5: Direct Delivery & Fleet Dispatch */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Truck size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 5: Direct Delivery &amp; Fleet Dispatch</h5>
                                                <p className="text-[11px] text-gray-500">In-house rider assignment, radius fees &amp; map dispatch</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">In-House Rider Dispatch &amp; Tracking</span>
                                                    <span className="text-[11px] text-gray-400 block">Enables delivery dashboard with rider assignment and live map.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.deliveryFleetEnabled} 
                                                    onChange={() => handleToggleTopic('deliveryFleetEnabled')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Topic 6: Customer Loyalty & CRM */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                                                <Award size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 6: Customer Loyalty &amp; CRM</h5>
                                                <p className="text-[11px] text-gray-500">Spend-to-coins rewards, tiers &amp; repeat guest perks</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Spend-to-Coins Loyalty Engine</span>
                                                    <span className="text-[11px] text-gray-400 block">Automatically credits loyalty points per bill to drive repeat orders.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.loyaltyPointsEnabled} 
                                                    onChange={() => handleToggleTopic('loyaltyPointsEnabled')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Topic 7: WhatsApp Automated Owner Business Pulse */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 7: WhatsApp Automated Owner Alerts</h5>
                                                <p className="text-[11px] text-gray-500">Real-time KOT alerts, void warnings &amp; 11 PM P&amp;L summary</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Instant WhatsApp Pulse Alerts &amp; Nightly P&amp;L</span>
                                                    <span className="text-[11px] text-gray-400 block">Dispatches sound chimes and automated WhatsApp summaries to owner phone.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.whatsappPnlAlerts} 
                                                    onChange={() => handleToggleTopic('whatsappPnlAlerts')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Topic 8: Dynamic Pricing & Happy Hours */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                                                <Percent size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Topic 8: Dynamic Pricing &amp; Happy Hours</h5>
                                                <p className="text-[11px] text-gray-500">Automated discounts for happy hour drinks &amp; weekday specials</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 block">Happy Hours &amp; Dynamic Slot Discounts</span>
                                                    <span className="text-[11px] text-gray-400 block">Applies configured % discount automatically during active happy hour times.</span>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={posConfig.happyHoursEnabled} 
                                                    onChange={() => handleToggleTopic('happyHoursEnabled')}
                                                    className="mt-1 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Action Footer */}
                            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <CheckCircle2 size={15} className="text-emerald-500" />
                                    <span>Changes will immediately apply to Cashier POS, Tables, KDS and Admin consoles.</span>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const defaultPreset = OUTLET_PRESETS.find(p => p.id === posConfig.outletFormat) || OUTLET_PRESETS[0];
                                            setPosConfig(defaultPreset.config);
                                            toast.success('Reset to format defaults');
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                                    >
                                        Reset to Defaults
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSavePosConfig()}
                                        disabled={savingPos}
                                        className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-rose-900/10 cursor-pointer disabled:opacity-70 flex-1 sm:flex-none"
                                    >
                                        {savingPos ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        Save POS Customizations
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'appearance' ? (
                        <div className="space-y-6 min-w-0 pr-1.5 flex-1">
                            <ThemeSettingCard />
                        </div>
                    ) : activeTab === 'security' ? (
                        <form onSubmit={handlePasswordChangeSubmit} className="space-y-6 min-w-0 pr-1.5 flex-1">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Change Account Password</h3>
                                <p className="text-gray-500 text-xs">Update your login password securely for your admin account.</p>
                            </div>

                            <div className="space-y-4 max-w-md pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Current Password <span className="text-gray-400 font-normal text-xs">(Leave blank if forgotten)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            placeholder="Enter current password or leave blank"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            required
                                            minLength={6}
                                            placeholder="Enter new password (min. 6 characters)"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        required
                                        placeholder="Re-enter new password"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-md shadow-green-900/10 disabled:opacity-70"
                                >
                                    {changingPassword ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Key size={16} />
                                    )}
                                    Update Password
                                </button>
                            </div>
                        </form>
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

                                        {/* Upload & Remove Controls */}
                                        <div>
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                                                className="hidden"
                                                id="logo-upload"
                                                onChange={handleLogoChange}
                                            />
                                            <div className="flex items-center gap-2">
                                                <label
                                                    htmlFor="logo-upload"
                                                    className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
                                                >
                                                    <Upload size={15} />
                                                    {logoPreview ? 'Change Logo' : (currentLogo ? 'Replace Logo' : 'Upload Logo')}
                                                </label>
                                                {(currentLogo || logoPreview) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm px-3.5 py-2.5 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={15} />
                                                        Remove Logo
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WebP or SVG · Max 5 MB</p>
                                            {logoPreview && (
                                                <p className="text-xs text-green-600 mt-1 font-medium">✓ New logo selected — click Save Settings to apply</p>
                                            )}
                                            {removeLogo && (
                                                <p className="text-xs text-red-600 mt-1 font-medium">✓ Logo will be removed — click Save Settings to apply</p>
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
