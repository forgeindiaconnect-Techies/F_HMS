import { DollarSign, TrendingUp, CreditCard, Wallet, Calendar, Download, PieChart, BarChart } from 'lucide-react';

const ManagerSales = () => {
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Today's Sales Breakdown</h2>
                    <p className="text-gray-500 text-sm mt-1">Detailed view of transactions, tender types, and hourly revenue.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => alert('Exporting sales data...')} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => alert('Viewing detailed report...')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md">
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
        </div>
    );
};

export default ManagerSales;
