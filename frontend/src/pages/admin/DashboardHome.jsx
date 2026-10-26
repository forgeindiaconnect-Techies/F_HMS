import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, ShoppingBag, DollarSign, Sparkles, ArrowRight } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const DashboardHome = () => {
    const { api, restaurant } = useAuth();
    const isCustomActive = restaurant?.billingConfig?.isCustomBillingActive === true;
    const customModules = restaurant?.billingConfig?.modules || {};
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [api]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
            </div>
        );
    }

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

    // Prepare weekly trend data: if empty, show zero values
    const chartData = data?.revenueTrend && data.revenueTrend.length > 0 
        ? data.revenueTrend.map(item => ({
            name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: item.revenue || 0,
            orders: item.orders || 0
        }))
        : [
            { name: 'Mon', revenue: 0, orders: 0 },
            { name: 'Tue', revenue: 0, orders: 0 },
            { name: 'Wed', revenue: 0, orders: 0 },
            { name: 'Thu', revenue: 0, orders: 0 },
            { name: 'Fri', revenue: 0, orders: 0 },
            { name: 'Sat', revenue: 0, orders: 0 },
            { name: 'Sun', revenue: 0, orders: 0 }
        ];

    // Popular items for BarChart: if empty, display placeholders
    const popularItems = data?.popularItems && data.popularItems.length > 0
        ? data.popularItems.map(item => ({
            name: item.name || 'Unknown',
            sales: item.totalSold || 0
        }))
        : [];

    return (
        <div className="space-y-6 text-slate-900 dark:text-slate-100">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>Business Overview</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Welcome back! Manage your overall business operations, sales, staff, and customer orders.</p>
            </div>

            {/* Initial Restaurant Setup Wizard Prompt */}
            {restaurant?.restaurantConfig?.setupWizardCompleted !== true && (
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 text-white border border-white/20">
                            <Sparkles size={24} className="text-emerald-300 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-black text-white text-base">Complete Your Restaurant Setup</h4>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                                    6-Step Guided Flow
                                </span>
                            </div>
                            <p className="text-xs text-emerald-100 mt-1 max-w-xl leading-relaxed">
                                Configure Kitchen KOT &amp; KDS, staff assignments, customer QR table modes, waiter tips, and accepted checkout tenders in a simple guided wizard.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/admin/setup-wizard"
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
                    >
                        <span>Launch Setup Wizard</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            )}

            {/* Custom Billing Configuration Banner */}
            {isCustomActive && (
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Custom Billing Setup Active
                                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                                    {restaurant?.billingConfig?.outletFormat || 'Configured'}
                                </span>
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Your POS and back-office workspace is tailored for {restaurant?.billingConfig?.outletFormat || 'your outlet format'}. Only chosen modules are active.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(customModules).filter(([_, enabled]) => enabled).slice(0, 4).map(([modKey]) => (
                            <span key={modKey} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                {modKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
                <StatCard
                    title="Total Revenue"
                    value={<span style={{ fontFamily: 'Manrope, sans-serif' }}>₹{overview.totalRevenue.toLocaleString('en-IN')}</span>}
                    icon={DollarSign}
                    trend={overview.revenueChange}
                    trendUp={overview.revenueChange >= 0}
                    colorClass="bg-gradient-to-br from-green-400 to-green-600"
                />
                <StatCard
                    title="Total Orders"
                    value={<span style={{ fontFamily: 'Manrope, sans-serif' }}>{overview.totalOrders}</span>}
                    icon={ShoppingBag}
                    trend={overview.ordersChange}
                    trendUp={overview.ordersChange >= 0}
                    colorClass="bg-gradient-to-br from-orange-400 to-orange-600"
                />
                <StatCard
                    title="Active Customers"
                    value={<span style={{ fontFamily: 'Manrope, sans-serif' }}>{overview.activeCustomers}</span>}
                    icon={Users}
                    trend={overview.customersChange}
                    trendUp={overview.customersChange >= 0}
                    colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
                />
                <StatCard
                    title="Avg Order Value"
                    value={<span style={{ fontFamily: 'Manrope, sans-serif' }}>₹{overview.avgOrderValue.toFixed(2)}</span>}
                    icon={TrendingUp}
                    trend={overview.avgChange}
                    trendUp={overview.avgChange >= 0}
                    colorClass="bg-gradient-to-br from-green-500 to-emerald-600"
                />
            </div>


            {/* QR Ordering Analytics Section */}
            {data?.qrAnalytics && (!isCustomActive || customModules.tableManagement !== false) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-3.5 sm:p-6 space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-950 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        QR Dine-In Ordering Ops
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-4">
                        <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active Tables</p>
                            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.activeTables}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Current Orders</p>
                            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.currentOrders}</p>
                        </div>
                        <div className="bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Pending</p>
                            <p className="text-xl sm:text-2xl font-black text-orange-700 dark:text-orange-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.pendingOrders}</p>
                        </div>
                        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Preparing</p>
                            <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.preparingOrders}</p>
                        </div>
                        <div className="bg-green-50/70 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Ready</p>
                            <p className="text-xl sm:text-2xl font-black text-green-700 dark:text-green-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.readyOrders}</p>
                        </div>
                        <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Served</p>
                            <p className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.servedOrders}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Completed</p>
                            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.completedOrders}</p>
                        </div>
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Avg Prep Time</p>
                            <p className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.qrAnalytics.avgPrepTime} min</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Ops Section */}
            {data?.deliveryAnalytics && (!isCustomActive || customModules.dineInTakeawayOrders !== false) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-3.5 sm:p-6 space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-950 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                        Delivery Partner Ops
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
                        <div className="bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Online Drivers</p>
                            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.onlinePartners}</p>
                        </div>
                        <div className="bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Pending Assign</p>
                            <p className="text-xl sm:text-2xl font-black text-orange-700 dark:text-orange-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.pendingAssignments}</p>
                        </div>
                        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Active Deliveries</p>
                            <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.activeDeliveries}</p>
                        </div>
                        <div className="bg-green-50/70 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Completed Payouts</p>
                            <p className="text-xl sm:text-2xl font-black text-green-700 dark:text-green-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{data.deliveryAnalytics.completedDeliveries}</p>
                        </div>
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center col-span-2 sm:col-span-1">
                            <p className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Delivery Revenue</p>
                            <p className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{data.deliveryAnalytics.totalDeliveryEarnings}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {(!isCustomActive || customModules.salesReports !== false) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Revenue Area Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Weekly Revenue</h3>
                        <div className="h-72">
                            {overview.totalOrders === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                                    <DollarSign size={40} className="mb-2 text-gray-300 dark:text-slate-600" />
                                    <p className="text-sm font-semibold">No order data available yet</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Total revenue will show here once orders are placed.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}
                                            formatter={(val) => [`₹${val}`, 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#16A34A' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Top Dishes Bar Chart */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Top Dishes</h3>
                        <div className="h-72">
                            {popularItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                                    <ShoppingBag size={40} className="mb-2 text-gray-300 dark:text-slate-600" />
                                    <p className="text-sm font-semibold">No sales data available</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Popular dishes will be ranked here by sales.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                                    <BarChart data={popularItems} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={80} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}
                                            formatter={(val) => [val, 'Sold']}
                                        />
                                        <Bar dataKey="sales" fill="#F97316" radius={[0, 8, 8, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardHome;
