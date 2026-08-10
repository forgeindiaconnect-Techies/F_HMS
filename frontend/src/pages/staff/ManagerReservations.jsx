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
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Reservation Approval</h2>
                    <p className="text-gray-500 text-sm mt-1">Review and manage incoming table booking requests.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Booked Tables (Tonight)</p>
                        <p className="text-2xl font-bold text-gray-900">{approvedRequests.length} confirmed</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Pending Approvals */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <Clock size={20} className="text-orange-500" /> Pending Requests ({pendingRequests.length})
                        </h3>
                        
                        {pendingRequests.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 border border-gray-150 text-center shadow-sm">
                                <p className="text-gray-400 font-medium">No pending reservation requests.</p>
                            </div>
                        ) : (
                            pendingRequests.map((res, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{res.guestName}</h4>
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">Standard</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarCheck size={16} /> 
                                                {new Date(res.date).toLocaleDateString()} {res.timeSlot}
                                            </span>
                                            <span className="flex items-center gap-1.5"><Users size={16} /> {res.guestCount} Guests</span>
                                            <span className="flex items-center gap-1.5"><Phone size={16} /> {res.guestPhone}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setActionModal({ show: true, type: 'message', reservation: res })} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Message Customer">
                                            <MessageSquare size={20} />
                                        </button>
                                        <button onClick={() => setActionModal({ show: true, type: 'reject', reservation: res })} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
                                            <X size={16} /> Reject
                                        </button>
                                        <button onClick={() => setActionModal({ show: true, type: 'approve', reservation: res })} className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold text-sm transition-colors shadow-sm">
                                            <Check size={16} /> Approve
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Approved Upcoming */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <CheckCircle size={20} className="text-green-500" /> Upcoming Confirmed
                        </h3>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            {approvedRequests.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-xs">
                                    No confirmed reservations.
                                </div>
                            ) : (
                                approvedRequests.map((res, i) => (
                                    <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 text-sm">{res.guestName}</h4>
                                            <span className="text-xs font-bold text-gray-500">
                                                {new Date(res.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-600">
                                            <span className="flex items-center gap-1"><Users size={14} /> {res.guestCount} Guests</span>
                                            <span className="text-[10px] font-mono text-gray-400">{res.timeSlot}</span>
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
                                {actionModal.type === 'message' && <><MessageSquare size={20} className="text-blue-600"/> Message Customer</>}
                                {actionModal.type === 'reject' && <><X size={20} className="text-red-600"/> Reject Reservation</>}
                                {actionModal.type === 'approve' && <><Check size={20} className="text-green-600"/> Approve Reservation</>}
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
                                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${
                                    actionModal.type === 'message' ? 'bg-blue-600 hover:bg-blue-700' :
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
