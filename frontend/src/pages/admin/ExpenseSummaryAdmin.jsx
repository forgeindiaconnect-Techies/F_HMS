import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    DollarSign, TrendingDown, TrendingUp, Calendar, Building2, Search, 
    Download, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Tag, 
    Plus, Filter, FileText, CheckCircle2, Receipt, AlertCircle, 
    CreditCard, Clock, RefreshCw, X, AlertTriangle, Layers,
    Edit2, Trash2, Eye
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
    'Rent',
    'Electricity',
    'Water',
    'Internet',
    'Material purchases',
    'Staff salary',
    'Equipment maintenance',
    'Delivery and transport',
    'Kitchen Supplies',
    'Marketing',
    'Other operating expenses'
];

const CATEGORY_COLORS = {
    'Rent': '#8B5CF6',
    'Electricity': '#F59E0B',
    'Water': '#3B82F6',
    'Internet': '#06B6D4',
    'Material purchases': '#10B981',
    'Staff salary': '#EC4899',
    'Equipment maintenance': '#F97316',
    'Delivery and transport': '#6366F1',
    'Kitchen Supplies': '#14B8A6',
    'Marketing': '#E11D48',
    'Other operating expenses': '#64748B'
};

const getPaymentBadge = (status) => {
    switch (status) {
        case 'Paid':
            return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Paid</span>;
        case 'Partially Paid':
            return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">Partially Paid</span>;
        case 'Pending':
            return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
        case 'Overdue':
            return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">Overdue</span>;
        default:
            return <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
};

const ExpenseSummaryAdmin = () => {
    const { api } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'expenses'; // 'expenses' | 'bills' | 'pending' | 'analytics'
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['expenses', 'bills', 'pending', 'analytics'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const handleTabChange = (t) => {
        setActiveTab(t);
        setSearchParams({ tab: t });
    };

    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedBranch, setSelectedBranch] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedPeriod, setSelectedPeriod] = useState('thismonth');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState(null);

    // Confirm Modal for deletion
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    // Form: Create Expense
    const [expenseForm, setExpenseForm] = useState({
        title: '',
        category: 'Rent',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        billingPeriod: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        branchId: '',
        paymentStatus: 'Pending',
        paidAmount: 0,
        paymentMethod: 'Bank Transfer',
        paymentReference: '',
        isRecurring: false,
        recurringFrequency: 'Monthly',
        description: '',
        notes: ''
    });

    // Form: Edit Expense
    const [editForm, setEditForm] = useState({
        title: '',
        category: 'Rent',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        billingPeriod: '',
        branchId: '',
        paymentStatus: 'Pending',
        paidAmount: 0,
        paymentMethod: 'Bank Transfer',
        isRecurring: false,
        recurringFrequency: 'Monthly',
        notes: ''
    });

    // Form: Payment Record
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'Bank Transfer',
        paymentReference: '',
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                period: selectedPeriod,
                branchId: selectedBranch !== 'All' ? selectedBranch : undefined,
                category: selectedCategory !== 'All' ? selectedCategory : undefined,
                paymentStatus: selectedStatus !== 'All' ? selectedStatus : undefined
            };

            const [expRes, sumRes, branchRes] = await Promise.all([
                api.get('/expenses', { params }).catch(() => ({ data: [] })),
                api.get('/expenses/summary', { params: { period: selectedPeriod, branchId: selectedBranch !== 'All' ? selectedBranch : undefined } }).catch(() => ({ data: null })),
                api.get('/branches').catch(() => ({ data: [] }))
            ]);

            setExpenses(expRes.data || []);
            setSummary(sumRes.data || null);
            setBranches(branchRes.data || []);

            if (branchRes.data?.length > 0 && !expenseForm.branchId) {
                setExpenseForm(prev => ({ ...prev, branchId: branchRes.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch expense records', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedPeriod, selectedBranch, selectedCategory, selectedStatus]);

    // Handle Create Expense
    const handleSaveExpense = async (e) => {
        e.preventDefault();
        const amt = Number(expenseForm.amount);
        if (amt <= 0) {
            toast.error('Please enter a valid expense amount');
            return;
        }

        try {
            const titleTrim = expenseForm.title.trim();
            const descTrim = (expenseForm.description || titleTrim || expenseForm.category).trim();

            await api.post('/expenses', {
                ...expenseForm,
                title: titleTrim || descTrim,
                description: descTrim,
                amount: amt,
                paidAmount: Number(expenseForm.paidAmount) || 0
            });
            toast.success('Expense record created successfully!');
            setIsAddModalOpen(false);
            setExpenseForm({
                title: '',
                category: 'Rent',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                billingPeriod: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                branchId: branches[0]?._id || '',
                paymentStatus: 'Pending',
                paidAmount: 0,
                paymentMethod: 'Bank Transfer',
                paymentReference: '',
                isRecurring: false,
                recurringFrequency: 'Monthly',
                description: '',
                notes: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to save expense', error);
            toast.error(error.response?.data?.message || 'Error saving expense');
        }
    };

    // Handle Edit Open
    const handleOpenEditModal = (expense) => {
        setSelectedExpenseForEdit(expense);
        setEditForm({
            title: expense.title || expense.description || '',
            category: expense.category || 'Rent',
            amount: expense.amount || 0,
            date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
            billingPeriod: expense.billingPeriod || '',
            branchId: expense.branchId?._id || expense.branchId || '',
            paymentStatus: expense.paymentStatus || 'Pending',
            paidAmount: expense.paidAmount || 0,
            paymentMethod: expense.paymentMethod || 'Bank Transfer',
            isRecurring: Boolean(expense.isRecurring),
            recurringFrequency: expense.recurringFrequency || 'Monthly',
            notes: expense.notes || ''
        });
        setIsEditModalOpen(true);
    };

    // Handle Update Expense
    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        if (!selectedExpenseForEdit) return;
        const amt = Number(editForm.amount);
        if (amt <= 0) {
            toast.error('Please enter a valid expense amount');
            return;
        }

        try {
            const titleTrim = editForm.title.trim();
            const descTrim = (titleTrim || editForm.category).trim();

            await api.put(`/expenses/${selectedExpenseForEdit._id}`, {
                ...editForm,
                title: titleTrim,
                description: descTrim,
                amount: amt,
                paidAmount: Number(editForm.paidAmount) || 0
            });
            toast.success('Expense record updated successfully!');
            setIsEditModalOpen(false);
            setSelectedExpenseForEdit(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update expense', error);
            toast.error(error.response?.data?.message || 'Error updating expense');
        }
    };

    // Handle Delete Expense
    const handleDeleteExpense = (expense) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Expense Record?',
            message: `Are you sure you want to delete "${expense.title || expense.description || expense.category}" of ₹${(expense.amount || 0).toLocaleString('en-IN')}? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/expenses/${expense._id}`);
                    toast.success('Expense record deleted successfully!');
                    fetchData();
                } catch (error) {
                    console.error('Failed to delete expense', error);
                    toast.error(error.response?.data?.message || 'Error deleting expense');
                }
            },
            isDestructive: true
        });
    };

    // Handle Record Payment
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedExpenseForPayment) return;
        const amt = Number(paymentForm.amount);
        if (amt <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }
        if (amt > selectedExpenseForPayment.balanceDue) {
            toast.error(`Amount cannot exceed outstanding balance of ₹${selectedExpenseForPayment.balanceDue}`);
            return;
        }

        try {
            await api.post(`/expenses/${selectedExpenseForPayment._id}/pay`, {
                amount: amt,
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                notes: paymentForm.notes
            });
            toast.success(`Payment of ₹${amt} logged successfully!`);
            setIsPaymentModalOpen(false);
            setSelectedExpenseForPayment(null);
            setPaymentForm({ amount: '', paymentMethod: 'Bank Transfer', paymentReference: '', notes: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to record payment', error);
            toast.error(error.response?.data?.message || 'Error recording payment');
        }
    };

    // Handle Generate Recurring Bills
    const handleGenerateRecurring = async () => {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        try {
            const res = await api.post('/expenses/generate-recurring', {
                targetBillingPeriod: currentMonth,
                branchId: selectedBranch !== 'All' ? selectedBranch : undefined
            });
            toast.success(res.data.message || 'Recurring bills generated without duplicates!');
            fetchData();
        } catch (error) {
            console.error('Failed to generate recurring bills', error);
            toast.error(error.response?.data?.message || 'Error generating recurring bills');
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        if (expenses.length === 0) {
            toast.error('No expense records to export.');
            return;
        }

        let csv = 'ID,Date,Category,Title,Description,Amount,Paid Amount,Balance Due,Payment Status,Due Date,Billing Period,Branch,Source\n';
        expenses.forEach(e => {
            const bName = e.branchId?.name || 'Main Branch';
            const cleanTitle = `"${(e.title || e.description || e.category || '').replace(/"/g, '""')}"`;
            const cleanDesc = `"${(e.description || e.title || '').replace(/"/g, '""')}"`;
            const dStr = new Date(e.date).toISOString().split('T')[0];
            const dueStr = e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : '-';
            csv += `"${e._id}",${dStr},"${e.category}",${cleanTitle},${cleanDesc},${e.amount},${e.paidAmount || 0},${e.balanceDue || 0},${e.paymentStatus},${dueStr},"${e.billingPeriod || '-'}",${bName},${e.source || 'Manual'}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Expenses_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Expenses CSV exported successfully!');
    };

    // Filtered lists for tabs
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (e.title?.toLowerCase().includes(q) || 
                    e.description?.toLowerCase().includes(q) || 
                    e.category?.toLowerCase().includes(q) ||
                    e.billingPeriod?.toLowerCase().includes(q));
        });
    }, [expenses, searchQuery]);

    // Bills: Rent, Electricity, Water, Internet
    const utilityBills = useMemo(() => {
        return filteredExpenses.filter(e => ['Rent', 'Electricity', 'Water', 'Internet'].includes(e.category));
    }, [filteredExpenses]);

    // Pending or Overdue Bills
    const pendingBills = useMemo(() => {
        return filteredExpenses.filter(e => e.balanceDue > 0 && ['Pending', 'Partially Paid', 'Overdue'].includes(e.paymentStatus));
    }, [filteredExpenses]);

    // Category Chart Data
    const categoryChartData = useMemo(() => {
        if (summary?.categoryBreakdown) {
            if (Array.isArray(summary.categoryBreakdown)) {
                return summary.categoryBreakdown.map(item => ({
                    name: item.category,
                    value: item.amount || 0
                }));
            }
            return Object.entries(summary.categoryBreakdown).map(([cat, val]) => ({
                name: cat,
                value: typeof val === 'object' ? (val.amount || 0) : Number(val) || 0
            }));
        }
        const map = {};
        filteredExpenses.forEach(e => {
            map[e.category] = (map[e.category] || 0) + (e.amount || 0);
        });
        return Object.entries(map).map(([cat, val]) => ({ name: cat, value: val }));
    }, [summary, filteredExpenses]);

    return (
        <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                        <Receipt size={14} /> Financial Operations & Expenses
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Rent, Bills & Expenses Management
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Comprehensive ledger for recurring rent, utility bills, supplier expenses, and staff salaries with strict liability and payment auditing.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                        onClick={handleGenerateRecurring}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-xs cursor-pointer"
                        title="Check and instantiate recurring monthly rent & utility bills"
                    >
                        <RefreshCw size={15} /> Check Recurring Bills
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-xs cursor-pointer"
                    >
                        <Download size={15} /> Export CSV
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-md shadow-emerald-900/10 cursor-pointer"
                    >
                        <Plus size={16} /> Record Expense / Bill
                    </button>
                </div>
            </div>

            {/* Financial Overview KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Incurred</span>
                        <DollarSign size={18} className="text-slate-700 dark:text-slate-300" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{(summary?.totalIncurred || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Total recorded expenses</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-emerald-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Paid Out</span>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{(summary?.totalPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Confirmed payments</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-amber-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Outstanding Liabilities</span>
                        <Clock size={18} />
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        ₹{((summary?.outstandingLiabilities ?? summary?.totalOutstanding) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">Pending payments balance</div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                    <div className="flex items-center justify-between text-red-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Overdue Bills</span>
                        <AlertTriangle size={18} />
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        ₹{(summary?.overdueAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">{((summary?.overdueBillsCount ?? summary?.overdueCount) || 0)} overdue bills</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                <button
                    onClick={() => handleTabChange('expenses')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'expenses'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Receipt size={16} /> All Expenses & Invoices ({filteredExpenses.length})
                </button>
                <button
                    onClick={() => handleTabChange('bills')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'bills'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <Building2 size={16} /> Rent & Utility Bills ({utilityBills.length})
                </button>
                <button
                    onClick={() => handleTabChange('pending')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'pending'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <AlertCircle size={16} /> Pending & Overdue Liabilities ({pendingBills.length})
                </button>
                <button
                    onClick={() => handleTabChange('analytics')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'analytics'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <PieIcon size={16} /> Category Breakdown
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search title, category, description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="thismonth">This Month</option>
                        <option value="lastmonth">Last Month</option>
                        <option value="all">All Time</option>
                    </select>

                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                    </select>

                    {branches.length > 1 && (
                        <select 
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        >
                            <option value="All">All Branches</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* TAB 1: ALL EXPENSES & INVOICES */}
            {(activeTab === 'expenses' || activeTab === 'bills' || activeTab === 'pending') && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                <tr>
                                    <th className="py-4 px-6">Expense Title & Ref</th>
                                    <th className="py-4 px-6">Category</th>
                                    <th className="py-4 px-6">Expense Date</th>
                                    <th className="py-4 px-6">Due Date / Billing Period</th>
                                    <th className="py-4 px-6">Total Amount</th>
                                    <th className="py-4 px-6">Paid Amount</th>
                                    <th className="py-4 px-6">Balance Due</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                {(activeTab === 'bills' ? utilityBills : activeTab === 'pending' ? pendingBills : filteredExpenses).length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-16 text-center">
                                            <div className="max-w-md mx-auto space-y-3">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                                                    <Receipt size={24} />
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">No Expense or Bill Records Found</h4>
                                                <p className="text-xs text-slate-400">
                                                    Get started by recording your operational overheads or instantly generate monthly recurring bills (Rent, Electricity, Water & Internet).
                                                </p>
                                                <div className="flex items-center justify-center gap-3 pt-2">
                                                    <button
                                                        onClick={() => setIsAddModalOpen(true)}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Plus size={14} /> Record First Expense
                                                    </button>
                                                    <button
                                                        onClick={handleGenerateRecurring}
                                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <RefreshCw size={14} /> Generate Standard Bills
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'bills' ? utilityBills : activeTab === 'pending' ? pendingBills : filteredExpenses).map(e => (
                                        <tr key={e._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                <div>{e.title || e.description || e.category}</div>
                                                <div className="text-xs font-normal text-slate-400 flex items-center gap-2">
                                                    <span>{e.branchId?.name || 'Main Outlet'}</span>
                                                    {e.isRecurring && (
                                                        <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 text-[10px] font-bold">
                                                            Recurring
                                                        </span>
                                                    )}
                                                    {e.source && e.source !== 'Manual' && (
                                                        <span className="text-[10px] text-slate-400 font-semibold">
                                                            via {e.source}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span 
                                                    className="px-2.5 py-1 rounded-md text-xs font-bold"
                                                    style={{ 
                                                        backgroundColor: `${CATEGORY_COLORS[e.category] || '#64748B'}15`,
                                                        color: CATEGORY_COLORS[e.category] || '#64748B'
                                                    }}
                                                >
                                                    {e.category}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(e.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-xs">
                                                {e.dueDate ? (
                                                    <span className={new Date(e.dueDate) < new Date() && e.balanceDue > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>
                                                        Due: {new Date(e.dueDate).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                                {e.billingPeriod && (
                                                    <div className="text-[11px] text-slate-400">{e.billingPeriod}</div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                ₹{e.amount?.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-emerald-600 dark:text-emerald-400">
                                                ₹{e.paidAmount?.toLocaleString('en-IN') || 0}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-amber-600 dark:text-amber-400">
                                                ₹{e.balanceDue?.toLocaleString('en-IN') || 0}
                                            </td>
                                            <td className="py-4 px-6">
                                                {getPaymentBadge(e.paymentStatus)}
                                            </td>
                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {e.balanceDue > 0 && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedExpenseForPayment(e);
                                                                setPaymentForm({
                                                                    amount: e.balanceDue,
                                                                    paymentMethod: 'Bank Transfer',
                                                                    paymentReference: '',
                                                                    notes: `Settlement for ${e.title || e.category}`
                                                                });
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                            title="Record payment toward balance"
                                                        >
                                                            <CreditCard size={13} /> Pay
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedExpenseForDetails(e);
                                                            setIsDetailsModalOpen(true);
                                                        }}
                                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(e)}
                                                        className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Expense"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExpense(e)}
                                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Expense"
                                                    >
                                                        <Trash2 size={14} />
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
            )}

            {/* TAB 4: CATEGORY BREAKDOWN & ANALYTICS */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <PieIcon size={18} className="text-emerald-500" /> Expenses Distribution by Category
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {categoryChartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={CATEGORY_COLORS[entry.name] || '#64748B'} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                            Expense Ledger Breakdown
                        </h3>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {categoryChartData.map(cat => (
                                <div key={cat.name} className="py-3 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2.5">
                                        <span 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#64748B' }} 
                                        />
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        ₹{cat.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: RECORD EXPENSE / BILL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Expense or Recurring Bill</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveExpense} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expense Title *</label>
                                <input 
                                    type="text"
                                    required
                                    value={expenseForm.title}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                                    placeholder="e.g. October Rent, Electricity Bill, Kitchen Exhaust Repair"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category *</label>
                                    <select 
                                        value={expenseForm.category}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amount (₹) *</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        min="1"
                                        required
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expense Date *</label>
                                    <input 
                                        type="date"
                                        required
                                        value={expenseForm.date}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Due Date</label>
                                    <input 
                                        type="date"
                                        value={expenseForm.dueDate}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Billing Period</label>
                                    <input 
                                        type="text"
                                        value={expenseForm.billingPeriod}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, billingPeriod: e.target.value })}
                                        placeholder="e.g. October 2026"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                    />
                                </div>
                                {branches.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Branch</label>
                                        <select 
                                            value={expenseForm.branchId}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, branchId: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        >
                                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Settlement at creation */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Initial Payment Settlement
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Paid Now (₹)</label>
                                        <input 
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={expenseForm.paidAmount}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, paidAmount: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Method</label>
                                        <select 
                                            value={expenseForm.paymentMethod}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        >
                                            <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Credit Card">Credit Card</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Recurring Checkbox */}
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={expenseForm.isRecurring}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                                    className="rounded-sm text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                                <label htmlFor="isRecurring" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Recurring monthly bill (auto-instantiate each month without duplicates)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                >
                                    Save Expense Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: RECORD PAYMENT */}
            {isPaymentModalOpen && selectedExpenseForPayment && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Expense Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1 mb-4">
                            <div>Title: <strong>{selectedExpenseForPayment.title || selectedExpenseForPayment.category}</strong></div>
                            <div>Category: <strong>{selectedExpenseForPayment.category}</strong></div>
                            <div>Outstanding Balance Due: <strong>₹{selectedExpenseForPayment.balanceDue?.toLocaleString('en-IN')}</strong></div>
                        </div>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Disbursement Amount (₹) *</label>
                                <input 
                                    type="number"
                                    step="any"
                                    max={selectedExpenseForPayment.balanceDue}
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
                                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Credit Card">Credit Card</option>
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
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                                >
                                    Log Valid Payment Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: EDIT EXPENSE */}
            {isEditModalOpen && selectedExpenseForEdit && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Expense Record</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateExpense} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expense Title *</label>
                                <input 
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category *</label>
                                    <select 
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Total Amount (₹) *</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        min="1"
                                        required
                                        value={editForm.amount}
                                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expense Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Due Date</label>
                                    <input 
                                        type="date"
                                        value={editForm.dueDate}
                                        onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Paid Amount (₹)</label>
                                    <input 
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={editForm.paidAmount}
                                        onChange={(e) => setEditForm({ ...editForm, paidAmount: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Billing Period</label>
                                    <input 
                                        type="text"
                                        value={editForm.billingPeriod}
                                        onChange={(e) => setEditForm({ ...editForm, billingPeriod: e.target.value })}
                                        placeholder="e.g. October 2026"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="editIsRecurring"
                                    checked={editForm.isRecurring}
                                    onChange={(e) => setEditForm({ ...editForm, isRecurring: e.target.checked })}
                                    className="rounded-sm text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                                <label htmlFor="editIsRecurring" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Recurring monthly bill template
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                                >
                                    Update Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: VIEW EXPENSE DETAILS */}
            {isDetailsModalOpen && selectedExpenseForDetails && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-8 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    {selectedExpenseForDetails.title || selectedExpenseForDetails.description || selectedExpenseForDetails.category}
                                </h3>
                                <p className="text-xs text-slate-400">Expense Ref: {selectedExpenseForDetails._id}</p>
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span className="text-slate-400 block mb-1">Category:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedExpenseForDetails.category}</span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span className="text-slate-400 block mb-1">Status:</span>
                                <div>{getPaymentBadge(selectedExpenseForDetails.paymentStatus)}</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span className="text-slate-400 block mb-1">Total Incurred:</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">₹{selectedExpenseForDetails.amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span className="text-slate-400 block mb-1">Balance Due:</span>
                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">₹{selectedExpenseForDetails.balanceDue?.toLocaleString('en-IN') || 0}</span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span className="text-slate-400 block mb-1">Expense Date:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(selectedExpenseForDetails.date).toLocaleDateString()}</span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <span className="text-slate-400 block mb-1">Billing Period:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedExpenseForDetails.billingPeriod || '-'}</span>
                            </div>
                        </div>

                        {/* Payment Transactions Audit Log */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Disbursement & Payment History ({selectedExpenseForDetails.payments?.length || 0})
                            </h4>
                            {(!selectedExpenseForDetails.payments || selectedExpenseForDetails.payments.length === 0) ? (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                                    No payments recorded yet. Full balance is outstanding.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {selectedExpenseForDetails.payments.map((p, idx) => (
                                        <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-emerald-600">₹{p.amount?.toLocaleString('en-IN')}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    via {p.paymentMethod} {p.reference ? `• Ref: ${p.reference}` : ''}
                                                </div>
                                            </div>
                                            <div className="text-right text-[11px] text-slate-400">
                                                {new Date(p.paidDate || p.createdAt || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDestructive={confirmModal.isDestructive}
            />
        </div>
    );
};

export default ExpenseSummaryAdmin;
