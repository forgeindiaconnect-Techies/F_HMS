import { FileText, Printer, FileDown, CheckCircle } from 'lucide-react';

const mockReports = [
    { name: 'End of Day Summary', desc: 'Cash drawer closing and net sales summary.', freq: 'Daily', time: '11:00 PM' },
    { name: 'Inventory Consumption', desc: 'Depletion of stock based on recipes sold.', freq: 'Daily', time: '11:30 PM' },
    { name: 'Staff Labor Cost', desc: 'Hours worked vs sales generated.', freq: 'Weekly', time: 'Sunday EOD' },
    { name: 'Tax Liability', desc: 'Total tax collected for local jurisdiction.', freq: 'Monthly', time: '1st of Month' },
];

const ManagerReports = () => {
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Reports</h2>
                    <p className="text-gray-500 text-sm mt-1">Generate and print mandatory branch closing reports.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* EOD Action */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10"><FileText size={120} /></div>
                        <h3 className="font-bold text-xl mb-2 relative z-10" style={{ fontFamily: 'Poppins, sans-serif' }}>End of Day (EOD)</h3>
                        <p className="text-sm text-gray-300 mb-6 relative z-10">Running EOD will close the cash drawer, lock today's sales, and generate the daily manifest.</p>
                        
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                                <span className="text-gray-400">Drawer Status</span>
                                <span className="text-orange-400 font-bold">Open</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                                <span className="text-gray-400">Cash Expected</span>
                                <span className="text-white font-bold">$1,245.00</span>
                            </div>
                            <button onClick={() => alert('Generating report...')} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md mt-4 flex items-center justify-center gap-2">
                                <FileText size={18} /> Generate Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* Available Reports */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Available Reports</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mockReports.map((report, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {report.freq}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">{report.name}</h4>
                                <p className="text-sm text-gray-500 mb-4 h-10">{report.desc}</p>
                                
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => alert('Viewing report...')} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1 border border-gray-200">
                                        <FileText size={14} /> View
                                    </button>
                                    <button onClick={() => alert('Downloading report...')} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1 border border-gray-200">
                                        <Download size={14} /> Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerReports;
