import { useState, useEffect, useRef } from 'react';
import { Download, Calendar, Filter, FileText, FileSpreadsheet, PieChart, Activity, X, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const reportTypes = [
    { id: 1, title: 'Daily Sales Summary', desc: 'Revenue, orders, and taxes collected for a specific day.', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, title: 'Item Performance', desc: 'Detailed breakdown of menu item sales and popularity.', icon: PieChart, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 3, title: 'Staff Shift Report', desc: 'Hours worked, orders handled, and tips accumulated by staff.', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 4, title: 'Tax & Compliance', desc: 'Detailed tax collection report for accounting purposes.', icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50' },
];

const Reports = () => {
    const { api } = useAuth();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentDownloads, setRecentDownloads] = useState([]);
    
    const [reportType, setReportType] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branch, setBranch] = useState('All Branches');
    const [format, setFormat] = useState('PDF Document');

    const [previewData, setPreviewData] = useState(null);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await api.get('/branches');
                setBranches(res.data);
            } catch (error) {
                console.error('Failed to fetch branches', error);
            }
        };
        fetchBranches();
    }, []);

    const handlePresetDate = (preset) => {
        const today = new Date();
        const yyyyMMdd = (date) => date.toISOString().split('T')[0];

        if (preset === 'Today') {
            setStartDate(yyyyMMdd(today));
            setEndDate(yyyyMMdd(today));
        } else if (preset === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            setStartDate(yyyyMMdd(yesterday));
            setEndDate(yyyyMMdd(yesterday));
        } else if (preset === 'Last 7 Days') {
            const last7 = new Date(today);
            last7.setDate(last7.getDate() - 7);
            setStartDate(yyyyMMdd(last7));
            setEndDate(yyyyMMdd(today));
        } else if (preset === 'This Month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(yyyyMMdd(firstDay));
            setEndDate(yyyyMMdd(today));
        }
    };

    const generateCSV = (data, type) => {
        if (!data || data.length === 0) return 'No data available';
        
        let csv = '';
        if (type === 1) { // Daily Sales
            csv = 'Date,Total Revenue,Total Tax,Orders\n';
            data.forEach(row => {
                csv += `${row._id},${row.totalRevenue},${row.totalTax},${row.orderCount}\n`;
            });
        } else if (type === 2) { // Item Performance
            csv = 'Item Name,Quantity Sold,Total Revenue\n';
            data.forEach(row => {
                csv += `${row.name},${row.quantitySold},${row.totalRevenue}\n`;
            });
        } else if (type === 3) { // Staff Report
            csv = 'Staff Name,Orders Handled,Total Revenue Generated\n';
            data.forEach(row => {
                csv += `${row.staffName},${row.ordersHandled},${row.totalRevenue}\n`;
            });
        } else if (type === 4) { // Tax
            csv = 'Date,Taxable Sales,Tax Collected\n';
            data.forEach(row => {
                csv += `${row._id},${row.taxableSales},${row.taxCollected}\n`;
            });
        }
        return csv;
    };

    const downloadCSV = (csvStr, filename) => {
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const payload = {
                reportType,
                startDate,
                endDate,
                branch: branch === 'All Branches' ? '' : branch
            };
            const res = await api.post('/reports/generate', payload);
            const reportName = reportTypes.find(r => r.id === reportType).title;
            
            // Add to recent downloads
            setRecentDownloads([{
                id: Date.now(),
                title: reportName,
                branchName: branch === 'All Branches' ? 'All Branches' : branches.find(b => b._id === branch)?.name || 'Unknown',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                format
            }, ...recentDownloads].slice(0, 5));

            if (format === 'CSV Spreadsheet') {
                const csvStr = generateCSV(res.data.data, reportType);
                downloadCSV(csvStr, `${reportName.replace(/ /g, '_')}_${new Date().getTime()}.csv`);
            } else {
                // Open PDF Preview Modal
                setPreviewData({
                    ...res.data,
                    title: reportName
                });
            }
            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Failed to generate report', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const renderPreviewTable = () => {
        if (!previewData || !previewData.data || previewData.data.length === 0) return <p className="text-gray-500 py-10 text-center">No data found for this period.</p>;
        
        const data = previewData.data;
        const type = previewData.reportType;

        if (type === 1) {
            return (
                <table className="w-full text-left border-collapse mt-4">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2">Date</th>
                            <th className="py-2">Orders</th>
                            <th className="py-2 text-right">Tax Collected</th>
                            <th className="py-2 text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-gray-200">
                                <td className="py-2">{row._id}</td>
                                <td className="py-2">{row.orderCount}</td>
                                <td className="py-2 text-right">₹{row.totalTax.toFixed(2)}</td>
                                <td className="py-2 text-right">₹{row.totalRevenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else if (type === 2) {
            return (
                <table className="w-full text-left border-collapse mt-4">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2">Item Name</th>
                            <th className="py-2 text-right">Quantity Sold</th>
                            <th className="py-2 text-right">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-gray-200">
                                <td className="py-2">{row.name}</td>
                                <td className="py-2 text-right">{row.quantitySold}</td>
                                <td className="py-2 text-right">₹{row.totalRevenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else if (type === 3) {
            return (
                <table className="w-full text-left border-collapse mt-4">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2">Staff Name</th>
                            <th className="py-2 text-right">Orders Handled</th>
                            <th className="py-2 text-right">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-gray-200">
                                <td className="py-2">{row.staffName}</td>
                                <td className="py-2 text-right">{row.ordersHandled}</td>
                                <td className="py-2 text-right">₹{row.totalRevenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else if (type === 4) {
             return (
                <table className="w-full text-left border-collapse mt-4">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2">Date</th>
                            <th className="py-2 text-right">Taxable Sales</th>
                            <th className="py-2 text-right">Tax Collected</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-gray-200">
                                <td className="py-2">{row._id}</td>
                                <td className="py-2 text-right">₹{row.taxableSales.toFixed(2)}</td>
                                <td className="py-2 text-right">₹{row.taxCollected.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports Generator</h2>
                    <p className="text-gray-500 text-sm mt-1">Generate and download financial, operational, and staff reports.</p>
                </div>
            </div>

            {/* Generator Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">1. Select Report Type</h3>
                        <div className="space-y-3">
                            {reportTypes.map((rt) => (
                                <label key={rt.id} className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${reportType === rt.id ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50/30'}`}>
                                    <div className="pt-0.5">
                                        <input 
                                            type="radio" 
                                            name="reportType" 
                                            className="w-4 h-4 text-green-600 focus:ring-green-500" 
                                            checked={reportType === rt.id}
                                            onChange={() => setReportType(rt.id)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`p-1.5 rounded-lg ${rt.bg} ${rt.color}`}>
                                                <rt.icon size={16} />
                                            </div>
                                            <span className="font-bold text-gray-900">{rt.title}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{rt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">2. Configuration</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-colors" 
                                        />
                                    </div>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-colors" 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {['Today', 'Yesterday', 'Last 7 Days', 'This Month'].map(preset => (
                                        <button 
                                            key={preset} 
                                            type="button"
                                            onClick={() => handlePresetDate(preset)}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                                <select 
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
                                >
                                    <option value="All Branches">All Branches</option>
                                    {branches.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="format" 
                                            value="PDF Document"
                                            checked={format === 'PDF Document'}
                                            onChange={(e) => setFormat(e.target.value)}
                                            className="text-green-600 focus:ring-green-500" 
                                        />
                                        <span className="text-sm text-gray-700">PDF Document</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="format" 
                                            value="CSV Spreadsheet"
                                            checked={format === 'CSV Spreadsheet'}
                                            onChange={(e) => setFormat(e.target.value)}
                                            className="text-green-600 focus:ring-green-500" 
                                        />
                                        <span className="text-sm text-gray-700">CSV Spreadsheet</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 shadow-md disabled:opacity-70" 
                                    style={{ fontFamily: 'Outfit, sans-serif' }}
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <><Download size={18} /> Generate & Download</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Recent Reports */}
            {recentDownloads.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Recent Downloads (Session)</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        {recentDownloads.map(dl => (
                            <div key={dl.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                        {dl.format === 'CSV Spreadsheet' ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{dl.title} - {dl.branchName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Generated {dl.date} • {dl.format}</p>
                                    </div>
                                </div>
                                <button className="text-green-600 hover:text-green-700 font-medium text-sm px-3 py-1.5 hover:bg-green-50 rounded-lg transition-colors">
                                    Ready
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Print Preview Modal */}
            {previewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setPreviewData(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 print:hidden">
                            <h3 className="font-bold text-gray-900 text-lg">Print Preview</h3>
                            <button onClick={() => setPreviewData(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto bg-white" id="printable-report">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-widest">{previewData.title}</h1>
                                <p className="text-gray-500 mt-2 font-medium">RestoSys Official Report</p>
                                <p className="text-gray-500 mt-1 text-sm">
                                    Generated: {new Date(previewData.generatedAt).toLocaleString()}
                                </p>
                                <div className="mt-4 inline-block bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700 font-medium">
                                    Period: {previewData.startDate || 'Beginning'} - {previewData.endDate || 'Present'}
                                </div>
                            </div>
                            
                            {renderPreviewTable()}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0 print:hidden">
                            <button 
                                onClick={() => setPreviewData(null)}
                                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm flex items-center gap-2"
                            >
                                <Printer size={16} /> Print as PDF
                            </button>
                        </div>
                    </div>
                    {/* Add print styles specifically for this modal */}
                    <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                            body * { visibility: hidden; }
                            #printable-report, #printable-report * { visibility: visible; }
                            #printable-report { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 0 !important; }
                        }
                    `}} />
                </div>
            )}
        </div>
    );
};

export default Reports;
