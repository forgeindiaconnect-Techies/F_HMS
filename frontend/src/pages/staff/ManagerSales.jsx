import { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, Calendar, Download, PieChart, BarChart, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ManagerSales = () => {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Today's Sales Breakdown</h2>
                    <p className="text-gray-500 text-sm mt-1">Detailed view of transactions, tender types, and hourly revenue.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowExportModal(true)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => setShowReportModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md">
                        <TrendingUp size={18} /> Detailed Report
                    </button>
                </div>
            </div>

            {/* Sales KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-green-50 font-medium">Gross Sales</p>
                        <DollarSign size={20} className="text-green-200" />
                    </div>
                    <h3 className="text-3xl font-extrabold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>$4,850.00</h3>
                    <p className="text-sm text-green-100 flex items-center gap-1 font-medium"><TrendingUp size={14} /> +15% vs Last Week</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Net Sales</p>
                        <Wallet size={20} className="text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>$4,250.00</h3>
                    <p className="text-sm text-gray-400 font-medium">After discounts & refunds</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Avg Ticket Size</p>
                        <CreditCard size={20} className="text-purple-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>$45.20</h3>
                    <p className="text-sm text-gray-400 font-medium">Based on 94 transactions</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Total Tax</p>
                        <DollarSign size={20} className="text-orange-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>$340.00</h3>
                    <p className="text-sm text-gray-400 font-medium">8.0% Standard Rate</p>
                </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><BarChart size={18} className="text-blue-500" /> Hourly Sales Volume</h3>
                    <div className="h-64 flex items-end gap-2 justify-between">
                        {/* Mock Bar Chart */}
                        {[30, 45, 20, 60, 85, 100, 75, 40].map((h, i) => (
                            <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group flex flex-col justify-end" style={{ height: '100%' }}>
                                <div className="bg-blue-500 w-full rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold">{12 + i}p</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-center text-sm text-gray-500 font-medium">Peak Hour: 5:00 PM - 6:00 PM ($1,200)</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><PieChart size={18} className="text-purple-500" /> Sales by Category</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Main Course', value: '45%', amount: '$1,912.50', color: 'bg-green-500' },
                            { name: 'Beverages', value: '25%', amount: '$1,062.50', color: 'bg-blue-500' },
                            { name: 'Appetizers', value: '15%', amount: '$637.50', color: 'bg-orange-500' },
                            { name: 'Desserts', value: '15%', amount: '$637.50', color: 'bg-purple-500' },
                        ].map((cat, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-gray-700">{cat.name}</span>
                                    <span className="text-gray-900 font-bold">{cat.amount}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className={`${cat.color} h-2 rounded-full`} style={{ width: cat.value }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Download size={20} className="text-blue-600"/> Export Sales Data</h3>
                            <button onClick={() => setShowExportModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Select Date Range</label>
                                <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>Today</option>
                                    <option>Yesterday</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>Custom Range...</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Export Format</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button className="border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold py-2 rounded-xl text-sm transition-colors">CSV</button>
                                    <button className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium py-2 rounded-xl text-sm transition-colors">Excel</button>
                                    <button className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium py-2 rounded-xl text-sm transition-colors">PDF</button>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowExportModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={() => { setShowExportModal(false); toast.success('Download started!'); }} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">Download Now</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><FileText size={20} className="text-green-600"/> Detailed Transaction Report (Today)</h3>
                            <button onClick={() => setShowReportModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {[
                                        { time: '17:42', id: '#ORD-112', type: 'Dine-In', amount: '$145.50', payment: 'Credit Card' },
                                        { time: '17:35', id: '#ORD-111', type: 'Takeaway', amount: '$32.00', payment: 'Cash' },
                                        { time: '17:15', id: '#ORD-110', type: 'Dine-In', amount: '$85.20', payment: 'Credit Card' },
                                        { time: '16:50', id: '#ORD-109', type: 'Delivery', amount: '$55.00', payment: 'Online' },
                                        { time: '16:30', id: '#ORD-108', type: 'Dine-In', amount: '$210.00', payment: 'Credit Card' },
                                        { time: '16:10', id: '#ORD-107', type: 'Takeaway', amount: '$18.50', payment: 'Cash' },
                                    ].map((tx, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{tx.time}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{tx.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded font-bold text-xs">{tx.type}</span></td>
                                            <td className="px-6 py-4 text-sm font-extrabold text-green-700 text-right">{tx.amount}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{tx.payment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowReportModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerSales;
