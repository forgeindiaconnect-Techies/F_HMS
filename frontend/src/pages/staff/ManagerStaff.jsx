import { useState } from 'react';
import { Search, Plus, Calendar, Clock, UserCheck, UserX, AlertTriangle, MessageSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';

const mockShift = [
    { name: 'Marcus Wong', role: 'Head Chef', status: 'Active', timeIn: '08:00 AM', hours: '4h 30m', alert: false },
    { name: 'Elena Rodriguez', role: 'Senior Waiter', status: 'Active', timeIn: '09:00 AM', hours: '3h 30m', alert: false },
    { name: 'Jessica Lee', role: 'Line Cook', status: 'Break', timeIn: '08:30 AM', hours: '4h 00m', alert: true }, // approaching OT
    { name: 'David Smith', role: 'Cashier', status: 'Active', timeIn: '10:00 AM', hours: '2h 30m', alert: false },
    { name: 'Tom Hardy', role: 'Waiter', status: 'Late', timeIn: 'Expected 12:00 PM', hours: '-', alert: true },
];

const ManagerStaff = () => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Staff & Shifts</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage today's attendance, breaks, and shift coverage.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowScheduleModal(true)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
                        <Calendar size={16} /> Weekly Schedule
                    </button>
                    <button onClick={() => setShowAssignModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md">
                        <Plus size={18} /> Assign Shift
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><UserCheck size={20} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Clocked In</p><h3 className="text-xl font-bold text-gray-900">12</h3></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">On Break</p><h3 className="text-xl font-bold text-gray-900">3</h3></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg"><UserX size={20} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Late / Absent</p><h3 className="text-xl font-bold text-gray-900">1</h3></div>
                </div>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl shadow-sm text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Labor Cost (Today)</p>
                        <h3 className="text-xl font-bold mt-1">$485.00</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-green-400 font-bold">Optimal</p>
                        <p className="text-[10px] text-gray-400 mt-1">18% of Rev</p>
                    </div>
                </div>
            </div>

            {/* Shift Roster */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Current Shift Roster</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Search staff..." className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time In</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hours Today</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockShift.map((staff, i) => (
                                <tr key={i} className={`hover:bg-gray-50 transition-colors ${staff.alert ? 'bg-red-50/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 border border-gray-200">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    {staff.name}
                                                    {staff.alert && <AlertTriangle size={14} className="text-red-500" />}
                                                </p>
                                                <p className="text-xs text-gray-500">{staff.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            staff.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            staff.status === 'Break' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {staff.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{staff.timeIn}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{staff.hours}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => toast.success(`Messaging ${staff.name}...`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Message"><MessageSquare size={18} /></button>
                                            <button onClick={() => toast.success(`Managing schedule for ${staff.name}`)} className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                                Manage
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekly Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Calendar size={20} className="text-blue-600" /> Weekly Schedule (Current)</h3>
                            <button onClick={() => setShowScheduleModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-7 gap-2 text-center text-sm">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="font-bold text-gray-500 pb-2 border-b border-gray-200">{day}</div>
                                ))}
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i} className="min-h-[120px] p-2 bg-gray-50 rounded-lg space-y-2">
                                        <div className="bg-white border border-gray-200 rounded p-1.5 text-xs text-left shadow-sm">
                                            <span className="font-bold text-gray-800 block">Marcus W.</span>
                                            <span className="text-gray-500">08:00 - 16:00</span>
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded p-1.5 text-xs text-left shadow-sm">
                                            <span className="font-bold text-gray-800 block">Elena R.</span>
                                            <span className="text-gray-500">09:00 - 17:00</span>
                                        </div>
                                        {i === 4 || i === 5 ? (
                                             <div className="bg-orange-50 border border-orange-200 rounded p-1.5 text-xs text-left shadow-sm">
                                                <span className="font-bold text-orange-800 block">Open Shift</span>
                                                <span className="text-orange-600">18:00 - 00:00</span>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowScheduleModal(false)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Close</button>
                            <button onClick={() => { setShowScheduleModal(false); toast.success('Schedule exported'); }} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">Export PDF</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Shift Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Plus size={20} className="text-green-600" /> Assign New Shift</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Employee</label>
                                <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <option value="">Select Employee...</option>
                                    <option value="marcus">Marcus Wong (Head Chef)</option>
                                    <option value="elena">Elena Rodriguez (Senior Waiter)</option>
                                    <option value="jessica">Jessica Lee (Line Cook)</option>
                                    <option value="tom">Tom Hardy (Waiter)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                <input type="date" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                                    <input type="time" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                                    <input type="time" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role / Station</label>
                                <input type="text" placeholder="e.g. Grill Station" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={() => { setShowAssignModal(false); toast.success('Shift assigned successfully!'); }} className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors">Confirm Assignment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerStaff;
