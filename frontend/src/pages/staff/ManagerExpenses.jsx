import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, DollarSign, Calendar, Tag, ArrowUpRight, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerExpenses = () => {
    const { api, user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Kitchen Supplies',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        staff: user?.name || 'Manager'
    });

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error('Failed to fetch expenses', err);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!formData.amount || Number(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            await api.post('/expenses', {
                category: formData.category,
                amount: Number(formData.amount),
                description: formData.description,
                date: formData.date,
                staff: formData.staff
            });
            
            setIsModalOpen(false);
            setFormData({
                category: 'Kitchen Supplies',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                staff: user?.name || 'Manager'
            });
            toast.success('Expense logged successfully');
            fetchExpenses();
        } catch (err) {
            console.error(err);
            toast.error('Failed to record expense');
        }
    };

    const handleDeleteExpense = async (id) => {
        try {
            await api.delete(`/expenses/${id}`);
            toast.success('Expense record deleted');
            fetchExpenses();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete expense record');
        }
    };

    const filteredExpenses = expenses.filter(exp =>
        exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp._id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Expense Tracking</h2>
                    <p className="text-gray-500 text-sm mt-1">Log and monitor branch operational and petty cash expenses.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={18} /> Record Expense
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Expenses (Filtered)</p>
                        <h3 className="text-3xl font-extrabold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="p-3.5 bg-red-50 text-red-500 rounded-xl">
                        <TrendingDown size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Petty Cash Balance</p>
                        <h3 className="text-3xl font-extrabold text-gray-900">₹15,000</h3>
                    </div>
                    <div className="p-3.5 bg-green-50 text-green-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Logged Transactions</p>
                        <h3 className="text-3xl font-extrabold text-gray-900">{filteredExpenses.length}</h3>
                    </div>
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                        <ArrowUpRight size={24} />
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search category, description, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    />
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="p-4">Expense ID</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Logged By</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                {filteredExpenses.map((exp) => (
                                    <tr key={exp._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-bold text-gray-900">#EXP-{exp._id.substring(exp._id.length - 4).toUpperCase()}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                <Tag size={12} /> {exp.category}
                                            </span>
                                        </td>
                                        <td className="p-4 max-w-xs truncate" title={exp.description}>{exp.description}</td>
                                        <td className="p-4">{exp.staff}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium">
                                                <Calendar size={12} /> {new Date(exp.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-4 font-extrabold text-red-600">₹{exp.amount.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteExpense(exp._id)}
                                                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors inline-flex items-center"
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-500">No expense records found matching your query.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Record Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Record Branch Expense</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                        
                        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                >
                                    <option value="Kitchen Supplies">Kitchen Supplies</option>
                                    <option value="Utility Bill">Utility Bill</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Staff Welfare">Staff Welfare</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                    placeholder="e.g. 1500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logged By</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.staff}
                                    onChange={(e) => setFormData({...formData, staff: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium h-20 resize-none"
                                    placeholder="Provide context for this expense..."
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerExpenses;
