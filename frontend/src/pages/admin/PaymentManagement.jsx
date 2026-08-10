import { useState, useEffect } from 'react';
import { Search, Download, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getStatusStyle = (status) => {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
        case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'Refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const PaymentManagement = () => {
    const { api } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [methodFilter, setMethodFilter] = useState('All Methods');
    const [statusFilter, setStatusFilter] = useState('All Statuses');

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            // Map orders to transaction data format
            const mapped = res.data.map(order => {
                let status = 'Pending';
                if (order.status === 'Refunded') status = 'Refunded';
                else if (order.isPaid) status = 'Completed';
                else if (order.status === 'Cancelled') status = 'Failed';

                return {
                    _id: order._id,
                    id: `TXN-${order._id.substring(order._id.length - 6).toUpperCase()}`,
                    orderId: `#ORD-${order._id.substring(order._id.length - 6).toUpperCase()}`,
                    date: new Date(order.createdAt).toLocaleString(),
                    method: order.paymentMethod || 'Card',
                    amount: order.totalPrice,
                    status,
                    customer: order.user?.name || 'Guest Customer',
                    rawOrder: order
                };
            });
            setTransactions(mapped);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
            toast.error('Failed to load transaction data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleProcessRefund = async (orderId) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: 'Refunded' });
            toast.success('Refund processed successfully!');
            fetchTransactions();
        } catch (err) {
            console.error(err);
            toast.error('Failed to process refund');
        }
    };

    const filteredTransactions = transactions.filter(txn => {
        const matchesSearch = txn.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             txn.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             txn.customer.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesMethod = methodFilter === 'All Methods' || txn.method === methodFilter;
        const matchesStatus = statusFilter === 'All Statuses' || txn.status === statusFilter;
        
        return matchesSearch && matchesMethod && matchesStatus;
    });

    // Compute Metrics
    const todayStr = new Date().toDateString();
    const todayRevenue = transactions
        .filter(t => t.status === 'Completed' && new Date(t.rawOrder.createdAt).toDateString() === todayStr)
        .reduce((sum, t) => sum + t.amount, 0);

    const refundedAmount = transactions
        .filter(t => t.status === 'Refunded')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingSettlements = transactions
        .filter(t => t.status === 'Pending')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Track transactions, refunds, and payment gateways.</p>
                </div>
                <button onClick={fetchTransactions} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
                    <Download size={16} /> Refresh
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue (Today)</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{todayRevenue.toFixed(2)}</h3>
                        <span className="flex items-center text-xs font-bold text-green-600 mb-1"><ArrowUpRight size={14} /> Live</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Transactions</p>
                    <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{transactions.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Refunds Processed</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{refundedAmount.toFixed(2)}</h3>
                        <span className="flex items-center text-xs font-bold text-red-600 mb-1"><ArrowDownRight size={14} /> Total</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Pending Settlements</p>
                    <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{pendingSettlements.toFixed(2)}</h3>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search transaction ID or customer..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" 
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                    >
                        <option value="All Methods">All Methods</option>
                        <option value="Card">Card</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                    </select>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                    >
                        <option value="All Statuses">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        No transactions found matching your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.map((txn, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">{txn.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{txn.date}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{txn.orderId}</p>
                                            <p className="text-xs text-gray-500">{txn.customer}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{txn.method}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{txn.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusStyle(txn.status)}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {txn.status === 'Completed' && (
                                                    <button 
                                                        onClick={() => handleProcessRefund(txn.rawOrder._id)}
                                                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors" 
                                                        title="Process Refund"
                                                    >
                                                        <RefreshCcw size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentManagement;
