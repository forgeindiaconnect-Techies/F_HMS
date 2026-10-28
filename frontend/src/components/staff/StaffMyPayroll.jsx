import { useState, useEffect } from 'react';
import { 
    CreditCard, Calendar, Clock, CheckCircle2, AlertCircle, 
    FileText, Printer, X, Download, DollarSign, Building, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getPayrollBadge = (status, paymentStatus) => {
    if (paymentStatus === 'Paid') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                Paid
            </span>
        );
    }
    if (paymentStatus === 'Partially Paid') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                <Clock size={13} className="text-blue-600 dark:text-blue-400" />
                Partially Paid
            </span>
        );
    }
    if (status === 'Approved' || status === 'Finalized') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                <Clock size={13} className="text-purple-600 dark:text-purple-400" />
                Pending Payment
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock size={13} className="text-amber-600 dark:text-amber-400" />
            Generated
        </span>
    );
};

const StaffMyPayroll = () => {
    const { api, user } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [slipLoading, setSlipLoading] = useState(false);
    const [restaurantInfo, setRestaurantInfo] = useState(null);

    const fetchMyPayroll = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/staff/payroll/my');
            setPayrolls(data);
        } catch (error) {
            console.error('Failed to load my payroll', error);
            toast.error(error.response?.data?.message || 'Failed to fetch payroll records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyPayroll();
    }, []);

    const handleOpenSlip = async (payrollId) => {
        try {
            setSlipLoading(true);
            const { data } = await api.get(`/staff/payroll/my/${payrollId}/slip`);
            setSelectedSlip(data.payroll);
            setRestaurantInfo(data.restaurant);
        } catch (error) {
            console.error('Failed to fetch salary slip', error);
            toast.error(error.response?.data?.message || 'Unable to open salary slip');
        } finally {
            setSlipLoading(false);
        }
    };

    const latestPayroll = payrolls[0] || null;

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        My Salary &amp; Payroll
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        View your monthly wages, attendance records, LOP deductions, and download official salary slips.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl border border-gray-200 dark:border-slate-700">
                        Employee ID: <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{user?.employeeId || 'Active'}</span>
                    </span>
                </div>
            </div>

            {/* Quick Metrics of Latest Payroll */}
            {latestPayroll && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                            Latest Pay Period
                        </span>
                        <div className="text-lg font-black text-gray-900 dark:text-white mt-1">
                            {typeof latestPayroll.month === 'number' 
                                ? new Date(2000, latestPayroll.month - 1, 1).toLocaleString('en-US', { month: 'long' }) 
                                : latestPayroll.month} {latestPayroll.year}
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 mt-0.5 block">
                            Status: {latestPayroll.paymentStatus || latestPayroll.status}
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                            Basic Fixed Salary
                        </span>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            ₹{(latestPayroll.basicSalary || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 block">
                            Earned: ₹{(latestPayroll.earnedBasicSalary || latestPayroll.calculations?.earnedBasic || 0).toLocaleString('en-IN')}
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                            LOP / Unpaid Deductions
                        </span>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                            -₹{(latestPayroll.lopDeduction || latestPayroll.calculations?.lopDeduction || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 block">
                            {latestPayroll.attendanceSummary?.lopDays || 0} Days LOP / Absent
                        </span>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md">
                        <span className="text-xs font-black text-emerald-100 uppercase tracking-wider block">
                            Net Salary Payable
                        </span>
                        <div className="text-2xl font-black mt-1">
                            ₹{(latestPayroll.netPayable || latestPayroll.calculations?.netSalaryPayable || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-emerald-100 font-bold mt-0.5 block">
                            Paid: ₹{(latestPayroll.paidAmount || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            )}

            {/* Payroll History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-base font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Salary Statements &amp; Pay Slips
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Audit log of your wages, attendance summaries, and disbursements.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-gray-400 text-xs font-bold animate-pulse">
                        Loading your payroll statements...
                    </div>
                ) : payrolls.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                            <CreditCard size={28} />
                        </div>
                        <h3 className="font-bold text-gray-700 dark:text-slate-300 text-sm">No Payroll Statements Yet</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            Your monthly payroll will appear here once generated by restaurant administration.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-slate-850 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-100 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-5">Salary Month</th>
                                    <th className="py-3.5 px-5">Basic Pay</th>
                                    <th className="py-3.5 px-5">Earned Basic</th>
                                    <th className="py-3.5 px-5">Allowances &amp; OT</th>
                                    <th className="py-3.5 px-5">LOP Deduction</th>
                                    <th className="py-3.5 px-5">Net Payable</th>
                                    <th className="py-3.5 px-5">Disbursed (Paid)</th>
                                    <th className="py-3.5 px-5">Payment Status</th>
                                    <th className="py-3.5 px-5">Disbursement Details</th>
                                    <th className="py-3.5 px-5 text-right">Salary Slip</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                                {payrolls.map((p) => {
                                    const monthName = typeof p.month === 'number'
                                        ? new Date(2000, p.month - 1, 1).toLocaleString('en-US', { month: 'long' })
                                        : p.month;
                                    const earned = p.calculations?.earnedBasic ?? p.earnedBasicSalary ?? p.basicSalary ?? 0;
                                    const ot = p.calculations?.overtimePay ?? p.overtimePay ?? 0;
                                    const allowances = p.calculations?.allowances ?? p.allowances ?? 0;
                                    const lopDed = p.calculations?.lopDeduction ?? p.lopDeduction ?? 0;
                                    const net = p.calculations?.netSalaryPayable ?? p.netPayable ?? 0;
                                    const paid = p.paidAmount ?? 0;

                                    const latestPayment = (p.payments && p.payments.length > 0) ? p.payments[p.payments.length - 1] : null;

                                    return (
                                        <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-5 font-black text-gray-900 dark:text-white">
                                                {monthName} {p.year}
                                            </td>
                                            <td className="py-4 px-5 font-bold">
                                                ₹{(p.basicSalary || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-4 px-5 font-bold text-gray-900 dark:text-white">
                                                ₹{earned.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-4 px-5 font-bold text-emerald-600 dark:text-emerald-400">
                                                +₹{(allowances + ot).toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-4 px-5 font-bold text-rose-600 dark:text-rose-400">
                                                {lopDed > 0 ? `-₹${lopDed.toLocaleString('en-IN')}` : '₹0'}
                                                {p.attendanceSummary?.lopDays > 0 && (
                                                    <span className="block text-[10px] text-gray-400 font-normal">
                                                        ({p.attendanceSummary.lopDays} LOP {p.attendanceSummary.lopDays === 1 ? 'day' : 'days'})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                                                ₹{net.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-4 px-5 font-black text-gray-900 dark:text-white">
                                                ₹{paid.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-4 px-5">
                                                {getPayrollBadge(p.status, p.paymentStatus)}
                                            </td>
                                            <td className="py-4 px-5">
                                                {latestPayment ? (
                                                    <div className="space-y-0.5">
                                                        <span className="font-bold text-gray-800 dark:text-slate-200 block">
                                                            {latestPayment.paymentMethod}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono block">
                                                            Ref: {latestPayment.reference || 'N/A'} • {new Date(latestPayment.paymentDate).toLocaleDateString('en-IN')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic text-[11px]">Pending Disbursement</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSlip(p._id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <FileText size={13} />
                                                    <span>Slip</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Printable Professional Salary Slip Modal */}
            {selectedSlip && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 my-8 space-y-6 animate-in zoom-in-95 duration-200 print:m-0 print:p-0 print:border-none print:shadow-none">
                        
                        {/* Header bar (Hide buttons on actual print) */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden">
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                                <ShieldCheck size={18} />
                                <span>Official Verified Salary Slip</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                                >
                                    <Printer size={14} />
                                    <span>Print / Save as PDF</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSlip(null)}
                                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Salary Slip Document Paper Preview */}
                        <div className="border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
                            {/* Restaurant Branding */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        {restaurantInfo?.name || 'Restaurant Dining Ops'}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {selectedSlip.branchId?.name ? `Branch: ${selectedSlip.branchId.name}` : 'Main Counter Outlet'}
                                    </p>
                                    {restaurantInfo?.address && (
                                        <p className="text-[11px] text-gray-400 mt-0.5">{restaurantInfo.address}</p>
                                    )}
                                    {restaurantInfo?.gstin && (
                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">GSTIN: {restaurantInfo.gstin}</p>
                                    )}
                                </div>
                                <div className="text-left sm:text-right">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                                        Monthly Pay Slip
                                    </span>
                                    <div className="text-sm font-black text-gray-900 mt-1 font-mono">
                                        {typeof selectedSlip.month === 'number' 
                                            ? new Date(2000, selectedSlip.month - 1, 1).toLocaleString('en-US', { month: 'long' }) 
                                            : selectedSlip.month} {selectedSlip.year}
                                    </div>
                                    <span className="text-[10px] text-gray-400 block font-mono">
                                        Generated: {new Date(selectedSlip.createdAt || Date.now()).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Employee Information Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 text-xs">
                                <div>
                                    <span className="text-gray-400 font-bold block">Employee Name:</span>
                                    <p className="font-black text-gray-900">{selectedSlip.employee?.name || user?.name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block">Employee ID:</span>
                                    <p className="font-mono font-black text-gray-900">{selectedSlip.employee?.employeeId || user?.employeeId || 'EMP-01'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block">Designation / Role:</span>
                                    <p className="font-bold text-gray-800">{selectedSlip.employee?.role || user?.role}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block">Bank / UPI:</span>
                                    <p className="font-mono text-gray-800 truncate" title={selectedSlip.employee?.bankDetails?.accountNumber || selectedSlip.employee?.bankDetails?.upiId}>
                                        {selectedSlip.employee?.bankDetails?.accountNumber 
                                            ? `A/C: ••••${String(selectedSlip.employee.bankDetails.accountNumber).slice(-4)}`
                                            : (selectedSlip.employee?.bankDetails?.upiId || 'Direct Bank Settlement')}
                                    </p>
                                </div>
                            </div>

                            {/* Attendance Days Matrix */}
                            <div className="p-3 bg-gray-50 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 border border-gray-100">
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Standard Days</span>
                                    <span className="font-black text-gray-900">{selectedSlip.attendanceSummary?.totalWorkingDays || 26}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Present Days</span>
                                    <span className="font-black text-emerald-600">{selectedSlip.attendanceSummary?.presentDays || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Paid Leaves</span>
                                    <span className="font-black text-purple-600">{selectedSlip.attendanceSummary?.paidLeaveDays || selectedSlip.attendanceSummary?.leaveDays || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Unpaid (LOP) Days</span>
                                    <span className="font-black text-rose-600">{selectedSlip.attendanceSummary?.lopDays || selectedSlip.attendanceSummary?.unpaidLeaveDays || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Overtime</span>
                                    <span className="font-black text-blue-600">{selectedSlip.attendanceSummary?.overtimeHours || 0} hrs</span>
                                </div>
                            </div>

                            {/* Earnings vs Deductions Table */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                                <div className="grid grid-cols-2 bg-gray-100 p-2.5 font-bold uppercase tracking-wider text-gray-700">
                                    <div>Gross Earnings</div>
                                    <div>Deductions &amp; Adjustments</div>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-gray-200 p-3 gap-3">
                                    {/* Earnings */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Basic Fixed:</span>
                                            <span className="font-bold">₹{(selectedSlip.basicSalary || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Earned Basic:</span>
                                            <span className="font-bold text-gray-900">
                                                ₹{(selectedSlip.calculations?.earnedBasic ?? selectedSlip.earnedBasicSalary ?? selectedSlip.basicSalary ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Allowances:</span>
                                            <span className="font-bold text-emerald-600">
                                                +₹{(selectedSlip.calculations?.allowances ?? selectedSlip.allowances ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Overtime Pay:</span>
                                            <span className="font-bold text-emerald-600">
                                                +₹{(selectedSlip.calculations?.overtimePay ?? selectedSlip.overtimePay ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200 font-extrabold text-gray-900">
                                            <span>Gross Total:</span>
                                            <span>
                                                ₹{(selectedSlip.calculations?.grossSalary ?? selectedSlip.grossPayable ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div className="space-y-2 pl-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Loss of Pay (LOP):</span>
                                            <span className="font-bold text-rose-600">
                                                -₹{(selectedSlip.calculations?.lopDeduction ?? selectedSlip.lopDeduction ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Other Deductions:</span>
                                            <span className="font-bold text-rose-600">
                                                -₹{(selectedSlip.calculations?.deductions ?? selectedSlip.otherDeductions ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Advances / Loans:</span>
                                            <span className="font-bold text-rose-600">
                                                -₹{(selectedSlip.calculations?.advances || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200 font-extrabold text-rose-700">
                                            <span>Total Deductions:</span>
                                            <span>
                                                -₹{(selectedSlip.calculations?.totalDeductions ?? selectedSlip.totalDeductions ?? 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Payable Bar */}
                                <div className="bg-emerald-50 p-3 border-t border-gray-200 flex justify-between items-center font-black">
                                    <span className="text-emerald-950 uppercase text-xs tracking-wider">Net Amount Disbursable:</span>
                                    <span className="text-emerald-700 text-lg font-mono">
                                        ₹{(selectedSlip.calculations?.netSalaryPayable ?? selectedSlip.netPayable ?? 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Settlement Information */}
                            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Status:</span>
                                    <span className="font-bold">{selectedSlip.paymentStatus || 'Pending'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount Disbursed:</span>
                                    <span className="font-bold text-emerald-600">₹{(selectedSlip.paidAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                {selectedSlip.payments && selectedSlip.payments.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Transaction Reference:</span>
                                        <span className="font-mono font-bold text-gray-800">
                                            {selectedSlip.payments[0].reference || 'Bank Disbursal'} • {new Date(selectedSlip.payments[0].paymentDate).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Signature Footer */}
                            <div className="pt-6 border-t border-gray-200 flex justify-between items-end text-[11px] text-gray-500">
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-800">Employee Signature</p>
                                    <div className="w-36 border-b border-gray-300 h-6"></div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="font-bold text-gray-800">Authorized Signatory / Branch Manager</p>
                                    <div className="w-48 border-b border-gray-300 h-6 ml-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffMyPayroll;
