import { useState, useEffect } from 'react';
import { CalendarCheck, Users, Clock, Check, X, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerReservations = () => {
    const { api, user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionModal, setActionModal] = useState({ show: false, type: '', reservation: null });
    const [selectedTable, setSelectedTable] = useState('');
    const [internalNotes, setInternalNotes] = useState('');

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reservations');
            // Filter reservations for current branch if manager
            const filtered = res.data.filter(r => {
                if (user.role === 'RestaurantAdmin' || user.role === 'SuperAdmin' || !user.branchId) {
                    return true;
                }
                const resBranchId = r.branch?._id || r.branch;
                const managerBranchId = user.branchId?._id || user.branchId;
                return resBranchId && managerBranchId && resBranchId.toString() === managerBranchId.toString();
            });
            setReservations(filtered);
        } catch (err) {
            console.error('Failed to fetch reservations', err);
            toast.error('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables');
            setTables(res.data);
        } catch (err) {
            console.error('Failed to fetch tables', err);
        }
    };

    useEffect(() => {
        fetchReservations();
        fetchTables();
    }, []);

    const handleAction = async () => {
        if (!actionModal.reservation) return;
        const resId = actionModal.reservation._id;

        try {
            let nextStatus = 'Pending';
            if (actionModal.type === 'approve') nextStatus = 'Confirmed';
            else if (actionModal.type === 'reject') nextStatus = 'Cancelled';

            await api.patch(`/reservations/${resId}/status`, {
                status: nextStatus
            });

            toast.success(
                actionModal.type === 'message' ? 'Message sent!' :
                    actionModal.type === 'reject' ? 'Reservation rejected.' :
                        'Reservation approved!'
            );

            setActionModal({ show: false, type: '', reservation: null });
            setSelectedTable('');
            setInternalNotes('');
            fetchReservations();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update reservation status');
        }
    };

    const pendingRequests = reservations.filter(r => r.status === 'Pending');
    const approvedRequests = reservations.filter(r => r.status === 'Confirmed');

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Reservation Approval</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Review and manage incoming table booking requests.</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2.5">
                    <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider leading-none">Booked Tables (Tonight)</p>
                        <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight mt-0.5">{approvedRequests.length} confirmed</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                    {/* Pending Approvals */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-xs flex flex-col min-w-0">
                        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <Clock size={18} className="text-orange-500 shrink-0" /> Pending Requests
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800">
                                {pendingRequests.length}
                            </span>
                        </div>

                        {pendingRequests.length === 0 ? (
                            <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-center bg-gray-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-6">
                                <p className="text-gray-400 font-medium text-sm">No pending reservation requests.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 flex-1">
                                {pendingRequests.map((res, i) => (
                                    <div key={res._id || i} className="bg-gray-50/60 dark:bg-slate-800/40 rounded-xl p-4 border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                                        <div className="flex-1 min-w-0 pl-1">
                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{res.guestName}</h4>
                                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shrink-0">Standard</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-600 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarCheck size={14} className="shrink-0" />
                                                    {new Date(res.date).toLocaleDateString()} {res.timeSlot}
                                                </span>
                                                <span className="flex items-center gap-1.5"><Users size={14} className="shrink-0" /> {res.guestCount} Guests</span>
                                                <span className="flex items-center gap-1.5"><Phone size={14} className="shrink-0" /> {res.guestPhone}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                                            <button onClick={() => setActionModal({ show: true, type: 'message', reservation: res })} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors cursor-pointer" title="Message Customer">
                                                <MessageSquare size={17} />
                                            </button>
                                            <button onClick={() => setActionModal({ show: true, type: 'reject', reservation: res })} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors cursor-pointer whitespace-nowrap">
                                                <X size={14} /> Reject
                                            </button>
                                            <button onClick={() => setActionModal({ show: true, type: 'approve', reservation: res })} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap">
                                                <Check size={14} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Approved Upcoming */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-xs flex flex-col min-w-0">
                        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <CheckCircle size={18} className="text-green-500 shrink-0" /> Upcoming Confirmed
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                                {approvedRequests.length}
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden bg-gray-50/30 dark:bg-slate-900">
                            {approvedRequests.length === 0 ? (
                                <div className="flex-1 min-h-[180px] p-6 text-center text-gray-400 text-sm flex items-center justify-center">
                                    No confirmed reservations.
                                </div>
                            ) : (
                                approvedRequests.map((res, i) => (
                                    <div key={res._id || i} className="p-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{res.guestName}</h4>
                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                <Users size={13} className="shrink-0" /> {res.guestCount} Guests
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                {new Date(res.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                                                {res.timeSlot}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modals */}
            {actionModal.show && actionModal.reservation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                {actionModal.type === 'message' && <><MessageSquare size={20} className="text-blue-600" /> Message Customer</>}
                                {actionModal.type === 'reject' && <><X size={20} className="text-red-600" /> Reject Reservation</>}
                                {actionModal.type === 'approve' && <><Check size={20} className="text-green-600" /> Approve Reservation</>}
                            </h3>
                            <button onClick={() => setActionModal({ show: false, type: '', reservation: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="font-bold text-gray-800 text-sm">{actionModal.reservation.guestName}</p>
                                <p className="text-xs text-gray-500">{new Date(actionModal.reservation.date).toLocaleDateString()} {actionModal.reservation.timeSlot} • {actionModal.reservation.guestCount} Guests</p>
                            </div>

                            {actionModal.type === 'message' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Message Content (SMS/Email)</label>
                                    <textarea rows="4" placeholder="Hello, we are contacting you regarding your reservation..." className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                                </div>
                            )}

                            {actionModal.type === 'reject' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Reason for Rejection</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3">
                                        <option>Fully Booked</option>
                                        <option>Outside Operating Hours</option>
                                        <option>Invalid Contact Info</option>
                                        <option>Other</option>
                                    </select>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Note to Customer (Optional)</label>
                                    <textarea rows="2" placeholder="Sorry, we are fully booked tonight..." className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
                                </div>
                            )}

                            {actionModal.type === 'approve' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Assign Table (Optional)</label>
                                        <select
                                            value={selectedTable}
                                            onChange={(e) => setSelectedTable(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="">Auto-Assign Later</option>
                                            {tables.map(t => (
                                                <option key={t._id} value={t._id}>Table {t.tableNumber} (Seats: {t.seatingCapacity})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Internal Notes</label>
                                        <input
                                            type="text"
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                            placeholder="e.g. Birthday anniversary, allergy"
                                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setActionModal({ show: false, type: '', reservation: null })} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button
                                onClick={handleAction}
                                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${actionModal.type === 'message' ? 'bg-blue-600 hover:bg-blue-700' :
                                    actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {actionModal.type === 'message' ? 'Send Message' : actionModal.type === 'reject' ? 'Confirm Rejection' : 'Confirm Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerReservations;
