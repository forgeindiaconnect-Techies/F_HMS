import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    MessageSquareQuote, Star, CheckCircle2, XCircle, Clock, AlertCircle, 
    Trash2, Eye, Search, Filter, RefreshCw, Check, X, ShieldAlert 
} from 'lucide-react';
import toast from 'react-hot-toast';

const TestimonialsManagement = () => {
    const { api } = useAuth();

    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for reject reason or card preview
    const [activeActionModal, setActiveActionModal] = useState(null); // { type: 'reject' | 'preview', item }
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const res = await api.get('/testimonials/admin/all', {
                params: { status: statusFilter }
            });
            if (res.data?.success) {
                setTestimonials(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching admin testimonials:', error);
            toast.error('Failed to load testimonials for review.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, [statusFilter]);

    const handleUpdateStatus = async (id, status, reason = '') => {
        try {
            setActionLoading(true);
            const res = await api.put(`/testimonials/admin/${id}/status`, {
                status,
                rejectionReason: reason
            });

            if (res.data?.success) {
                toast.success(res.data.message || `Testimonial updated to ${status}.`);
                setActiveActionModal(null);
                setRejectionReason('');
                fetchTestimonials();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this testimonial?')) return;

        try {
            const res = await api.delete(`/testimonials/admin/${id}`);
            if (res.data?.success) {
                toast.success('Testimonial deleted successfully.');
                fetchTestimonials();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete.');
        }
    };

    const filteredTestimonials = testimonials.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.ownerName?.toLowerCase().includes(q) ||
            t.restaurantName?.toLowerCase().includes(q) ||
            t.location?.toLowerCase().includes(q) ||
            t.quote?.toLowerCase().includes(q)
        );
    });

    const counts = {
        all: testimonials.length,
        Pending: testimonials.filter(t => t.status === 'Pending').length,
        Approved: testimonials.filter(t => t.status === 'Approved').length,
        Rejected: testimonials.filter(t => t.status === 'Rejected').length
    };

    const formatAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
        const apiBase = import.meta.env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
        let origin = '';
        try { origin = new URL(apiBase).origin; } catch (_) {}
        return `${origin}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
                        <MessageSquareQuote size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Partner Testimonials Moderation
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Review and publish authentic testimonials from registered restaurant owners.
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchTestimonials}
                    className="self-start sm:self-auto px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { key: 'all', label: 'All Reviews' },
                        { key: 'Pending', label: 'Pending Review', count: counts.Pending, alert: counts.Pending > 0 },
                        { key: 'Approved', label: 'Approved (Live)', count: counts.Approved },
                        { key: 'Rejected', label: 'Rejected', count: counts.Rejected }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer ${
                                statusFilter === tab.key 
                                    ? 'bg-[#FF5A1F] text-white shadow-md shadow-orange-500/20' 
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    statusFilter === tab.key 
                                        ? 'bg-white/20 text-white' 
                                        : tab.alert ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search testimonials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all outline-none"
                    />
                </div>
            </div>

            {/* Testimonials List / Table */}
            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 border-3 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-500">Loading submitted testimonials...</p>
                </div>
            ) : filteredTestimonials.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <MessageSquareQuote size={24} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        No testimonials found
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {statusFilter === 'Pending' 
                            ? 'No testimonials pending approval at this time.' 
                            : 'No partner testimonials match your current filter.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTestimonials.map(item => (
                        <div 
                            key={item._id}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                            {/* Left: Author & Content */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                {formatAvatarUrl(item.avatar) ? (
                                    <img
                                        src={formatAvatarUrl(item.avatar)}
                                        alt={item.ownerName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold text-base flex items-center justify-center border-2 border-purple-200 dark:border-purple-800 shrink-0">
                                        {item.ownerName ? item.ownerName.trim().charAt(0).toUpperCase() : 'O'}
                                    </div>
                                )}

                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-black text-sm text-slate-900 dark:text-white">
                                            {item.ownerName}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-medium">
                                            • {item.restaurantName} ({item.location})
                                        </span>
                                        
                                        {/* Status Tag */}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            item.status === 'Approved'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : item.status === 'Pending'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="flex items-center gap-1 text-[#FF5A0A]">
                                        {[...Array(item.rating || 5)].map((_, i) => (
                                            <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                                        ))}
                                        <span className="text-[11px] text-slate-400 font-semibold ml-1">
                                            ({item.rating || 5}/5)
                                        </span>
                                    </div>

                                    {/* Quote Text */}
                                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                        "{item.quote}"
                                    </p>

                                    {item.status === 'Rejected' && item.rejectionReason && (
                                        <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 p-2 rounded-lg mt-2">
                                            <strong>Rejection reason:</strong> {item.rejectionReason}
                                        </div>
                                    )}

                                    <div className="text-[10px] text-slate-400 pt-1">
                                        Submitted on: {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {item.approvedAt && ` • Approved on: ${new Date(item.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Moderation Actions */}
                            <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                
                                {item.status !== 'Approved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(item._id, 'Approved')}
                                        disabled={actionLoading}
                                        className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Check size={14} /> Approve &amp; Publish
                                    </button>
                                )}

                                {item.status !== 'Rejected' && (
                                    <button
                                        onClick={() => {
                                            setActiveActionModal({ type: 'reject', item });
                                            setRejectionReason('');
                                        }}
                                        disabled={actionLoading}
                                        className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <X size={14} /> Reject
                                    </button>
                                )}

                                {item.status === 'Approved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(item._id, 'Pending')}
                                        disabled={actionLoading}
                                        className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Clock size={14} /> Revert to Pending
                                    </button>
                                )}

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setActiveActionModal({ type: 'preview', item })}
                                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="Preview Card"
                                    >
                                        <Eye size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Reason Modal */}
            {activeActionModal?.type === 'reject' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                <ShieldAlert size={18} className="text-rose-600" />
                                Reject Testimonial
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveActionModal(null)}
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Provide feedback for <strong>{activeActionModal.item.ownerName}</strong> ({activeActionModal.item.restaurantName}). This will be visible on their dashboard.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Reason for Rejection / Suggested Revision
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Please clarify your restaurant location or add more details about your specific results with the software..."
                                rows={3}
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setActiveActionModal(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleUpdateStatus(activeActionModal.item._id, 'Rejected', rejectionReason)}
                                disabled={actionLoading}
                                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                {actionLoading ? 'Saving...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Card Preview Modal */}
            {activeActionModal?.type === 'preview' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                Public Card Preview
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveActionModal(null)}
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Card matching landing page */}
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm text-left flex flex-col justify-between space-y-4">
                            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                                "{activeActionModal.item.quote}"
                            </p>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={formatAvatarUrl(activeActionModal.item.avatar)} 
                                        alt={activeActionModal.item.ownerName}
                                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                    />
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                                            {activeActionModal.item.ownerName}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {activeActionModal.item.restaurantName}, {activeActionModal.item.location}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex text-[#FF5A0A]">
                                    {[...Array(activeActionModal.item.rating || 5)].map((_, i) => (
                                        <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setActiveActionModal(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TestimonialsManagement;
