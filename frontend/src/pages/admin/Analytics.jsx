import { useState, useEffect } from 'react';
import { Calendar, Download, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#16A34A', '#F97316', '#3B82F6', '#8B5CF6'];

const Analytics = () => {
    const { api } = useAuth();
    const [timeframe, setTimeframe] = useState(7);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        overview: {
            totalRevenue: 0, revenueChange: 0,
            totalOrders: 0, ordersChange: 0,
            avgOrderValue: 0, avgChange: 0,
            activeCustomers: 0, customersChange: 0
        },
        revenueTrend: [],
        popularItems: [],
        categoryData: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/analytics/dashboard?timeframe=${timeframe}`);
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [timeframe]);

    const formatCurrency = (val) => `₹${Number(val).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    const formatNumber = (val) => Number(val).toLocaleString();

    const handleExport = () => {
        if (!data.revenueTrend || data.revenueTrend.length === 0) {
            toast.error('No data to export for this timeframe.');
            return;
        }

        let csv = 'Date,Revenue,Orders\n';
        data.revenueTrend.forEach(row => {
            csv += `${row._id},${row.revenue},${row.orders}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_export_${timeframe}_days.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Analytics Dashboard</h2>
                    <p className="text-gray-500 text-sm mt-1">Deep dive into sales trends, customer behavior, and menu performance.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5">
                        <Calendar size={16} className="text-gray-400" />
                        <select 
                            value={timeframe} 
                            onChange={(e) => setTimeframe(Number(e.target.value))}
                            className="bg-transparent text-sm text-gray-600 font-medium focus:outline-none cursor-pointer"
                        >
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 90 Days</option>
                            <option value={365}>Last 365 Days</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md" 
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                        <Download size={16} /> Export Data
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { title: 'Total Revenue', value: formatCurrency(data.overview.totalRevenue), change: `${data.overview.revenueChange > 0 ? '+' : ''}${data.overview.revenueChange.toFixed(1)}%`, isUp: data.overview.revenueChange >= 0 },
                            { title: 'Total Orders', value: formatNumber(data.overview.totalOrders), change: `${data.overview.ordersChange > 0 ? '+' : ''}${data.overview.ordersChange.toFixed(1)}%`, isUp: data.overview.ordersChange >= 0 },
                            { title: 'Avg Order Value', value: formatCurrency(data.overview.avgOrderValue), change: `${data.overview.avgChange > 0 ? '+' : ''}${data.overview.avgChange.toFixed(1)}%`, isUp: data.overview.avgChange >= 0 },
                            { title: 'Active Customers', value: formatNumber(data.overview.activeCustomers), change: `${data.overview.customersChange > 0 ? '+' : ''}${data.overview.customersChange.toFixed(1)}%`, isUp: data.overview.customersChange >= 0 },
                        ].map((kpi, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                                <div className="flex items-end justify-between mt-4">
                                    <h3 className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{kpi.value}</h3>
                                    <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-md ${kpi.isUp ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                        {kpi.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                        {kpi.change}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Revenue Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Revenue Overview</h3>
                                <button className="text-gray-400 hover:text-gray-600"><TrendingUp size={20}/></button>
                            </div>
                            <div className="h-[300px] w-full">
                                {data.revenueTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="_id" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value) => [`₹${value}`, 'Revenue']}
                                                labelFormatter={(label) => `Date: ${label}`}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">No revenue data for this period</div>
                                )}
                            </div>
                        </div>

                        {/* Category Pie Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-gray-900 text-lg mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Sales by Category</h3>
                            <div className="flex-1 min-h-[250px]">
                                {data.categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <PieChart>
                                            <Pie
                                                data={data.categoryData}
                                                innerRadius={70}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.categoryData.map((entry, index) => (
                                                    <Cell key={`cell-₹{index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">No data</div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {data.categoryData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-gray-600 font-medium">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Orders Bar Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-3">
                            <h3 className="font-bold text-gray-900 text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Daily Order Volume</h3>
                            <div className="h-[250px] w-full">
                                {data.revenueTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                        <BarChart data={data.revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="_id" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                            <Tooltip 
                                                cursor={{fill: '#F3F4F6'}}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="orders" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">No order data for this period</div>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
