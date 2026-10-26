import { useState, useEffect } from 'react';
import { 
    Download, Calendar, Filter, FileText, FileSpreadsheet, 
    PieChart, Activity, X, Printer, DollarSign, ShoppingCart, 
    Users, Clock, AlertTriangle, Layers, ChevronRight, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const REPORT_DEFINITIONS = [
    { 
        id: 'daily_earnings', 
        title: 'Daily Earnings Report', 
        desc: 'Daily breakdown of gross sales, discounts, refunds, actual collections, incurred expenses, and net profit.',
        icon: DollarSign, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-50 dark:bg-emerald-950/40' 
    },
    { 
        id: 'weekly_sales', 
        title: 'Weekly Sales Report', 
        desc: 'ISO week-by-week aggregated orders, gross sales, discounts, net sales, collections, and average order values.',
        icon: Activity, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50 dark:bg-blue-950/40' 
    },
    { 
        id: 'monthly_profit_loss', 
        title: 'Monthly Profit / Loss Report', 
        desc: 'Monthly comparison of realized sales, material costs, gross profit, salaries, overhead, and operating net margins.',
        icon: FileSpreadsheet, 
        color: 'text-purple-500', 
        bg: 'bg-purple-50 dark:bg-purple-950/40' 
    },
    { 
        id: 'expenses', 
        title: 'Expense Audit Report', 
        desc: 'Detailed ledger of all operating expenses, rent, utilities, vendor bills, payment statuses, and balance due.',
        icon: FileText, 
        color: 'text-amber-500', 
        bg: 'bg-amber-50 dark:bg-amber-950/40' 
    },
    { 
        id: 'material_purchases', 
        title: 'Material Purchase Report', 
        desc: 'Supplier purchase invoices, itemized quantities, unit costs, tax, paid amounts, and outstanding vendor liabilities.',
        icon: ShoppingCart, 
        color: 'text-teal-500', 
        bg: 'bg-teal-50 dark:bg-teal-950/40' 
    },
    { 
        id: 'attendance', 
        title: 'Staff Attendance Report', 
        desc: 'Employee daily clock times, present/absent/leave records, late arrivals, overtime hours, and corrections.',
        icon: Users, 
        color: 'text-indigo-500', 
        bg: 'bg-indigo-50 dark:bg-indigo-950/40' 
    },
    { 
        id: 'payroll', 
        title: 'Payroll & Salary Report', 
        desc: 'Monthly staff wages, earned basic, overtime compensation, deductions, net salary payable, and disbursed amounts.',
        icon: DollarSign, 
        color: 'text-pink-500', 
        bg: 'bg-pink-50 dark:bg-pink-950/40' 
    },
    { 
        id: 'pending_bills', 
        title: 'Pending Bills & Liabilities Report', 
        desc: 'Unpaid and overdue expenses, pending supplier invoices, upcoming rent and utilities with due date warnings.',
        icon: AlertTriangle, 
        color: 'text-red-500', 
        bg: 'bg-red-50 dark:bg-red-950/40' 
    }
];

const Reports = () => {
    const { api } = useAuth();
    const [selectedReport, setSelectedReport] = useState('daily_earnings');
    const [period, setPeriod] = useState('thismonth');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branch, setBranch] = useState('All');
    const [category, setCategory] = useState('All');
    const [paymentStatus, setPaymentStatus] = useState('All');
    const [supplier, setSupplier] = useState('');
    
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportResult, setReportResult] = useState(null);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await api.get('/branches');
                setBranches(res.data || []);
            } catch (error) {
                console.error('Failed to fetch branches', error);
            }
        };
        fetchBranches();
    }, []);

    const handlePresetDate = (preset) => {
        setPeriod(preset);
        const today = new Date();
        const yyyyMMdd = (date) => date.toISOString().split('T')[0];

        if (preset === 'today') {
            setStartDate(yyyyMMdd(today));
            setEndDate(yyyyMMdd(today));
        } else if (preset === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            setStartDate(yyyyMMdd(yesterday));
            setEndDate(yyyyMMdd(yesterday));
        } else if (preset === 'last7days') {
            const last7 = new Date(today);
            last7.setDate(last7.getDate() - 7);
            setStartDate(yyyyMMdd(last7));
            setEndDate(yyyyMMdd(today));
        } else if (preset === 'last30days') {
            const last30 = new Date(today);
            last30.setDate(last30.getDate() - 30);
            setStartDate(yyyyMMdd(last30));
            setEndDate(yyyyMMdd(today));
        } else if (preset === 'thismonth') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(yyyyMMdd(firstDay));
            setEndDate(yyyyMMdd(today));
        } else if (preset === 'lastmonth') {
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            setStartDate(yyyyMMdd(firstDayLastMonth));
            setEndDate(yyyyMMdd(lastDayLastMonth));
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const payload = {
                reportType: selectedReport,
                period,
                startDate: period === 'custom' ? startDate : undefined,
                endDate: period === 'custom' ? endDate : undefined,
                branchId: branch !== 'All' ? branch : undefined,
                category: category !== 'All' ? category : undefined,
                paymentStatus: paymentStatus !== 'All' ? paymentStatus : undefined,
                supplier: supplier ? supplier : undefined
            };

            const res = await api.post('/reports/generate', payload);
            setReportResult(res.data);
            toast.success('Report generated successfully!');
        } catch (error) {
            console.error('Failed to generate report', error);
            toast.error(error.response?.data?.message || 'Error generating report');
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate on initial selection or changes
    useEffect(() => {
        handleGenerateReport();
    }, [selectedReport, period, branch]);

    // Export to CSV
    const handleDownloadCSV = () => {
        if (!reportResult || !reportResult.data || reportResult.data.length === 0) {
            toast.error('No data available to export.');
            return;
        }

        const rows = reportResult.data;
        const headers = Object.keys(rows[0]).filter(k => k !== 'id' && k !== '_id');
        let csv = headers.join(',') + '\n';

        rows.forEach(row => {
            const line = headers.map(h => {
                let val = row[h];
                if (val === null || val === undefined) val = '';
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(',');
            csv += line + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedReport}_${reportResult.startDate}_to_${reportResult.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Report downloaded successfully!');
    };

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <FileSpreadsheet size={14} /> Comprehensive Business Analytics
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Financial & Operational Reports
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Generate official restaurant reports with customizable date filters, branch isolation, and instantaneous CSV export.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={handleDownloadCSV}
                        disabled={!reportResult || !reportResult.data?.length}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-md shadow-emerald-900/10"
                    >
                        <Download size={16} /> Download CSV Report
                    </button>
                </div>
            </div>

            {/* Report Type Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {REPORT_DEFINITIONS.map(rep => {
                    const Icon = rep.icon;
                    const isSelected = selectedReport === rep.id;
                    return (
                        <div 
                            key={rep.id}
                            onClick={() => setSelectedReport(rep.id)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                                isSelected 
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md border-transparent ring-2 ring-emerald-500' 
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : `${rep.bg} ${rep.color}`}`}>
                                    <Icon size={20} />
                                </div>
                                {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                )}
                            </div>
                            <h4 className="font-bold text-sm mb-1">{rep.title}</h4>
                            <p className={`text-xs line-clamp-2 ${isSelected ? 'text-white/70 dark:text-slate-600' : 'text-slate-400'}`}>
                                {rep.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Reusable Date & Dimension Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Presets:</span>
                        {[
                            { key: 'today', label: 'Today' },
                            { key: 'yesterday', label: 'Yesterday' },
                            { key: 'last7days', label: 'Last 7 Days' },
                            { key: 'last30days', label: 'Last 30 Days' },
                            { key: 'thismonth', label: 'This Month' },
                            { key: 'lastmonth', label: 'Last Month' }
                        ].map(p => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => handlePresetDate(p.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    period === p.key 
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPeriod('custom')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                period === 'custom' 
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            Custom Range
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {branches.length > 1 && (
                            <select 
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                            >
                                <option value="All">All Branches</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        )}
                        <button 
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                            {loading ? 'Generating...' : 'Refresh Report'}
                        </button>
                    </div>
                </div>

                {/* Custom Date Form */}
                {period === 'custom' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="text-xs font-bold text-slate-500">Custom Range:</span>
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <button 
                            onClick={handleGenerateReport}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                            Apply Dates
                        </button>
                    </div>
                )}
            </div>

            {/* Summary KPI Banner if available */}
            {reportResult?.summary && Object.keys(reportResult.summary).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(reportResult.summary).map(([key, val]) => (
                        <div key={key} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                            <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                                {typeof val === 'number' && key.toLowerCase().includes('total') && !key.toLowerCase().includes('count') && !key.toLowerCase().includes('orders') && !key.toLowerCase().includes('records') && !key.toLowerCase().includes('weeks') && !key.toLowerCase().includes('invoices') && !key.toLowerCase().includes('employees')
                                    ? `₹${val.toLocaleString('en-IN')}`
                                    : String(val)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Report Data Table Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            Report Data: {REPORT_DEFINITIONS.find(r => r.id === selectedReport)?.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Period: {reportResult?.startDate} to {reportResult?.endDate} | Total Records: {reportResult?.data?.length || 0}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                            <tr>
                                {reportResult?.data?.length > 0 ? (
                                    Object.keys(reportResult.data[0])
                                        .filter(k => k !== 'id' && k !== '_id')
                                        .map(col => (
                                            <th key={col} className="py-4 px-6 whitespace-nowrap">
                                                {col.replace(/([A-Z])/g, ' $1').trim()}
                                            </th>
                                        ))
                                ) : (
                                    <th className="py-4 px-6">Result</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {!reportResult?.data || reportResult.data.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-12 text-center text-slate-400">
                                        No records found for the selected date range and filters.
                                    </td>
                                </tr>
                            ) : (
                                reportResult.data.map((row, idx) => {
                                    const cols = Object.keys(row).filter(k => k !== 'id' && k !== '_id');
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                            {cols.map(c => (
                                                <td key={c} className="py-4 px-6 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                                                    {typeof row[c] === 'number' && (c.toLowerCase().includes('sales') || c.toLowerCase().includes('cost') || c.toLowerCase().includes('profit') || c.toLowerCase().includes('amount') || c.toLowerCase().includes('collected') || c.toLowerCase().includes('balance') || c.toLowerCase().includes('salary') || c.toLowerCase().includes('rent') || c.toLowerCase().includes('utilities') || c.toLowerCase().includes('expenses'))
                                                        ? `₹${row[c].toLocaleString('en-IN')}`
                                                        : String(row[c] ?? '-')}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
