import { useState, useEffect, useMemo } from 'react';
import { 
    DollarSign, TrendingDown, TrendingUp, Calendar, Building2, Search, 
    Download, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Tag, Plus, Filter, FileText, CheckCircle2, Receipt
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_COLORS = {
    'Kitchen Supplies': '#10B981',
    'Utility Bill': '#3B82F6',
    'Maintenance': '#F59E0B',
    'Staff Welfare': '#8B5CF6',
    'Marketing': '#EC4899',
    'Others': '#6B7280'
};

const ExpenseSummaryAdmin = () => {
    const { api } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter controls
    const [selectedBranch, setSelectedBranch] = useState('All');
    const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // 'today' | 'weekly' | 'monthly' | 'all'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, branchRes, orderRes] = await Promise.all([
                api.get('/expenses').catch(() => ({ data: [] })),
                api.get('/branches').catch(() => ({ data: [] })),
                api.get('/orders').catch(() => ({ data: [] }))
            ]);

            setExpenses(expRes.data || []);
            setBranches(branchRes.data || []);
            setOrders(orderRes.data || []);
        } catch (error) {
            console.error('Failed to fetch expense summary data', error);
            toast.error('Failed to load expense records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter expenses by selected branch & date period
    const filteredExpenses = useMemo(() => {
        const now = new Date();

        return expenses.filter(exp => {
            // Branch filter
            const bId = exp.branchId?._id || exp.branchId;
            if (selectedBranch !== 'All' && bId !== selectedBranch) {
                return false;
            }

            // Date period filter
            const expDate = new Date(exp.date);
            if (selectedPeriod === 'today') {
                const today = new Date();
                if (expDate.toDateString() !== today.toDateString()) return false;
            } else if (selectedPeriod === 'weekly') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                if (expDate < oneWeekAgo) return false;
            } else if (selectedPeriod === 'monthly') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                if (expDate < startOfMonth) return false;
            }

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const bName = (exp.branchId?.name || '').toLowerCase();
                const desc = (exp.description || '').toLowerCase();
                const cat = (exp.category || '').toLowerCase();
                const staffName = (exp.staff || '').toLowerCase();
                if (!bName.includes(query) && !desc.includes(query) && !cat.includes(query) && !staffName.includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [expenses, selectedBranch, selectedPeriod, searchQuery]);

    // Calculate metrics: Today, Weekly, Monthly, Total
    const todayExpensesTotal = useMemo(() => {
        const todayStr = new Date().toDateString();
        return expenses.filter(e => {
            const bId = e.branchId?._id || e.branchId;
            if (selectedBranch !== 'All' && bId !== selectedBranch) return false;
            return new Date(e.date).toDateString() === todayStr;
        }).reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [expenses, selectedBranch]);

    const weeklyExpensesTotal = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return expenses.filter(e => {
            const bId = e.branchId?._id || e.branchId;
            if (selectedBranch !== 'All' && bId !== selectedBranch) return false;
            return new Date(e.date) >= oneWeekAgo;
        }).reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [expenses, selectedBranch]);

    const monthlyExpensesTotal = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return expenses.filter(e => {
            const bId = e.branchId?._id || e.branchId;
            if (selectedBranch !== 'All' && bId !== selectedBranch) return false;
            return new Date(e.date) >= startOfMonth;
        }).reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [expenses, selectedBranch]);

    const totalFilteredExpenses = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }, [filteredExpenses]);

    // Filter sales / revenue for matching period & branch
    const filteredSales = useMemo(() => {
        const now = new Date();
        return orders.filter(o => {
            if (!o.isPaid && o.status !== 'Completed') return false;
            const bId = o.branchId?._id || o.branchId;
            if (selectedBranch !== 'All' && bId && bId !== selectedBranch) return false;

            const oDate = new Date(o.createdAt || o.date);
            if (selectedPeriod === 'today') {
                return oDate.toDateString() === now.toDateString();
            } else if (selectedPeriod === 'weekly') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return oDate >= oneWeekAgo;
            } else if (selectedPeriod === 'monthly') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return oDate >= startOfMonth;
            }
            return true;
        }).reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    }, [orders, selectedBranch, selectedPeriod]);

    // Financial Analysis: Expense vs Sales vs Profit
    const netProfit = filteredSales - totalFilteredExpenses;
    const profitMargin = filteredSales > 0 ? ((netProfit / filteredSales) * 100).toFixed(1) : 0;

    // Expenses by Category for Pie / Bar chart
    const categoryChartData = useMemo(() => {
        const catMap = {};
        filteredExpenses.forEach(e => {
            const cat = e.category || 'Others';
            catMap[cat] = (catMap[cat] || 0) + (e.amount || 0);
        });
        return Object.keys(catMap).map(cat => ({
            name: cat,
            value: catMap[cat]
        }));
    }, [filteredExpenses]);

    // Export Expense Summary Report as CSV
    const handleExportCSV = () => {
        if (filteredExpenses.length === 0) {
            toast.error('No expense records to export.');
            return;
        }

        let csv = 'Expense ID,Branch,Category,Description,Logged By,Date,Amount (INR)\n';
        filteredExpenses.forEach(e => {
            const bName = e.branchId?.name || 'Main Branch';
            const cleanDesc = `"${(e.description || '').replace(/"/g, '""')}"`;
            csv += `"#EXP-${e._id.substring(e._id.length - 4).toUpperCase()}",${bName},${e.category},${cleanDesc},${e.staff},${new Date(e.date).toLocaleDateString()},${e.amount}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Expense_Summary_Report_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Expense Summary CSV report downloaded!');
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Cross-Branch Expense &amp; Profit Tracking
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Monitor branch operational expenses, compare gross sales vs expenses, and analyze net profit margins.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md"
                    >
                        <Download size={16} /> Export CSV Report
                    </button>
                </div>
            </div>

            {/* Filter Bar (Branch & Date Controls) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-emerald-600" />
                    <span className="text-xs font-black uppercase text-gray-700 tracking-wider">Filters &amp; Scopes</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Branch Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            <option value="All">All Branches ({branches.length})</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date-wise Period Selector */}
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setSelectedPeriod('today')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPeriod === 'today' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('weekly')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPeriod === 'weekly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('monthly')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPeriod === 'monthly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPeriod === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All Time
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <>
                    {/* Expense KPI Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Expenses</span>
                            <div className="flex items-end justify-between mt-3">
                                <h3 className="text-3xl font-extrabold text-gray-900">₹{todayExpensesTotal.toLocaleString('en-IN')}</h3>
                                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                                    <TrendingDown size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weekly Expenses (7 Days)</span>
                            <div className="flex items-end justify-between mt-3">
                                <h3 className="text-3xl font-extrabold text-gray-900">₹{weeklyExpensesTotal.toLocaleString('en-IN')}</h3>
                                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                                    <Calendar size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Expenses (This Month)</span>
                            <div className="flex items-end justify-between mt-3">
                                <h3 className="text-3xl font-extrabold text-gray-900">₹{monthlyExpensesTotal.toLocaleString('en-IN')}</h3>
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                    <Tag size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Filter Total</span>
                            <div className="flex items-end justify-between mt-3">
                                <h3 className="text-3xl font-extrabold text-white">₹{totalFilteredExpenses.toLocaleString('en-IN')}</h3>
                                <div className="p-2.5 bg-white/10 text-emerald-400 rounded-xl">
                                    <Receipt size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Expense vs Sales / Profit Breakdown Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Sales vs Expense vs Profit Summary Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        Financial Health: Sales vs. Expenses vs. Net Profit
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Gross Revenue compared directly against operational expenses for the selected branch &amp; period.
                                    </p>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase border border-emerald-200">
                                    {selectedPeriod} View
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Gross Sales Revenue</span>
                                    <h4 className="text-2xl font-black text-emerald-950">₹{filteredSales.toLocaleString('en-IN')}</h4>
                                    <span className="text-[10px] text-emerald-600 font-bold block">From Completed Orders</span>
                                </div>

                                <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-1">
                                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Total Expenses</span>
                                    <h4 className="text-2xl font-black text-rose-950">₹{totalFilteredExpenses.toLocaleString('en-IN')}</h4>
                                    <span className="text-[10px] text-rose-600 font-bold block">Operational &amp; Petty Cash</span>
                                </div>

                                <div className={`p-4 rounded-2xl border space-y-1 ${netProfit >= 0 ? 'bg-teal-50/70 border-teal-100' : 'bg-red-50/70 border-red-100'}`}>
                                    <span className={`text-xs font-bold uppercase tracking-wider block ${netProfit >= 0 ? 'text-teal-700' : 'text-red-700'}`}>Net Profit Margin</span>
                                    <h4 className={`text-2xl font-black ${netProfit >= 0 ? 'text-teal-950' : 'text-red-950'}`}>₹{netProfit.toLocaleString('en-IN')}</h4>
                                    <span className={`text-[10px] font-bold block ${netProfit >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                                        Margin: {profitMargin}% {netProfit >= 0 ? 'Profit' : 'Loss'}
                                    </span>
                                </div>
                            </div>

                            {/* Visual Progress Bar Breakdown */}
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                                    <span>Sales Revenue (100%) vs Expenses ({filteredSales > 0 ? ((totalFilteredExpenses / filteredSales) * 100).toFixed(1) : 0}%)</span>
                                    <span className="text-emerald-600">{profitMargin}% Net Margin</span>
                                </div>
                                <div className="w-full bg-rose-100 rounded-full h-4 overflow-hidden flex shadow-inner">
                                    <div 
                                        className="bg-emerald-500 h-full transition-all duration-700" 
                                        style={{ width: `${Math.max(0, Math.min(100, (netProfit / (filteredSales || 1)) * 100))}%` }}
                                        title="Net Profit"
                                    />
                                    <div 
                                        className="bg-rose-500 h-full transition-all duration-700" 
                                        style={{ width: `${Math.max(0, Math.min(100, (totalFilteredExpenses / (filteredSales || 1)) * 100))}%` }}
                                        title="Expenses"
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 pt-1">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Net Profit</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Operating Expenses</span>
                                </div>
                            </div>
                        </div>

                        {/* Expense Category Share Donut Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Expense Category Share</h3>
                                <p className="text-xs text-gray-500">Cost distribution across operational categories.</p>
                            </div>

                            <div className="h-56 w-full my-2">
                                {categoryChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryChartData}
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {categoryChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                        No expense records for this filter
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                                {categoryChartData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1.5 truncate">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#6B7280' }} />
                                        <span className="text-gray-700 truncate">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Detailed Expense Ledger Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4">
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Detailed Expense Audit Ledger</h3>
                                <p className="text-xs text-gray-500">Showing {filteredExpenses.length} expense transactions for {selectedBranch === 'All' ? 'All Branches' : 'Selected Branch'}</p>
                            </div>
                            
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by branch, category, notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="p-4">Expense ID</th>
                                        <th className="p-4">Branch Location</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Description / Notes</th>
                                        <th className="p-4">Logged By</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                    {filteredExpenses.map((exp) => {
                                        const bName = exp.branchId?.name || 'Main Branch';

                                        return (
                                            <tr key={exp._id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="p-4 font-bold text-gray-900 font-mono text-xs">#EXP-{exp._id.substring(exp._id.length - 4).toUpperCase()}</td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                        <Building2 size={12} className="text-gray-500" /> {bName}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span 
                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                                                        style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#6B7280' }}
                                                    >
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 max-w-xs truncate font-medium text-gray-700" title={exp.description}>{exp.description}</td>
                                                <td className="p-4 text-xs font-bold text-gray-800">{exp.staff}</td>
                                                <td className="p-4 text-xs font-medium text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                                                <td className="p-4 text-right font-extrabold text-rose-600 text-base">₹{exp.amount.toLocaleString('en-IN')}</td>
                                            </tr>
                                        );
                                    })}

                                    {filteredExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="p-10 text-center text-gray-400 font-medium">
                                                No expense records found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExpenseSummaryAdmin;
