import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
    MessageSquare, CheckCircle2, Clock, Star, Users, 
    Search, LifeBuoy, Phone, Mail, Send,
    RefreshCw, Filter, Sparkles, AlertCircle, Eye, X
} from 'lucide-react';

const AdminCustomerCare = () => {
    const { api } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'reviews'

    // Reply Modal
    const [replyModal, setReplyModal] = useState({ open: false, inquiry: null, replyText: '' });
    const [submittingReply, setSubmittingReply] = useState(false);

    const fetchData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const capTimer = setTimeout(() => {
            setLoading(false);
            setRefreshing(false);
        }, 3000);

        try {
            const [inquiriesRes, ordersRes] = await Promise.all([
                api.get('/inquiries/restaurant').catch(() => ({ data: [] })),
                api.get('/orders').catch(() => ({ data: [] }))
            ]);

            if (Array.isArray(inquiriesRes.data)) {
                setInquiries(inquiriesRes.data);
            }

            // Extract customer order reviews
            const reviewed = (Array.isArray(ordersRes.data) ? ordersRes.data : [])
                .filter(order => 
                    (order.deliveryRating && (order.deliveryRating.overall > 0 || order.deliveryRating.review)) ||
                    (order.internalRating && order.internalRating > 0)
                )
                .map(order => {
                    const rating = order.deliveryRating?.overall || order.internalRating || 5;
                    const comment = order.deliveryRating?.review || 'Order completed smoothly.';
                    return {
                        id: `#ORD-${order._id.substring(order._id.length - 6).toUpperCase()}`,
                        customerName: order.user?.name || 'Diner',
                        customerPhone: order.user?.phoneNumber || order.user?.phone || 'N/A',
                        rating,
                        comment,
                        createdAt: order.createdAt
                    };
                });
            setFeedback(reviewed);
        } catch (err) {
            console.error('Failed to load customer care data:', err);
            toast.error('Unable to sync customer care data');
        } finally {
            clearTimeout(capTimer);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [api]);

    // Handle Quick Status Update
    const handleUpdateStatus = async (id, status, replyText = '') => {
        setUpdatingId(id);
        try {
            const payload = { status };
            if (replyText) payload.adminReply = replyText;

            const { data } = await api.put(`/inquiries/restaurant/${id}`, payload);
            setInquiries(prev => prev.map(item => (item._id === id ? data : item)));
            toast.success(`Inquiry marked as ${status}`);
            if (replyModal.open) {
                setReplyModal({ open: false, inquiry: null, replyText: '' });
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update ticket status');
        } finally {
            setUpdatingId(null);
            setSubmittingReply(false);
        }
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyModal.inquiry) return;
        setSubmittingReply(true);
        handleUpdateStatus(replyModal.inquiry._id, 'In Progress', replyModal.replyText);
    };

    // Filtered Inquiries
    const filteredInquiries = useMemo(() => {
        return inquiries.filter(item => {
            const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query || 
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.email && item.email.toLowerCase().includes(query)) ||
                (item.phone && item.phone.toLowerCase().includes(query)) ||
                (item.subject && item.subject.toLowerCase().includes(query)) ||
                (item.message && item.message.toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [inquiries, statusFilter, searchQuery]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = inquiries.length;
        const newCount = inquiries.filter(i => !i.status || i.status === 'New').length;
        const inProgressCount = inquiries.filter(i => i.status === 'In Progress').length;
        const resolvedCount = inquiries.filter(i => i.status === 'Resolved').length;
        const avgRating = feedback.length > 0
            ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)
            : '5.0';

        return { total, newCount, inProgressCount, resolvedCount, avgRating };
    }, [inquiries, feedback]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-sans">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading Customer Care Portal...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-slate-100">
            {/* Top Navigation Switcher: Admin & Customer vs Admin & Super Admin */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-slate-900/80 rounded-2xl w-fit border border-gray-200/80 dark:border-slate-800 shadow-inner">
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md transition-all cursor-default"
                >
                    <MessageSquare size={16} />
                    <span>Admin & Customer</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {stats.total}
                    </span>
                </button>

                <Link
                    to="/admin/support/super-admin"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                    <LifeBuoy size={16} />
                    <span>Admin & Super Admin</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                        Platform Helpdesk
                    </span>
                </Link>
            </div>

            {/* Main Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-6">
                    <MessageSquare size={280} />
                </div>
                <div className="space-y-2 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={12} /> Live Diner Support & Care
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black font-sans leading-tight">Customer Care & Inquiries</h1>
                    <p className="text-emerald-100/80 max-w-xl text-xs sm:text-sm leading-relaxed">
                        Review, answer, and manage direct inquiries, feedback, and support tickets submitted by customers visiting your restaurant online or in person.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative z-10">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-start justify-between min-w-0">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Total Inquiries</span>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.total}</h2>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                        <MessageSquare size={18} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-start justify-between min-w-0">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">New / Action Needed</span>
                        <h2 className={`text-xl sm:text-2xl font-black ${stats.newCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {stats.newCount}
                        </h2>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                        <AlertCircle size={18} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-start justify-between min-w-0">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">In Progress</span>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{stats.inProgressCount}</h2>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                        <Clock size={18} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-start justify-between min-w-0">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Resolved</span>
                        <h2 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.resolvedCount}</h2>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                        <CheckCircle2 size={18} />
                    </div>
                </div>

                <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-start justify-between min-w-0">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Diner CSAT</span>
                        <h2 className="text-xl sm:text-2xl font-black text-amber-500 flex items-center gap-1">
                            {stats.avgRating} <Star size={18} className="fill-amber-400 text-amber-400" />
                        </h2>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/40">
                        <Star size={18} />
                    </div>
                </div>
            </div>

            {/* View Tabs: Inquiries & Diner Reviews */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 gap-6">
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'inquiries'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                >
                    <MessageSquare size={16} />
                    Customer Inquiries & Tickets ({inquiries.length})
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        activeTab === 'reviews'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Star size={16} />
                    Customer Order Reviews ({feedback.length})
                </button>
            </div>

            {activeTab === 'inquiries' ? (
                <>
                    {/* Search & Status Filter Toolbar */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Search Input */}
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by diner name, phone, email, subject..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 dark:text-white"
                            />
                            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
                            {['All', 'New', 'In Progress', 'Resolved'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customer Inquiries Cards Feed */}
                    {filteredInquiries.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">No Customer Inquiries Found</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 max-w-md mx-auto">
                                {searchQuery || statusFilter !== 'All' 
                                    ? 'No inquiries match the current search or filter criteria. Try clearing filters.'
                                    : 'All customer tickets have been handled or no inquiries have been submitted yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredInquiries.map((inq) => {
                                const initials = (inq.name || 'C').substring(0, 2).toUpperCase();
                                const isUpdating = updatingId === inq._id;
                                const isNew = !inq.status || inq.status === 'New';
                                const isInProgress = inq.status === 'In Progress';
                                const isResolved = inq.status === 'Resolved';

                                return (
                                    <div 
                                        key={inq._id}
                                        className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            {/* Left Customer Info */}
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                                                    {initials}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                                                            {inq.name}
                                                        </h4>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                                            isResolved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' :
                                                            isInProgress ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                                                        }`}>
                                                            {inq.status || 'New'}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-semibold">
                                                            {inq.source || 'Customer'}
                                                        </span>
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                                                        {inq.email && inq.email !== 'N/A' && (
                                                            <a 
                                                                href={`mailto:${inq.email}?subject=Regarding: ${encodeURIComponent(inq.subject || 'Your Inquiry')}`}
                                                                className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                                            >
                                                                <Mail size={12} /> {inq.email}
                                                            </a>
                                                        )}
                                                        {inq.phone && inq.phone !== 'N/A' && (
                                                            <a 
                                                                href={`tel:${inq.phone}`}
                                                                className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                                            >
                                                                <Phone size={12} /> {inq.phone}
                                                            </a>
                                                        )}
                                                        <span>•</span>
                                                        <span className="text-[11px] text-gray-400">
                                                            {new Date(inq.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                                                {!isResolved && (
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => setReplyModal({ open: true, inquiry: inq, replyText: inq.adminReply || '' })}
                                                        className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Send size={13} /> Reply / Note
                                                    </button>
                                                )}

                                                {!isInProgress && !isResolved && (
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => handleUpdateStatus(inq._id, 'In Progress')}
                                                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        In Progress
                                                    </button>
                                                )}

                                                {!isResolved && (
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => handleUpdateStatus(inq._id, 'Resolved')}
                                                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={13} /> Resolve
                                                    </button>
                                                )}

                                                {isResolved && (
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => handleUpdateStatus(inq._id, 'In Progress')}
                                                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 hover:text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                                                    >
                                                        Reopen
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject & Message Body */}
                                        <div className="bg-gray-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/80 space-y-1.5">
                                            <p className="text-xs font-bold text-gray-900 dark:text-slate-200 uppercase tracking-wide">
                                                {inq.subject}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                                                {inq.message}
                                            </p>
                                        </div>

                                        {/* Admin Reply or Resolution Note if Present */}
                                        {inq.adminReply && (
                                            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-xs space-y-1">
                                                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                                                    <span className="flex items-center gap-1.5">
                                                        <CheckCircle2 size={13} /> Staff Response / Note:
                                                    </span>
                                                    {inq.repliedAt && (
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                                            {new Date(inq.repliedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                                                    {inq.adminReply}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                /* Customer Order Reviews Tab */
                <div className="space-y-4">
                    {feedback.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mx-auto">
                                <Star size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">No Diner Reviews Yet</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 max-w-md mx-auto">
                                Customer ratings and order feedback submitted after dine-in or delivery will appear here automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {feedback.map((fb, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{fb.customerName}</h4>
                                            <span className="text-[11px] text-gray-400 font-semibold">{fb.id}</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-xs font-black">
                                            <span>{fb.rating}</span>
                                            <Star size={13} className="fill-amber-400 text-amber-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 italic">
                                        "{fb.comment}"
                                    </p>
                                    <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                                        <span>Ordered {new Date(fb.createdAt).toLocaleDateString()}</span>
                                        {fb.customerPhone !== 'N/A' && (
                                            <a href={`tel:${fb.customerPhone}`} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                                                <Phone size={11} /> Call Diner
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Reply / Admin Note Modal */}
            {replyModal.open && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare size={18} className="text-emerald-600" /> Reply to {replyModal.inquiry?.name}
                            </h3>
                            <button
                                onClick={() => setReplyModal({ open: false, inquiry: null, replyText: '' })}
                                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-950 p-3 rounded-2xl text-xs space-y-1">
                            <p className="font-bold text-gray-800 dark:text-slate-200">{replyModal.inquiry?.subject}</p>
                            <p className="text-gray-600 dark:text-slate-400 italic">"{replyModal.inquiry?.message}"</p>
                        </div>

                        <form onSubmit={handleSendReply} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                                    Admin Response / Resolution Note
                                </label>
                                <textarea
                                    rows={4}
                                    value={replyModal.replyText}
                                    onChange={(e) => setReplyModal(prev => ({ ...prev, replyText: e.target.value }))}
                                    placeholder="Enter your response to the customer or internal resolution note..."
                                    required
                                    className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReplyModal({ open: false, inquiry: null, replyText: '' })}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReply}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Send size={13} /> {submittingReply ? 'Saving...' : 'Save & Mark In Progress'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomerCare;

