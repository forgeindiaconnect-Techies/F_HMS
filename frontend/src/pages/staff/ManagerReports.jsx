import { useState, useEffect } from 'react';
import { FileText, Printer, FileDown, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerReports = () => {
    const { api, user } = useAuth();
    const [reportType, setReportType] = useState('1'); // 1: Daily Sales, 2: Item Performance, 3: Staff Performance, 4: Tax & Compliance
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches');
            setBranches(res.data);
            if (res.data.length > 0) {
                setSelectedBranch(user.branchId?._id || user.branchId || res.data[0]._id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setReportData(null);
            const res = await api.post('/reports/generate', {
                reportType: Number(reportType),
                startDate,
                endDate,
                branch: selectedBranch
            });
            setReportData(res.data);
            toast.success('Report generated successfully!');
        } catch (err) {
            console.error(err);
            if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to generate report');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Reports</h2>
                    <p className="text-gray-500 text-sm mt-1">Generate dynamic operational, sales, and compliance reports.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Configuration Panel */}
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm space-y-4 h-fit">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                        <FileText size={20} className="text-green-600" /> Configure Report
                    </h3>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Report Type</label>
                        <select 
                            value={reportType} 
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                        >
                            <option value="1">Daily Sales Summary</option>
                            <option value="2">Item Performance</option>
                            <option value="3">Staff Performance</option>
                            <option value="4">Tax & Compliance</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Branch</label>
                        <select 
                            value={selectedBranch} 
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                        >
                            <option value="All Branches">All Branches</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-green-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerateReport} 
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />} 
                        Generate Report
                    </button>
                </div>

                {/* Report Output Screen */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex flex-col min-h-[450px]">
                    {loading ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-gray-400 space-y-2">
                            <RefreshCw className="animate-spin text-green-600" size={32} />
                            <p className="text-sm font-medium">Aggregating database closing registers...</p>
                        </div>
                    ) : !reportData ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-gray-400 space-y-2">
                            <FileText size={48} className="text-gray-300" />
                            <p className="text-sm font-medium">Select parameters and click generate to view details.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 flex-1 flex flex-col justify-between" id="printable-report">
                            <div>
                                <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {reportType === '1' && 'Daily Sales Summary Report'}
                                            {reportType === '2' && 'Item Sales & Performance Report'}
                                            {reportType === '3' && 'Staff Performance & Sales Report'}
                                            {reportType === '4' && 'Tax Liability & Compliance Report'}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2 no-print">
                                        <button onClick={handlePrint} className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                            <Printer size={14} /> Print
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Tables */}
                                <div className="overflow-x-auto border border-gray-150 rounded-xl">
                                    <table className="w-full text-left text-sm">
                                        {reportType === '1' && (
                                            <>
                                                <thead className="bg-gray-50/70 border-b border-gray-150 text-gray-500 font-bold">
                                                    <tr>
                                                        <th className="p-3">Date</th>
                                                        <th className="p-3 text-center">Orders Processed</th>
                                                        <th className="p-3 text-right">Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                                                    {reportData.data.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-3">{row._id}</td>
                                                            <td className="p-3 text-center">{row.orderCount}</td>
                                                            <td className="p-3 text-right text-green-700">₹{(row.totalRevenue || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </>
                                        )}

                                        {reportType === '2' && (
                                            <>
                                                <thead className="bg-gray-50/70 border-b border-gray-150 text-gray-500 font-bold">
                                                    <tr>
                                                        <th className="p-3">Item Name</th>
                                                        <th className="p-3 text-center">Quantity Sold</th>
                                                        <th className="p-3 text-right">Total Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                                                    {reportData.data.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-3">{row.name || 'Custom Item'}</td>
                                                            <td className="p-3 text-center">{row.quantitySold}</td>
                                                            <td className="p-3 text-right text-green-700">₹{(row.totalRevenue || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </>
                                        )}

                                        {reportType === '3' && (
                                            <>
                                                <thead className="bg-gray-50/70 border-b border-gray-150 text-gray-500 font-bold">
                                                    <tr>
                                                        <th className="p-3">Staff Name</th>
                                                        <th className="p-3 text-center">Orders Handled</th>
                                                        <th className="p-3 text-right">Total Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                                                    {reportData.data.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-3">{row.staffName}</td>
                                                            <td className="p-3 text-center">{row.ordersHandled}</td>
                                                            <td className="p-3 text-right text-green-700">₹{(row.totalRevenue || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </>
                                        )}

                                        {reportType === '4' && (
                                            <>
                                                <thead className="bg-gray-50/70 border-b border-gray-150 text-gray-500 font-bold">
                                                    <tr>
                                                        <th className="p-3">Date</th>
                                                        <th className="p-3 text-right">Taxable Sales</th>
                                                        <th className="p-3 text-right font-extrabold text-red-600">Tax Collected (5%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                                                    {reportData.data.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-3">{row._id}</td>
                                                            <td className="p-3 text-right">₹{(row.taxableSales || 0).toFixed(2)}</td>
                                                            <td className="p-3 text-right text-red-600">₹{(row.taxCollected || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </>
                                        )}
                                    </table>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs text-gray-400">
                                <span>Generated: {new Date(reportData.generatedAt).toLocaleString()}</span>
                                <span className="italic font-bold">Confidential - Branch Closing Manifest</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerReports;
