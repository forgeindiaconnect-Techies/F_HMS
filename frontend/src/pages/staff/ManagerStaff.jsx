import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Search, Plus, Calendar, Clock, UserCheck, UserX, AlertTriangle, 
    MessageSquare, X, CheckCircle2, AlertCircle, DollarSign, CreditCard, 
    FileText, Printer, ChevronRight, Edit2, ShieldCheck, Download, Filter, 
    RefreshCw, CalendarDays, Check, Ban
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

const ManagerStaff = () => {
    const { api, user, restaurant } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'shifts'; // 'shifts' | 'leaves' | 'attendance' | 'payroll'
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab with URL search parameter
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['shifts', 'leaves', 'attendance', 'payroll'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setSearchParams({ tab: tabName });
    };

    // Shared state
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 1: Shifts & Roster State
    // ──────────────────────────────────────────────────────────────────────────
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStaffForManage, setSelectedStaffForManage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [assignShiftData, setAssignShiftData] = useState({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        station: 'Main Counter'
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 2: Leave Management State
    // ──────────────────────────────────────────────────────────────────────────
    const [leaves, setLeaves] = useState([]);
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');
    const [leaveSearch, setLeaveSearch] = useState('');
    const [selectedLeaveForAction, setSelectedLeaveForAction] = useState(null);
    const [leaveActionForm, setLeaveActionForm] = useState({
        status: 'Approved',
        isPaid: true,
        managerRemarks: ''
    });
    const [actionSubmitting, setActionSubmitting] = useState(false);

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 3: Attendance Management State
    // ──────────────────────────────────────────────────────────────────────────
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceSaving, setAttendanceSaving] = useState(false);
    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
    const [correctionTarget, setCorrectionTarget] = useState(null);
    const [correctionForm, setCorrectionForm] = useState({
        status: 'Present',
        checkInTime: '09:00',
        checkOutTime: '18:00',
        lateMinutes: 0,
        overtimeHours: 0,
        reason: ''
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TAB 4: Branch Payroll State
    // ──────────────────────────────────────────────────────────────────────────
    const currentYear = new Date().getFullYear();
    const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
    const [payrollMonth, setPayrollMonth] = useState(currentMonthName);
    const [payrollYear, setPayrollYear] = useState(currentYear);
    const [payrollRecords, setPayrollRecords] = useState([]);
    const [payrollLoading, setPayrollLoading] = useState(false);
    const [selectedSlipRecord, setSelectedSlipRecord] = useState(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustTarget, setAdjustTarget] = useState(null);
    const [adjustForm, setAdjustForm] = useState({
        allowances: 0,
        overtimePay: 0,
        bonuses: 0,
        deductions: 0,
        notes: ''
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Data Fetching
    // ──────────────────────────────────────────────────────────────────────────
    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff');
            // Filter staff members assigned to this branch, excluding Managers and Admins
            const filtered = res.data.filter(s => {
                if (s.role === 'BranchManager' || s.role === 'RestaurantAdmin' || s.role === 'SuperAdmin') {
                    return false;
                }
                if (user?.role === 'RestaurantAdmin' || user?.role === 'SuperAdmin' || !user?.branchId) {
                    return true;
                }
                const staffBranchId = s.branchId?._id || s.branchId;
                const managerBranchId = user?.branchId?._id || user?.branchId;
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

    const fetchLeaveRequests = async () => {
        try {
            setLeavesLoading(true);
            const params = {};
            if (leaveStatusFilter !== 'All') params.status = leaveStatusFilter;
            if (user?.branchId) {
                params.branchId = user.branchId?._id || user.branchId;
            }
            const res = await api.get('/staff/leave', { params });
            setLeaves(res.data || []);
        } catch (error) {
            console.error('Failed to fetch leave requests', error);
            toast.error('Failed to load leave requests');
        } finally {
            setLeavesLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const params = {
                startDate: attendanceDate,
                endDate: attendanceDate
            };
            if (user?.branchId) {
                params.branchId = user.branchId?._id || user.branchId;
            }
            const res = await api.get('/staff/attendance', { params });
            const list = res.data || [];
            setAttendanceRecords(list);

            const map = {};
            staffList.forEach(emp => {
                const existing = list.find(r => (r.employee?._id || r.employee) === emp._id);
                if (existing) {
                    map[emp._id] = {
                        _id: existing._id,
                        status: existing.status,
                        checkInTime: existing.checkInTime ? new Date(existing.checkInTime).toTimeString().slice(0, 5) : '09:00',
                        checkOutTime: existing.checkOutTime ? new Date(existing.checkOutTime).toTimeString().slice(0, 5) : '18:00',
                        lateMinutes: existing.lateMinutes || 0,
                        overtimeHours: existing.overtimeHours || 0,
                        isPaidLeave: existing.isPaidLeave,
                        isLOP: existing.isLOP,
                        notes: existing.notes || '',
                        isSaved: true
                    };
                } else {
                    map[emp._id] = {
                        status: 'Present',
                        checkInTime: '09:00',
                        checkOutTime: '18:00',
                        lateMinutes: 0,
                        overtimeHours: 0,
                        notes: '',
                        isSaved: false
                    };
                }
            });
            setAttendanceMap(map);
        } catch (err) {
            console.error('Failed to fetch attendance records', err);
        }
    };

    const fetchBranchPayroll = async () => {
        try {
            setPayrollLoading(true);
            const params = {
                month: payrollMonth,
                year: payrollYear
            };
            if (user?.branchId) {
                params.branchId = user.branchId?._id || user.branchId;
            }
            const res = await api.get('/staff/payroll', { params });
            setPayrollRecords(res.data || []);
        } catch (error) {
            console.error('Failed to fetch branch payroll', error);
        } finally {
            setPayrollLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (activeTab === 'leaves') {
            fetchLeaveRequests();
        } else if (activeTab === 'attendance' && staffList.length > 0) {
            fetchAttendance();
        } else if (activeTab === 'payroll') {
            fetchBranchPayroll();
        }
    }, [activeTab, attendanceDate, payrollMonth, payrollYear, leaveStatusFilter, staffList.length]);

    // ──────────────────────────────────────────────────────────────────────────
    // Leave Actions
    // ──────────────────────────────────────────────────────────────────────────
    const handleOpenLeaveAction = (leave, defaultStatus = 'Approved') => {
        setSelectedLeaveForAction(leave);
        setLeaveActionForm({
            status: defaultStatus,
            isPaid: leave.isPaid ?? true,
            managerRemarks: ''
        });
    };

    const handleSubmitLeaveAction = async (e) => {
        e.preventDefault();
        if (!selectedLeaveForAction) return;

        try {
            setActionSubmitting(true);
            await api.put(`/staff/leave/${selectedLeaveForAction._id}/status`, {
                status: leaveActionForm.status,
                isPaid: leaveActionForm.isPaid,
                managerRemarks: leaveActionForm.managerRemarks
            });

            toast.success(`Leave request ${leaveActionForm.status.toLowerCase()} and attendance records synced.`);
            setSelectedLeaveForAction(null);
            fetchLeaveRequests();
            if (activeTab === 'attendance') fetchAttendance();
        } catch (error) {
            console.error('Failed to update leave request status', error);
            toast.error(error.response?.data?.message || 'Error updating leave request');
        } finally {
            setActionSubmitting(false);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Attendance Actions
    // ──────────────────────────────────────────────────────────────────────────
    const handleSaveBulkAttendance = async () => {
        setAttendanceSaving(true);
        try {
            const records = staffList.map(emp => {
                const data = attendanceMap[emp._id] || { status: 'Present' };
                let checkInISO = null;
                let checkOutISO = null;
                if (data.checkInTime) {
                    checkInISO = new Date(`${attendanceDate}T${data.checkInTime}:00`).toISOString();
                }
                if (data.checkOutTime) {
                    checkOutISO = new Date(`${attendanceDate}T${data.checkOutTime}:00`).toISOString();
                }

                return {
                    employeeId: emp._id,
                    status: data.status,
                    checkInTime: checkInISO,
                    checkOutTime: checkOutISO,
                    lateMinutes: Number(data.lateMinutes) || 0,
                    overtimeHours: Number(data.overtimeHours) || 0,
                    notes: data.notes || ''
                };
            });

            await api.post('/staff/attendance/bulk', {
                date: attendanceDate,
                records
            });
            toast.success(`Attendance saved for ${attendanceDate}!`);
            fetchAttendance();
        } catch (error) {
            console.error('Failed to save attendance', error);
            toast.error(error.response?.data?.message || 'Error saving attendance');
        } finally {
            setAttendanceSaving(false);
        }
    };

    const handleOpenCorrectionModal = (record) => {
        setCorrectionTarget(record);
        setCorrectionForm({
            status: record.status,
            checkInTime: record.checkInTime ? new Date(record.checkInTime).toTimeString().slice(0, 5) : '09:00',
            checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toTimeString().slice(0, 5) : '18:00',
            lateMinutes: record.lateMinutes || 0,
            overtimeHours: record.overtimeHours || 0,
            reason: ''
        });
        setIsCorrectionModalOpen(true);
    };

    const handleSaveCorrection = async (e) => {
        e.preventDefault();
        if (!correctionForm.reason.trim()) {
            toast.error('Correction reason is mandatory for audit trail compliance.');
            return;
        }

        try {
            const dateStr = correctionTarget.dateString || new Date(correctionTarget.date).toISOString().split('T')[0];
            const checkInISO = correctionForm.checkInTime ? new Date(`${dateStr}T${correctionForm.checkInTime}:00`).toISOString() : null;
            const checkOutISO = correctionForm.checkOutTime ? new Date(`${dateStr}T${correctionForm.checkOutTime}:00`).toISOString() : null;

            await api.put(`/staff/attendance/${correctionTarget._id}/correct`, {
                status: correctionForm.status,
                checkInTime: checkInISO,
                checkOutTime: checkOutISO,
                lateMinutes: Number(correctionForm.lateMinutes) || 0,
                overtimeHours: Number(correctionForm.overtimeHours) || 0,
                reason: correctionForm.reason
            });

            toast.success('Attendance corrected and logged in audit history!');
            setIsCorrectionModalOpen(false);
            setCorrectionTarget(null);
            fetchAttendance();
        } catch (error) {
            console.error('Failed to correct attendance', error);
            toast.error(error.response?.data?.message || 'Error updating attendance');
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Payroll Adjust Actions
    // ──────────────────────────────────────────────────────────────────────────
    const handleOpenAdjustModal = (payroll) => {
        if (payroll.paymentStatus === 'Paid') {
            toast.error('Cannot modify finalized and fully paid payroll records.');
            return;
        }
        setAdjustTarget(payroll);
        setAdjustForm({
            allowances: payroll.calculations?.allowances || 0,
            overtimePay: payroll.calculations?.overtimePay || 0,
            bonuses: payroll.calculations?.bonuses || 0,
            deductions: payroll.calculations?.deductions || 0,
            notes: ''
        });
        setIsAdjustModalOpen(true);
    };

    const handleSaveAdjustment = async (e) => {
        e.preventDefault();
        if (!adjustTarget) return;

        try {
            await api.put(`/staff/payroll/${adjustTarget._id}/correct`, {
                allowances: Number(adjustForm.allowances) || 0,
                overtimePay: Number(adjustForm.overtimePay) || 0,
                bonuses: Number(adjustForm.bonuses) || 0,
                deductions: Number(adjustForm.deductions) || 0,
                notes: adjustForm.notes || 'Manager adjustment before finalization'
            });

            toast.success('Payroll components adjusted and audit logged!');
            setIsAdjustModalOpen(false);
            setAdjustTarget(null);
            fetchBranchPayroll();
        } catch (error) {
            console.error('Failed to correct payroll', error);
            toast.error(error.response?.data?.message || 'Error adjusting payroll record');
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Helper computations
    // ──────────────────────────────────────────────────────────────────────────
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

    const filteredLeaves = useMemo(() => {
        return leaves.filter(l => {
            const empName = l.employee?.name?.toLowerCase() || '';
            const empCode = l.employee?.employeeId?.toLowerCase() || '';
            const matchesSearch = !leaveSearch || empName.includes(leaveSearch.toLowerCase()) || empCode.includes(leaveSearch.toLowerCase());
            return matchesSearch;
        });
    }, [leaves, leaveSearch]);

    const attendanceStats = useMemo(() => {
        let present = 0, absent = 0, paidLeave = 0, unpaidLeave = 0;
        Object.values(attendanceMap).forEach(v => {
            if (v.status === 'Present' || v.status === 'Half-day') present++;
            else if (v.status === 'Absent') absent++;
            else if (v.status === 'Leave') {
                if (v.isPaidLeave !== false) paidLeave++;
                else unpaidLeave++;
            }
        });
        return { present, absent, paidLeave, unpaidLeave, total: staffList.length };
    }, [attendanceMap, staffList]);

    const payrollSummary = useMemo(() => {
        const totalStaff = payrollRecords.length;
        const totalNet = payrollRecords.reduce((acc, r) => acc + (r.calculations?.netSalaryPayable || 0), 0);
        const totalPaid = payrollRecords.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
        const totalDue = payrollRecords.reduce((acc, r) => acc + (r.balanceDue || 0), 0);
        const totalLOPDeduction = payrollRecords.reduce((acc, r) => acc + (r.calculations?.lopDeduction || 0), 0);
        return { totalStaff, totalNet, totalPaid, totalDue, totalLOPDeduction };
    }, [payrollRecords]);

    const exportWeeklyPDF = () => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(22, 163, 74);
            doc.text('RestoSys - Weekly Staff Schedule', 20, 20);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 28);
            doc.setDrawColor(230, 230, 230);
            doc.line(20, 32, 277, 32);

            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const colWidth = 35;
            const startX = 20;
            const startY = 45;

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            days.forEach((day, index) => {
                const x = startX + (index * colWidth);
                doc.text(day, x, startY);
                doc.line(x, startY + 2, x + 30, startY + 2);
            });
            doc.save(`Weekly_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
        };
        script.onerror = () => {
            toast.error('Failed to load PDF export library.');
        };
        document.body.appendChild(script);
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-16 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <UserCheck size={14} /> Branch Operations &amp; HR
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Staff, Leaves &amp; Branch Payroll
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                        Manage daily shifts, review and approve leave requests, record attendance with LOP tracking, and review branch payroll.
                    </p>
                </div>
                {activeTab === 'shifts' && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={exportWeeklyPDF} 
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-xs flex items-center gap-2"
                        >
                            <Calendar size={16} /> Weekly Schedule
                        </button>
                        <button 
                            onClick={() => setShowAssignModal(true)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md"
                        >
                            <Plus size={18} /> Assign Shift
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => handleTabChange('shifts')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'shifts'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <UserCheck size={16} /> Today's Staff &amp; Shifts ({displayStaff.length})
                </button>
                <button
                    onClick={() => handleTabChange('leaves')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'leaves'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <CalendarDays size={16} /> Leave Requests &amp; Approvals
                    {leaves.filter(l => l.status === 'Pending').length > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {leaves.filter(l => l.status === 'Pending').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => handleTabChange('attendance')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'attendance'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Clock size={16} /> Daily Attendance Logs
                </button>
                <button
                    onClick={() => handleTabChange('payroll')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'payroll'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <CreditCard size={16} /> Branch Payroll Overview
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: SHIFTS & ROSTER                                                */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'shifts' && (
                <div className="space-y-6">
                    {/* Shift Control Strip */}
                    <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-xs font-black tracking-wide uppercase text-slate-200">Terminal Shift Roster</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">Supervisor: {user?.name || 'Duty Manager'}</span>
                            </div>
                            <StaffShiftClockWidget compact={true} userRole="Branch Manager" userName={user?.name || "Manager"} />
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl text-xs border border-slate-700/60 font-semibold shadow-xs">
                                <span className="text-slate-400">Total Shift Roster:</span>
                                <span className="font-mono font-black text-emerald-400">{staffList.length} Members</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg"><UserCheck size={20} /></div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Clocked In</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{clockedInCount}</h3>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg"><Clock size={20} /></div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">On Break</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{onBreakCount}</h3>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg"><UserX size={20} /></div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Late / Absent</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{absentCount}</h3>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-900 dark:to-slate-950 p-4 rounded-xl shadow-xs text-white border border-transparent dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase">Estimated Shift Cost</p>
                                <h3 className="text-xl font-bold mt-1">₹{laborCostToday}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-emerald-400 font-bold">Optimal</p>
                                <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-1">Live Shift Active</p>
                            </div>
                        </div>
                    </div>

                    {/* Shift Roster Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50 dark:bg-slate-950/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Current Shift Roster
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Live duty status and active shifts</p>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search staff..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500" 
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Time In</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Hours Worked</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Station</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {displayStaff.map((staff) => (
                                        <tr key={staff._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                        {staff.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                                                            {staff.name}
                                                            {staff.alert && <AlertTriangle size={14} className="text-amber-500" title="Shift overtime alert" />}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                                            <span>{staff.role}</span>
                                                            {staff.employeeId && (
                                                                <span className="font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                                                    {staff.employeeId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {staff.status === 'Active' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Clocked In</span>}
                                                {staff.status === 'Break' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">On Break</span>}
                                                {staff.status === 'Absent' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Off Shift</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 font-mono">{staff.timeIn}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 font-mono">{staff.hours}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">Main Counter</td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedStaffForManage(staff)}
                                                    className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayStaff.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-gray-400 dark:text-slate-500">
                                                No staff found for this branch.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: LEAVE REQUESTS & APPROVALS                                     */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'leaves' && (
                <div className="space-y-6">
                    {/* Leave Summary Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Approvals</p>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                {leaves.filter(l => l.status === 'Pending').length}
                            </h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved Leaves</p>
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {leaves.filter(l => l.status === 'Approved').length}
                            </h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rejected</p>
                            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                {leaves.filter(l => l.status === 'Rejected').length}
                            </h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leave Requests</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                {leaves.length}
                            </h3>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
                            {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setLeaveStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        leaveStatusFilter === st
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search by staff name/ID..."
                                value={leaveSearch}
                                onChange={(e) => setLeaveSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Leave Requests Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Leave Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Days</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Pay Policy</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {filteredLeaves.map((leave) => {
                                        const startStr = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        const endStr = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                        return (
                                            <tr key={leave._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {leave.employee?.name || 'Staff Member'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                                            <span>{leave.employee?.role || 'Staff'}</span>
                                                            {leave.employee?.employeeId && (
                                                                <span className="font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                    {leave.employee?.employeeId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                                                        {leave.leaveType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 dark:text-slate-300">
                                                    {startStr} - {endStr}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                    {leave.daysCount} {leave.daysCount === 1 ? 'day' : 'days'}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-500 dark:text-slate-400" title={leave.reason}>
                                                    {leave.reason}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {leave.isPaid ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                                            Paid Leave
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                                            Unpaid / LOP
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {leave.status === 'Pending' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                            <Clock size={12} /> Pending Review
                                                        </span>
                                                    )}
                                                    {leave.status === 'Approved' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            <CheckCircle2 size={12} /> Approved
                                                        </span>
                                                    )}
                                                    {leave.status === 'Rejected' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                                            <AlertCircle size={12} /> Rejected
                                                        </span>
                                                    )}
                                                    {leave.status === 'Cancelled' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {leave.status === 'Pending' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenLeaveAction(leave, 'Approved')}
                                                                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                                            >
                                                                <Check size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenLeaveAction(leave, 'Rejected')}
                                                                className="px-3 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Ban size={14} /> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 dark:text-slate-500">
                                                            {leave.approvedBy?.name ? `By ${leave.approvedBy.name}` : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredLeaves.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-gray-400 dark:text-slate-500">
                                                {leavesLoading ? 'Loading leave requests...' : 'No leave requests found for this filter.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: DAILY ATTENDANCE LOGS & CORRECTIONS                            */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    {/* Attendance Header & Controls */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Attendance Date</label>
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <button
                                onClick={fetchAttendance}
                                className="p-2.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors mt-5 cursor-pointer"
                                title="Refresh attendance for date"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleSaveBulkAttendance}
                                disabled={attendanceSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-60"
                            >
                                <CheckCircle2 size={16} />
                                {attendanceSaving ? 'Saving...' : 'Save Daily Attendance'}
                            </button>
                        </div>
                    </div>

                    {/* Attendance Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Present Staff</p>
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{attendanceStats.present}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Absent Days</p>
                            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{attendanceStats.absent}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved Leave (Paid)</p>
                            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{attendanceStats.paidLeave}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unpaid Leave / LOP</p>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{attendanceStats.unpaidLeave}</h3>
                        </div>
                    </div>

                    {/* Attendance Recording Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Check In</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Check Out</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Overtime (Hrs)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Leave / LOP Info</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Audit Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {staffList.map((emp) => {
                                        const entry = attendanceMap[emp._id] || { status: 'Present', checkInTime: '09:00', checkOutTime: '18:00', overtimeHours: 0 };
                                        const savedRecord = attendanceRecords.find(r => (r.employee?._id || r.employee) === emp._id);

                                        return (
                                            <tr key={emp._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm">{emp.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                                            <span>{emp.role}</span>
                                                            {emp.employeeId && (
                                                                <span className="font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                    {emp.employeeId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={entry.status}
                                                        onChange={(e) => setAttendanceMap(prev => ({
                                                            ...prev,
                                                            [emp._id]: { ...(prev[emp._id] || {}), status: e.target.value }
                                                        }))}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                                                            entry.status === 'Present'
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : entry.status === 'Absent'
                                                                ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                                                                : entry.status === 'Leave'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                                                : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                                                        }`}
                                                    >
                                                        <option value="Present">Present</option>
                                                        <option value="Absent">Absent</option>
                                                        <option value="Leave">Leave</option>
                                                        <option value="Half-day">Half-day</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="time"
                                                        value={entry.checkInTime || '09:00'}
                                                        onChange={(e) => setAttendanceMap(prev => ({
                                                            ...prev,
                                                            [emp._id]: { ...(prev[emp._id] || {}), checkInTime: e.target.value }
                                                        }))}
                                                        disabled={entry.status === 'Absent' || entry.status === 'Leave'}
                                                        className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono disabled:opacity-40"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="time"
                                                        value={entry.checkOutTime || '18:00'}
                                                        onChange={(e) => setAttendanceMap(prev => ({
                                                            ...prev,
                                                            [emp._id]: { ...(prev[emp._id] || {}), checkOutTime: e.target.value }
                                                        }))}
                                                        disabled={entry.status === 'Absent' || entry.status === 'Leave'}
                                                        className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono disabled:opacity-40"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="12"
                                                        step="0.5"
                                                        value={entry.overtimeHours || 0}
                                                        onChange={(e) => setAttendanceMap(prev => ({
                                                            ...prev,
                                                            [emp._id]: { ...(prev[emp._id] || {}), overtimeHours: Number(e.target.value) }
                                                        }))}
                                                        disabled={entry.status === 'Absent' || entry.status === 'Leave'}
                                                        className="w-16 px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-mono disabled:opacity-40"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {entry.status === 'Leave' ? (
                                                        entry.isLOP ? (
                                                            <span className="font-bold text-rose-600 dark:text-rose-400">Unpaid / LOP Applied</span>
                                                        ) : (
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Approved Paid Leave</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {savedRecord ? (
                                                        <button
                                                            onClick={() => handleOpenCorrectionModal(savedRecord)}
                                                            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Edit2 size={13} /> Correct Log
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-amber-500 font-medium">Unsaved</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {staffList.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-gray-400 dark:text-slate-500">
                                                No staff members found for this branch.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: BRANCH PAYROLL OVERVIEW                                        */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'payroll' && (
                <div className="space-y-6">
                    {/* Period Selector & Metrics */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Month</label>
                                <select
                                    value={payrollMonth}
                                    onChange={(e) => setPayrollMonth(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Year</label>
                                <select
                                    value={payrollYear}
                                    onChange={(e) => setPayrollYear(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="text-xs font-bold px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl border border-gray-200 dark:border-slate-700">
                            Branch: <span className="text-emerald-600 dark:text-emerald-400">{user?.branchId?.name || 'Assigned Branch'}</span>
                        </div>
                    </div>

                    {/* Payroll Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Net Wages</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{payrollSummary.totalNet.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disbursed (Paid)</p>
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{payrollSummary.totalPaid.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Due</p>
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{payrollSummary.totalDue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">LOP Deductions</p>
                            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">₹{payrollSummary.totalLOPDeduction.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Payroll Records Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Basic</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Attendance &amp; Leave</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">LOP Deduct</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Overtime</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Net Salary</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {payrollRecords.map((record) => {
                                        const c = record.calculations || {};
                                        const att = record.attendanceSummary || {};

                                        return (
                                            <tr key={record._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {record.employee?.name || 'Staff Member'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                                            <span>{record.employee?.role || 'Staff'}</span>
                                                            {record.employee?.employeeId && (
                                                                <span className="font-mono text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                    {record.employee?.employeeId}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                    ₹{record.basicSalary?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 dark:text-slate-300">
                                                    <div>Present: <span className="font-bold text-emerald-600">{att.presentDays || 0}d</span></div>
                                                    <div className="text-[11px] text-gray-400">
                                                        Paid Leave: {att.paidLeaveDays || 0}d | LOP: <span className="text-rose-500 font-bold">{att.lopDays || 0}d</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                                                    {c.lopDeduction ? `-₹${c.lopDeduction.toLocaleString()}` : '₹0'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-slate-300">
                                                    ₹{(c.overtimePay || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                    ₹{(c.netSalaryPayable || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {record.paymentStatus === 'Paid' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            <CheckCircle2 size={12} /> Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                            <Clock size={12} /> {record.status || 'Pending'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedSlipRecord(record)}
                                                            className="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <FileText size={13} /> View Slip
                                                        </button>
                                                        {record.paymentStatus !== 'Paid' && (
                                                            <button
                                                                onClick={() => handleOpenAdjustModal(record)}
                                                                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Edit2 size={13} /> Adjust
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {payrollRecords.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-gray-400 dark:text-slate-500">
                                                {payrollLoading ? 'Loading branch payroll records...' : 'No payroll records generated for this month yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* MODALS                                                                */}
            {/* ══════════════════════════════════════════════════════════════════════ */}

            {/* Leave Action (Approve / Reject) Modal */}
            {selectedLeaveForAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    {leaveActionForm.status} Leave Request
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {selectedLeaveForAction.employee?.name} ({selectedLeaveForAction.daysCount} days)
                                </p>
                            </div>
                            <button onClick={() => setSelectedLeaveForAction(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitLeaveAction} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Decision</label>
                                <select
                                    value={leaveActionForm.status}
                                    onChange={(e) => setLeaveActionForm({ ...leaveActionForm, status: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 dark:text-white"
                                >
                                    <option value="Approved">Approve Request</option>
                                    <option value="Rejected">Reject Request</option>
                                </select>
                            </div>

                            {leaveActionForm.status === 'Approved' && (
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Paid / Unpaid Policy</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="isPaidLeaveOption"
                                                checked={leaveActionForm.isPaid === true}
                                                onChange={() => setLeaveActionForm({ ...leaveActionForm, isPaid: true })}
                                                className="text-emerald-600"
                                            />
                                            Paid Leave (No salary deduction)
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="isPaidLeaveOption"
                                                checked={leaveActionForm.isPaid === false}
                                                onChange={() => setLeaveActionForm({ ...leaveActionForm, isPaid: false })}
                                                className="text-amber-600"
                                            />
                                            Unpaid / LOP
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        Approved leave dates will automatically sync into attendance with this pay policy.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Manager Remarks</label>
                                <textarea
                                    value={leaveActionForm.managerRemarks}
                                    onChange={(e) => setLeaveActionForm({ ...leaveActionForm, managerRemarks: e.target.value })}
                                    placeholder="e.g. Approved with relief staff arranged / Rejected due to weekend rush..."
                                    rows={3}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLeaveForAction(null)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionSubmitting}
                                    className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                                        leaveActionForm.status === 'Approved'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {actionSubmitting ? 'Updating...' : `Confirm ${leaveActionForm.status}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance Correction Modal */}
            {isCorrectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Correct Attendance Record
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {correctionTarget?.employee?.name} - {attendanceDate}
                                </p>
                            </div>
                            <button onClick={() => setIsCorrectionModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCorrection} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Status</label>
                                <select
                                    value={correctionForm.status}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 dark:text-white"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Half-day">Half-day</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Check In</label>
                                    <input
                                        type="time"
                                        value={correctionForm.checkInTime}
                                        onChange={(e) => setCorrectionForm({ ...correctionForm, checkInTime: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Check Out</label>
                                    <input
                                        type="time"
                                        value={correctionForm.checkOutTime}
                                        onChange={(e) => setCorrectionForm({ ...correctionForm, checkOutTime: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Overtime (Hours)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="12"
                                    step="0.5"
                                    value={correctionForm.overtimeHours}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, overtimeHours: Number(e.target.value) })}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">
                                    Reason for Correction (Mandatory) *
                                </label>
                                <textarea
                                    value={correctionForm.reason}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                                    placeholder="Enter audit trail reason for modifying attendance record..."
                                    rows={2}
                                    required
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCorrectionModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                                >
                                    Save Correction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payroll Adjustment Modal */}
            {isAdjustModalOpen && adjustTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Adjust Payroll Components</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {adjustTarget.employee?.name} - {payrollMonth} {payrollYear}
                                </p>
                            </div>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Allowances (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.allowances}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, allowances: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Overtime Pay (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.overtimePay}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, overtimePay: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Bonuses (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.bonuses}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, bonuses: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Deductions (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.deductions}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, deductions: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Adjustment Notes</label>
                                <textarea
                                    value={adjustForm.notes}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                                    placeholder="Reason for salary component modification..."
                                    rows={2}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                                >
                                    Save Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary Slip & Breakdown Modal */}
            {selectedSlipRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-800 max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Staff Payslip Overview</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {selectedSlipRecord.employee?.name} - {payrollMonth} {payrollYear}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => window.print()}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                                    title="Print payslip"
                                >
                                    <Printer size={18} />
                                </button>
                                <button onClick={() => setSelectedSlipRecord(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
                                <div>
                                    <h4 className="text-xl font-black text-gray-900 dark:text-white">{restaurant?.name || 'Restaurant Systems'}</h4>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{selectedSlipRecord.branchId?.name || 'Branch Office'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                                        {selectedSlipRecord.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            {/* Employee Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl text-xs">
                                <div>
                                    <span className="text-gray-400 block font-medium">Employee Name:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedSlipRecord.employee?.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block font-medium">Employee Code:</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedSlipRecord.employee?.employeeId || 'EMP-Active'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block font-medium">Designation:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedSlipRecord.employee?.role || 'Staff'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block font-medium">Present Days:</span>
                                    <span className="font-bold text-emerald-600">{selectedSlipRecord.attendanceSummary?.presentDays || 0} days</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block font-medium">Paid Leaves:</span>
                                    <span className="font-bold text-blue-600">{selectedSlipRecord.attendanceSummary?.paidLeaveDays || 0} days</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block font-medium">LOP / Unpaid Days:</span>
                                    <span className="font-bold text-rose-600">{selectedSlipRecord.attendanceSummary?.lopDays || 0} days</span>
                                </div>
                            </div>

                            {/* Earnings & Deductions Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                                    <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Earnings</h5>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>Basic Salary</span>
                                        <span className="font-mono font-bold">₹{selectedSlipRecord.basicSalary?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>Allowances</span>
                                        <span className="font-mono font-bold">₹{(selectedSlipRecord.calculations?.allowances || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>Overtime Wages</span>
                                        <span className="font-mono font-bold">₹{(selectedSlipRecord.calculations?.overtimePay || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>Bonuses / Incentives</span>
                                        <span className="font-mono font-bold">₹{(selectedSlipRecord.calculations?.bonuses || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40 flex justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                        <span>Gross Earnings</span>
                                        <span className="font-mono">₹{(selectedSlipRecord.calculations?.grossSalary || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40 space-y-2">
                                    <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Deductions</h5>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>Loss of Pay (LOP)</span>
                                        <span className="font-mono font-bold text-rose-600">-₹{(selectedSlipRecord.calculations?.lopDeduction || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>General Deductions</span>
                                        <span className="font-mono font-bold">-₹{(selectedSlipRecord.calculations?.deductions || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-700 dark:text-slate-300">
                                        <span>Salary Advances</span>
                                        <span className="font-mono font-bold">-₹{(selectedSlipRecord.calculations?.advances || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 border-t border-rose-200 dark:border-rose-800/40 flex justify-between text-xs font-bold text-rose-900 dark:text-rose-200">
                                        <span>Total Deductions</span>
                                        <span className="font-mono">-₹{(selectedSlipRecord.calculations?.totalDeductions || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Payable Bar */}
                            <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                                <div>
                                    <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Net Amount Payable</span>
                                    <span className="text-xs text-emerald-400 font-medium">Disbursement Status: {selectedSlipRecord.paymentStatus}</span>
                                </div>
                                <div className="text-2xl font-black font-mono text-emerald-400">
                                    ₹{(selectedSlipRecord.calculations?.netSalaryPayable || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => setSelectedSlipRecord(null)}
                                className="px-5 py-2 text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Schedule Modal */}
            {selectedStaffForManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Manage Schedule: {selectedStaffForManage.name}</h3>
                            <button onClick={() => setSelectedStaffForManage(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={18} />
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
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Current Status</label>
                                <select 
                                    name="statusSelect"
                                    defaultValue={selectedStaffForManage.status === 'Break' ? 'Break' : selectedStaffForManage.status === 'Active' ? 'Active' : 'Off'} 
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white"
                                >
                                    <option value="Active">Active (Clocked In)</option>
                                    <option value="Break">On Break</option>
                                    <option value="Off">Clocked Out</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Adjust Time In</label>
                                    <input 
                                        name="timeInInput"
                                        type="time" 
                                        defaultValue="09:00" 
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Adjust Time Out</label>
                                    <input 
                                        name="timeOutInput"
                                        type="time" 
                                        defaultValue="17:00" 
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white" 
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <button type="button" onClick={() => setSelectedStaffForManage(null)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Shift Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                <Plus size={18} className="text-emerald-600" /> Assign Floor / Shift
                            </h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            toast.success(`Assigned shift for ${assignShiftData.date} successfully!`);
                            setShowAssignModal(false);
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Select Employee</label>
                                <select 
                                    value={assignShiftData.staffId} 
                                    onChange={(e) => setAssignShiftData({ ...assignShiftData, staffId: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white"
                                >
                                    {staffList.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Shift Date</label>
                                <input 
                                    type="date" 
                                    value={assignShiftData.date} 
                                    onChange={(e) => setAssignShiftData({ ...assignShiftData, date: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white" 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        value={assignShiftData.startTime}
                                        onChange={(e) => setAssignShiftData({ ...assignShiftData, startTime: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        value={assignShiftData.endTime}
                                        onChange={(e) => setAssignShiftData({ ...assignShiftData, endTime: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase mb-1">Station / Post</label>
                                <input 
                                    type="text" 
                                    value={assignShiftData.station}
                                    onChange={(e) => setAssignShiftData({ ...assignShiftData, station: e.target.value })}
                                    placeholder="e.g. Counter 1, Kitchen Line 2, Floor East"
                                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs">Assign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerStaff;
