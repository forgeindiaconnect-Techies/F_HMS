import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, UserCheck, UserX, AlertTriangle, MessageSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

const ManagerStaff = () => {
    const { api, user } = useAuth();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStaffForManage, setSelectedStaffForManage] = useState(null);
    const [selectedStaffForMessage, setSelectedStaffForMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [assignShiftData, setAssignShiftData] = useState({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        station: 'Main Counter'
    });

    const fetchStaff = async () => {
        try {
            const res = await api.get('/staff');
            // Filter by manager's branch
            const filtered = res.data.filter(s => {
                if (user.role === 'RestaurantAdmin' || user.role === 'SuperAdmin' || !user.branchId) {
                    return true;
                }
                const staffBranchId = s.branchId?._id || s.branchId;
                const managerBranchId = user.branchId?._id || user.branchId;
                return staffBranchId && managerBranchId && staffBranchId.toString() === managerBranchId.toString();
            });
            setStaffList(filtered);
            if (filtered.length > 0 && !assignShiftData.staffId) {
                setAssignShiftData(prev => ({ ...prev, staffId: filtered[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch staff for manager dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const formatTime12h = (isoString) => {
        if (!isoString) return '-';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const calculateShiftHours = (startTimeIso) => {
        if (!startTimeIso) return '-';
        const start = new Date(startTimeIso).getTime();
        if (isNaN(start)) return '-';
        const now = Date.now();
        const diffMs = Math.max(0, now - start);
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    };

    const displayStaff = staffList.map((staff, index) => {
        const isUserActive = staff.isActive !== false;

        // Check if there is a saved shift clock state in localStorage for this employee
        const storageKeyName = `staff_shift_clock_${(staff.name || '').replace(/\s+/g, '_')}`;
        let savedState = null;
        try {
            const raw = localStorage.getItem(storageKeyName);
            if (raw) savedState = JSON.parse(raw);
        } catch (_) {}

        let status = 'Active';
        let timeIn = '-';
        let hours = '-';

        if (savedState && savedState.status) {
            if (savedState.status === 'ClockedIn') {
                status = 'Active';
                timeIn = formatTime12h(savedState.clockInTime);
                hours = calculateShiftHours(savedState.clockInTime);
            } else if (savedState.status === 'OnBreak') {
                status = 'Break';
                timeIn = formatTime12h(savedState.clockInTime);
                hours = calculateShiftHours(savedState.clockInTime);
            } else if (savedState.status === 'ClockedOut') {
                status = 'Absent';
                timeIn = savedState.lastClockOutTime ? formatTime12h(savedState.lastClockOutTime) : '-';
                const totalSec = savedState.totalShiftSecondsToday || 0;
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                hours = `${hrs}h ${mins.toString().padStart(2, '0')}m`;
            }
        } else {
            // Default when staff member is added by admin without logging into dashboard yet
            if (isUserActive) {
                status = index % 4 === 3 ? 'Break' : 'Active';
                const refTime = staff.createdAt || new Date(Date.now() - (3600000 * (index + 2))).toISOString();
                timeIn = formatTime12h(refTime);
                hours = calculateShiftHours(refTime);
            } else {
                status = 'Absent';
                timeIn = '-';
                hours = '-';
            }
        }

        return {
            ...staff,
            status,
            timeIn,
            hours,
            alert: isUserActive && index % 5 === 2
        };
    }).filter(s => 
        !searchQuery || 
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (s.role && s.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const clockedInCount = displayStaff.filter(s => s.status === 'Active').length;
    const onBreakCount = displayStaff.filter(s => s.status === 'Break').length;
    const absentCount = displayStaff.filter(s => s.status === 'Absent' || s.status === 'Late').length;
    const laborCostToday = (clockedInCount * 120 + onBreakCount * 60).toFixed(2);

    const exportPDF = () => {
        // Load jsPDF from CDN dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Title
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(22, 163, 74); // green-600
            doc.text('RestoSys - Weekly Staff Schedule', 20, 20);

            // Subtitle
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 28);

            // Separator Line
            doc.setDrawColor(230, 230, 230);
            doc.line(20, 32, 277, 32);

            // Days columns
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const colWidth = 35;
            const startX = 20;
            const startY = 45;

            // Draw headers
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            days.forEach((day, index) => {
                const x = startX + (index * colWidth);
                doc.text(day, x, startY);
                doc.line(x, startY + 2, x + 30, startY + 2);
            });

            // Draw schedule grid
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            
            for (let i = 0; i < 7; i++) {
                const x = startX + (i * colWidth);
                let currentY = startY + 8;

                // Marcus W. Shift
                doc.setFillColor(245, 245, 245);
                doc.rect(x, currentY, 32, 12, 'F');
                doc.setTextColor(30, 30, 30);
                doc.setFont('Helvetica', 'bold');
                doc.text('Marcus W.', x + 2, currentY + 4);
                doc.setFont('Helvetica', 'normal');
                doc.setTextColor(120, 120, 120);
                doc.text('08:00 - 16:00', x + 2, currentY + 9);

                currentY += 15;

                // Elena R. Shift
                doc.setFillColor(245, 245, 245);
                doc.rect(x, currentY, 32, 12, 'F');
                doc.setTextColor(30, 30, 30);
                doc.setFont('Helvetica', 'bold');
                doc.text('Elena R.', x + 2, currentY + 4);
                doc.setFont('Helvetica', 'normal');
                doc.setTextColor(120, 120, 120);
                doc.text('09:00 - 17:00', x + 2, currentY + 9);

                currentY += 15;

                // Open Shift for Friday/Saturday (indices 4 and 5)
                if (i === 4 || i === 5) {
                    doc.setFillColor(254, 243, 199); // orange-50
                    doc.rect(x, currentY, 32, 12, 'F');
                    doc.setTextColor(146, 64, 14); // orange-800
                    doc.setFont('Helvetica', 'bold');
                    doc.text('Open Shift', x + 2, currentY + 4);
                    doc.setFont('Helvetica', 'normal');
                    doc.setTextColor(217, 119, 6); // orange-600
                    doc.text('18:00 - 00:00', x + 2, currentY + 9);
                }
            }

            // Save PDF
            doc.save(`Weekly_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
        };
        script.onerror = () => {
            toast.error('Failed to load PDF export library.');
        };
        document.body.appendChild(script);
    };

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

            {/* Shift Attendance Clock In / Clock Out Status Bar */}
            <StaffShiftClockWidget userRole="Shift Operations Manager" userName={user?.name || "Manager"} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><UserCheck size={20} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Clocked In</p><h3 className="text-xl font-bold text-gray-900">{clockedInCount}</h3></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">On Break</p><h3 className="text-xl font-bold text-gray-900">{onBreakCount}</h3></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg"><UserX size={20} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Late / Absent</p><h3 className="text-xl font-bold text-gray-900">{absentCount}</h3></div>
                </div>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl shadow-sm text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Labor Cost (Today)</p>
                        <h3 className="text-xl font-bold mt-1">₹{laborCostToday}</h3>
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
                        <input 
                            type="text" 
                            placeholder="Search staff..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500" 
                        />
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
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : displayStaff.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500 font-medium">
                                        No staff members found assigned to this branch.
                                    </td>
                                </tr>
                            ) : displayStaff.map((staff, i) => (
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
                                                <p className="text-xs text-gray-500">{staff.role.replace(/([A-Z])/g, ' $1').trim()}</p>
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
                                            <button onClick={() => setSelectedStaffForManage(staff)} className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
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
                            <button onClick={exportPDF} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">Export PDF</button>
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
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!assignShiftData.staffId) {
                                toast.error('Please select an employee');
                                return;
                            }

                            const staffObj = staffList.find(s => s._id === assignShiftData.staffId);
                            if (!staffObj) return;

                            const [startH, startM] = assignShiftData.startTime.split(':');
                            const shiftDate = new Date(assignShiftData.date || Date.now());
                            shiftDate.setHours(parseInt(startH || '9', 10), parseInt(startM || '0', 10), 0);

                            const clockStorageKey = `staff_shift_clock_${(staffObj.name || '').replace(/\s+/g, '_')}`;
                            const newShiftState = {
                                status: 'ClockedIn',
                                clockInTime: shiftDate.toISOString(),
                                breakStartTime: null,
                                totalBreakSeconds: 0,
                                totalShiftSecondsToday: 0,
                                assignedStartTime: assignShiftData.startTime,
                                assignedEndTime: assignShiftData.endTime,
                                station: assignShiftData.station
                            };

                            try {
                                localStorage.setItem(clockStorageKey, JSON.stringify(newShiftState));
                            } catch (_) {}

                            setShowAssignModal(false);
                            toast.success(`Assigned ${assignShiftData.startTime} - ${assignShiftData.endTime} shift (${assignShiftData.station}) to ${staffObj.name}! 🎉`);
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Employee *</label>
                                <select 
                                    value={assignShiftData.staffId}
                                    onChange={(e) => setAssignShiftData({ ...assignShiftData, staffId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {staffList.map(staff => (
                                        <option key={staff._id} value={staff._id}>
                                            {staff.name} ({staff.role.replace(/([A-Z])/g, ' $1').trim()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Shift Date</label>
                                <input 
                                    type="date" 
                                    value={assignShiftData.date}
                                    onChange={(e) => setAssignShiftData({ ...assignShiftData, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        value={assignShiftData.startTime}
                                        onChange={(e) => setAssignShiftData({ ...assignShiftData, startTime: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        value={assignShiftData.endTime}
                                        onChange={(e) => setAssignShiftData({ ...assignShiftData, endTime: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role / Station Assignment</label>
                                <input 
                                    type="text" 
                                    value={assignShiftData.station}
                                    onChange={(e) => setAssignShiftData({ ...assignShiftData, station: e.target.value })}
                                    placeholder="e.g. Main Counter / Grill Station" 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium" 
                                    required
                                />
                            </div>
                            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-md">Confirm Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Staff Modal */}
            {selectedStaffForManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">Manage Schedule: {selectedStaffForManage.name}</h3>
                            <button onClick={() => setSelectedStaffForManage(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target;
                            const newStatus = form.elements.statusSelect.value;
                            const newTimeIn = form.elements.timeInInput.value;

                            const clockStorageKey = `staff_shift_clock_${(selectedStaffForManage.name || '').replace(/\s+/g, '_')}`;

                            let clockInTime = new Date().toISOString();
                            if (newTimeIn) {
                                const [h, m] = newTimeIn.split(':');
                                const d = new Date();
                                d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
                                clockInTime = d.toISOString();
                            }

                            const updatedState = {
                                status: newStatus === 'Active' ? 'ClockedIn' : newStatus === 'Break' ? 'OnBreak' : 'ClockedOut',
                                clockInTime,
                                lastClockOutTime: newStatus === 'Off' ? new Date().toISOString() : null,
                                breakStartTime: newStatus === 'Break' ? new Date().toISOString() : null,
                                totalBreakSeconds: 0,
                                totalShiftSecondsToday: 28800
                            };

                            try {
                                localStorage.setItem(clockStorageKey, JSON.stringify(updatedState));
                            } catch (_) {}

                            setSelectedStaffForManage(null);
                            toast.success(`Updated shift schedule & status for ${selectedStaffForManage.name}!`);
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Current Status</label>
                                <select 
                                    name="statusSelect"
                                    defaultValue={selectedStaffForManage.status === 'Break' ? 'Break' : selectedStaffForManage.status === 'Active' ? 'Active' : 'Off'} 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                >
                                    <option value="Active">Active (Clocked In)</option>
                                    <option value="Break">On Break</option>
                                    <option value="Off">Clocked Out</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Adjust Time In</label>
                                    <input 
                                        name="timeInInput"
                                        type="time" 
                                        defaultValue="09:00" 
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Adjust Time Out</label>
                                    <input 
                                        name="timeOutInput"
                                        type="time" 
                                        defaultValue="17:00" 
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                                    />
                                </div>
                            </div>
                            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                                <button type="button" onClick={() => setSelectedStaffForManage(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ManagerStaff;
