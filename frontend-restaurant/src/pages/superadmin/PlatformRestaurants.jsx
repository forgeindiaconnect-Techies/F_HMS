import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Check, X, Ban, RefreshCw, Eye, EyeOff, Trash2, Search, Store, 
    Sparkles, TrendingUp, ShieldCheck, AlertCircle, Building2, Calendar, 
    Phone, Mail, MapPin, RotateCcw, CheckCircle2, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const PlatformRestaurants = () => {
    const { api } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRestaurant, setViewingRestaurant] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilterTab, setActiveFilterTab] = useState('All');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get('/super-admin/restaurants');
                setRestaurants(res.data || []);
            } catch (error) {
                console.error("Failed to fetch restaurants", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, [api]);

    // Handle Restaurant Approval
    const handleApproval = async (id, status) => {
        try {
            await api.put(`/super-admin/restaurants/${id}/approval`, { approvalStatus: status });
            setRestaurants(prev => prev.map(r => 
                r._id === id ? { ...r, approvalStatus: status } : r
            ));
            toast.success(`Restaurant ${status.toLowerCase()} successfully!`);
        } catch (error) {
            toast.error('Failed to update approval status');
        }
    };

    // Update Visibility Status (Active, Inactive, Suspended)
    const handleUpdateStatus = (id, newStatus, name) => {
        const isDestructive = newStatus === 'Suspended' || newStatus === 'Inactive';
        const title = newStatus === 'Active' 
            ? `Activate ${name || 'Restaurant'}`
            : newStatus === 'Inactive'
            ? `Hide / Deactivate ${name || 'Restaurant'}`
            : `Suspend ${name || 'Restaurant'}`;

        const message = newStatus === 'Active'
            ? `Activate and publish "${name}" to the customer marketplace? Customers will be able to discover the restaurant, view the menu, and place orders (subject to approval).`
            : newStatus === 'Inactive'
            ? `Deactivate "${name}"? It will be hidden immediately from customer discovery, explore listings, and public menus. Existing historical orders and billing records remain intact.`
            : `Suspend "${name}"? The restaurant will be blocked from public customer listings and prevented from accepting new customer orders immediately.`;

        setConfirmModal({
            isOpen: true,
            title,
            message,
            isDestructive,
            onConfirm: async () => {
                try {
                    const res = await api.put(`/super-admin/restaurants/${id}/status`, { status: newStatus });
                    setRestaurants(prev => prev.map(r => 
                        r._id === id ? { ...r, status: newStatus, isActive: newStatus === 'Active' } : r
                    ));
                    toast.success(res.data?.message || `Restaurant status updated to ${newStatus}!`);
                } catch (error) {
                    console.error("Failed to update status", error);
                    toast.error(error.response?.data?.message || 'Failed to update restaurant status');
                }
            }
        });
    };

    // Safe Soft Delete
    const handleDeleteRestaurant = (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: `Soft-Delete ${name || 'Restaurant'}`,
            message: `Are you sure you want to soft-delete "${name}"? It will be removed from customer listings and will not accept new orders. All historical orders, bills, invoices, payments, and staff records are SAFELY PRESERVED in the database. You can restore this restaurant at any time.`,
            isDestructive: true,
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/super-admin/restaurants/${id}`);
                    setRestaurants(prev => prev.map(r => 
                        r._id === id ? { ...r, status: 'Deleted', isDeleted: true, isActive: false, deletedAt: new Date() } : r
                    ));
                    toast.success(res.data?.message || 'Restaurant soft-deleted successfully! Historical records preserved.');
                } catch (error) {
                    console.error("Failed to delete restaurant", error);
                    toast.error(error.response?.data?.message || 'Failed to delete restaurant');
                }
            }
        });
    };

    // Restore Soft-Deleted Restaurant
    const handleRestoreRestaurant = (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: `Restore ${name || 'Restaurant'}`,
            message: `Are you sure you want to restore "${name}"? This will reactivate the restaurant and reinstate its platform access and marketplace visibility.`,
            isDestructive: false,
            onConfirm: async () => {
                try {
                    const res = await api.put(`/super-admin/restaurants/${id}/restore`);
                    setRestaurants(prev => prev.map(r => 
                        r._id === id ? { ...r, status: 'Active', isDeleted: false, isActive: true, deletedAt: null } : r
                    ));
                    toast.success(res.data?.message || 'Restaurant restored successfully!');
                } catch (error) {
                    console.error("Failed to restore restaurant", error);
                    toast.error(error.response?.data?.message || 'Failed to restore restaurant');
                }
            }
        });
    };

    const calculateRemainingDays = (expiryDate) => {
        if (!expiryDate) return 'No expiry date set';
        const diffTime = new Date(expiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `Expired ${Math.abs(diffDays)} days ago`;
        }
        return `${diffDays} days remaining`;
    };

    const getPlanPrice = (plan, price) => {
        if (price && price > 0) return `₹${price.toLocaleString('en-IN')}`;
        const p = (plan || '').toLowerCase();
        if (p === 'enterprise') return '₹12,999';
        if (p === 'pro' || p === 'professional') return '₹5,999';
        return '₹2,999';
    };

    // Calculate metrics
    const totalCount = restaurants.length;
    const activeVisibilityCount = restaurants.filter(r => !r.isDeleted && (r.status || 'Active') === 'Active' && r.isActive !== false).length;
    const inactiveCount = restaurants.filter(r => !r.isDeleted && (r.status === 'Inactive' || r.isActive === false)).length;
    const suspendedCount = restaurants.filter(r => !r.isDeleted && r.status === 'Suspended').length;
    const softDeletedCount = restaurants.filter(r => r.isDeleted || r.status === 'Deleted').length;
    const enterpriseCount = restaurants.filter(r => !r.isDeleted && (r.subscription?.plan || '').toLowerCase() === 'enterprise').length;
    const customPosCount = restaurants.filter(r => !r.isDeleted && r.billingConfig?.isCustomBillingActive).length;
    const pendingApprovalCount = restaurants.filter(r => !r.isDeleted && r.approvalStatus === 'Pending').length;

    // Calculate total SaaS MRR
    const activeSubscribers = restaurants.filter(r => !r.isDeleted && (r.subscription?.status || 'Active') === 'Active');
    const totalSaaSMRR = activeSubscribers.reduce((acc, r) => {
        const sub = r.subscription || {};
        if (sub.price && sub.price > 0) return acc + sub.price;
        const p = (sub.plan || 'Basic').toLowerCase();
        if (p === 'enterprise') return acc + 12999;
        if (p === 'pro' || p === 'professional') return acc + 5999;
        return acc + 2999;
    }, 0);

    // Filtering logic
    const filteredRestaurants = restaurants.filter(r => {
        const isDeleted = Boolean(r.isDeleted || r.status === 'Deleted');
        const restStatus = isDeleted ? 'Deleted' : (r.status || (r.isActive === false ? 'Inactive' : 'Active'));
        const plan = (r.subscription?.plan || 'Basic').toLowerCase();
        const isCustomPOS = Boolean(r.billingConfig?.isCustomBillingActive);

        let matchesTab = true;
        if (activeFilterTab === 'Active') matchesTab = restStatus === 'Active' && !isDeleted;
        else if (activeFilterTab === 'Inactive') matchesTab = restStatus === 'Inactive' && !isDeleted;
        else if (activeFilterTab === 'Suspended') matchesTab = restStatus === 'Suspended' && !isDeleted;
        else if (activeFilterTab === 'Deleted') matchesTab = isDeleted;
        else if (activeFilterTab === 'Custom Setup') matchesTab = isCustomPOS && !isDeleted;
        else if (activeFilterTab === 'Enterprise') matchesTab = plan === 'enterprise' && !isDeleted;
        else if (activeFilterTab === 'Pending Approval') matchesTab = r.approvalStatus === 'Pending' && !isDeleted;

        if (!matchesTab) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = (r.name || '').toLowerCase();
        const ownerName = (r.ownerId?.name || '').toLowerCase();
        const ownerEmail = (r.ownerId?.email || '').toLowerCase();
        const address = (r.address || '').toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        return name.includes(q) || ownerName.includes(q) || ownerEmail.includes(q) || address.includes(q) || phone.includes(q);
    });

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight">Platform Restaurants Registry</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Comprehensive management for all {totalCount} registered restaurants, marketplace visibility, and custom POS systems.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                        <TrendingUp size={14} className="text-emerald-600" />
                        MRR: ₹{totalSaaSMRR.toLocaleString('en-IN')}/mo
                    </span>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Outlets</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">{totalCount}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active & Visible</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{activeVisibilityCount}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Inactive / Hidden</div>
                    <div className="text-2xl font-black text-amber-700 mt-1">{inactiveCount}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Suspended</div>
                    <div className="text-2xl font-black text-rose-700 mt-1">{suspendedCount}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Soft-Deleted</div>
                    <div className="text-2xl font-black text-gray-700 mt-1">{softDeletedCount}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Custom POS</div>
                    <div className="text-2xl font-black text-purple-700 mt-1">{customPosCount}</div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search & Filter Tabs */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by restaurant name, owner, city, email or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                            {[
                                { key: 'All', label: 'All', count: totalCount },
                                { key: 'Active', label: 'Active & Visible', count: activeVisibilityCount },
                                { key: 'Inactive', label: 'Inactive / Hidden', count: inactiveCount },
                                { key: 'Suspended', label: 'Suspended', count: suspendedCount },
                                { key: 'Deleted', label: 'Soft-Deleted', count: softDeletedCount },
                                { key: 'Custom Setup', label: 'Custom POS', count: customPosCount },
                                { key: 'Enterprise', label: 'Enterprise', count: enterpriseCount },
                                ...(pendingApprovalCount > 0 ? [{ key: 'Pending Approval', label: 'Pending', count: pendingApprovalCount }] : [])
                            ].map((tab) => {
                                const isActive = activeFilterTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveFilterTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                            isActive
                                                ? 'bg-gray-900 text-white shadow-sm'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-4 font-bold">Restaurant & Location</th>
                                <th className="p-4 font-bold">Owner & Contact</th>
                                <th className="p-4 font-bold">Marketplace Visibility</th>
                                <th className="p-4 font-bold">Plan & Pricing</th>
                                <th className="p-4 font-bold">POS Setup</th>
                                <th className="p-4 font-bold">Approval</th>
                                <th className="p-4 font-bold">Renewal Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRestaurants.map(restaurant => {
                                const isDeleted = Boolean(restaurant.isDeleted || restaurant.status === 'Deleted');
                                const restStatus = isDeleted ? 'Deleted' : (restaurant.status || (restaurant.isActive === false ? 'Inactive' : 'Active'));
                                
                                const planLower = (restaurant.subscription?.plan || 'basic').toLowerCase();
                                const isEnterprise = planLower === 'enterprise';
                                const isPro = planLower === 'pro' || planLower === 'professional';
                                const planPrice = getPlanPrice(restaurant.subscription?.plan, restaurant.subscription?.price);
                                const cycle = restaurant.subscription?.billingCycle || 'monthly';
                                const expiry = restaurant.subscription?.expiryDate;
                                let diffDays = null;
                                if (expiry) {
                                    diffDays = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
                                }
                                const hasCustomPOS = Boolean(restaurant.billingConfig?.isCustomBillingActive);
                                const outletFormat = restaurant.billingConfig?.outletFormat || restaurant.posConfig?.outletFormat || 'Restaurant';

                                return (
                                    <tr key={restaurant._id} className={`hover:bg-gray-50/80 transition-colors ${isDeleted ? 'bg-gray-50/40 opacity-75' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                    {restaurant.logo ? (
                                                        <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-base">
                                                            {restaurant.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className={`font-bold block text-sm ${isDeleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{restaurant.name}</span>
                                                    <span className="text-[11px] font-semibold text-gray-500 block">{outletFormat}</span>
                                                    {restaurant.address && (
                                                        <span className="text-[10px] text-gray-400 block truncate max-w-[180px]">{restaurant.address}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold text-gray-900">{restaurant.ownerId?.name || 'Authorized Admin'}</div>
                                            <div className="text-[11px] text-gray-500">{restaurant.ownerId?.email || 'N/A'}</div>
                                            {restaurant.phone && (
                                                <div className="text-[10px] text-gray-400 font-medium">📞 {restaurant.phone}</div>
                                            )}
                                        </td>
                                        {/* Marketplace Visibility Column */}
                                        <td className="p-4">
                                            {isDeleted ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-xs font-bold">
                                                    <Trash2 size={12} className="text-gray-400" /> Soft-Deleted
                                                </span>
                                            ) : restStatus === 'Active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active / Visible
                                                </span>
                                            ) : restStatus === 'Inactive' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
                                                    <EyeOff size={12} className="text-amber-500" /> Inactive / Hidden
                                                </span>
                                            ) : restStatus === 'Suspended' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                                                    <Ban size={12} className="text-rose-500" /> Suspended
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium">
                                                    {restStatus}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                                                    isEnterprise 
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                        : isPro 
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                    {restaurant.subscription?.plan || 'Basic'}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-700">
                                                    {planPrice}<span className="text-[10px] text-gray-400 font-normal">/{cycle === 'yearly' ? 'yr' : 'mo'}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {hasCustomPOS ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                                                    <Sparkles size={12} className="text-emerald-600" /> Custom POS
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium">
                                                    Standard POS
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {restaurant.approvalStatus === 'Pending' && <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg">Pending</span>}
                                            {restaurant.approvalStatus === 'Approved' && <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-lg">Approved</span>}
                                            {restaurant.approvalStatus === 'Rejected' && <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg">Rejected</span>}
                                        </td>
                                        <td className="p-4">
                                            {diffDays !== null ? (
                                                <div>
                                                    <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold inline-block border ${
                                                        diffDays < 0
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : diffDays <= 7
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                        {diffDays < 0 ? `Expired ${Math.abs(diffDays)}d ago` : diffDays === 0 ? 'Expires today' : `${diffDays} days left`}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 block mt-0.5">
                                                        {new Date(expiry).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">Ongoing</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => setViewingRestaurant(restaurant)} 
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors" 
                                                    title="View Full Profile & Subscription"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {isDeleted ? (
                                                    /* Restore Soft-Deleted Restaurant */
                                                    <button
                                                        onClick={() => handleRestoreRestaurant(restaurant._id, restaurant.name)}
                                                        className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                                                        title="Restore Restaurant to Active Status"
                                                    >
                                                        <RotateCcw size={14} /> Restore
                                                    </button>
                                                ) : (
                                                    <>
                                                        {/* Approval Controls */}
                                                        {restaurant.approvalStatus === 'Pending' && (
                                                            <>
                                                                <button onClick={() => handleApproval(restaurant._id, 'Approved')} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl" title="Approve">
                                                                    <Check size={16} />
                                                                </button>
                                                                <button onClick={() => handleApproval(restaurant._id, 'Rejected')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl" title="Reject">
                                                                    <X size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Visibility Control: Toggle Active / Inactive */}
                                                        {restStatus === 'Active' ? (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(restaurant._id, 'Inactive', restaurant.name)}
                                                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                                                                title="Hide / Deactivate Restaurant (Remove from Customer Apps)"
                                                            >
                                                                <EyeOff size={16} />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(restaurant._id, 'Active', restaurant.name)}
                                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                                                                title="Activate Restaurant (Make Visible in Customer Apps)"
                                                            >
                                                                <CheckCircle2 size={16} />
                                                            </button>
                                                        )}

                                                        {/* Visibility Control: Suspend / Unsuspend */}
                                                        {restStatus === 'Suspended' ? (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(restaurant._id, 'Active', restaurant.name)}
                                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                                                                title="Unsuspend Restaurant"
                                                            >
                                                                <RefreshCw size={16} />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleUpdateStatus(restaurant._id, 'Suspended', restaurant.name)}
                                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                                                                title="Suspend Restaurant"
                                                            >
                                                                <Ban size={16} />
                                                            </button>
                                                        )}

                                                        {/* Safe Soft Delete */}
                                                        <button 
                                                            onClick={() => handleDeleteRestaurant(restaurant._id, restaurant.name)} 
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors" 
                                                            title="Soft-Delete Restaurant (Preserves Financial & Order Records)"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredRestaurants.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-gray-500 font-medium">
                                        <Store className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-600 font-bold text-base">No restaurants match your search or filter.</p>
                                        <p className="text-xs text-gray-400 mt-1">Try clearing the search query or switching tabs.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {viewingRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setViewingRestaurant(null)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Restaurant Profile & Visibility</h3>
                                <p className="text-xs text-gray-500">Comprehensive membership, marketplace status, and POS configuration</p>
                            </div>
                            <button onClick={() => setViewingRestaurant(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                    {viewingRestaurant.logo ? (
                                        <img src={viewingRestaurant.logo} alt={viewingRestaurant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-2xl">
                                            {viewingRestaurant.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-lg font-black text-gray-900 truncate">{viewingRestaurant.name}</h4>
                                    <p className="text-xs text-gray-600 font-semibold mt-0.5">Owner: {viewingRestaurant.ownerId?.name || 'Partner Admin'}</p>
                                    <p className="text-[11px] text-gray-500 truncate">{viewingRestaurant.ownerId?.email || 'N/A'}</p>
                                    {viewingRestaurant.phone && (
                                        <p className="text-[11px] text-gray-500">📞 {viewingRestaurant.phone}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2.5 text-sm">
                                {/* Marketplace Visibility Status */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Marketplace Status:</span>
                                    {viewingRestaurant.isDeleted ? (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-black rounded-lg border border-gray-300">
                                            Soft-Deleted
                                        </span>
                                    ) : (
                                        <span className={`px-3 py-1 text-xs font-black rounded-lg border ${
                                            (viewingRestaurant.status || 'Active') === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : viewingRestaurant.status === 'Suspended'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {viewingRestaurant.status || 'Active'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Subscription Tier:</span>
                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-lg border border-purple-200">
                                        {viewingRestaurant.subscription?.plan || 'Basic'} Tier
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Billing Cycle:</span>
                                    <span className="text-gray-900 font-bold capitalize">
                                        {viewingRestaurant.subscription?.billingCycle || 'monthly'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Recurring Price:</span>
                                    <span className="text-gray-900 font-black">
                                        ₹{(viewingRestaurant.subscription?.price || (
                                            (viewingRestaurant.subscription?.plan || '').toLowerCase() === 'enterprise' ? 12999 :
                                            (viewingRestaurant.subscription?.plan || '').toLowerCase() === 'pro' ? 5999 : 2999
                                        )).toLocaleString('en-IN')} / {viewingRestaurant.subscription?.billingCycle === 'yearly' ? 'year' : 'month'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Subscription Status:</span>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                                        viewingRestaurant.subscription?.status === 'Active' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {viewingRestaurant.subscription?.status || 'Active'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Platform Approval:</span>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                                        viewingRestaurant.approvalStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {viewingRestaurant.approvalStatus || 'Approved'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Member Since:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.createdAt ? new Date(viewingRestaurant.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Next Renewal:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.subscription?.expiryDate ? new Date(viewingRestaurant.subscription?.expiryDate).toLocaleDateString() : 'Perpetual'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-2.5">
                                    <span className="text-gray-500 font-medium">Renewal Countdown:</span>
                                    <span className="font-black text-blue-600">
                                        {calculateRemainingDays(viewingRestaurant.subscription?.expiryDate)}
                                    </span>
                                </div>
                            </div>

                            {/* Soft-Deleted Banner */}
                            {viewingRestaurant.isDeleted && (
                                <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 space-y-1">
                                    <div className="flex items-center gap-2 text-gray-800 font-bold text-xs uppercase tracking-wider">
                                        <ShieldAlert size={14} className="text-gray-600" />
                                        Soft-Deleted Restaurant
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Deleted on {viewingRestaurant.deletedAt ? new Date(viewingRestaurant.deletedAt).toLocaleString() : 'N/A'}. All past order history, invoices, payments, and financial reports are securely preserved in the database.
                                    </p>
                                </div>
                            )}

                            {/* Custom Billing POS Details */}
                            {viewingRestaurant.billingConfig?.isCustomBillingActive && (
                                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-2 mt-3">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                                        <Sparkles size={14} className="text-emerald-600" />
                                        Custom POS Architecture Active
                                    </div>
                                    <p className="text-xs text-gray-700">
                                        <span className="font-semibold">Format:</span> {viewingRestaurant.billingConfig?.outletFormat || 'Custom Outlet'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {Object.entries(viewingRestaurant.billingConfig?.modules || {})
                                            .filter(([_, active]) => active)
                                            .map(([mod]) => (
                                                <span key={mod} className="px-2 py-0.5 bg-white text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                                                    ✓ {mod.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {viewingRestaurant.address && (
                                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-xs text-gray-600">
                                    <span className="font-bold text-gray-700 block mb-0.5">Location / Address:</span>
                                    {viewingRestaurant.address}
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setViewingRestaurant(null)}
                                className="w-full mt-2 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
        </div>
    );
};

export default PlatformRestaurants;
