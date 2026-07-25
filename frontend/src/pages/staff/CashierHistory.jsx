import { useState, useEffect } from 'react';
import { Receipt, Search, Download, X, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();
    
    let dayStr = isToday ? '(Today)' : isYesterday ? '(Yesterday)' : date.toLocaleDateString();
    return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${dayStr}`;
};

const CashierHistory = () => {
    const { api } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeReceipt, setActiveReceipt] = useState(null);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/orders?isPaid=true');
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch payment history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [api]);

    const filteredTransactions = transactions.filter(txn => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const txnId = txn.paymentResult?.id?.toLowerCase() || '';
        const billId = txn._id.toLowerCase();
        return txnId.includes(search) || billId.includes(search);
    });

    const exportToCSV = () => {
        if (filteredTransactions.length === 0) return toast.error('No data to export');
        
        const headers = ['Transaction ID', 'Bill ID', 'Table/Type', 'Payment Method', 'Amount', 'Tax', 'Date'];
        const csvRows = [headers.join(',')];

        filteredTransactions.forEach(txn => {
            const row = [
                txn.paymentResult?.id || 'N/A',
                txn._id,
                txn.orderType === 'Dine In' ? `Table ${txn.tableNumber || 'Any'}` : txn.orderType,
                txn.paymentMethod,
                txn.totalPrice.toFixed(2),
                txn.taxPrice.toFixed(2),
                new Date(txn.paidAt || txn.createdAt).toLocaleString()
            ];
            csvRows.push(row.map(cell => `"${cell}"`).join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment History</h2>
                    <p className="text-sm text-gray-500 mt-1">Review all settled bills and transactions.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search TXN ID or Bill ID..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <button 
                        onClick={exportToCSV}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bill ID</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Table/Type</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-10 text-center text-gray-400">Loading history...</td></tr>
                        ) : filteredTransactions.length === 0 ? (
                            <tr><td colSpan="7" className="p-10 text-center text-gray-400">No transactions found.</td></tr>
                        ) : filteredTransactions.map((txn) => (
                            <tr key={txn._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <span className="font-bold text-gray-900 font-sans">{txn.paymentResult?.id || 'N/A'}</span>
                                </td>
                                <td className="p-4 text-gray-500 font-medium text-sm truncate max-w-[100px]">{txn._id}</td>
                                <td className="p-4">
                                    <span className="bg-gray-100 text-gray-800 font-bold px-3 py-1 rounded-lg text-xs">
                                        {txn.orderType === 'Dine In' ? `T-${txn.tableNumber || 'Any'}` : txn.orderType}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        txn.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        txn.paymentMethod === 'Cash' ? 'bg-green-50 text-green-700 border-green-200' :
                                        txn.paymentMethod === 'UPI' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}>
                                        {txn.paymentMethod}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-gray-900">₹{txn.totalPrice.toFixed(2)}</td>
                                <td className="p-4 text-sm font-medium text-gray-500">
                                    {formatTime(txn.paidAt || txn.createdAt)}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => setActiveReceipt(txn)}
                                        className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                    >
                                        <Receipt size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Receipt Modal */}
            {activeReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setActiveReceipt(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Receipt size={20} className="text-purple-600"/> Receipt Details
                            </h3>
                            <button onClick={() => setActiveReceipt(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 bg-gray-50">
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                                <div className="text-center pb-4 border-b border-gray-100 uppercase tracking-widest text-xs font-bold text-gray-500">
                                    <p className="text-gray-900 font-sans text-xl tracking-normal mb-1">RestoSys</p>
                                    Bill #{activeReceipt._id.substring(activeReceipt._id.length - 6).toUpperCase()}<br/>
                                    {activeReceipt.orderType === 'Dine In' ? `Table ${activeReceipt.tableNumber || 'Any'}` : activeReceipt.orderType}
                                </div>
                                
                                <div className="space-y-2 pt-2 border-b border-gray-100 pb-4">
                                    {activeReceipt.orderItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{item.qty}x {item.name}</span>
                                            <span className="font-medium text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Subtotal</span>
                                        <span>₹{(activeReceipt.totalPrice - activeReceipt.taxPrice).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Tax</span>
                                        <span>₹{activeReceipt.taxPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <span>₹{activeReceipt.totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div className="text-center pt-4 border-t border-gray-100 text-xs text-gray-500">
                                    Paid via <span className="font-bold text-gray-700">{activeReceipt.paymentMethod}</span><br/>
                                    {formatTime(activeReceipt.paidAt || activeReceipt.createdAt)}
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    toast.success('Printing receipt...');
                                    setActiveReceipt(null);
                                }}
                                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
                            >
                                <Printer size={16} /> Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierHistory;
