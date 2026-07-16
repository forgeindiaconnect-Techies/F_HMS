import { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, Calendar, Download, PieChart, BarChart, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ManagerSales = () => {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('CSV');
    const [dateRange, setDateRange] = useState('Today');

    const handleDownload = () => {
        if (exportFormat === 'PDF') {
            // Load jsPDF from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Styles
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(22);
                doc.setTextColor(22, 163, 74); // green-600
                doc.text('RestoSys Sales Report', 14, 20);

                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Date Range: ${dateRange} | Generated: ${new Date().toLocaleString()}`, 14, 26);

                doc.setDrawColor(230, 230, 230);
                doc.line(14, 30, 196, 30);

                // Stats Section
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                doc.text('Gross Sales: Rs. 4,850.00', 14, 38);
                doc.text('Net Sales: Rs. 4,250.00', 14, 44);
                doc.text('Total Tax (8%): Rs. 340.00', 14, 50);

                // Table
                let y = 62;
                doc.line(14, y, 196, y);
                doc.setFont('Helvetica', 'bold');
                doc.setTextColor(30, 30, 30);
                doc.text('Time', 16, y + 5);
                doc.text('Order ID', 40, y + 5);
                doc.text('Type', 80, y + 5);
                doc.text('Payment Method', 115, y + 5);
                doc.text('Amount', 165, y + 5);
                doc.line(14, y + 8, 196, y + 8);

                y += 13;
                doc.setFont('Helvetica', 'normal');
                doc.setTextColor(80, 80, 80);

                const txns = [
                    { time: '17:42', id: '#ORD-112', type: 'Dine-In', amount: 'Rs. 145.50', payment: 'Credit Card' },
                    { time: '17:35', id: '#ORD-111', type: 'Takeaway', amount: 'Rs. 32.00', payment: 'Cash' },
                    { time: '17:15', id: '#ORD-110', type: 'Dine-In', amount: 'Rs. 85.20', payment: 'Credit Card' },
                    { time: '16:50', id: '#ORD-109', type: 'Delivery', amount: 'Rs. 55.00', payment: 'Online' },
                    { time: '16:30', id: '#ORD-108', type: 'Dine-In', amount: 'Rs. 210.00', payment: 'Credit Card' },
                    { time: '16:10', id: '#ORD-107', type: 'Takeaway', amount: 'Rs. 18.50', payment: 'Cash' },
                ];

                txns.forEach(tx => {
                    doc.text(tx.time, 16, y);
                    doc.text(tx.id, 40, y);
                    doc.text(tx.type, 80, y);
                    doc.text(tx.payment, 115, y);
                    doc.text(tx.amount, 165, y);
                    doc.line(14, y + 3, 196, y + 3);
                    y += 10;
                });

                doc.save(`Sales_Report_${dateRange.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
                setShowExportModal(false);
                toast.success('PDF report downloaded successfully!');
            };
            script.onerror = () => {
                toast.error('Failed to load PDF export library.');
            };
            document.body.appendChild(script);
        } else {
            // CSV or Excel download simulation
            const headers = ['Time', 'Order ID', 'Type', 'Payment Method', 'Amount'];
            const rows = [
                ['17:42', '#ORD-112', 'Dine-In', 'Credit Card', '145.50'],
                ['17:35', '#ORD-111', 'Takeaway', 'Cash', '32.00'],
                ['17:15', '#ORD-110', 'Dine-In', 'Credit Card', '85.20'],
                ['16:50', '#ORD-109', 'Delivery', 'Online', '55.00'],
                ['16:30', '#ORD-108', 'Dine-In', 'Credit Card', '210.00'],
                ['16:10', '#ORD-107', 'Takeaway', 'Cash', '18.50']
            ];

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = exportFormat.toLowerCase() === 'excel' ? 'xlsx' : 'csv';
            link.setAttribute('download', `Sales_Report_${dateRange.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.${ext}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setShowExportModal(false);
            toast.success(`${exportFormat} report downloaded successfully!`);
        }
    };

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
                    <h3 className="text-3xl font-extrabold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹4,850.00</h3>
                    <p className="text-sm text-green-100 flex items-center gap-1 font-medium"><TrendingUp size={14} /> +15% vs Last Week</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Net Sales</p>
                        <Wallet size={20} className="text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹4,250.00</h3>
                    <p className="text-sm text-gray-400 font-medium">After discounts & refunds</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Avg Ticket Size</p>
                        <CreditCard size={20} className="text-purple-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹45.20</h3>
                    <p className="text-sm text-gray-400 font-medium">Based on 94 transactions</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Total Tax</p>
                        <DollarSign size={20} className="text-orange-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹340.00</h3>
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
                    <div className="mt-8 text-center text-sm text-gray-500 font-medium">Peak Hour: 5:00 PM - 6:00 PM (₹1,200)</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><PieChart size={18} className="text-purple-500" /> Sales by Category</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Main Course', value: '45%', amount: '₹1,912.50', color: 'bg-green-500' },
                            { name: 'Beverages', value: '25%', amount: '₹1,062.50', color: 'bg-blue-500' },
                            { name: 'Appetizers', value: '15%', amount: '₹637.50', color: 'bg-orange-500' },
                            { name: 'Desserts', value: '15%', amount: '₹637.50', color: 'bg-purple-500' },
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
                                <select 
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                >
                                    <option value="Today">Today</option>
                                    <option value="Yesterday">Yesterday</option>
                                    <option value="This Week">This Week</option>
                                    <option value="This Month">This Month</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Export Format</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => setExportFormat('CSV')}
                                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                            exportFormat === 'CSV' 
                                            ? 'border-green-600 bg-green-50 text-green-700 shadow-sm' 
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        CSV
                                    </button>
                                    <button 
                                        onClick={() => setExportFormat('Excel')}
                                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                            exportFormat === 'Excel' 
                                            ? 'border-green-600 bg-green-50 text-green-700 shadow-sm' 
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        Excel
                                    </button>
                                    <button 
                                        onClick={() => setExportFormat('PDF')}
                                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                            exportFormat === 'PDF' 
                                            ? 'border-green-600 bg-green-50 text-green-700 shadow-sm' 
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowExportModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleDownload} className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-md">Download Now</button>
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
                                        { time: '17:42', id: '#ORD-112', type: 'Dine-In', amount: '₹145.50', payment: 'Credit Card' },
                                        { time: '17:35', id: '#ORD-111', type: 'Takeaway', amount: '₹32.00', payment: 'Cash' },
                                        { time: '17:15', id: '#ORD-110', type: 'Dine-In', amount: '₹85.20', payment: 'Credit Card' },
                                        { time: '16:50', id: '#ORD-109', type: 'Delivery', amount: '₹55.00', payment: 'Online' },
                                        { time: '16:30', id: '#ORD-108', type: 'Dine-In', amount: '₹210.00', payment: 'Credit Card' },
                                        { time: '16:10', id: '#ORD-107', type: 'Takeaway', amount: '₹18.50', payment: 'Cash' },
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
