import { useState, useEffect } from 'react';
import { 
    DollarSign, ShoppingBag, TrendingUp, TrendingDown, Calendar, 
    Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, CreditCard,
    ArrowUpRight, ArrowDownRight, Info, Download
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie 
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DailyEarnings = () => {
    const { api } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [branchId, setBranchId] = useState('All');
    const [branches, setBranches] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const yesterdayDate = (() => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return y.toISOString().split('T')[0];
    })();

    const handleExportCSV = () => {
        if (!data) return;
        const m = data.metrics || {};
        const exp = data.expenses || {};
        const prof = data.profitability || {};

        let csv = 'Daily Metric,Value,Notes\n';
        csv += `Report Date,${selectedDate},Tracking Period\n`;
        csv += `Gross Sales,${m.grossSales || 0},Total bill value\n`;
        csv += `Completed Orders,${m.completedOrders || 0},Paid customer tickets\n`;
        csv += `Total Orders,${m.totalOrders || 0},All orders recorded\n`;
        csv += `Amount Collected,${m.amountCollected || 0},Actual cash and digital collections\n`;
        csv += `Outstanding Customer Tabs,${m.outstandingCustomerPayments || 0},Unsettled payments\n`;
        csv += `Total Daily Expenses,${exp.totalDailyExpenses || 0},Material + staff + rent + overheads\n`;
        csv += `Material & Food Costs,${exp.materialCosts || 0},Raw ingredients\n`;
        csv += `Staff Wages / Salary,${exp.staffExpenses || 0},Daily wages & proration\n`;
        csv += `Rent & Utilities,${exp.rentAndUtilities || 0},Daily facility proration\n`;
        csv += `Other Operating Expenses,${exp.otherExpenses || 0},Daily operational overheads\n`;
        csv += `Estimated Daily Profit,${prof.estimatedProfitLoss || 0},Net Sales minus Total Expenses\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Daily_Earnings_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Daily metrics for ${selectedDate} exported to CSV!`);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { date: selectedDate };
            if (branchId !== 'All') params.branchId = branchId;

            const [res, branchRes] = await Promise.all([
                api.get('/analytics/daily-earnings', { params }),
                api.get('/branches').catch(() => ({ data: [] }))
            ]);

            setData(res.data);
            setBranches(branchRes.data || []);
        } catch (error) {
            console.error('Failed to load daily earnings', error);
            toast.error('Failed to load daily earnings analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate, branchId]);

    const metrics = data?.metrics || {};
    const expenses = data?.expenses || {};
    const profitability = data?.profitability || {};
    const hourlyTrend = data?.hourlyTrend || [];
    const collectionBreakdown = metrics.collectionBreakdown || {};

    const collectionChartData = Object.entries(collectionBreakdown)
        .filter(([_, val]) => val > 0)
        .map(([method, val]) => ({ name: method, value: val }));

    const COLLECTION_COLORS = {
        Cash: '#10B981',
        Card: '#3B82F6',
        UPI: '#8B5CF6',
        Online: '#06B6D4',
        Other: '#64748B'
    };

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <Clock size={14} /> Real-Time Business Tracking
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Daily Earnings & Sales Analytics
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Today's live financial pulse: real orders, actual payment collections, daily expenses, and confirmed vs estimated profit.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                selectedDate === new Date().toISOString().split('T')[0]
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setSelectedDate(yesterdayDate)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                selectedDate === yesterdayDate
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                        >
                            Yesterday
                        </button>
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-2 py-1 bg-transparent border-0 text-xs font-bold focus:outline-hidden"
                        />
                    </div>

                    {branches.length > 1 && (
                        <select 
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        >
                            <option value="All">All Outlets</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    )}

                    <button 
                        onClick={handleExportCSV}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
                        title="Export Daily Report CSV"
                    >
                        <Download size={15} /> Export CSV
                    </button>

                    <button 
                        onClick={fetchData}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                        title="Refresh live metrics"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Daily KPI Snapshot */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
                        <ShoppingBag size={18} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{(metrics.grossSales || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {metrics.totalOrders || 0} orders ({metrics.completedOrders || 0} paid, {metrics.cancelledOrders || 0} cancelled)
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Amount Collected</span>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{(metrics.amountCollected || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Unsettled customer tabs: ₹{(metrics.outstandingCustomerPayments || 0).toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-red-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Daily Expenses</span>
                        <ArrowDownRight size={18} />
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        ₹{(expenses.totalDailyExpenses || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Food: ₹{expenses.materialCosts || 0} | Staff: ₹{expenses.staffExpenses || 0}
                    </div>
                </div>

                <div className={`p-5 rounded-2xl border shadow-xs ${
                    (profitability.estimatedProfitLoss || 0) >= 0 
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {profitability.isEstimated ? 'Estimated Profit' : 'Confirmed Cash Profit'}
                        </span>
                        <DollarSign size={18} className={(profitability.estimatedProfitLoss || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                    </div>
                    <div className={`text-2xl font-black ${
                        (profitability.estimatedProfitLoss || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                        ₹{(profitability.estimatedProfitLoss || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Net Sales: ₹{(metrics.netSales || 0).toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Proration and Cost Transparency Notice */}
            {profitability.costProrationNotes && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Info size={16} className="text-blue-500 shrink-0" />
                    <span><strong>Accounting Transparency:</strong> {profitability.costProrationNotes}</span>
                </div>
            )}

            {/* Charts: Hourly Sales Trend & Payment Collection Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        Today's Hourly Revenue & Order Flow
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="hourlyColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip formatter={(value, name) => [name === 'revenue' ? `₹${value}` : value, name === 'revenue' ? 'Revenue' : 'Orders']} />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#hourlyColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                        Collections by Payment Method
                    </h3>
                    {collectionChartData.length === 0 ? (
                        <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
                            No payment collections recorded today.
                        </div>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={collectionChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={75}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {collectionChartData.map((entry) => (
                                            <Cell key={entry.name} fill={COLLECTION_COLORS[entry.name] || '#64748B'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Expense Breakdown Details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Daily Expense Allocation Summary ({data?.dateLabel || selectedDate})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                        <span className="text-slate-400 block mb-1">Material & Food Cost:</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            ₹{(expenses.materialCosts || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                        <span className="text-slate-400 block mb-1">Staff Expenses:</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            ₹{(expenses.staffExpenses || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                        <span className="text-slate-400 block mb-1">Rent & Utilities:</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            ₹{(expenses.rentAndUtilities || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                        <span className="text-slate-400 block mb-1">Other Operating Costs:</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                            ₹{(expenses.otherExpenses || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyEarnings;
