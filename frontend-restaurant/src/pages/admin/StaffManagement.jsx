import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Search, Plus, Filter, Mail, Phone, Calendar, Clock, 
    MoreVertical, ShieldCheck, MapPin, X, Trash2, Edit2, 
    CheckCircle2, AlertCircle, DollarSign, FileText, Printer, 
    CreditCard, ArrowRight, UserCheck, Users, ChevronRight, History,
    CalendarDays, FileSpreadsheet, Check, Ban, Settings2, Sliders, Eye, RefreshCw, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Leave', 'Half-day', 'Holiday'];

const getStatusBadge = (status) => {
    switch(status) {
        case 'Active': return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Active</span>;
        case 'On Leave': return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">On Leave</span>;
        case 'Terminated': return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">Terminated</span>;
        default: return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
};

const getAttendancePill = (status) => {
    switch (status) {
        case 'Present': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'Absent': return 'bg-red-100 text-red-800 border-red-300';
        case 'Leave': return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'Half-day': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'Holiday': return 'bg-purple-100 text-purple-800 border-purple-300';
        default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
};

const getPayrollBadge = (status) => {
    switch (status) {
        case 'Paid': return <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold">Paid</span>;
        case 'Partially Paid': return <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-bold">Partially Paid</span>;
        case 'Approved': return <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-bold">Approved</span>;
        case 'Generated': return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold">Generated</span>;
        case 'Pending Payment':
        case 'Pending': return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
        case 'Draft': return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">Draft</span>;
        default: return <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
};

const formatRoleName = (role) => {
    if (!role) return 'Staff';
    if (role === 'BranchManager') return 'Manager';
    if (role === 'DeliveryPartner') return 'Delivery Partner';
    return role;
};

const StaffManagement = () => {
    const { api, restaurant } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'staff'; // 'staff' | 'attendance' | 'payroll' | 'leaves' | 'reports'
    const [activeTab, setActiveTab] = useState(initialTab);

    // Keep url in sync
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['staff', 'attendance', 'payroll', 'leaves', 'reports'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const handleTabChange = (t) => {
        setActiveTab(t);
        setSearchParams({ tab: t });
    };

    // Shared state
    const [staffList, setStaffList] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // TAB 1: Staff Profiles State
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [staffForm, setStaffForm] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Waiter',
        branchId: '',
        employmentStatus: 'Active',
        joiningDate: new Date().toISOString().split('T')[0],
        salaryConfig: {
            basicSalary: 20000,
            salaryFrequency: 'Monthly',
            overtimeRatePerHour: 150,
            dailyWorkHours: 9,
            monthlyWorkingDays: 26,
            allowances: 0,
            deductions: 0
        }
    });

    // TAB 2: Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceBranch, setAttendanceBranch] = useState('All');
    const [attendanceMap, setAttendanceMap] = useState({}); // empId -> attendance record
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceSaving, setAttendanceSaving] = useState(false);
    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
    const [correctionTarget, setCorrectionTarget] = useState(null);
    const [correctionForm, setCorrectionForm] = useState({
        status: 'Present',
        checkInTime: '',
        checkOutTime: '',
        lateMinutes: 0,
        overtimeHours: 0,
        reason: ''
    });

    // TAB 3: Payroll State
    const currentYear = new Date().getFullYear();
    const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
    const [payrollMonth, setPayrollMonth] = useState(currentMonthName);
    const [payrollYear, setPayrollYear] = useState(currentYear);
    const [payrollBranch, setPayrollBranch] = useState('All');
    const [payrollRecords, setPayrollRecords] = useState([]);
    const [payrollPreview, setPayrollPreview] = useState(null);
    const [isCalculatingPayroll, setIsCalculatingPayroll] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayrollForPayment, setSelectedPayrollForPayment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'Bank Transfer',
        paymentReference: '',
        notes: ''
    });
    const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
    const [salarySlipData, setSalarySlipData] = useState(null);

    // TAB 4: Leave Management (Admin)
    const [leavesList, setLeavesList] = useState([]);
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');
    const [leaveBranchFilter, setLeaveBranchFilter] = useState('All');
    const [leaveSearch, setLeaveSearch] = useState('');
    const [selectedLeaveForAction, setSelectedLeaveForAction] = useState(null);
    const [leaveActionForm, setLeaveActionForm] = useState({
        status: 'Approved',
        isPaid: true,
        managerRemarks: ''
    });
    const [leaveActionSubmitting, setLeaveActionSubmitting] = useState(false);

    // LOP Policy Config State
    const [isLOPConfigModalOpen, setIsLOPConfigModalOpen] = useState(false);
    const [lopConfigForm, setLopConfigForm] = useState({
        lopCalculationPolicy: 'Configured_Working_Days',
        monthlyPaidLeaveQuota: 2,
        unpaidLeaveDeductionType: 'Full_Day_Basic'
    });
    const [lopSaving, setLopSaving] = useState(false);

    // Payroll Interactive Preview Modal State
    const [isPayrollPreviewModalOpen, setIsPayrollPreviewModalOpen] = useState(false);

    // Payroll Adjustment & Corrections State
    const [isPayrollAdjustModalOpen, setIsPayrollAdjustModalOpen] = useState(false);
    const [adjustTarget, setAdjustTarget] = useState(null);
    const [adjustForm, setAdjustForm] = useState({
        basicSalary: 0,
        allowances: 0,
        overtimePay: 0,
        bonuses: 0,
        deductions: 0,
        advances: 0,
        notes: ''
    });
    const [adjustSaving, setAdjustSaving] = useState(false);

    // Payroll Audit History Viewer State
    const [isAuditHistoryModalOpen, setIsAuditHistoryModalOpen] = useState(false);
    const [selectedAuditHistory, setSelectedAuditHistory] = useState([]);
    const [auditHistoryEmpName, setAuditHistoryEmpName] = useState('');

    // TAB 5: Payroll Reports State
    const [payrollReportsData, setPayrollReportsData] = useState(null);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportMonth, setReportMonth] = useState('All');
    const [reportYear, setReportYear] = useState(currentYear);
    const [reportBranch, setReportBranch] = useState('All');
    const [reportStatus, setReportStatus] = useState('All');

    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    // Fetch Initial Data
    const fetchBaseData = async () => {
        setLoading(true);
        try {
            const [staffRes, branchRes] = await Promise.all([
                api.get('/staff').catch(() => ({ data: [] })),
                api.get('/branches').catch(() => ({ data: [] }))
            ]);
            setStaffList(staffRes.data || []);
            setBranches(branchRes.data || []);

            if (branchRes.data?.length > 0 && !staffForm.branchId) {
                setStaffForm(prev => ({ ...prev, branchId: branchRes.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch staff data', error);
            toast.error('Failed to load staff records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBaseData();
    }, []);

    // ── Attendance Loading & Saving ──────────────────────────────────────────
    const fetchAttendanceForDate = async () => {
        try {
            const params = {
                startDate: attendanceDate,
                endDate: attendanceDate
            };
            if (attendanceBranch !== 'All') params.branchId = attendanceBranch;
            const res = await api.get('/staff/attendance', { params });
            const list = res.data || [];
            setAttendanceRecords(list);

            // Populate attendanceMap with existing database records or default to 'Present'
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
            console.error('Failed to fetch attendance', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'attendance' && staffList.length > 0) {
            fetchAttendanceForDate();
        }
    }, [activeTab, attendanceDate, attendanceBranch, staffList]);

    const handleSaveBulkAttendance = async () => {
        setAttendanceSaving(true);
        try {
            const records = staffList
                .filter(emp => {
                    const bId = emp.branchId?._id || emp.branchId;
                    return attendanceBranch === 'All' || bId === attendanceBranch;
                })
                .map(emp => {
                    const data = attendanceMap[emp._id] || { status: 'Present' };
                    // Build ISO datetime from attendanceDate and time strings
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
            toast.success(`Daily attendance saved for ${attendanceDate}!`);
            fetchAttendanceForDate();
        } catch (error) {
            console.error('Failed to save attendance', error);
            toast.error(error.response?.data?.message || 'Error saving attendance');
        } finally {
            setAttendanceSaving(false);
        }
    };

    const handleAttendanceStatusToggle = (empId, status) => {
        setAttendanceMap(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || {}),
                status
            }
        }));
    };

    const handleAttendanceFieldChange = (empId, field, val) => {
        setAttendanceMap(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || {}),
                [field]: val
            }
        }));
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

            toast.success('Attendance record corrected and audit logged!');
            setIsCorrectionModalOpen(false);
            setCorrectionTarget(null);
            fetchAttendanceForDate();
        } catch (error) {
            console.error('Failed to correct attendance', error);
            toast.error(error.response?.data?.message || 'Error updating attendance');
        }
    };

    // ── Payroll Loading & Generation ─────────────────────────────────────────
    const fetchPayrollRecords = async () => {
        try {
            const params = { month: payrollMonth, year: payrollYear };
            if (payrollBranch !== 'All') params.branchId = payrollBranch;
            const res = await api.get('/staff/payroll', { params });
            setPayrollRecords(res.data || []);
        } catch (error) {
            console.error('Failed to fetch payroll records', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'payroll') {
            fetchPayrollRecords();
        } else if (activeTab === 'leaves') {
            fetchLeavesList();
        } else if (activeTab === 'reports') {
            fetchPayrollReports();
        }
    }, [activeTab, payrollMonth, payrollYear, payrollBranch, leaveStatusFilter, leaveBranchFilter, reportYear, reportMonth, reportBranch, reportStatus]);

    // ── Leaves Fetching & Approvals ──────────────────────────────────────────
    const fetchLeavesList = async () => {
        setLeavesLoading(true);
        try {
            const params = {};
            if (leaveStatusFilter !== 'All') params.status = leaveStatusFilter;
            if (leaveBranchFilter !== 'All') params.branchId = leaveBranchFilter;
            const res = await api.get('/staff/leave', { params });
            setLeavesList(res.data || []);
        } catch (error) {
            console.error('Failed to fetch leave requests', error);
            toast.error('Failed to load leave requests');
        } finally {
            setLeavesLoading(false);
        }
    };

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
            setLeaveActionSubmitting(true);
            await api.put(`/staff/leave/${selectedLeaveForAction._id}/status`, {
                status: leaveActionForm.status,
                isPaid: leaveActionForm.isPaid,
                managerRemarks: leaveActionForm.managerRemarks
            });

            toast.success(`Leave request ${leaveActionForm.status.toLowerCase()} and attendance records synced.`);
            setSelectedLeaveForAction(null);
            fetchLeavesList();
        } catch (error) {
            console.error('Failed to update leave status', error);
            toast.error(error.response?.data?.message || 'Error updating leave request');
        } finally {
            setLeaveActionSubmitting(false);
        }
    };

    // ── LOP Policy Config ────────────────────────────────────────────────────
    const fetchLOPConfig = async () => {
        try {
            const res = await api.get('/staff/payroll/config');
            if (res.data) {
                setLopConfigForm({
                    lopCalculationPolicy: res.data.lopCalculationPolicy || 'Configured_Working_Days',
                    monthlyPaidLeaveQuota: res.data.monthlyPaidLeaveQuota ?? 2,
                    unpaidLeaveDeductionType: res.data.unpaidLeaveDeductionType || 'Full_Day_Basic'
                });
            }
        } catch (error) {
            console.error('Failed to fetch LOP policy config', error);
        }
    };

    const handleOpenLOPConfigModal = () => {
        fetchLOPConfig();
        setIsLOPConfigModalOpen(true);
    };

    const handleSaveLOPConfig = async (e) => {
        e.preventDefault();
        setLopSaving(true);
        try {
            await api.put('/staff/payroll/config', lopConfigForm);
            toast.success('Restaurant LOP and Paid Leave policy saved successfully!');
            setIsLOPConfigModalOpen(false);
        } catch (error) {
            console.error('Failed to update LOP policy', error);
            toast.error(error.response?.data?.message || 'Error saving LOP policy');
        } finally {
            setLopSaving(false);
        }
    };

    // ── Payroll Adjustments & Audit History ──────────────────────────────────
    const handleOpenPayrollAdjustModal = (payroll) => {
        setAdjustTarget(payroll);
        setAdjustForm({
            basicSalary: payroll.basicSalary || 0,
            allowances: payroll.calculations?.allowances || 0,
            overtimePay: payroll.calculations?.overtimePay || 0,
            bonuses: payroll.calculations?.bonuses || 0,
            deductions: payroll.calculations?.deductions || 0,
            advances: payroll.calculations?.advances || 0,
            notes: ''
        });
        setIsPayrollAdjustModalOpen(true);
    };

    const handleSavePayrollAdjustment = async (e) => {
        e.preventDefault();
        if (!adjustTarget) return;

        setAdjustSaving(true);
        try {
            await api.put(`/staff/payroll/${adjustTarget._id}/correct`, {
                basicSalary: Number(adjustForm.basicSalary),
                allowances: Number(adjustForm.allowances),
                overtimePay: Number(adjustForm.overtimePay),
                bonuses: Number(adjustForm.bonuses),
                deductions: Number(adjustForm.deductions),
                advances: Number(adjustForm.advances),
                notes: adjustForm.notes || 'Admin manual correction before finalization'
            });

            toast.success('Payroll components adjusted and audit logged!');
            setIsPayrollAdjustModalOpen(false);
            setAdjustTarget(null);
            fetchPayrollRecords();
        } catch (error) {
            console.error('Failed to correct payroll record', error);
            toast.error(error.response?.data?.message || 'Error adjusting payroll record');
        } finally {
            setAdjustSaving(false);
        }
    };

    const handleOpenAuditHistory = (payroll) => {
        setSelectedAuditHistory(payroll.auditHistory || []);
        setAuditHistoryEmpName(payroll.employee?.name || 'Employee');
        setIsAuditHistoryModalOpen(true);
    };

    // ── Payroll Reports Fetching ─────────────────────────────────────────────
    const fetchPayrollReports = async () => {
        setReportsLoading(true);
        try {
            const params = {};
            if (reportYear) params.year = reportYear;
            if (reportMonth !== 'All') params.month = reportMonth;
            if (reportBranch !== 'All') params.branchId = reportBranch;
            if (reportStatus !== 'All') params.status = reportStatus;

            const res = await api.get('/staff/payroll/reports', { params });
            setPayrollReportsData(res.data);
        } catch (error) {
            console.error('Failed to load payroll reports', error);
            toast.error('Failed to fetch payroll reports');
        } finally {
            setReportsLoading(false);
        }
    };

    const handleCalculatePayroll = async () => {
        setIsCalculatingPayroll(true);
        try {
            const res = await api.post('/staff/payroll/calculate', {
                month: payrollMonth,
                year: payrollYear,
                branchId: payrollBranch !== 'All' ? payrollBranch : undefined
            });
            setPayrollPreview(res.data);
            setIsPayrollPreviewModalOpen(true);
            toast.success(`Calculated preview for ${res.data.count || 0} employees.`);
        } catch (error) {
            console.error('Failed to calculate payroll', error);
            toast.error(error.response?.data?.message || 'Error calculating payroll');
        } finally {
            setIsCalculatingPayroll(false);
        }
    };

    const handleGeneratePayrollBatch = async () => {
        try {
            const res = await api.post('/staff/payroll/generate', {
                month: payrollMonth,
                year: payrollYear,
                branchId: payrollBranch !== 'All' ? payrollBranch : undefined
            });
            toast.success(`Generated payroll batch (${res.data.count} employees). Initial status: Pending.`);
            setPayrollPreview(null);
            fetchPayrollRecords();
        } catch (error) {
            console.error('Failed to generate payroll batch', error);
            toast.error(error.response?.data?.message || 'Error generating payroll');
        }
    };

    const handleRecordPayrollPayment = async (e) => {
        e.preventDefault();
        if (!selectedPayrollForPayment) return;
        const amt = Number(paymentForm.amount);
        if (amt <= 0) {
            toast.error('Please enter a valid disbursement amount');
            return;
        }
        if (amt > selectedPayrollForPayment.balanceDue) {
            toast.error(`Amount cannot exceed pending salary balance of ₹${selectedPayrollForPayment.balanceDue}`);
            return;
        }

        try {
            await api.post(`/staff/payroll/${selectedPayrollForPayment._id}/pay`, {
                amount: amt,
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                notes: paymentForm.notes
            });
            toast.success(`Salary payment of ₹${amt} disbursed and logged to expenses!`);
            setIsPaymentModalOpen(false);
            setSelectedPayrollForPayment(null);
            setPaymentForm({ amount: '', paymentMethod: 'Bank Transfer', paymentReference: '', notes: '' });
            fetchPayrollRecords();
        } catch (error) {
            console.error('Failed to record salary payment', error);
            toast.error(error.response?.data?.message || 'Error recording salary payment');
        }
    };

    const handleOpenSalarySlip = async (pId) => {
        try {
            const res = await api.get(`/staff/payroll/${pId}`);
            setSalarySlipData(res.data);
            setIsSalarySlipModalOpen(true);
        } catch (error) {
            console.error('Failed to load salary slip', error);
            toast.error('Failed to load salary slip');
        }
    };

    // ── Staff Profiles CRUD ──────────────────────────────────────────────────
    const handleSaveStaff = async (e) => {
        e.preventDefault();
        try {
            const rawRole = staffForm.role === 'Manager' ? 'BranchManager' : staffForm.role;
            const targetBranch = (staffForm.branchId && staffForm.branchId !== 'All') ? staffForm.branchId : (branches[0]?._id || null);

            const payload = {
                ...staffForm,
                role: rawRole,
                branchId: targetBranch,
                salaryConfig: {
                    ...staffForm.salaryConfig,
                    basicSalary: Number(staffForm.salaryConfig.basicSalary) || 0,
                    overtimeRatePerHour: Number(staffForm.salaryConfig.overtimeRatePerHour) || 0,
                    dailyWorkHours: Number(staffForm.salaryConfig.dailyWorkHours) || 8,
                    monthlyWorkingDays: Number(staffForm.salaryConfig.monthlyWorkingDays) || 26,
                    allowances: Number(staffForm.salaryConfig.allowances) || 0,
                    deductions: Number(staffForm.salaryConfig.deductions) || 0
                }
            };

            if (!payload.password && !editingStaffId) {
                payload.password = 'Staff@123';
            }

            if (editingStaffId) {
                await api.put(`/staff/${editingStaffId}`, payload);
                toast.success('Staff profile and salary configuration updated');
            } else {
                await api.post('/staff', payload);
                toast.success('New employee registered successfully');
            }
            setIsStaffModalOpen(false);
            setEditingStaffId(null);
            fetchBaseData();
        } catch (error) {
            console.error('Failed to save staff', error);
            toast.error(error.response?.data?.message || 'Error saving staff');
        }
    };

    const handleDeleteStaff = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Staff Member',
            message: 'Are you sure you want to delete this staff member? This will remove their credentials and attendance records.',
            onConfirm: async () => {
                try {
                    await api.delete(`/staff/${id}`);
                    fetchBaseData();
                    toast.success('Staff member removed successfully');
                } catch (error) {
                    console.error('Failed to delete staff', error);
                    toast.error('Failed to delete staff member');
                }
            },
            isDestructive: true
        });
    };

    // Filtered Staff
    const filteredStaff = useMemo(() => {
        return staffList.filter(s => {
            const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  s.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesRole = false;
            if (roleFilter === 'All') {
                matchesRole = true;
            } else if (roleFilter === 'Manager' || roleFilter === 'BranchManager') {
                matchesRole = s.role === 'BranchManager' || s.role === 'Manager';
            } else if (roleFilter === 'DeliveryPartner' || roleFilter === 'Delivery Partner') {
                matchesRole = s.role === 'DeliveryPartner' || s.role === 'Delivery Partner';
            } else if (roleFilter === 'Staff' || roleFilter === 'General Staff') {
                matchesRole = s.role === 'Staff' || s.role === 'General Staff';
            } else {
                matchesRole = s.role?.toLowerCase() === roleFilter.toLowerCase();
            }

            const bId = s.branchId?._id || s.branchId;
            const matchesBranch = branchFilter === 'All' || bId === branchFilter;
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [staffList, searchQuery, roleFilter, branchFilter]);

    // Attendance stats for today
    const attendanceStats = useMemo(() => {
        let present = 0, absent = 0, leave = 0, halfday = 0, holiday = 0;
        Object.values(attendanceMap).forEach(v => {
            if (v.status === 'Present') present++;
            else if (v.status === 'Absent') absent++;
            else if (v.status === 'Leave') leave++;
            else if (v.status === 'Half-day') halfday++;
            else if (v.status === 'Holiday') holiday++;
        });
        return { present, absent, leave, halfday, holiday, total: staffList.length };
    }, [attendanceMap, staffList]);

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <Users size={14} /> Staff & Human Resources
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Staff, Attendance & Payroll
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Manage employee profiles, salary rules, daily clock-in/out attendance, overtime, monthly payroll batches, and payslips.
                    </p>
                </div>
                {activeTab === 'staff' && (
                    <button 
                        onClick={() => {
                            setEditingStaffId(null);
                            setStaffForm({
                                employeeId: `EMP-${Date.now().toString().slice(-4)}`,
                                name: '',
                                email: '',
                                phone: '',
                                password: '',
                                role: 'Waiter',
                                branchId: branches[0]?._id || '',
                                employmentStatus: 'Active',
                                joiningDate: new Date().toISOString().split('T')[0],
                                salaryConfig: {
                                    basicSalary: 20000,
                                    salaryFrequency: 'Monthly',
                                    overtimeRatePerHour: 150,
                                    dailyWorkHours: 9,
                                    monthlyWorkingDays: 26,
                                    allowances: 0,
                                    deductions: 0
                                }
                            });
                            setIsStaffModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-md shadow-emerald-900/10"
                    >
                        <Plus size={16} /> Add Employee
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                <button
                    onClick={() => handleTabChange('staff')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'staff'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Users size={16} /> Staff Profiles & Salary Setup ({staffList.length})
                </button>
                <button
                    onClick={() => handleTabChange('attendance')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'attendance'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Calendar size={16} /> Daily Attendance Tracker
                </button>
                <button
                    onClick={() => handleTabChange('leaves')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'leaves'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <CalendarDays size={16} /> Leave Management & Approvals
                    {leavesList.filter(l => l.status === 'Pending').length > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                            {leavesList.filter(l => l.status === 'Pending').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => handleTabChange('payroll')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'payroll'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <DollarSign size={16} /> Payroll & Salary Disbursements
                </button>
                <button
                    onClick={() => handleTabChange('reports')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === 'reports'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <FileSpreadsheet size={16} /> Payroll Reports & Summary
                </button>
            </div>

            {/* TAB 1: STAFF DIRECTORY & SALARY CONFIG */}
            {activeTab === 'staff' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search by name, email, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <select 
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden"
                            >
                                <option value="All">All Roles</option>
                                <option value="Manager">Manager</option>
                                <option value="Chef">Chef</option>
                                <option value="Waiter">Waiter</option>
                                <option value="Cashier">Cashier</option>
                                <option value="DeliveryPartner">Delivery Partner</option>
                                <option value="Staff">General Staff</option>
                            </select>

                            {branches.length > 1 && (
                                <select 
                                    value={branchFilter}
                                    onChange={(e) => setBranchFilter(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden"
                                >
                                    <option value="All">All Branches</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Staff Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Employee ID & Name</th>
                                        <th className="py-4 px-6">Role & Branch</th>
                                        <th className="py-4 px-6">Contact Info</th>
                                        <th className="py-4 px-6">Salary Configuration</th>
                                        <th className="py-4 px-6">Joining Date</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-400">
                                                No employees found. Click "Add Employee" above.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map(emp => (
                                            <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    <div>{emp.name}</div>
                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {emp.employeeId || 'ID Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRoleName(emp.role)}</span>
                                                    <div className="text-xs text-slate-400">{emp.branchId?.name || 'Main Outlet'}</div>
                                                </td>
                                                <td className="py-4 px-6 text-xs">
                                                    <div>{emp.email}</div>
                                                    <div className="text-slate-400">{emp.phoneNumber || emp.phone || '-'}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        ₹{(emp.salaryConfig?.basicSalary || 0).toLocaleString('en-IN')} 
                                                        <span className="text-xs font-normal text-slate-400"> / {emp.salaryConfig?.salaryFrequency || 'Monthly'}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        OT: ₹{emp.salaryConfig?.overtimeRatePerHour || 100}/hr | {emp.salaryConfig?.dailyWorkHours || 9}h/day
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                                                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getStatusBadge(emp.employmentStatus || 'Active')}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingStaffId(emp._id);
                                                                setStaffForm({
                                                                    employeeId: emp.employeeId || '',
                                                                    name: emp.name,
                                                                    email: emp.email,
                                                                    phone: emp.phoneNumber || emp.phone || '',
                                                                    password: '',
                                                                    role: (emp.role === 'BranchManager' || emp.role === 'Manager') ? 'Manager' : emp.role,
                                                                    branchId: emp.branchId?._id || emp.branchId || '',
                                                                    employmentStatus: emp.employmentStatus || 'Active',
                                                                    joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
                                                                    salaryConfig: {
                                                                        basicSalary: emp.salaryConfig?.basicSalary || 20000,
                                                                        salaryFrequency: emp.salaryConfig?.salaryFrequency || 'Monthly',
                                                                        overtimeRatePerHour: emp.salaryConfig?.overtimeRatePerHour || 150,
                                                                        dailyWorkHours: emp.salaryConfig?.dailyWorkHours || 9,
                                                                        monthlyWorkingDays: emp.salaryConfig?.monthlyWorkingDays || 26,
                                                                        allowances: Array.isArray(emp.salaryConfig?.allowances)
                                                                            ? emp.salaryConfig.allowances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0)
                                                                            : (Number(emp.salaryConfig?.allowances) || 0),
                                                                        deductions: Array.isArray(emp.salaryConfig?.deductions)
                                                                            ? emp.salaryConfig.deductions.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)
                                                                            : (Number(emp.salaryConfig?.deductions) || 0)
                                                                    }
                                                                });
                                                                setIsStaffModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Edit Profile & Salary Config"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStaff(emp._id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete Staff"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: DAILY ATTENDANCE TRACKER */}
            {activeTab === 'attendance' && (
                <div className="space-y-4">
                    {/* Attendance Date Controls & Stats */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Calendar size={16} /> Attendance Date:
                                </label>
                                <input 
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                                    className="text-xs font-bold text-emerald-600 hover:underline px-2 py-1"
                                >
                                    Today
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 1);
                                        setAttendanceDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="text-xs font-bold text-slate-500 hover:underline px-2 py-1"
                                >
                                    Yesterday
                                </button>
                            </div>

                            <button 
                                onClick={handleSaveBulkAttendance}
                                disabled={attendanceSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-xs"
                            >
                                <CheckCircle2 size={16} /> 
                                {attendanceSaving ? 'Saving Records...' : 'Save Daily Attendance'}
                            </button>
                        </div>

                        {/* Attendance Summary Chips */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                                <div className="text-xs font-bold text-slate-400">Total Staff</div>
                                <div className="text-xl font-black text-slate-900 dark:text-white">{attendanceStats.total}</div>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-300">
                                <div className="text-xs font-bold">Present</div>
                                <div className="text-xl font-black">{attendanceStats.present}</div>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-800 dark:text-red-300">
                                <div className="text-xs font-bold">Absent</div>
                                <div className="text-xl font-black">{attendanceStats.absent}</div>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-300">
                                <div className="text-xs font-bold">Leave</div>
                                <div className="text-xl font-black">{attendanceStats.leave}</div>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-800 dark:text-blue-300">
                                <div className="text-xs font-bold">Half-Day</div>
                                <div className="text-xl font-black">{attendanceStats.halfday}</div>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-800 dark:text-purple-300">
                                <div className="text-xs font-bold">Holiday</div>
                                <div className="text-xl font-black">{attendanceStats.holiday}</div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Employee</th>
                                        <th className="py-4 px-6">Attendance Status</th>
                                        <th className="py-4 px-6">Check In</th>
                                        <th className="py-4 px-6">Check Out</th>
                                        <th className="py-4 px-6">Late (Min)</th>
                                        <th className="py-4 px-6">Overtime (Hrs)</th>
                                        <th className="py-4 px-6">Notes</th>
                                        <th className="py-4 px-6 text-right">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {staffList.map(emp => {
                                        const current = attendanceMap[emp._id] || { status: 'Present', checkInTime: '09:00', checkOutTime: '18:00' };
                                        const existingRecord = attendanceRecords.find(r => (r.employee?._id || r.employee) === emp._id);
                                        return (
                                            <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    <div>{emp.name}</div>
                                                    <span className="text-xs text-slate-400">{emp.employeeId || formatRoleName(emp.role)}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {ATTENDANCE_STATUSES.map(st => (
                                                            <button
                                                                key={st}
                                                                type="button"
                                                                onClick={() => handleAttendanceStatusToggle(emp._id, st)}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                                                    current.status === st 
                                                                        ? getAttendancePill(st) 
                                                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                                                }`}
                                                            >
                                                                {st}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <input 
                                                        type="time"
                                                        value={current.checkInTime || ''}
                                                        onChange={(e) => handleAttendanceFieldChange(emp._id, 'checkInTime', e.target.value)}
                                                        disabled={current.status === 'Absent' || current.status === 'Leave' || current.status === 'Holiday'}
                                                        className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <input 
                                                        type="time"
                                                        value={current.checkOutTime || ''}
                                                        onChange={(e) => handleAttendanceFieldChange(emp._id, 'checkOutTime', e.target.value)}
                                                        disabled={current.status === 'Absent' || current.status === 'Leave' || current.status === 'Holiday'}
                                                        className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        value={current.lateMinutes || 0}
                                                        onChange={(e) => handleAttendanceFieldChange(emp._id, 'lateMinutes', e.target.value)}
                                                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={current.overtimeHours || 0}
                                                        onChange={(e) => handleAttendanceFieldChange(emp._id, 'overtimeHours', e.target.value)}
                                                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold text-emerald-600"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <input 
                                                        type="text"
                                                        placeholder="Notes..."
                                                        value={current.notes || ''}
                                                        onChange={(e) => handleAttendanceFieldChange(emp._id, 'notes', e.target.value)}
                                                        className="w-32 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                                    />
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {existingRecord ? (
                                                        <button 
                                                            onClick={() => handleOpenCorrectionModal(existingRecord)}
                                                            className="text-xs text-blue-600 hover:underline font-bold flex items-center justify-end gap-1"
                                                            title="Authorized Attendance Correction"
                                                        >
                                                            <History size={13} /> Correct
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Unsaved</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
                 {/* TAB 3: LEAVE MANAGEMENT & APPROVALS */}
            {activeTab === 'leaves' && (
                <div className="space-y-4">
                    {/* Leave Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
                            <span className="text-2xl font-black text-amber-500 mt-1 block">
                                {leavesList.filter(l => l.status === 'Pending').length}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Approved Leaves</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                                {leavesList.filter(l => l.status === 'Approved').length}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Rejected</span>
                            <span className="text-2xl font-black text-rose-500 mt-1 block">
                                {leavesList.filter(l => l.status === 'Rejected').length}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Recorded</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                                {leavesList.length}
                            </span>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                            {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setLeaveStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        leaveStatusFilter === st
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {branches.length > 1 && (
                                <select
                                    value={leaveBranchFilter}
                                    onChange={(e) => setLeaveBranchFilter(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                >
                                    <option value="All">All Branches</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            )}

                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search by staff name/ID..."
                                    value={leaveSearch}
                                    onChange={(e) => setLeaveSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Leaves Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Employee</th>
                                        <th className="py-4 px-6">Branch</th>
                                        <th className="py-4 px-6">Leave Type</th>
                                        <th className="py-4 px-6">Dates</th>
                                        <th className="py-4 px-6">Days</th>
                                        <th className="py-4 px-6">Reason</th>
                                        <th className="py-4 px-6">Pay Policy</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {leavesList
                                        .filter(l => {
                                            const n = l.employee?.name?.toLowerCase() || '';
                                            const c = l.employee?.employeeId?.toLowerCase() || '';
                                            return !leaveSearch || n.includes(leaveSearch.toLowerCase()) || c.includes(leaveSearch.toLowerCase());
                                        })
                                        .map(leave => {
                                            const startStr = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                            const endStr = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                            return (
                                                <tr key={leave._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                        <div>{leave.employee?.name || 'Staff Member'}</div>
                                                        <span className="text-xs text-slate-400">{leave.employee?.employeeId || leave.employee?.role}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-500">
                                                        {leave.branchId?.name || 'Main Branch'}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200">
                                                            {leave.leaveType}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                                                        {startStr} - {endStr}
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                        {leave.daysCount}d
                                                    </td>
                                                    <td className="py-4 px-6 max-w-xs truncate text-xs text-slate-500" title={leave.reason}>
                                                        {leave.reason}
                                                    </td>
                                                    <td className="py-4 px-6">
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
                                                    <td className="py-4 px-6">
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
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                Cancelled
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        {leave.status === 'Pending' ? (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleOpenLeaveAction(leave, 'Approved')}
                                                                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Check size={13} /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenLeaveAction(leave, 'Rejected')}
                                                                    className="px-3 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Ban size={13} /> Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">
                                                                {leave.approvedBy?.name ? `By ${leave.approvedBy.name}` : '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {leavesList.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="py-12 text-center text-slate-400">
                                                {leavesLoading ? 'Loading leave requests...' : 'No leave requests recorded.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: PAYROLL & SALARY */}
            {activeTab === 'payroll' && (
                <div className="space-y-4">
                    {/* Period Picker & Action Strip */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Pay Period:</span>
                            <select 
                                value={payrollMonth}
                                onChange={(e) => setPayrollMonth(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                            >
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>

                            <select 
                                value={payrollYear}
                                onChange={(e) => setPayrollYear(Number(e.target.value))}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                            >
                                {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            {branches.length > 1 && (
                                <select 
                                    value={payrollBranch}
                                    onChange={(e) => setPayrollBranch(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                >
                                    <option value="All">All Branches</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={handleOpenLOPConfigModal}
                                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Configure LOP Calculation & Paid Leave Rules"
                            >
                                <Settings2 size={16} /> LOP Policy
                            </button>
                            <button 
                                onClick={handleCalculatePayroll}
                                disabled={isCalculatingPayroll}
                                className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Eye size={16} />
                                {isCalculatingPayroll ? 'Calculating...' : 'Preview Wages'}
                            </button>
                            <button 
                                onClick={handleGeneratePayrollBatch}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus size={16} /> Generate Payroll Batch
                            </button>
                        </div>
                    </div>

                    {/* Payroll Records Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Employee</th>
                                        <th className="py-4 px-6">Pay Period</th>
                                        <th className="py-4 px-6">Basic Pay</th>
                                        <th className="py-4 px-6">Attendance &amp; Leave</th>
                                        <th className="py-4 px-6">LOP Deduct</th>
                                        <th className="py-4 px-6">Overtime</th>
                                        <th className="py-4 px-6">Gross Pay</th>
                                        <th className="py-4 px-6">Net Payable</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {payrollRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="py-12 text-center text-slate-400">
                                                No payroll batch generated for {payrollMonth} {payrollYear}. Click "Preview Wages" to calculate and review before generating.
                                            </td>
                                        </tr>
                                    ) : (
                                        payrollRecords.map(p => {
                                            const c = p.calculations || {};
                                            const att = p.attendanceSummary || {};

                                            return (
                                                <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                        <div>{p.employee?.name || 'Staff Member'}</div>
                                                        <span className="text-xs text-slate-400">{p.employee?.employeeId || formatRoleName(p.employee?.role)}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                                                        <div>{typeof p.month === 'number' ? new Date(2000, p.month - 1, 1).toLocaleString('en-US', { month: 'long' }) : p.month} {p.year}</div>
                                                        <span className="text-[11px] text-slate-400">{p.branchId?.name || 'Main Branch'}</span>
                                                    </td>
                                                    <td className="py-4 px-6 font-mono font-semibold">
                                                        ₹{(p.basicSalary ?? p.salaryConfig?.basicSalary ?? 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                                                        <div>Present: <span className="font-bold text-emerald-600">{att.presentDays || 0}d</span></div>
                                                        <div className="text-[11px] text-slate-400">
                                                            Paid Leave: {att.paidLeaveDays || 0}d | LOP: <span className="text-rose-500 font-bold">{att.lopDays || 0}d</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                                                        {c.lopDeduction ? `-₹${c.lopDeduction.toLocaleString('en-IN')}` : '₹0'}
                                                    </td>
                                                    <td className="py-4 px-6 text-sm font-mono text-emerald-600 font-semibold">
                                                        +₹{(c.overtimePay || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-slate-700 dark:text-slate-300">
                                                        ₹{(c.grossSalary || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                                                        ₹{(c.netSalaryPayable || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {getPayrollBadge(p.paymentStatus || p.status)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {p.balanceDue > 0 && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedPayrollForPayment(p);
                                                                        setPaymentForm({
                                                                            amount: p.balanceDue,
                                                                            paymentMethod: 'Bank Transfer',
                                                                            paymentReference: '',
                                                                            notes: `Salary disbursement for ${p.month} ${p.year}`
                                                                        });
                                                                        setIsPaymentModalOpen(true);
                                                                    }}
                                                                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <CreditCard size={12} /> Disburse
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleOpenSalarySlip(p._id)}
                                                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                                                title="Generate Printable Salary Slip"
                                                            >
                                                                <FileText size={15} />
                                                            </button>
                                                            {p.paymentStatus !== 'Paid' && (
                                                                <button
                                                                    onClick={() => handleOpenPayrollAdjustModal(p)}
                                                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                                                    title="Authorized Payroll Correction / Adjustment"
                                                                >
                                                                    <Edit2 size={15} />
                                                                </button>
                                                            )}
                                                            {p.auditHistory?.length > 0 && (
                                                                <button
                                                                    onClick={() => handleOpenAuditHistory(p)}
                                                                    className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                                                                    title={`View Audit History (${p.auditHistory.length} logs)`}
                                                                >
                                                                    <History size={15} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: PAYROLL REPORTS & SUMMARY ANALYTICS */}
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    {/* Filter Strip */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>
                            <select
                                value={reportYear}
                                onChange={(e) => setReportYear(Number(e.target.value))}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            <select
                                value={reportMonth}
                                onChange={(e) => setReportMonth(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="All">All Months</option>
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>

                            {branches.length > 1 && (
                                <select
                                    value={reportBranch}
                                    onChange={(e) => setReportBranch(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                >
                                    <option value="All">All Branches</option>
                                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            )}

                            <select
                                value={reportStatus}
                                onChange={(e) => setReportStatus(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="All">All Payment Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending / Unpaid</option>
                                <option value="Partially Paid">Partially Paid</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchPayrollReports}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                                <RefreshCw size={14} /> Refresh Report
                            </button>
                        </div>
                    </div>

                    {/* Report KPI Cards */}
                    {payrollReportsData && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Net Payable</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block font-mono">
                                    ₹{payrollReportsData.totalNetPayable?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Disbursed (Paid)</span>
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
                                    ₹{payrollReportsData.totalPaid?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Outstanding Due</span>
                                <span className="text-2xl font-black text-amber-500 mt-1 block font-mono">
                                    ₹{payrollReportsData.totalDue?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total LOP Deductions</span>
                                <span className="text-2xl font-black text-rose-500 mt-1 block font-mono">
                                    ₹{payrollReportsData.totalLOPDeductions?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paid vs Pending Batches</span>
                                <span className="text-lg font-black text-slate-900 dark:text-white mt-1 block">
                                    <span className="text-emerald-600">{payrollReportsData.paidCount} Paid</span> / <span className="text-amber-500">{payrollReportsData.pendingCount} Pending</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Branch-wise Breakdown Table */}
                    {payrollReportsData?.branchBreakdown?.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Branch-wise Payroll Summary</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                        <tr>
                                            <th className="py-3 px-6">Branch Name</th>
                                            <th className="py-3 px-6">Employees</th>
                                            <th className="py-3 px-6">Gross Wages</th>
                                            <th className="py-3 px-6">Net Wages</th>
                                            <th className="py-3 px-6">Paid Disbursed</th>
                                            <th className="py-3 px-6 text-right">Balance Due</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                        {payrollReportsData.branchBreakdown.map((b, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                                                <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">{b.branchName}</td>
                                                <td className="py-3 px-6">{b.totalEmployees}</td>
                                                <td className="py-3 px-6 font-mono">₹{b.gross?.toLocaleString('en-IN')}</td>
                                                <td className="py-3 px-6 font-mono font-bold">₹{b.net?.toLocaleString('en-IN')}</td>
                                                <td className="py-3 px-6 font-mono text-emerald-600 font-bold">₹{b.paid?.toLocaleString('en-IN')}</td>
                                                <td className="py-3 px-6 font-mono text-amber-500 font-bold text-right">₹{b.due?.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: ADD / EDIT STAFF WITH SALARY CONFIG */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingStaffId ? 'Edit Employee & Salary Config' : 'Register New Employee'}
                            </h3>
                            <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveStaff} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Employee ID *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={staffForm.employeeId}
                                        onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={staffForm.name}
                                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email *</label>
                                    <input 
                                        type="email"
                                        required
                                        value={staffForm.email}
                                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                                    <input 
                                        type="text"
                                        value={staffForm.phone}
                                        onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            {!editingStaffId && (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password *</label>
                                    <input 
                                        type="password"
                                        required
                                        value={staffForm.password}
                                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role</label>
                                    <select 
                                        value={(staffForm.role === 'BranchManager' || staffForm.role === 'Manager') ? 'Manager' : staffForm.role}
                                        onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Chef">Chef</option>
                                        <option value="Waiter">Waiter</option>
                                        <option value="Cashier">Cashier</option>
                                        <option value="DeliveryPartner">Delivery Partner</option>
                                        <option value="Staff">General Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Branch</label>
                                    <select 
                                        value={staffForm.branchId}
                                        onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Status</label>
                                    <select 
                                        value={staffForm.employmentStatus}
                                        onChange={(e) => setStaffForm({ ...staffForm, employmentStatus: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>

                            {/* Salary Configuration Sub-panel */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Salary & Payroll Rules
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Basic Salary (₹)</label>
                                        <input 
                                            type="number"
                                            value={staffForm.salaryConfig.basicSalary}
                                            onChange={(e) => setStaffForm({
                                                ...staffForm,
                                                salaryConfig: { ...staffForm.salaryConfig, basicSalary: e.target.value }
                                            })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Frequency</label>
                                        <select 
                                            value={staffForm.salaryConfig.salaryFrequency}
                                            onChange={(e) => setStaffForm({
                                                ...staffForm,
                                                salaryConfig: { ...staffForm.salaryConfig, salaryFrequency: e.target.value }
                                            })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Daily">Daily</option>
                                            <option value="Hourly">Hourly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">OT Rate (₹/hr)</label>
                                        <input 
                                            type="number"
                                            value={staffForm.salaryConfig.overtimeRatePerHour}
                                            onChange={(e) => setStaffForm({
                                                ...staffForm,
                                                salaryConfig: { ...staffForm.salaryConfig, overtimeRatePerHour: e.target.value }
                                            })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Fixed Allowances (₹)</label>
                                        <input 
                                            type="number"
                                            value={staffForm.salaryConfig.allowances}
                                            onChange={(e) => setStaffForm({
                                                ...staffForm,
                                                salaryConfig: { ...staffForm.salaryConfig, allowances: e.target.value }
                                            })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Standard Deductions (₹)</label>
                                        <input 
                                            type="number"
                                            value={staffForm.salaryConfig.deductions}
                                            onChange={(e) => setStaffForm({
                                                ...staffForm,
                                                salaryConfig: { ...staffForm.salaryConfig, deductions: e.target.value }
                                            })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsStaffModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                >
                                    {editingStaffId ? 'Save Changes' : 'Register Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ATTENDANCE CORRECTION & AUDIT */}
            {isCorrectionModalOpen && correctionTarget && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authorized Attendance Correction</h3>
                                <p className="text-xs text-slate-400">All modifications are permanently recorded in the compliance audit trail.</p>
                            </div>
                            <button onClick={() => setIsCorrectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1 mb-4">
                            <div>Employee: <strong>{correctionTarget.employee?.name}</strong></div>
                            <div>Date: <strong>{correctionTarget.dateString}</strong></div>
                            <div>Current Status: <strong>{correctionTarget.status}</strong></div>
                        </div>

                        <form onSubmit={handleSaveCorrection} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Attendance Status</label>
                                <select 
                                    value={correctionForm.status}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                >
                                    {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Check In Time</label>
                                    <input 
                                        type="time"
                                        value={correctionForm.checkInTime}
                                        onChange={(e) => setCorrectionForm({ ...correctionForm, checkInTime: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Check Out Time</label>
                                    <input 
                                        type="time"
                                        value={correctionForm.checkOutTime}
                                        onChange={(e) => setCorrectionForm({ ...correctionForm, checkOutTime: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Reason for Correction (Required for Audit) *</label>
                                <textarea 
                                    required
                                    rows="2"
                                    value={correctionForm.reason}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                                    placeholder="e.g. Employee forgot biometric clock-in, manager approved on-duty field visit"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            {/* Previous audit trail if any */}
                            {correctionTarget.correctionHistory?.length > 0 && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs space-y-1">
                                    <div className="font-bold text-amber-800 dark:text-amber-300">Previous Correction History:</div>
                                    {correctionTarget.correctionHistory.map((h, i) => (
                                        <div key={i} className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                                            {h.previousStatus} → {h.newStatus} on {new Date(h.timestamp).toLocaleDateString()} (Reason: {h.reason})
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCorrectionModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                                >
                                    Submit Approved Correction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: RECORD SALARY PAYMENT */}
            {isPaymentModalOpen && selectedPayrollForPayment && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Disburse Salary Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 mb-4">
                            <div>Employee: <strong>{selectedPayrollForPayment.employee?.name}</strong></div>
                            <div>Pay Period: <strong>{selectedPayrollForPayment.month} {selectedPayrollForPayment.year}</strong></div>
                            <div>Pending Balance Due: <strong>₹{selectedPayrollForPayment.balanceDue?.toLocaleString('en-IN')}</strong></div>
                        </div>
                        <form onSubmit={handleRecordPayrollPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Disbursement Amount (₹) *</label>
                                <input 
                                    type="number"
                                    step="any"
                                    max={selectedPayrollForPayment.balanceDue}
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                                <select 
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    <option value="Bank Transfer">Direct Bank Transfer / NEFT</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Transaction Ref / Cheque #</label>
                                <input 
                                    type="text"
                                    value={paymentForm.paymentReference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                                    placeholder="e.g. UTR / Ref No."
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                >
                                    Disburse & Log Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: PRINTABLE SALARY SLIP */}
            {isSalarySlipModalOpen && salarySlipData && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 text-slate-900 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-black">{restaurant?.name || 'Restaurant Business'}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Official Salary Slip</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => window.print()}
                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                                >
                                    <Printer size={14} /> Print Slip
                                </button>
                                <button onClick={() => setIsSalarySlipModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="py-4 grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-slate-400">Employee Name:</div>
                                <div className="font-bold text-sm">{salarySlipData.employee?.name}</div>
                            </div>
                            <div>
                                <div className="text-slate-400">Employee ID:</div>
                                <div className="font-bold text-sm">{salarySlipData.employee?.employeeId || '-'}</div>
                            </div>
                            <div>
                                <div className="text-slate-400">Designation / Role:</div>
                                <div className="font-semibold">{formatRoleName(salarySlipData.employee?.role)}</div>
                            </div>
                            <div>
                                <div className="text-slate-400">Pay Period:</div>
                                <div className="font-semibold">{salarySlipData.month} {salarySlipData.year}</div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        <div className="p-3 bg-slate-50 rounded-xl text-xs grid grid-cols-4 gap-2 mb-4">
                            <div>
                                <span className="text-slate-400 block">Working Days:</span>
                                <span className="font-bold">{salarySlipData.attendanceSummary?.totalWorkingDays ?? salarySlipData.attendanceSummary?.totalDays ?? 26}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Present Days:</span>
                                <span className="font-bold text-emerald-600">{salarySlipData.attendanceSummary?.presentDays || 0}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Absent Days:</span>
                                <span className="font-bold text-red-600">{salarySlipData.attendanceSummary?.absentDays || 0}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Overtime Hours:</span>
                                <span className="font-bold text-blue-600">{salarySlipData.attendanceSummary?.overtimeHours || 0} hrs</span>
                            </div>
                        </div>

                        {/* Earnings & Deductions Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs mb-4">
                            <div className="grid grid-cols-2 bg-slate-100 font-bold p-2.5">
                                <div>Earnings & Allowances</div>
                                <div>Deductions & Adjustments</div>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-slate-200 p-3 gap-2">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Basic Earned:</span>
                                        <span className="font-semibold">₹{(salarySlipData.calculations?.earnedBasic ?? salarySlipData.earnedBasicSalary ?? salarySlipData.basicSalary ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Overtime Pay:</span>
                                        <span className="font-semibold text-emerald-600">+₹{(salarySlipData.calculations?.overtimePay ?? salarySlipData.overtimePay ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Bonuses:</span>
                                        <span className="font-semibold">+₹{(salarySlipData.calculations?.bonuses ?? salarySlipData.bonuses ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Allowances:</span>
                                        <span className="font-semibold text-emerald-600">+₹{(salarySlipData.calculations?.allowances ?? salarySlipData.allowances ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                                        <span className="text-slate-700">Gross Salary:</span>
                                        <span className="text-slate-900">₹{(salarySlipData.calculations?.grossSalary ?? salarySlipData.grossPayable ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5 pl-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Deductions:</span>
                                        <span className="font-semibold text-red-600">-₹{(salarySlipData.calculations?.deductions ?? salarySlipData.totalDeductions ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Salary Advances:</span>
                                        <span className="font-semibold text-red-600">-₹{(salarySlipData.calculations?.advances ?? 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between font-bold text-sm">
                                <span>Net Salary Payable:</span>
                                <span className="text-emerald-700 text-base">₹{(salarySlipData.calculations?.netSalaryPayable ?? salarySlipData.netPayable ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Payment Status Summary */}
                        <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between">
                                <span>Total Disbursed:</span>
                                <span className="font-bold text-emerald-600">₹{salarySlipData.paidAmount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Outstanding Due:</span>
                                <span className="font-bold text-amber-600">₹{salarySlipData.balanceDue?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment Status:</span>
                                <span className="font-bold">{salarySlipData.paymentStatus}</span>
                            </div>
                        </div>

                        <div className="pt-6 mt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                            Computer generated salary slip. Confirmed and verified against actual attendance logs.
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 5: LOP & PAID LEAVE POLICY CONFIG */}
            {isLOPConfigModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                                    <Settings2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">LOP &amp; Leave Quota Policy</h3>
                                    <p className="text-xs text-slate-400">Configure Loss of Pay wage calculation and monthly paid leave limits</p>
                                </div>
                            </div>
                            <button onClick={() => setIsLOPConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLOPConfig} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    LOP Calculation Policy (Divisor Base)
                                </label>
                                <select
                                    value={lopConfigForm.lopCalculationPolicy}
                                    onChange={(e) => setLopConfigForm({ ...lopConfigForm, lopCalculationPolicy: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                >
                                    <option value="Configured_Working_Days">Configured Working Days (e.g. 26 Days per profile)</option>
                                    <option value="Standard_26_Days">Standard 26 Working Days (Fixed Statutory standard)</option>
                                    <option value="Calendar_Days">Actual Calendar Days in Month (28 - 31 days)</option>
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Determines the per-day wage rate: Basic Salary ÷ Working Days Base.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    Monthly Paid Leave Quota (Days per month)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={lopConfigForm.monthlyPaidLeaveQuota}
                                    onChange={(e) => setLopConfigForm({ ...lopConfigForm, monthlyPaidLeaveQuota: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Approved leaves within quota are paid; leaves exceeding this become unpaid Loss of Pay (LOP).
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                                    Unpaid Leave Deduction Basis
                                </label>
                                <select
                                    value={lopConfigForm.unpaidLeaveDeductionType}
                                    onChange={(e) => setLopConfigForm({ ...lopConfigForm, unpaidLeaveDeductionType: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                >
                                    <option value="Full_Day_Basic">Full Day Basic Pay Deduction</option>
                                    <option value="Full_Day_Gross">Full Day Gross Pay Deduction (Basic + Allowances)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsLOPConfigModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={lopSaving}
                                    className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                                >
                                    {lopSaving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: PAYROLL PREVIEW & GENERATION */}
            {isPayrollPreviewModalOpen && payrollPreview && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileSpreadsheet className="text-emerald-600" size={22} />
                                    Payroll Calculation Preview: {payrollMonth} {payrollYear}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Review auto-calculated wage components, attendance totals, and LOP deductions before finalizing batch.
                                </p>
                            </div>
                            <button onClick={() => setIsPayrollPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Preview Summary Strip */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Employees</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                                    {payrollPreview.count || 0}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Gross Wages</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                                    ₹{(payrollPreview.totalGross || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total LOP Deductions</span>
                                <span className="text-xl font-black text-rose-500 font-mono mt-0.5 block">
                                    -₹{(payrollPreview.totalLOPDeductions || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Net Payable</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                                    ₹{(payrollPreview.totalNetPayable || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {/* Table of Calculated Items */}
                        <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Attendance / Leave</th>
                                        <th className="py-3 px-4">Basic Pay</th>
                                        <th className="py-3 px-4">Overtime</th>
                                        <th className="py-3 px-4">Gross Pay</th>
                                        <th className="py-3 px-4">LOP Deduct</th>
                                        <th className="py-3 px-4">Total Deductions</th>
                                        <th className="py-3 px-4 text-right">Net Payable</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(payrollPreview.items || []).map((item, idx) => {
                                        const att = item.attendanceSummary || {};
                                        const c = item.calculations || {};
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                                    <div>{item.employeeName}</div>
                                                    <span className="text-[11px] text-slate-400">{item.employeeId} • {item.branchName}</span>
                                                </td>
                                                <td className="py-3 px-4 text-[11px]">
                                                    <div>Present: <span className="font-bold text-emerald-600">{att.presentDays || 0}d</span></div>
                                                    <div className="text-slate-400">Paid Lv: {att.paidLeaveDays || 0}d | LOP: <span className="font-bold text-rose-500">{att.lopDays || 0}d</span></div>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-semibold">
                                                    ₹{(item.basicSalary || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                                                    +₹{(c.overtimePay || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-3 px-4 font-mono">
                                                    ₹{(c.grossSalary || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold text-rose-500">
                                                    {c.lopDeduction ? `-₹${c.lopDeduction.toLocaleString('en-IN')}` : '₹0'}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-rose-600">
                                                    -₹{(c.deductions || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold text-right text-emerald-600 text-sm">
                                                    ₹{(c.netSalaryPayable || 0).toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions footer */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-400">
                                Wages calculated according to active attendance logs &amp; approved leaves.
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPayrollPreviewModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await handleGeneratePayrollBatch();
                                        setIsPayrollPreviewModalOpen(false);
                                    }}
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                                >
                                    <Check size={16} /> Confirm &amp; Generate Batch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 7: PAYROLL ADJUSTMENT & AUDIT */}
            {isPayrollAdjustModalOpen && adjustTarget && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authorized Payroll Adjustment</h3>
                                <p className="text-xs text-slate-400">
                                    {adjustTarget.employee?.name} • {adjustTarget.month} {adjustTarget.year}
                                </p>
                            </div>
                            <button onClick={() => setIsPayrollAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePayrollAdjustment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Basic Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.basicSalary}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, basicSalary: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Allowances (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.allowances}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, allowances: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Overtime Pay (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.overtimePay}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, overtimePay: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Bonuses / Incentives (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.bonuses}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, bonuses: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Deductions (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.deductions}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, deductions: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Salary Advances (₹)</label>
                                    <input
                                        type="number"
                                        value={adjustForm.advances}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, advances: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-500"
                                    />
                                </div>
                            </div>

                            {/* Live Preview of Net Calculated */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-500">Calculated Net Payable:</span>
                                <span className="font-mono font-bold text-base text-emerald-600">
                                    ₹{(
                                        (Number(adjustForm.basicSalary) || 0) +
                                        (Number(adjustForm.allowances) || 0) +
                                        (Number(adjustForm.overtimePay) || 0) +
                                        (Number(adjustForm.bonuses) || 0) -
                                        (Number(adjustForm.deductions) || 0) -
                                        (Number(adjustForm.advances) || 0)
                                    ).toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                                    Adjustment Justification / Reason (Required for Audit) *
                                </label>
                                <textarea
                                    required
                                    rows="2"
                                    value={adjustForm.notes}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                                    placeholder="e.g. Approved incentive bonus, corrected overtime hours per kitchen log"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPayrollAdjustModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustSaving}
                                    className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {adjustSaving ? 'Saving...' : 'Apply Correction & Log Audit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 8: PAYROLL AUDIT HISTORY */}
            {isAuditHistoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit History: {auditHistoryEmpName}</h3>
                                    <p className="text-xs text-slate-400">Complete record of adjustments, corrections, and disbursements</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAuditHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {selectedAuditHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    No audit history entries logged for this payroll record.
                                </div>
                            ) : (
                                selectedAuditHistory.map((item, idx) => (
                                    <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-md text-[11px]">
                                                {item.action || 'Modification'}
                                            </span>
                                            <span className="text-slate-400 text-[11px]">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-300">
                                            <strong>Performed By:</strong> {item.performedBy?.name || 'Administrator'} ({item.performedBy?.role || 'Admin'})
                                        </div>
                                        {item.notes && (
                                            <div className="text-slate-500 italic">
                                                "{item.notes}"
                                            </div>
                                        )}
                                        {item.previousCalculations && item.updatedCalculations && (
                                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between font-mono text-[11px]">
                                                <span className="text-slate-400">
                                                    Prev Net: ₹{(item.previousCalculations.netSalaryPayable || 0).toLocaleString('en-IN')}
                                                </span>
                                                <ArrowRight size={12} className="text-slate-400" />
                                                <span className="text-emerald-600 font-bold">
                                                    New Net: ₹{(item.updatedCalculations.netSalaryPayable || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsAuditHistoryModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 9: LEAVE ACTION & REVIEW */}
            {selectedLeaveForAction && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Leave Request</h3>
                            <button onClick={() => setSelectedLeaveForAction(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-1 mb-4">
                            <div>Employee: <strong>{selectedLeaveForAction.employee?.name}</strong> ({selectedLeaveForAction.employee?.employeeId})</div>
                            <div>Leave Type: <strong>{selectedLeaveForAction.leaveType}</strong></div>
                            <div>
                                Dates: <strong>{new Date(selectedLeaveForAction.startDate).toLocaleDateString()} to {new Date(selectedLeaveForAction.endDate).toLocaleDateString()}</strong> ({selectedLeaveForAction.daysCount} days)
                            </div>
                            <div className="pt-1 text-slate-500">Reason: "{selectedLeaveForAction.reason}"</div>
                        </div>

                        <form onSubmit={handleSubmitLeaveAction} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Decision *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLeaveActionForm({ ...leaveActionForm, status: 'Approved' })}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                            leaveActionForm.status === 'Approved'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <Check size={14} /> Approve Leave
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLeaveActionForm({ ...leaveActionForm, status: 'Rejected' })}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                            leaveActionForm.status === 'Rejected'
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <Ban size={14} /> Reject Leave
                                    </button>
                                </div>
                            </div>

                            {leaveActionForm.status === 'Approved' && (
                                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={leaveActionForm.isPaid}
                                            onChange={(e) => setLeaveActionForm({ ...leaveActionForm, isPaid: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Mark as Paid Leave
                                        </span>
                                    </label>
                                    <p className="text-[11px] text-slate-400 mt-1 pl-6">
                                        If unchecked, these days will be marked as Loss of Pay (LOP) and deducted during monthly payroll calculation.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                                    Manager / Admin Remarks
                                </label>
                                <textarea
                                    rows="2"
                                    value={leaveActionForm.managerRemarks}
                                    onChange={(e) => setLeaveActionForm({ ...leaveActionForm, managerRemarks: e.target.value })}
                                    placeholder="e.g. Approved as per medical certificate, or alternative shift arranged"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLeaveForAction(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={leaveActionSubmitting}
                                    className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer ${
                                        leaveActionForm.status === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {leaveActionSubmitting ? 'Submitting...' : `Confirm ${leaveActionForm.status}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
