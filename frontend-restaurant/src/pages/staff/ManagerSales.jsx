import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, Download, PieChart, BarChart, X, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerSales = () => {
    const { api } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('CSV');
    const [dateRange, setDateRange] = useState('Today');

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            const list = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
            setOrders(list);
        } catch (err) {
            console.error('Failed to load branch sales', err);
            toast.error('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [api]);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 6);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return orders.filter(o => {
            if (['Cancelled', 'Refunded'].includes(o.status)) return false;
            const d = new Date(o.createdAt);
            if (dateRange === 'Today') return d >= startOfToday;
            if (dateRange === 'Yesterday') return d >= startOfYesterday && d < startOfToday;
            if (dateRange === 'This Week') return d >= startOfWeek;
            if (dateRange === 'This Month') return d >= startOfMonth;
            return true;
        });
    }, [orders, dateRange]);

    const metrics = useMemo(() => {
        const netSales = filteredOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
        const totalDiscounts = filteredOrders.reduce((s, o) => s + (Number(o.discountAmount || o.discount) || 0), 0);
        const grossSales = netSales + totalDiscounts;
        const totalTax = filteredOrders.reduce((s, o) => s + (Number(o.taxPrice) || 0), 0);
        const count = filteredOrders.length;
        const avgTicket = count > 0 ? netSales / count : 0;
        return { grossSales, netSales, totalTax, count, avgTicket };
    }, [filteredOrders]);

    // Real hourly buckets (last 8 active business slots from 12 PM to 8 PM or peak buckets)
    const hourlyBuckets = useMemo(() => {
        const slots = Array.from({ length: 10 }, (_, idx) => {
            const hour = 11 + idx; // 11:00 to 20:00
            const label = hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`;
            return { hour, label, total: 0 };
        });
        filteredOrders.forEach(o => {
            const h = new Date(o.createdAt).getHours();
            const bucket = slots.find(s => s.hour === h);
            if (bucket) bucket.total += Number(o.totalPrice) || 0;
        });
        const maxVal = Math.max(...slots.map(s => s.total), 1);
        const peak = slots.reduce((best, s) => (s.total > best.total ? s : best), slots[0]);
        return {
            slots: slots.map(s => ({ ...s, pct: Math.round((s.total / maxVal) * 100) })),
            peak
        };
    }, [filteredOrders]);

    // Real breakdown by item / top selling items
    const itemBreakdown = useMemo(() => {
        const map = {};
        let grandTotal = 0;
        filteredOrders.forEach(o => {
            (o.orderItems || []).forEach(it => {
                const name = it.name || 'Item';
                const qty = Number(it.qty || it.quantity || 1);
                const rev = (Number(it.price) || 0) * qty;
                map[name] = (map[name] || 0) + rev;
                grandTotal += rev;
            });
        });
        const colors = ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500'];
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, amount], idx) => ({
                name,
                amount,
                pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
                color: colors[idx % colors.length]
            }));
    }, [filteredOrders]);

    const handleDownload = () => {
        try {
            if (filteredOrders.length === 0) {
                toast.error(`No sales transactions found for ${dateRange}`);
                return;
            }
            if (exportFormat === 'PDF') {
                window.print();
                setShowExportModal(false);
                toast.success('Print / PDF dialogue opened!');
                return;
            }

            const headers = ['Time', 'Order ID', 'Type', 'Payment Method', 'Status', 'Amount (INR)'];
            const rows = filteredOrders.map(o => [
                new Date(o.createdAt).toLocaleString(),
                `#${String(o._id).slice(-6).toUpperCase()}`,
                o.orderType || 'Dine In',
                o.paymentMethod || 'Card',
                o.status || 'Completed',
                (Number(o.totalPrice) || 0).toFixed(2)
            ]);

            const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
            const mimeType = exportFormat === 'Excel' ? 'application/vnd.ms-excel;charset=utf-8;' : 'text/csv;charset=utf-8;';
            const blob = new Blob([csvContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Sales_Report_${dateRange.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setShowExportModal(false);
            toast.success(`${exportFormat} report downloaded (${filteredOrders.length} orders)!`);
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to export sales report');
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-4 sm:space-y-6 pb-12 font-sans">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{dateRange}&apos;s Sales Breakdown</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Live view of branch transactions, tax totals, and hourly revenue.</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 px-3 py-2.5 rounded-xl text-sm font-medium"
                    >
                        <option value="Today">Today</option>
                        <option value="Yesterday">Yesterday</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                    </select>
                    <button onClick={fetchSales} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 text-gray-700 dark:text-slate-200 p-2.5 rounded-xl" title="Refresh">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowExportModal(true)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2 cursor-pointer">
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => setShowReportModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer">
                        <TrendingUp size={18} /> Detailed Report
                    </button>
                </div>
            </div>

            {/* Sales KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-green-50 font-medium">Gross Sales</p>
                        <DollarSign size={20} className="text-green-200" />
                    </div>
                    <h3 className="text-3xl font-extrabold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{metrics.grossSales.toFixed(2)}</h3>
                    <p className="text-sm text-green-100 font-medium">{metrics.count} orders in {dateRange}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Net Sales</p>
                        <Wallet size={20} className="text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{metrics.netSales.toFixed(2)}</h3>
                    <p className="text-sm text-gray-400 font-medium">After discounts</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Avg Ticket Size</p>
                        <CreditCard size={20} className="text-purple-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{metrics.avgTicket.toFixed(2)}</h3>
                    <p className="text-sm text-gray-400 font-medium">Based on {metrics.count} transactions</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-500 font-medium">Total Tax</p>
                        <DollarSign size={20} className="text-orange-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{metrics.totalTax.toFixed(2)}</h3>
                    <p className="text-sm text-gray-400 font-medium">Recorded GST collected</p>
                </div>
            </div>

            {/* Live Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><BarChart size={18} className="text-blue-500" /> Hourly Sales Volume</h3>
                    <div className="h-64 flex items-end gap-2 justify-between">
                        {hourlyBuckets.slots.map((slot) => (
                            <div key={slot.hour} className="w-full bg-blue-50 dark:bg-slate-800 rounded-t-lg relative group flex flex-col justify-end" style={{ height: '100%' }} title={`₹${slot.total.toFixed(0)}`}>
                                <div className="bg-blue-500 w-full rounded-t-lg transition-all" style={{ height: `${slot.pct}%` }} />
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold">{slot.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-center text-sm text-gray-500 font-medium">
                        {hourlyBuckets.peak?.total > 0
                            ? `Peak Slot: ${hourlyBuckets.peak.label} (₹${hourlyBuckets.peak.total.toFixed(2)})`
                            : `No hourly orders recorded for ${dateRange}`}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><PieChart size={18} className="text-purple-500" /> Top Selling Items Share</h3>
                    {itemBreakdown.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-gray-400">No item sales data for {dateRange}.</div>
                    ) : (
                        <div className="space-y-4">
                            {itemBreakdown.map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-bold text-gray-700 dark:text-slate-200">{item.name} ({item.pct}%)</span>
                                        <span className="text-gray-900 dark:text-white font-bold">₹{item.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Download size={20} className="text-blue-600"/> Export Sales Data</h3>
                            <button onClick={() => setShowExportModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">Select Date Range</label>
                                <select 
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800"
                                >
                                    <option value="Today">Today</option>
                                    <option value="Yesterday">Yesterday</option>
                                    <option value="This Week">This Week</option>
                                    <option value="This Month">This Month</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">Export Format</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['CSV', 'Excel', 'PDF'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setExportFormat(fmt)}
                                            className={`py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                                                exportFormat === fmt
                                                ? 'border-green-600 bg-green-50 text-green-700 shadow-sm'
                                                : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setShowExportModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDownload} className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md cursor-pointer">Download Now</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><FileText size={20} className="text-green-600"/> Detailed Transaction Report ({dateRange})</h3>
                            <button onClick={() => setShowReportModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-0 overflow-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {filteredOrders.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">No transactions recorded for {dateRange}.</td></tr>
                                    ) : (
                                        filteredOrders.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-slate-300">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">#{String(tx._id).slice(-6).toUpperCase()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600"><span className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded font-bold text-xs">{tx.orderType}</span></td>
                                                <td className="px-6 py-4 text-sm font-extrabold text-green-700 text-right">₹{(Number(tx.totalPrice) || 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-slate-300">{tx.paymentMethod || 'Card'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setShowReportModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerSales;
