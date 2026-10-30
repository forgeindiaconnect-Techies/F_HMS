import { useState, useEffect } from 'react';
import { 
    DollarSign, TrendingUp, TrendingDown, Calendar, Filter, 
    FileText, ArrowDownRight, ArrowUpRight, CheckCircle2, 
    AlertCircle, Download, HelpCircle, Layers, PieChart as PieIcon,
    ChevronDown, ChevronRight, Calculator
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie 
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ProfitAndLoss = () => {
    const { api } = useAuth();
    const [period, setPeriod] = useState('thismonth');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branchId, setBranchId] = useState('All');
    const [branches, setBranches] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBreakdown, setShowBreakdown] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { period };
            if (period === 'custom') {
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;
            }
            if (branchId !== 'All') params.branchId = branchId;

            const [pnlRes, branchRes] = await Promise.all([
                api.get('/analytics/profit-loss', { params }),
                api.get('/branches').catch(() => ({ data: [] }))
            ]);

            setData(pnlRes.data);
            setBranches(branchRes.data || []);
        } catch (error) {
            console.error('Failed to load P&L analytics', error);
            toast.error('Failed to load Profit & Loss statement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, branchId]);

    const handleApplyCustomDates = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleExportCSV = () => {
        if (!data) return;
        const s = data.sales || {};
        const e = data.expenses || {};
        const p = data.profitability || {};
        const cf = data.cashFlow || {};
        const bs = data.billsStatus || {};

        let csv = 'Profit & Loss Statement\n';
        csv += `Restaurant,${data.restaurant?.name || 'Authenticated Restaurant'}\n`;
        csv += `Report Period,${data.dateRange?.period || period} (${data.dateRange?.startDate} to ${data.dateRange?.endDate})\n`;
        csv += `Generated At,${new Date().toISOString()}\n\n`;

        csv += 'Metric Category,Metric Name,Amount (INR),Notes\n';
        csv += `Revenue,Gross Sales,${s.grossSales || 0},Total bill amounts before discounts and cancellations\n`;
        csv += `Revenue,Discounts Given,${s.discounts || 0},Promotional discounts and coupons applied\n`;
        csv += `Revenue,Refunds & Cancellations,${s.refunds || 0},Cancelled orders\n`;
        csv += `Revenue,Net Realized Sales,${s.netSales || 0},Realized operating sales\n`;
        csv += `Revenue,Taxes Collected,${s.taxesCollected || 0},GST/VAT collected (kept balance-neutral)\n`;
        csv += `COGS,Raw Material & Food Costs,${e.materialAndFoodCosts || 0},Stock purchases & kitchen supplies (anti-double-counted)\n`;
        csv += `Profitability,Gross Profit,${p.grossProfit || 0},Net Sales minus Material Costs\n`;
        csv += `Profitability,Gross Profit Margin %,${p.grossProfitMarginPercent || 0}%,Margin on Net Sales\n`;
        csv += `Operating Expenses,Staff Salary & Wages,${e.staffSalaryExpenses || 0},Payroll and labor expenses\n`;
        csv += `Operating Expenses,Rent,${e.rent || 0},Premises lease/rent\n`;
        csv += `Operating Expenses,Electricity,${e.electricity || 0},Power utility costs\n`;
        csv += `Operating Expenses,Water & Internet,${e.waterAndInternet || 0},Water and communication utilities\n`;
        csv += `Operating Expenses,Maintenance & Repairs,${e.maintenance || 0},Upkeep and repairs\n`;
        csv += `Operating Expenses,Other Operating Overheads,${e.otherOperatingExpenses || 0},Delivery and other operational costs\n`;
        csv += `Operating Expenses,Total Operating Overhead,${e.totalExpensesIncurred || 0},Accrued operational expenditures\n`;
        csv += `Profitability,Net Operating Profit / Loss,${p.netOperatingProfitLoss || 0},Operating profit (Net Sales - Total Operating Overhead)\n`;
        csv += `Profitability,Net Profit Margin %,${p.netProfitMarginPercent || 0}%,Net profit margin percentage\n`;
        csv += `Cash Flow,Actual Cash Collections,${cf.actualCashCollected || 0},Total paid orders collected\n`;
        csv += `Cash Flow,Customer Unpaid Receivables,${cf.unpaidCustomerReceivables || 0},Pending customer payments\n`;
        csv += `Cash Flow,Actual Cash Disbursements,${cf.actualCashOutflow || 0},Paid expenses disbursed\n`;
        csv += `Cash Flow,Outstanding Liabilities Due,${cf.outstandingLiabilities || 0},Pending supplier & utility payments\n`;
        csv += `Cash Flow,Net Cash Flow,${cf.netCashFlow || 0},Actual Cash Inflow minus Actual Cash Outflow\n`;
        csv += `Liabilities Status,Overdue Bills Amount,${bs.overdueBillsAmount || 0},Overdue unpaid bills\n`;
        csv += `Liabilities Status,Overdue Bills Count,${bs.overdueBillsCount || 0},Count of overdue bills\n`;
        csv += `Liabilities Status,Pending Bills Count,${bs.pendingBillsCount || 0},Count of pending bills\n`;
        csv += `Liabilities Status,Paid Bills Count,${bs.paidBillsCount || 0},Count of settled bills\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Profit_and_Loss_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('P&L Statement exported to CSV!');
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const sales = data?.sales || {};
    const expenses = data?.expenses || {};
    const profitability = data?.profitability || {};
    const cashFlow = data?.cashFlow || {};
    const breakdown = data?.calculationBreakdown || {};

    // Waterfall chart data
    const waterfallData = [
        { name: 'Gross Sales', amount: sales.grossSales || 0, fill: '#10B981' },
        { name: 'Discounts', amount: -(sales.discounts || 0), fill: '#F59E0B' },
        { name: 'Net Sales', amount: sales.netSales || 0, fill: '#059669' },
        { name: 'Food Cost', amount: -(expenses.materialAndFoodCosts || 0), fill: '#EF4444' },
        { name: 'Gross Profit', amount: profitability.grossProfit || 0, fill: '#3B82F6' },
        { name: 'Staff Salary', amount: -(expenses.staffSalaryExpenses || 0), fill: '#EC4899' },
        { name: 'Rent & Utils', amount: -((expenses.rent || 0) + (expenses.electricity || 0) + (expenses.waterAndInternet || 0)), fill: '#8B5CF6' },
        { name: 'Net Profit', amount: profitability.netOperatingProfitLoss || 0, fill: profitability.netOperatingProfitLoss >= 0 ? '#10B981' : '#EF4444' }
    ];

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <TrendingUp size={14} /> Financial Performance
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Profit & Loss Statement
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Audited financial statement distinguishing sales revenue, cost of goods sold, operating overheads, cash flow, and net profit.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                        onClick={handleExportCSV}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-xs"
                    >
                        <Download size={15} /> Export P&L CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Period:</span>
                    {['today', 'yesterday', 'last7days', 'thismonth', 'lastmonth'].map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                                period === p 
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {p === 'last7days' ? 'Last 7 Days' : p === 'thismonth' ? 'This Month' : p === 'lastmonth' ? 'Last Month' : p}
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

                <div className="flex flex-wrap items-center gap-3">
                    {period === 'custom' && (
                        <form onSubmit={handleApplyCustomDates} className="flex items-center gap-2">
                            <input 
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input 
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                            <button 
                                type="submit"
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                            >
                                Apply
                            </button>
                        </form>
                    )}

                    {branches.length > 1 && (
                        <select 
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        >
                            <option value="All">All Outlets</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Empty State Notification */}
            {data?.isEmpty && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm">
                    <AlertCircle size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="font-bold">No financial transactions recorded for this period</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">All calculated metrics reflect real database values (₹0). Try selecting a different date range or recording new orders and expenses.</p>
                    </div>
                </div>
            )}

            {/* KPI Cards: Net Sales, Gross Profit, Total Incurred, Net Profit */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Net Sales</span>
                        <DollarSign size={18} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{(sales.netSales || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Gross: ₹{(sales.grossSales || 0).toLocaleString('en-IN')} (Disc: ₹{sales.discounts || 0})
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-blue-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Gross Profit</span>
                        <TrendingUp size={18} />
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        ₹{(profitability.grossProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Margin: {profitability.grossProfitMarginPercent || 0}%
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-red-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Operating Costs</span>
                        <ArrowDownRight size={18} />
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        ₹{(expenses.totalExpensesIncurred || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Paid: ₹{(expenses.totalExpensesPaid || 0).toLocaleString('en-IN')} | Due: ₹{expenses.outstandingExpensesLiability || 0}
                    </div>
                </div>

                <div className={`p-5 rounded-2xl border shadow-xs ${
                    (profitability.netOperatingProfitLoss || 0) >= 0 
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Operating Profit</span>
                        <Calculator size={18} className={(profitability.netOperatingProfitLoss || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                    </div>
                    <div className={`text-2xl font-black ${
                        (profitability.netOperatingProfitLoss || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                        ₹{(profitability.netOperatingProfitLoss || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Net Margin: {profitability.netProfitMarginPercent || 0}%
                    </div>
                </div>
            </div>

            {/* Waterfall Flow Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                    Revenue to Net Profit Flow (Waterfall Breakdown)
                </h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Math.abs(v)}`} />
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {waterfallData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Complete P&L Accounting Statement Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audited Income Statement</h3>
                        <p className="text-xs text-slate-400">Statement period: {data?.dateRange?.startDate} to {data?.dateRange?.endDate}</p>
                    </div>
                    <button 
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                        {showBreakdown ? 'Hide Formula Breakdown' : 'Show Formula Breakdown'}
                        {showBreakdown ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                    {/* SECTION 1: REVENUE */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 font-bold text-xs uppercase tracking-wider text-slate-500">
                        1. Revenue & Sales
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Gross Sales</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(sales.grossSales || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center text-amber-600 dark:text-amber-400">
                        <span>Less: Customer Discounts & Coupons</span>
                        <span className="font-semibold">-₹{(sales.discounts || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center text-red-600 dark:text-red-400">
                        <span>Less: Cancelled Orders & Refunds</span>
                        <span className="font-semibold">-₹{(sales.refunds || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center font-bold">
                        <span className="text-slate-900 dark:text-white">Net Sales (Realized Sales)</span>
                        <span className="text-emerald-600 text-base">₹{(sales.netSales || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {/* SECTION 2: COST OF GOODS SOLD */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 font-bold text-xs uppercase tracking-wider text-slate-500">
                        2. Cost of Goods Sold (COGS)
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <div>
                            <span className="text-slate-700 dark:text-slate-300">Raw Material & Food Costs</span>
                            <span className="block text-[11px] text-slate-400">Derived from verified supplier purchases / stock consumption</span>
                        </div>
                        <span className="font-semibold text-red-600">-₹{(expenses.materialAndFoodCosts || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 bg-blue-50/40 dark:bg-blue-950/20 flex justify-between items-center font-bold">
                        <span className="text-blue-900 dark:text-blue-300">Gross Profit</span>
                        <span className="text-blue-600 text-base">₹{(profitability.grossProfit || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {/* SECTION 3: OPERATING EXPENSES */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 font-bold text-xs uppercase tracking-wider text-slate-500">
                        3. Operating Expenses (OPEX)
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Staff Salary & Wages</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(expenses.staffSalaryExpenses || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Rent</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(expenses.rent || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Electricity Bills</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(expenses.electricity || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Water & Internet Bills</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(expenses.waterAndInternet || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Equipment Maintenance</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(expenses.maintenance || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Other Operating Expenses</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{(expenses.otherOperatingExpenses || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center font-bold">
                        <span className="text-slate-900 dark:text-white">Total Operating Overhead</span>
                        <span className="text-red-600 text-base">₹{(expenses.totalExpensesIncurred || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {/* SECTION 4: NET OPERATING PROFIT / LOSS */}
                    <div className={`px-6 py-4 flex justify-between items-center font-black text-lg ${
                        (profitability.netOperatingProfitLoss || 0) >= 0 
                            ? 'bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300' 
                            : 'bg-red-100/50 dark:bg-red-950/40 text-red-900 dark:text-red-300'
                    }`}>
                        <div>
                            <span>Estimated Net Operating Profit / (Loss)</span>
                            <span className="block text-xs font-normal text-slate-500 mt-0.5">
                                Accrual basis: Realized Sales minus Incurred Operating Expenses
                            </span>
                        </div>
                        <span className="text-xl">
                            ₹{(profitability.netOperatingProfitLoss || 0).toLocaleString('en-IN')}
                        </span>
                    </div>

                    {/* SECTION 5: CASH MOVEMENT RECONCILIATION */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 font-bold text-xs uppercase tracking-wider text-slate-500">
                        4. Cash Flow Reconciliation (Cash Actually Collected vs Paid)
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Actual Cash / Digital Collections</span>
                        <span className="font-semibold text-emerald-600">₹{(cashFlow.actualCashCollected || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-slate-700 dark:text-slate-300">Actual Outflow Disbursed (Paid Expenses)</span>
                        <span className="font-semibold text-red-600">-₹{(cashFlow.actualCashOutflow || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center font-bold">
                        <div>
                            <span className="text-slate-900 dark:text-white">Net Cash Flow</span>
                            <span className="block text-[11px] font-normal text-slate-400">Excludes outstanding unpaid liabilities and uncollected customer credit</span>
                        </div>
                        <span className={(cashFlow.netCashFlow || 0) >= 0 ? 'text-emerald-600 text-base' : 'text-red-600 text-base'}>
                            ₹{(cashFlow.netCashFlow || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Formula Breakdown Panel */}
            {showBreakdown && breakdown && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        <HelpCircle size={16} className="text-emerald-500" /> Accounting Derivation Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            <strong>Net Sales:</strong> {breakdown.netSalesFormula}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            <strong>Gross Profit:</strong> {breakdown.grossProfitFormula}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            <strong>Net Operating Profit:</strong> {breakdown.netOperatingProfitLossFormula}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            <strong>Anti-Double-Counting Rules:</strong> {breakdown.antiDoubleCountingRule}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitAndLoss;
