import { CalendarCheck, Users, Clock, Check, X, Phone, MessageSquare, CheckCircle } from 'lucide-react';

const mockReservations = [
    { id: '#RES-102', name: 'John Doe', phone: '+1 555-0192', guests: 4, time: '19:00 Today', type: 'VIP', status: 'Pending' },
    { id: '#RES-103', name: 'Sarah Smith', phone: '+1 555-0184', guests: 2, time: '19:30 Today', type: 'Standard', status: 'Pending' },
    { id: '#RES-104', name: 'Corporate Event', phone: '+1 555-0111', guests: 12, time: '20:00 Today', type: 'Event', status: 'Approved' },
    { id: '#RES-105', name: 'Mike Johnson', phone: '+1 555-0177', guests: 6, time: '18:00 Tomorrow', type: 'Standard', status: 'Approved' },
];

const ManagerReservations = () => {
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
                        <p className="text-2xl font-bold text-gray-900">14 / 20</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Pending Approvals */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <Clock size={20} className="text-orange-500" /> Pending Requests (2)
                    </h3>
                    
                    {mockReservations.filter(r => r.status === 'Pending').map((res, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-gray-900 text-lg">{res.name}</h4>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${res.type === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{res.type}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600">
                                    <span className="flex items-center gap-1.5"><CalendarCheck size={16} /> {res.time}</span>
                                    <span className="flex items-center gap-1.5"><Users size={16} /> {res.guests} Guests</span>
                                    <span className="flex items-center gap-1.5"><Phone size={16} /> {res.phone}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => alert(`Messaging customer ${res.name}...`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Message Customer">
                                    <MessageSquare size={20} />
                                </button>
                                <button onClick={() => alert(`Rejecting reservation ${res.id}...`)} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
                                    <X size={16} /> Reject
                                </button>
                                <button onClick={() => alert(`Approving reservation ${res.id}...`)} className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold text-sm transition-colors shadow-sm">
                                    <Check size={16} /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Approved Upcoming */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <CheckCircle size={20} className="text-green-500" /> Upcoming Approved
                    </h3>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        {mockReservations.filter(r => r.status === 'Approved').map((res, i) => (
                            <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900 text-sm">{res.name}</h4>
                                    <span className="text-xs font-bold text-gray-500">{res.time}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><Users size={14} /> {res.guests} Guests</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${res.type === 'Event' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{res.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerReservations;
