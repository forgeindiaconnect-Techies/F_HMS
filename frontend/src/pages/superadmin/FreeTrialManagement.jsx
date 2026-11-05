import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Clock, CheckCircle, XCircle, ShieldAlert, ShieldCheck, 
    Search, RefreshCw, Calendar, Mail, Phone, Store, User, 
    ArrowRight, Lock, Unlock, Eye, Sparkles, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const FreeTrialManagement = () => {
    const { api } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Modal states
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'freeze' | 'unfreeze' | 'details'
    const [actionReason, setActionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTrialRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/super-admin/trial-requests');
            setRestaurants(res.data || []);
        } catch (error) {
            console.error('Failed to fetch trial requests:', error);
            toast.error('Failed to load free trial requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrialRequests();
    }, [api]);

    // Handle Approve
    const handleApprove = async () => {
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/super-admin/trial-requests/${selectedRestaurant._id}/approve`);
            toast.success(res.data.message || '7-Day Free Trial approved and countdown started!');
            closeModal();
            fetchTrialRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve trial request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Reject
    const handleReject = async () => {
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/super-admin/trial-requests/${selectedRestaurant._id}/reject`, {
                reason: actionReason
            });
            toast.success(res.data.message || 'Trial request rejected.');
            closeModal();
            fetchTrialRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject trial request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Manual Freeze
    const handleFreeze = async () => {
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/super-admin/restaurants/${selectedRestaurant._id}/freeze`, {
                reason: actionReason
            });
            toast.success(res.data.message || 'Restaurant dashboard manually frozen.');
            closeModal();
            fetchTrialRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to freeze restaurant.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Manual Unfreeze
    const handleUnfreeze = async () => {
        if (!selectedRestaurant) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`/super-admin/restaurants/${selectedRestaurant._id}/unfreeze`);
            toast.success(res.data.message || 'Restaurant dashboard unfrozen.');
            closeModal();
            fetchTrialRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Cannot unfreeze restaurant without a valid subscription.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openModal = (restaurant, type) => {
        setSelectedRestaurant(restaurant);
        setModalType(type);
        setActionReason('');
    };

    const closeModal = () => {
        setSelectedRestaurant(null);
        setModalType(null);
        setActionReason('');
    };

    // Filter Logic
    const filteredRestaurants = restaurants.filter(r => {
        const sub = r.subscription || {};
        const matchesSearch = 
            r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.ownerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.ownerId?.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'All') return true;
        if (filterStatus === 'Pending') return sub.status === 'Pending Approval';
        if (filterStatus === 'Active') return sub.status === 'Active' && sub.trialActive;
        if (filterStatus === 'Frozen') return sub.status === 'Frozen' || sub.manualFreeze;
        if (filterStatus === 'Expired') return sub.status === 'Expired';
        if (filterStatus === 'Rejected') return sub.status === 'Rejected';
        return true;
    });

    // Counts
    const counts = {
        all: restaurants.length,
        pending: restaurants.filter(r => r.subscription?.status === 'Pending Approval').length,
        active: restaurants.filter(r => r.subscription?.status === 'Active' && r.subscription?.trialActive).length,
        frozen: restaurants.filter(r => r.subscription?.status === 'Frozen' || r.subscription?.manualFreeze).length,
        expired: restaurants.filter(r => r.subscription?.status === 'Expired').length,
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Free Trial & Subscription Access Management</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Review trial requests, authorize 7-day activation, inspect expirations, and control manual freezes.
                    </p>
                </div>

                <button
                    onClick={fetchTrialRequests}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh Requests
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-amber-600">{counts.pending}</span>
                        <span className="p-2 bg-amber-50 rounded-xl text-amber-600"><Clock size={16} /></span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active 7-Day Trials</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-emerald-600">{counts.active}</span>
                        <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle size={16} /></span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Frozen Dashboards</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-slate-900">{counts.frozen}</span>
                        <span className="p-2 bg-slate-100 rounded-xl text-slate-700"><Lock size={16} /></span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expired Trials</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-rose-600">{counts.expired}</span>
                        <span className="p-2 bg-rose-50 rounded-xl text-rose-600"><AlertTriangle size={16} /></span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search restaurant, owner, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {['All', 'Pending', 'Active', 'Frozen', 'Expired', 'Rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filterStatus === tab 
                                    ? 'bg-orange-500 text-white shadow-xs' 
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="animate-spin text-orange-500" size={28} />
                        <span className="text-xs font-semibold">Loading trial subscriptions...</span>
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 space-y-2">
                        <Store size={36} className="mx-auto opacity-40" />
                        <p className="text-sm font-bold">No trial subscription requests found.</p>
                        <p className="text-xs">Try adjusting your search query or filter status.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                    <th className="p-4">Restaurant</th>
                                    <th className="p-4">Owner Info</th>
                                    <th className="p-4">Request Date</th>
                                    <th className="p-4">Trial / Expiry</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredRestaurants.map(r => {
                                    const sub = r.subscription || {};
                                    const isPending = sub.status === 'Pending Approval';
                                    const isFrozen = sub.manualFreeze || sub.status === 'Frozen';
                                    const isActive = sub.status === 'Active' && sub.trialActive;
                                    const isExpired = sub.status === 'Expired';
                                    const isRejected = sub.status === 'Rejected';

                                    // Countdown calculation
                                    let daysLeft = null;
                                    if (isActive && sub.trialEndDate) {
                                        const diff = new Date(sub.trialEndDate).getTime() - Date.now();
                                        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                                    }

                                    return (
                                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Restaurant */}
                                            <td className="p-4">
                                                <div className="font-extrabold text-slate-900">{r.name}</div>
                                                <div className="text-[11px] text-slate-400 font-medium">
                                                    Plan: <span className="font-bold text-slate-700">{sub.plan || 'Pro'}</span>
                                                </div>
                                            </td>

                                            {/* Owner Info */}
                                            <td className="p-4 space-y-0.5">
                                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                    <User size={12} className="text-slate-400" />
                                                    {r.ownerId?.name || 'Unknown Owner'}
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                                                    <Mail size={12} className="text-slate-400" />
                                                    {r.ownerId?.email || 'No email'}
                                                </div>
                                            </td>

                                            {/* Request Date */}
                                            <td className="p-4 text-slate-600 font-medium">
                                                {sub.trialRequestDate ? new Date(sub.trialRequestDate).toLocaleDateString() : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A')}
                                            </td>

                                            {/* Trial Expiry */}
                                            <td className="p-4">
                                                {isPending ? (
                                                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block">
                                                        ⏳ Starts on Approval
                                                    </span>
                                                ) : isActive ? (
                                                    <div className="space-y-0.5">
                                                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
                                                            {daysLeft !== null ? `${daysLeft} days remaining` : 'Active'}
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 font-medium">
                                                            Until {new Date(sub.trialEndDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ) : isExpired ? (
                                                    <span className="text-[11px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 inline-block">
                                                        Expired {sub.trialEndDate ? new Date(sub.trialEndDate).toLocaleDateString() : ''}
                                                    </span>
                                                ) : isFrozen ? (
                                                    <span className="text-[11px] text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 inline-block">
                                                        ❄️ Manually Frozen
                                                    </span>
                                                ) : isRejected ? (
                                                    <span className="text-[11px] text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-200 inline-block">
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">N/A</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    isPending ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                    isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                    isFrozen ? 'bg-slate-900 text-white border-slate-950' :
                                                    isExpired ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                                    'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {sub.status || 'Inactive'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Details */}
                                                    <button
                                                        onClick={() => openModal(r, 'details')}
                                                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Approve / Reject when Pending */}
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal(r, 'approve')}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-xs flex items-center gap-1"
                                                            >
                                                                <CheckCircle size={13} /> Approve (7-Days)
                                                            </button>
                                                            <button
                                                                onClick={() => openModal(r, 'reject')}
                                                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Manual Freeze / Unfreeze */}
                                                    {!isPending && !isFrozen && (
                                                        <button
                                                            onClick={() => openModal(r, 'freeze')}
                                                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                            title="Manually Freeze Dashboard"
                                                        >
                                                            <Lock size={12} /> Freeze
                                                        </button>
                                                    )}

                                                    {isFrozen && (
                                                        <button
                                                            onClick={() => openModal(r, 'unfreeze')}
                                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                            title="Unfreeze Dashboard"
                                                        >
                                                            <Unlock size={12} /> Unfreeze
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ACTION MODALS */}

            {/* 1. APPROVE MODAL */}
            {modalType === 'approve' && selectedRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                            <CheckCircle size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black text-slate-900">Approve 7-Day Free Trial</h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Restaurant: <span className="font-bold text-slate-800">{selectedRestaurant.name}</span>
                            </p>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2 text-emerald-900">
                            <p className="font-bold">⚠️ Trial Duration Notice:</p>
                            <p className="leading-relaxed">
                                The 7-day trial countdown will <strong>begin immediately right now</strong> upon your confirmation and will run for exactly 7 days (ending on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}).
                            </p>
                            <p className="leading-relaxed font-semibold">
                                Approval and trial start email notifications will be sent to <strong>{selectedRestaurant.ownerId?.email}</strong>.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                            >
                                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm & Activate Trial'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. REJECT MODAL */}
            {modalType === 'reject' && selectedRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                            <XCircle size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black text-slate-900">Reject Free Trial Request</h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Restaurant: <span className="font-bold text-slate-800">{selectedRestaurant.name}</span>
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Rejection Reason (Emailed to owner)</label>
                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder="Explain why the trial request was rejected..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 focus:bg-white min-h-[90px] resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                            >
                                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : 'Reject Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. FREEZE MODAL */}
            {modalType === 'freeze' && selectedRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                            <Lock size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black text-slate-900">Manually Freeze Dashboard</h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Restaurant: <span className="font-bold text-slate-800">{selectedRestaurant.name}</span>
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Reason for Freeze (Required)</label>
                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder="Administrative review hold, compliance verification, etc."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 focus:bg-white min-h-[90px] resize-none"
                            />
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 font-medium leading-relaxed">
                            ❄️ Freezing immediately blocks protected operational dashboard APIs for this restaurant while securely preserving all data.
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFreeze}
                                disabled={isSubmitting || !actionReason.trim()}
                                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : 'Freeze Dashboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. UNFREEZE MODAL */}
            {modalType === 'unfreeze' && selectedRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Unlock size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black text-slate-900">Unfreeze Dashboard Access</h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Restaurant: <span className="font-bold text-slate-800">{selectedRestaurant.name}</span>
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-2 text-blue-900">
                            <p className="font-bold">Subscription Access Rule:</p>
                            <p className="leading-relaxed">
                                Unfreezing is permitted <strong>only if the restaurant has a valid, active trial or paid subscription</strong>. It will strictly reject unfreezing if the trial or payment is expired.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnfreeze}
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                            >
                                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Unfreeze'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. DETAILS MODAL */}
            {modalType === 'details' && selectedRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{selectedRestaurant.name}</h3>
                                <p className="text-xs text-slate-500">Subscription & Trial Audit Log</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-black text-xs uppercase">
                                {selectedRestaurant.subscription?.status || 'Inactive'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Owner Name</span>
                                <p className="font-extrabold text-slate-800">{selectedRestaurant.ownerId?.name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Owner Email</span>
                                <p className="font-extrabold text-slate-800">{selectedRestaurant.ownerId?.email || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                                <p className="font-extrabold text-slate-800">{selectedRestaurant.ownerId?.phoneNumber || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</span>
                                <p className="font-extrabold text-slate-800">{selectedRestaurant.subscription?.paymentStatus || 'Trial'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Trial Start Date</span>
                                <p className="font-extrabold text-slate-800">
                                    {selectedRestaurant.subscription?.trialStartDate ? new Date(selectedRestaurant.subscription.trialStartDate).toLocaleString() : 'Not Started'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Trial End Date</span>
                                <p className="font-extrabold text-slate-800">
                                    {selectedRestaurant.subscription?.trialEndDate ? new Date(selectedRestaurant.subscription.trialEndDate).toLocaleString() : 'Not Set'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved By</span>
                                <p className="font-extrabold text-slate-800">
                                    {selectedRestaurant.subscription?.approvedBy?.name || 'Pending'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved At</span>
                                <p className="font-extrabold text-slate-800">
                                    {selectedRestaurant.subscription?.approvedAt ? new Date(selectedRestaurant.subscription.approvedAt).toLocaleString() : 'Pending'}
                                </p>
                            </div>
                        </div>

                        {selectedRestaurant.subscription?.freezeReason && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Freeze Reason:</span>
                                <p className="text-slate-800 font-semibold">{selectedRestaurant.subscription.freezeReason}</p>
                            </div>
                        )}

                        {selectedRestaurant.subscription?.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs space-y-1">
                                <span className="text-[10px] font-bold text-red-500 uppercase">Rejection Reason:</span>
                                <p className="text-red-800 font-semibold">{selectedRestaurant.subscription.rejectionReason}</p>
                            </div>
                        )}

                        <button
                            onClick={closeModal}
                            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreeTrialManagement;

