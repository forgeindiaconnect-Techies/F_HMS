import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Search, Plus, Filter, Mail, Phone, Calendar, Clock, 
    MoreVertical, ShieldCheck, MapPin, X, Trash2, Edit2, 
    CheckCircle2, AlertCircle, DollarSign, FileText, Printer, 
    CreditCard, ArrowRight, UserCheck, Users, ChevronRight, History
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
        case 'Paid': return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Paid</span>;
        case 'Partially Paid': return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">Partially Paid</span>;
        case 'Pending': return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
        default: return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
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
    const initialTab = searchParams.get('tab') || 'staff'; // 'staff' | 'attendance' | 'payroll'
    const [activeTab, setActiveTab] = useState(initialTab);

    // Keep url in sync
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['staff', 'attendance', 'payroll'].includes(tabParam)) {
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
        }
    }, [activeTab, payrollMonth, payrollYear, payrollBranch]);

    const handleCalculatePayroll = async () => {
        setIsCalculatingPayroll(true);
        try {
            const res = await api.post('/staff/payroll/calculate', {
                month: payrollMonth,
                year: payrollYear,
                branchId: payrollBranch !== 'All' ? payrollBranch : undefined
            });
            setPayrollPreview(res.data);
            toast.success(`Calculated payroll for ${payrollMonth} ${payrollYear}`);
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
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'attendance'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Calendar size={16} /> Daily Attendance Tracker
                </button>
                <button
                    onClick={() => handleTabChange('payroll')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'payroll'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <DollarSign size={16} /> Payroll & Salary Disbursements
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

            {/* TAB 3: PAYROLL & SALARY */}
            {activeTab === 'payroll' && (
                <div className="space-y-4">
                    {/* Month Picker & Actions */}
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
                                {[2024, 2025, 2026, 2027].map(y => (
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

                        <div className="flex items-center gap-2.5">
                            <button 
                                onClick={handleCalculatePayroll}
                                disabled={isCalculatingPayroll}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-bold transition-colors"
                            >
                                {isCalculatingPayroll ? 'Calculating...' : 'Recalculate Wages'}
                            </button>
                            <button 
                                onClick={handleGeneratePayrollBatch}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs"
                            >
                                Generate Payroll Batch
                            </button>
                        </div>
                    </div>

                    {/* Payroll Preview Banner if active */}
                    {payrollPreview && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-sm">
                            <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                                <span>Payroll Calculation Summary for {payrollMonth} {payrollYear}</span>
                                <span>{payrollPreview.count} Staff Members Evaluated</span>
                            </div>
                            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                                Click "Generate Payroll Batch" to create official payroll records. Salaries start in <strong>Pending</strong> status until actual payment records are disbursed.
                            </p>
                        </div>
                    )}

                    {/* Payroll Records Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="py-4 px-6">Employee</th>
                                        <th className="py-4 px-6">Pay Period</th>
                                        <th className="py-4 px-6">Basic Pay</th>
                                        <th className="py-4 px-6">Earned Basic</th>
                                        <th className="py-4 px-6">Overtime Pay</th>
                                        <th className="py-4 px-6">Net Payable</th>
                                        <th className="py-4 px-6">Disbursed (Paid)</th>
                                        <th className="py-4 px-6">Pending Due</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {payrollRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="py-12 text-center text-slate-400">
                                                No payroll batch generated for {payrollMonth} {payrollYear}. Click "Generate Payroll Batch" to compute salaries.
                                            </td>
                                        </tr>
                                    ) : (
                                        payrollRecords.map(p => (
                                            <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    <div>{p.employee?.name || 'Staff Member'}</div>
                                                    <span className="text-xs text-slate-400">{p.employee?.employeeId || formatRoleName(p.employee?.role)}</span>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                                                    {typeof p.month === 'number' ? new Date(2000, p.month - 1, 1).toLocaleString('en-US', { month: 'long' }) : p.month} {p.year}
                                                </td>
                                                <td className="py-4 px-6">
                                                    ₹{(p.basicSalary ?? p.salaryConfig?.basicSalary ?? 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6 font-semibold">
                                                    ₹{(p.calculations?.earnedBasic ?? p.earnedBasicSalary ?? 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6 text-emerald-600 font-semibold">
                                                    +₹{(p.calculations?.overtimePay ?? p.overtimePay ?? 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                    ₹{(p.calculations?.netSalaryPayable ?? p.netPayable ?? 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400">
                                                    ₹{(p.paidAmount ?? 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-amber-600 dark:text-amber-400">
                                                    ₹{(p.balanceDue ?? 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getPayrollBadge(p.paymentStatus)}
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
                                                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                                            >
                                                                <CreditCard size={12} /> Disburse
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleOpenSalarySlip(p._id)}
                                                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Generate Printable Salary Slip"
                                                        >
                                                            <FileText size={15} />
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
        </div>
    );
};

export default StaffManagement;
