import { useState, useEffect } from 'react';
import { 
    Calendar, Clock, Plus, X, AlertCircle, CheckCircle2, 
    XCircle, Ban, FileText, ChevronRight, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const LEAVE_TYPES = [
    { id: 'Casual Leave', label: 'Casual Leave (Standard)', isPaid: true },
    { id: 'Sick Leave', label: 'Sick / Medical Leave', isPaid: true },
    { id: 'Paid Leave', label: 'Paid Annual Leave', isPaid: true },
    { id: 'Unpaid Leave', label: 'Unpaid Leave (LOP)', isPaid: false },
    { id: 'Emergency Leave', label: 'Emergency Leave', isPaid: true }
];

const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                    Approved
                </span>
            );
        case 'Pending':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                    <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                    Pending Approval
                </span>
            );
        case 'Rejected':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    <XCircle size={13} className="text-rose-600 dark:text-rose-400" />
                    Rejected
                </span>
            );
        case 'Cancelled':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    <Ban size={13} />
                    Cancelled
                </span>
            );
        default:
            return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
};

const StaffMyLeave = () => {
    const { api, user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    const [form, setForm] = useState({
        leaveType: 'Casual Leave',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
    });

    const fetchMyLeaves = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/staff/leave/my');
            setLeaves(data);
        } catch (error) {
            console.error('Failed to load my leaves', error);
            toast.error(error.response?.data?.message || 'Failed to fetch leave history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyLeaves();
    }, []);

    // Calculate duration in days
    const calculateDays = (start, end) => {
        if (!start || !end) return 1;
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 0;
        const diffMs = e.getTime() - s.getTime();
        return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    };

    const currentDurationDays = calculateDays(form.startDate, form.endDate);

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        if (!form.reason.trim()) {
            toast.error('Please enter a reason for your leave request');
            return;
        }
        if (new Date(form.startDate) > new Date(form.endDate)) {
            toast.error('End date must be on or after start date');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await api.post('/staff/leave', {
                leaveType: form.leaveType,
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason.trim()
            });

            toast.success(data.message || 'Leave request submitted successfully!');
            setIsApplyModalOpen(false);
            setForm({
                leaveType: 'Casual Leave',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: ''
            });
            fetchMyLeaves();
        } catch (error) {
            console.error('Apply leave error', error);
            toast.error(error.response?.data?.message || 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelLeave = async (leaveId) => {
        if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;

        try {
            setCancellingId(leaveId);
            const { data } = await api.put(`/staff/leave/${leaveId}/cancel`, {
                reason: 'Cancelled by staff member'
            });
            toast.success(data.message || 'Leave request cancelled');
            fetchMyLeaves();
        } catch (error) {
            console.error('Cancel leave error', error);
            toast.error(error.response?.data?.message || 'Failed to cancel leave request');
        } finally {
            setCancellingId(null);
        }
    };

    // Monthly summary stats for current logged-in staff
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthLeaves = leaves.filter(l => {
        const d = new Date(l.startDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const approvedCount = currentMonthLeaves.filter(l => l.status === 'Approved').reduce((acc, l) => acc + (l.daysCount || 0), 0);
    const pendingCount = currentMonthLeaves.filter(l => l.status === 'Pending').reduce((acc, l) => acc + (l.daysCount || 0), 0);
    const unpaidLOPCount = currentMonthLeaves.filter(l => l.status === 'Approved' && !l.isPaid).reduce((acc, l) => acc + (l.daysCount || 0), 0);

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16 font-sans">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        My Leave Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Submit time-off requests, track approval status, and review your historical leave records.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer w-fit"
                >
                    <Plus size={16} />
                    <span>Apply for Leave</span>
                </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                            Approved This Month
                        </span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {approvedCount} <span className="text-xs font-semibold text-gray-500">Days</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                            Pending Requests
                        </span>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                            {pendingCount} <span className="text-xs font-semibold text-gray-500">Days</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                            Unpaid / LOP Leaves
                        </span>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                            {unpaidLOPCount} <span className="text-xs font-semibold text-gray-500">Days</span>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
                        <AlertCircle size={20} />
                    </div>
                </div>
            </div>

            {/* Leave History Table / Card List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-base font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Leave History &amp; Applications
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Track the status of all requests submitted to your branch management.
                        </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-full">
                        Total Requests: {leaves.length}
                    </span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-gray-400 text-xs font-bold animate-pulse">
                        Loading your leave applications...
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                            <Calendar size={28} />
                        </div>
                        <h3 className="font-bold text-gray-700 dark:text-slate-300 text-sm">No Leave Requests Found</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            You have not submitted any leave requests yet. Click "Apply for Leave" above whenever you need time off.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-slate-850 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-5">Leave Type</th>
                                    <th className="py-3.5 px-5">Duration / Dates</th>
                                    <th className="py-3.5 px-5">Reason</th>
                                    <th className="py-3.5 px-5">Compensation Policy</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5">Manager Remarks</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                                {leaves.map((leave) => {
                                    const sDate = new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                    const eDate = new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                    return (
                                        <tr key={leave._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-5">
                                                <span className="font-black text-gray-900 dark:text-white block text-sm">
                                                    {leave.leaveType}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    Submitted: {new Date(leave.appliedAt || leave.createdAt).toLocaleDateString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-gray-900 dark:text-white">
                                                    {sDate} {sDate !== eDate && `→ ${eDate}`}
                                                </div>
                                                <span className="inline-block mt-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                                                    {leave.daysCount} {leave.daysCount === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 max-w-xs truncate" title={leave.reason}>
                                                <p className="line-clamp-2 text-gray-600 dark:text-slate-300">{leave.reason}</p>
                                            </td>
                                            <td className="py-4 px-5">
                                                {leave.isPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Paid Leave
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        Unpaid (Loss of Pay)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5">
                                                {getStatusBadge(leave.status)}
                                            </td>
                                            <td className="py-4 px-5 text-gray-500 dark:text-slate-400">
                                                {leave.managerRemarks ? (
                                                    <div className="space-y-0.5">
                                                        <p className="font-semibold text-gray-800 dark:text-slate-200">{leave.managerRemarks}</p>
                                                        {leave.approvalDate && (
                                                            <span className="text-[10px] text-gray-400 block">
                                                                Reviewed on {new Date(leave.approvalDate).toLocaleDateString('en-IN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No remarks</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                {leave.status === 'Pending' ? (
                                                    <button
                                                        type="button"
                                                        disabled={cancellingId === leave._id}
                                                        onClick={() => handleCancelLeave(leave._id)}
                                                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                                    >
                                                        {cancellingId === leave._id ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 font-medium">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Apply for Leave */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        Submit Leave Application
                                    </h3>
                                    <p className="text-xs text-gray-400">Request planned time off or report sick leave</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsApplyModalOpen(false)}
                                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleApplyLeave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Leave Category *
                                </label>
                                <select
                                    value={form.leaveType}
                                    onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {LEAVE_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={form.startDate}
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Duration preview pill */}
                            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                                <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                                    Total Leave Duration:
                                </span>
                                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl shadow-xs">
                                    {currentDurationDays} {currentDurationDays === 1 ? 'Day' : 'Days'}
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Reason / Description *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Explain the reason for your time-off request..."
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsApplyModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffMyLeave;
