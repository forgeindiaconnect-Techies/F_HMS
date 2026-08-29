import { useState, useEffect } from 'react';
import { 
    Truck, Plus, Search, Check, X, ShieldAlert, Ban, User, MapPin, 
    DollarSign, Clock, CheckCircle2, AlertTriangle, Star, Navigation, 
    Award, Shield, FileText, ToggleLeft, ToggleRight, Store, Bike
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DeliveryManagement = () => {
    const { api, restaurant } = useAuth();
    const [activeTab, setActiveTab] = useState('settings');
    const [partners, setPartners] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
    const [totalOrdersCount, setTotalOrdersCount] = useState(0);
    const [riderProgress, setRiderProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPartner, setNewPartner] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        vehicleType: 'Bike',
        vehicleModel: '',
        rcNumber: '',
        licenseNumber: '',
        profilePhoto: '',
        drivingLicense: '',
        idProof: ''
    });

    // Settings state
    const [settings, setSettings] = useState({
        deliveryType: 'Both',
        enabled: false,
        radius: 5,
        freeRadius: 2,
        baseFee: 30,
        perKmCharge: 10,
        peakHourFee: 15,
        rainSurcharge: 20,
        minOrderAmountForFreeDelivery: 300,
        minOrderAmountForDelivery: 0,
        deliveryOperatingHours: { start: '09:00', end: '22:00' }
    });

    const fetchPartners = async () => {
        try {
            const res = await api.get('/delivery/partners');
            setPartners(res.data);
        } catch (error) {
            console.error('Failed to fetch delivery partners', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/delivery/analytics');
            setAnalytics(res.data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    };

    const fetchActiveOrders = async () => {
        try {
            const res = await api.get('/orders');
            setTotalOrdersCount(res.data.length);
            // Filter only delivery orders that are active
            const active = res.data.filter(o => 
                o.orderType === 'Delivery' && 
                !['Delivered', 'Cancelled', 'Completed'].includes(o.status)
            );
            setActiveOrders(active);
            
            // Set default or update tracking order state
            setSelectedTrackingOrder(prev => {
                if (!prev && active.length > 0) return active[0];
                if (prev) {
                    const stillActive = active.find(o => o._id === prev._id);
                    return stillActive || (active.length > 0 ? active[0] : null);
                }
                return null;
            });
        } catch (error) {
            console.error('Failed to fetch active orders', error);
        }
    };

    const getTrackingPartnerDetails = () => {
        if (!selectedTrackingOrder || !selectedTrackingOrder.deliveryPartner) return null;
        const partnerId = typeof selectedTrackingOrder.deliveryPartner === 'object' 
            ? (selectedTrackingOrder.deliveryPartner._id || selectedTrackingOrder.deliveryPartner.id)
            : selectedTrackingOrder.deliveryPartner;
        return partners.find(p => {
            const pUserId = p.userId?._id || p.userId?.id || p.userId;
            return String(pUserId) === String(partnerId) || String(p._id) === String(partnerId);
        });
    };

    const trackingPartner = getTrackingPartnerDetails();

    const initData = async (isInitialLoading = false) => {
        if (isInitialLoading) setLoading(true);
        if (restaurant && restaurant.deliverySettings) {
            setSettings(prev => ({
                ...prev,
                ...restaurant.deliverySettings,
                deliveryOperatingHours: restaurant.deliverySettings.deliveryOperatingHours || prev.deliveryOperatingHours
            }));
        }
        await Promise.all([
            fetchPartners(),
            fetchAnalytics(),
            fetchActiveOrders()
        ]);
        if (isInitialLoading) setLoading(false);
    };

    useEffect(() => {
        initData(true);
        
        // Silent background polling every 30 seconds for live order status without UI restarts
        const pollInterval = setInterval(() => {
            fetchPartners();
            fetchAnalytics();
            fetchActiveOrders();
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);


    useEffect(() => {
        if (!selectedTrackingOrder) return;
        
        // Reset progress when selecting a new order
        setRiderProgress(0);

        // If the order is out for delivery, simulate live movement!
        const isMoving = ['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) || 
                         ['Picked Up', 'On the Way'].includes(selectedTrackingOrder.deliveryStatus);
        
        if (!isMoving) {
            setRiderProgress(0);
            return;
        }

        // Loop simulation progress from 10% to 95% repeatedly to show live movement!
        const timer = setInterval(() => {
            setRiderProgress(p => {
                if (p >= 95) return 10; // Reset to simulate next leg
                return p + 2;
            });
        }, 800);

        return () => clearInterval(timer);
    }, [selectedTrackingOrder]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            await api.put('/delivery/settings', settings);
            toast.success('Delivery settings updated successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    const handleAddPartner = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/partners', newPartner);
            toast.success('Delivery partner registered successfully!');
            setIsAddModalOpen(false);
            setNewPartner({
                name: '',
                email: '',
                phoneNumber: '',
                vehicleType: 'Bike',
                vehicleModel: '',
                rcNumber: '',
                licenseNumber: '',
                profilePhoto: '',
                drivingLicense: '',
                idProof: ''
            });
            fetchPartners();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add delivery partner');
        }
    };

    const handleUpdateStatus = async (id, verificationStatus) => {
        try {
            await api.put(`/delivery/partners/${id}/status`, { verificationStatus });
            toast.success(`Partner status updated to ${verificationStatus}`);
            fetchPartners();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleToggleActive = async (id) => {
        try {
            const res = await api.put(`/delivery/partners/${id}/toggle-active`);
            toast.success(res.data.message || 'Status updated successfully');
            fetchPartners();
        } catch (error) {
            toast.error('Failed to toggle active status');
        }
    };

    const handleAutoAssign = async (orderId) => {
        try {
            await api.put(`/delivery/orders/${orderId}/auto-assign`);
            toast.success('Nearest delivery partner assigned automatically!');
            fetchActiveOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Auto-assignment failed');
        }
    };

    const handleManualAssign = async (orderId, partnerUserId) => {
        try {
            await api.put(`/delivery/orders/${orderId}/assign`, { partnerUserId });
            toast.success('Delivery partner assigned successfully!');
            fetchActiveOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Assignment failed');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Delivery Partner Management</h2>
                <p className="text-gray-500 text-sm mt-1">Configure settings, register delivery staff, monitor live order tracking, and view analytics reports.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-px">
                {['settings', 'partners', 'tracking', 'analytics'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-bold text-sm capitalize transition-all border-b-2 -mb-px ${
                            activeTab === tab 
                            ? 'border-green-600 text-green-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab === 'tracking' ? 'Live Tracking' : tab}
                    </button>
                ))}
            </div>

            {/* TABS CONTAINER */}
            <div className="mt-6">

                {/* ─── TAB 1: SETTINGS ────────────────────────────────────── */}
                {activeTab === 'settings' && (
                    <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Availability Card */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">Delivery Status</h3>
                                        <p className="text-xs text-gray-400">Toggle whether your restaurant currently takes delivery orders.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                                        className="text-green-600 hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        {settings.enabled ? (
                                            <ToggleRight size={44} className="stroke-[1.5]" />
                                        ) : (
                                            <ToggleLeft size={44} className="text-gray-300 stroke-[1.5]" />
                                        )}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Type</label>
                                        <select
                                            value={settings.deliveryType}
                                            onChange={(e) => setSettings(prev => ({ ...prev, deliveryType: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                        >
                                            <option value="Self">Self Delivery (Own Staff)</option>
                                            <option value="Third-Party">Third-Party (Uber, Dunzo, etc.)</option>
                                            <option value="Both">Both Methods</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Radius (km)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1"
                                                max="30"
                                                value={settings.radius}
                                                onChange={(e) => setSettings(prev => ({ ...prev, radius: Number(e.target.value) }))}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                            />
                                            <span className="font-extrabold text-sm text-gray-700 whitespace-nowrap">{settings.radius} km</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charges & Fees Card */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Rates & Surcharges</h3>
                                    <p className="text-xs text-gray-400">Configure delivery charges, limits, and extra multipliers.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Free Delivery Radius (km)</label>
                                        <input
                                            type="number"
                                            value={settings.freeRadius}
                                            onChange={(e) => setSettings(prev => ({ ...prev, freeRadius: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Min Order Value for Free Delivery</label>
                                        <input
                                            type="number"
                                            value={settings.minOrderAmountForFreeDelivery}
                                            onChange={(e) => setSettings(prev => ({ ...prev, minOrderAmountForFreeDelivery: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Base Delivery Fee (₹)</label>
                                        <input
                                            type="number"
                                            value={settings.baseFee}
                                            onChange={(e) => setSettings(prev => ({ ...prev, baseFee: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Per KM Surcharge (₹)</label>
                                        <input
                                            type="number"
                                            value={settings.perKmCharge}
                                            onChange={(e) => setSettings(prev => ({ ...prev, perKmCharge: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Peak Hour Fee (₹)</label>
                                        <input
                                            type="number"
                                            value={settings.peakHourFee}
                                            onChange={(e) => setSettings(prev => ({ ...prev, peakHourFee: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rain Surcharge (₹)</label>
                                        <input
                                            type="number"
                                            value={settings.rainSurcharge}
                                            onChange={(e) => setSettings(prev => ({ ...prev, rainSurcharge: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Min Order Amount for Delivery (₹)</label>
                                        <input
                                            type="number"
                                            value={settings.minOrderAmountForDelivery || 0}
                                            onChange={(e) => setSettings(prev => ({ ...prev, minOrderAmountForDelivery: Number(e.target.value) }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Start Hour</label>
                                        <input
                                            type="time"
                                            value={settings.deliveryOperatingHours?.start || '09:00'}
                                            onChange={(e) => setSettings(prev => ({ 
                                                ...prev, 
                                                deliveryOperatingHours: { 
                                                    ...(prev.deliveryOperatingHours || {}), 
                                                    start: e.target.value 
                                                } 
                                            }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery End Hour</label>
                                        <input
                                            type="time"
                                            value={settings.deliveryOperatingHours?.end || '22:00'}
                                            onChange={(e) => setSettings(prev => ({ 
                                                ...prev, 
                                                deliveryOperatingHours: { 
                                                    ...(prev.deliveryOperatingHours || {}), 
                                                    end: e.target.value 
                                                } 
                                            }))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Radius Visual Mock Map */}
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full space-y-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Map Bounding Area</h3>
                                <p className="text-xs text-gray-400">Visualization of the {settings.radius} km order constraint.</p>
                            </div>

                            <div className="relative flex-1 min-h-[250px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
                                {/* Simulated grid lines */}
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                                
                                {/* Target circles */}
                                <div className="relative w-44 h-44 rounded-full bg-green-500/10 border-2 border-dashed border-green-500 flex items-center justify-center animate-pulse">
                                    <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                                        <MapPin className="text-green-600 animate-bounce" size={24} />
                                    </div>
                                    <span className="absolute -top-6 text-[10px] font-black text-green-700 bg-white px-2 py-0.5 rounded-full shadow border border-green-200">
                                        Max: {settings.radius} km
                                    </span>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-600/15 text-sm transition-all"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </form>
                )}

                {/* ─── TAB 2: PARTNERS ────────────────────────────────────── */}
                {activeTab === 'partners' && (
                    <div className="space-y-6">
                        {/* Title and Add Button */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900">Registered Delivery Staff</h3>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-green-600/15"
                            >
                                <Plus size={16} /> Register Partner
                            </button>
                        </div>

                        {/* List */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="py-4 px-6">Partner Name</th>
                                            <th className="py-4 px-6">Phone Number</th>
                                            <th className="py-4 px-6">Vehicle Details</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                            <th className="py-4 px-6 text-center">Verification</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {partners.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-gray-400 font-bold">
                                                    No delivery partners registered yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            partners.map(p => (
                                                <tr key={p._id} className="hover:bg-gray-50/50">
                                                    <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs">
                                                            {p.userId?.name?.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold flex items-center gap-1.5">
                                                                {p.userId?.name}
                                                                {p.userId?.isActive === false && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-105 text-red-700 font-extrabold uppercase border border-red-200">Inactive</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">{p.userId?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-600">{p.userId?.phoneNumber || '—'}</td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-semibold text-gray-800">{p.vehicleDetails?.type}</span>
                                                        <p className="text-[10px] text-gray-400">{p.vehicleDetails?.model || 'No model specified'}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            p.status === 'Online' 
                                                            ? 'bg-green-50 text-green-700 border border-green-200' 
                                                            : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            p.verificationStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                                            p.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            p.verificationStatus === 'Suspended' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {p.verificationStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                                                        {p.verificationStatus !== 'Approved' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(p._id, 'Approved')}
                                                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 inline-flex items-center"
                                                                title="Approve Partner"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        {p.verificationStatus !== 'Suspended' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(p._id, 'Suspended')}
                                                                className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 inline-flex items-center"
                                                                title="Suspend Partner"
                                                            >
                                                                <Ban size={14} />
                                                            </button>
                                                        )}
                                                        {p.verificationStatus !== 'Rejected' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(p._id, 'Rejected')}
                                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 inline-flex items-center"
                                                                title="Reject Partner"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleToggleActive(p._id)}
                                                            className={`p-1.5 rounded-lg inline-flex items-center transition-all ${
                                                                p.userId?.isActive !== false
                                                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                            }`}
                                                            title={p.userId?.isActive !== false ? "Deactivate Partner" : "Activate Partner"}
                                                        >
                                                            {p.userId?.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: LIVE TRACKING ───────────────────────────────── */}
                {activeTab === 'tracking' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Active Orders List */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Active Delivery Orders</h3>
                                <p className="text-xs text-gray-400">List of orders currently out for delivery or pending assign.</p>
                            </div>

                            <div className="space-y-3 overflow-y-auto max-h-[500px]">
                                {activeOrders.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 font-bold text-sm">
                                        No active delivery orders{totalOrdersCount > 0 ? ` (out of ${totalOrdersCount} total branch orders)` : ''}.
                                    </div>
                                ) : (
                                    activeOrders.map(o => (
                                        <div 
                                            key={o._id} 
                                            onClick={() => setSelectedTrackingOrder(o)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                                                selectedTrackingOrder?._id === o._id 
                                                ? 'bg-blue-50/70 border-blue-400 shadow-md ring-2 ring-blue-400/10' 
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100/75'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-gray-900">#{o._id.substring(o._id.length - 4).toUpperCase()}</span>
                                                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase">{o.status}</span>
                                            </div>

                                            <div className="text-xs text-gray-500 space-y-1">
                                                <p>Address: <strong>{o.shippingAddress?.address || 'Any'}</strong></p>
                                                <p>Distance: <strong>{o.deliveryDistance || 0} km</strong></p>
                                                {o.deliveryPartner ? (
                                                    <div className="space-y-1 mt-2 pt-2 border-t border-gray-200/60 text-[10px] font-semibold text-gray-600">
                                                        <div className="flex justify-between">
                                                            <span>Partner:</span>
                                                            <strong className="text-emerald-700">{typeof o.deliveryPartner === 'object' ? o.deliveryPartner.name : 'Assigned'}</strong>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span>Delivery Status:</span>
                                                            <span className="text-[9px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{o.deliveryStatus || 'Pending'}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-orange-500 font-bold">Awaiting Assignment</p>
                                                )}
                                            </div>

                                            {!o.deliveryPartner && (
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleAutoAssign(o._id)}
                                                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-colors"
                                                    >
                                                        Auto Assign
                                                    </button>
                                                    <select
                                                        onChange={(e) => handleManualAssign(o._id, e.target.value)}
                                                        className="bg-white border border-gray-200 rounded-lg text-[10px] font-bold px-2 py-1"
                                                    >
                                                        <option value="">Manual Assign</option>
                                                        {partners.filter(p => p.status === 'Online' && p.verificationStatus === 'Approved').map(p => (
                                                            <option key={p.userId?._id} value={p.userId?._id}>{p.userId?.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Interactive Tracking Map Visualizer */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[580px] space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Live Delivery Route Tracker</h3>
                                    <p className="text-xs text-gray-400">Map simulation of active delivery partner coordinates.</p>
                                </div>
                                {selectedTrackingOrder && (
                                    <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full">
                                        Status: {selectedTrackingOrder.status}
                                    </span>
                                )}
                            </div>

                            {/* Stepper Milestones (Zomato/Swiggy Style) */}
                            {selectedTrackingOrder ? (
                                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-[10px] font-bold text-gray-500">
                                    {[
                                        { label: 'Accepted', active: ['Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'].includes(selectedTrackingOrder.status) },
                                        { label: 'Preparing', active: ['Preparing', 'Ready', 'Out for Delivery', 'Delivered'].includes(selectedTrackingOrder.status) },
                                        { label: 'Ready', active: ['Ready', 'Out for Delivery', 'Delivered'].includes(selectedTrackingOrder.status) },
                                        { label: 'Out for Delivery', active: ['Out for Delivery', 'Delivered'].includes(selectedTrackingOrder.status) }
                                    ].map((step, index) => (
                                        <div key={index} className="flex flex-col items-center gap-1">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] font-black ${
                                                step.active 
                                                ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                                                : 'bg-white border-gray-200 text-gray-300'
                                            }`}>
                                                {step.active ? '✓' : index + 1}
                                            </div>
                                            <span className={step.active ? 'text-emerald-700 font-extrabold' : 'text-gray-400'}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            <div className="relative flex-1 bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden flex flex-col">
                                {/* Map Grid lines (Dark Zomato/Swiggy styled theme) */}
                                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                                
                                {selectedTrackingOrder ? (
                                    <>
                                        {/* SVG Route Lines */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                            {/* Dotted grey route */}
                                            <line x1="20%" y1="40%" x2="80%" y2="70%" stroke="#334155" strokeWidth="3" strokeDasharray="6,6" strokeLinecap="round" />
                                            {/* Traversed green path */}
                                            <line x1="20%" y1="40%" x2={`${20 + (['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) ? riderProgress : 0) * 0.6}%`} y2={`${40 + (['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) ? riderProgress : 0) * 0.3}%`} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                                        </svg>

                                        {/* Restaurant Store Marker */}
                                        <div className="absolute top-[40%] left-[20%] -translate-x-1/2 -translate-y-1/2 text-center group z-10">
                                            <div className="relative flex h-9 w-9 items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-2xl shadow-xl border-2 border-white cursor-pointer transition-all group-hover:scale-110">
                                                <div className="absolute inset-0 rounded-2xl bg-orange-500 animate-ping opacity-20"></div>
                                                <Store size={18} />
                                            </div>
                                            <span className="block text-[8px] font-black text-white bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded shadow mt-1.5 uppercase tracking-widest leading-none">Hub Shop</span>
                                        </div>

                                        {/* Customer Destination Marker */}
                                        <div className="absolute top-[70%] left-[80%] -translate-x-1/2 -translate-y-1/2 text-center group z-10">
                                            <div className="relative flex h-8 w-8 items-center justify-center bg-purple-500 text-white rounded-full shadow-lg border-2 border-white cursor-pointer transition-transform group-hover:scale-110">
                                                <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-25"></div>
                                                <MapPin size={16} />
                                            </div>
                                            <span className="block text-[8px] font-black text-white bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded shadow mt-1 uppercase tracking-widest leading-none">Home</span>
                                        </div>

                                        {/* Dynamic Rider Bike & Driver Avatar Marker */}
                                        {selectedTrackingOrder.deliveryPartner && (
                                            <div 
                                                className="absolute -translate-x-1/2 -translate-y-1/2 text-center group z-20 transition-all duration-300 ease-out"
                                                style={{
                                                    left: `${20 + (['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) ? riderProgress : 0) * 0.6}%`,
                                                    top: `${40 + (['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) ? riderProgress : 0) * 0.3}%`
                                                }}
                                            >
                                                <div className="relative flex h-11 w-11 items-center justify-center bg-emerald-500 text-white rounded-full shadow-2xl border-2 border-white cursor-pointer transition-all group-hover:scale-110">
                                                    {/* Outer pulsing ping wave */}
                                                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-35"></div>
                                                    
                                                    {/* Bike animation */}
                                                    <Bike size={20} className="animate-bounce" />
                                                    
                                                    {/* Small driver user overlay badge */}
                                                    <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 rounded-full p-0.5 text-emerald-400 shadow-md">
                                                        <User size={10} className="fill-emerald-400/20" />
                                                    </div>
                                                </div>
                                                <span className="block text-[8px] font-black text-emerald-400 bg-slate-950 border border-slate-800 px-2 py-1 rounded shadow-lg mt-1 whitespace-nowrap leading-none">
                                                    {typeof selectedTrackingOrder.deliveryPartner === 'object' ? selectedTrackingOrder.deliveryPartner.name : 'Rider'} ({selectedTrackingOrder.deliveryStatus || 'Transit'})
                                                </span>
                                            </div>
                                        )}

                                        {/* Route Details overlay card */}
                                        <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl text-[10px] space-y-1.5 max-w-[240px] text-slate-300 z-10">
                                            <p className="font-extrabold text-white uppercase tracking-widest text-[9px] border-b border-slate-800 pb-1 flex justify-between">
                                                <span>Route Stats</span>
                                                <span className="text-emerald-400">Order #{selectedTrackingOrder._id.substring(selectedTrackingOrder._id.length - 4).toUpperCase()}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-500">Assigned Partner:</span>
                                                <strong className="text-emerald-400">{typeof selectedTrackingOrder.deliveryPartner === 'object' ? selectedTrackingOrder.deliveryPartner.name : 'Assigned Partner'}</strong>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-500">Vehicle:</span>
                                                <strong className="text-slate-200">{trackingPartner ? `${trackingPartner.vehicleDetails?.type} (${trackingPartner.vehicleDetails?.model || 'Generic'})` : '—'}</strong>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-500">Simulated Speed:</span>
                                                <strong className="text-slate-200">
                                                    {['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) ? '32 km/h' : '0 km/h (Idle)'}
                                                </strong>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-500">Distance Remaining:</span>
                                                <strong className="text-slate-200">
                                                    {['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status) 
                                                        ? `${Number((selectedTrackingOrder.deliveryDistance * (1 - riderProgress / 100)).toFixed(1))} km` 
                                                        : `${selectedTrackingOrder.deliveryDistance || 0} km`
                                                    }
                                                </strong>
                                            </p>
                                            <p className="flex justify-between border-t border-slate-800/60 pt-1">
                                                <span className="text-slate-500">Estimated ETA:</span>
                                                <strong className="text-emerald-400 font-extrabold">
                                                    {['Picked Up', 'On the Way', 'Out for Delivery'].includes(selectedTrackingOrder.status)
                                                        ? `${Math.max(1, Math.ceil((selectedTrackingOrder.deliveryDistance * 3) * (1 - riderProgress / 100)))} mins`
                                                        : `${selectedTrackingOrder.deliveryDistance ? selectedTrackingOrder.deliveryDistance * 3 : 15} mins`
                                                    }
                                                </strong>
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 text-center text-xs text-slate-500 font-bold">
                                        Select an active delivery order on the left to track its live route.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 4: ANALYTICS ───────────────────────────────────── */}
                {activeTab === 'analytics' && analytics && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: 'Total Deliveries', value: analytics.totalDeliveries, icon: Truck, color: 'text-green-600 bg-green-50' },
                                { title: 'Success Rate', value: analytics.deliverySuccessRate, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
                                { title: 'Avg. Delivery Time', value: analytics.avgDeliveryTime, icon: Clock, color: 'text-orange-600 bg-orange-50' },
                                { title: 'Total Payout', value: `₹${analytics.totalDeliveryEarnings}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' }
                            ].map((kpi, idx) => {
                                const Icon = kpi.icon;
                                return (
                                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl ${kpi.color}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kpi.title}</p>
                                            <h4 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h4>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Charts Panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Performance statistics */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Success Rate Trends</h3>
                                    <p className="text-xs text-gray-400">Proportions of completed deliveries vs cancellations.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    {[
                                        { name: 'Completed Payouts', val: parseInt(analytics.deliverySuccessRate), color: 'bg-green-500' },
                                        { name: 'Cancellations / Late', val: parseInt(analytics.cancellationRate), color: 'bg-red-500' }
                                    ].map((bar, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span>{bar.name}</span>
                                                <span>{bar.val}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                <div className={`h-full ${bar.color}`} style={{ width: `${bar.val}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Partners Leaderboard */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Top Deliverers</h3>
                                    <p className="text-xs text-gray-400">Partners ranked by rating and speed.</p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { name: 'Ravi Kumar', rating: '4.9', count: '14 deliveries' },
                                        { name: 'Sandeep Sharma', rating: '4.8', count: '11 deliveries' }
                                    ].map((pat, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-200">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{pat.name}</p>
                                                    <p className="text-[9px] text-gray-400">{pat.count}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-amber-500 font-extrabold">
                                                <Star size={12} className="fill-amber-500" /> {pat.rating}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD PARTNER MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-gray-900 text-lg">Register Delivery Partner</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddPartner} className="flex flex-col min-h-0 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar text-left">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newPartner.name}
                                        onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        placeholder="e.g. Ramesh Singh"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={newPartner.email}
                                        onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        placeholder="e.g. ramesh@gmail.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newPartner.phoneNumber}
                                        onChange={(e) => setNewPartner({...newPartner, phoneNumber: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle Type</label>
                                        <select
                                            value={newPartner.vehicleType}
                                            onChange={(e) => setNewPartner({...newPartner, vehicleType: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                                        >
                                            <option value="Bike">Bike</option>
                                            <option value="Scooter">Scooter</option>
                                            <option value="Car">Car</option>
                                            <option value="Bicycle">Bicycle</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle Model</label>
                                        <input 
                                            type="text"
                                            value={newPartner.vehicleModel}
                                            onChange={(e) => setNewPartner({...newPartner, vehicleModel: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="e.g. Activa 6G"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">RC Book Number</label>
                                        <input 
                                            type="text"
                                            value={newPartner.rcNumber}
                                            onChange={(e) => setNewPartner({...newPartner, rcNumber: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="RC-XXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">License Number</label>
                                        <input 
                                            type="text"
                                            value={newPartner.licenseNumber}
                                            onChange={(e) => setNewPartner({...newPartner, licenseNumber: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="DL-XXXX"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profile Photo (URL)</label>
                                    <input 
                                        type="text"
                                        value={newPartner.profilePhoto}
                                        onChange={(e) => setNewPartner({...newPartner, profilePhoto: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Driving License (URL)</label>
                                        <input 
                                            type="text"
                                            value={newPartner.drivingLicense}
                                            onChange={(e) => setNewPartner({...newPartner, drivingLicense: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="https://example.com/dl.pdf"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ID Proof (URL)</label>
                                        <input 
                                            type="text"
                                            value={newPartner.idProof}
                                            onChange={(e) => setNewPartner({...newPartner, idProof: e.target.value})}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            placeholder="https://example.com/id.pdf"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    Register Partner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryManagement;
