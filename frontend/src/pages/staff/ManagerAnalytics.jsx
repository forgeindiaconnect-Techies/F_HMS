import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ManagerAnalytics = () => {
    const { api } = useAuth();
    const [range, setRange] = useState('Last 7 Days');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await api.get('/analytics/dashboard');
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch manager analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [api]);

    const overview = data?.overview || {
        totalRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        ordersChange: 0,
        activeCustomers: 0,
        customersChange: 0,
        avgOrderValue: 0,
        avgChange: 0
    };

    const popularItems = data?.popularItems && data.popularItems.length > 0
        ? data.popularItems.map(item => ({
            name: item.name || 'Unknown Item',
            qty: item.totalSold || 0,
            rev: `₹${((item.totalSold || 0) * (item.price || 0)).toLocaleString('en-IN')}`
        }))
        : [];

    const qrAnalytics = data?.qrAnalytics;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Branch Analytics</h2>
                    <p className="text-gray-500 text-sm mt-1">Key performance metrics and trends for your branch.</p>
                </div>
                <select 
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm focus:outline-none focus:border-green-500"
                >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="This Month">This Month</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <>
                    {/* Top Level Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2.5 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${overview.revenueChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {overview.revenueChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(overview.revenueChange)}%
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">₹{(overview.totalRevenue || 0).toLocaleString('en-IN')}</h3>
                        </div>
                        
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><ShoppingBag size={20} /></div>
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${overview.ordersChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {overview.ordersChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(overview.ordersChange)}%
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{overview.totalOrders || 0}</h3>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${overview.customersChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {overview.customersChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(overview.customersChange)}%
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Customer Traffic</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{overview.activeCustomers || 0}</h3>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20} /></div>
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <ArrowDownRight size={14} /> {qrAnalytics?.avgPrepTime || 12} min
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Avg Prep Time</p>
                            <h3 className="text-2xl font-extrabold text-gray-900">{qrAnalytics?.avgPrepTime || 0} mins</h3>
                        </div>
                    </div>

                    {/* Two Column Layout for deeper analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Popular Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Top Selling Items</h3>
                            </div>
                            <div className="p-5">
                                {popularItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-sm font-semibold">No order data yet</p>
                                        <p className="text-xs mt-1">Top selling items will appear once orders are placed.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {popularItems.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-extrabold text-gray-300 w-4">{i + 1}</span>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                        <p className="text-xs text-gray-500">{item.qty} sold</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-gray-700">{item.rev}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Operations Breakdown */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Dine-In & Order Operations</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Tables</p>
                                        <p className="text-2xl font-black text-gray-900 mt-1">{qrAnalytics?.activeTables || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Orders</p>
                                        <p className="text-2xl font-black text-gray-900 mt-1">{qrAnalytics?.completedOrders || 0}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 font-medium">Completed Orders Rate</span>
                                            <span className="font-bold text-green-600">
                                                {overview.totalOrders > 0 ? `${Math.round(((qrAnalytics?.completedOrders || 0) / overview.totalOrders) * 100)}%` : '0%'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className="bg-green-500 h-2 rounded-full transition-all duration-350" 
                                                style={{ width: `${overview.totalOrders > 0 ? Math.round(((qrAnalytics?.completedOrders || 0) / overview.totalOrders) * 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default ManagerAnalytics;
