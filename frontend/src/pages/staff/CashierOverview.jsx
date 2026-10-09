import { useState, useEffect } from 'react';
import { Banknote, ReceiptText, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const CashierOverview = () => {
    const { api, user } = useAuth();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        settledBills: 0,
        pendingBills: 0,
        recentSettled: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const { data } = await api.get('/orders');
                
                // Calculate today's stats
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todaysOrders = data.filter(order => new Date(order.createdAt) >= today);
                const paidOrders = todaysOrders.filter(order => order.isPaid);
                const pendingOrders = todaysOrders.filter(order => !order.isPaid && order.status !== 'Pending'); // Or all pending

                const totalRev = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);

                setStats({
                    totalRevenue: totalRev,
                    settledBills: paidOrders.length,
                    pendingBills: data.filter(o => !o.isPaid).length, // Total pending
                    recentSettled: paidOrders.slice(0, 5) // Top 5 most recent paid today
                });
            } catch (error) {
                console.error('Failed to fetch cashier overview', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
        const interval = setInterval(fetchOverview, 30000);
        return () => clearInterval(interval);
    }, [api]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Welcome back, {user?.name || 'Cashier'}!</h2>
                <p className="text-gray-500 mt-1">Here's what's happening at the register today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <Banknote size={24} className="text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Revenue</p>
                        <h3 className="text-3xl font-black text-gray-900">₹{stats.totalRevenue.toFixed(2)}</h3>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Settled Bills</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.settledBills}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                        <Clock size={24} className="text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Bills</p>
                        <h3 className="text-3xl font-black text-gray-900">{stats.pendingBills}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-purple-600"/> Quick Actions
                    </h3>
                    <div className="space-y-4">
                        <Link to="/cashier/billing" className="block w-full p-4 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-purple-900 text-lg">Process Payment</h4>
                                    <p className="text-purple-700 text-sm mt-1">Settle pending bills in the queue</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <ReceiptText size={20} className="text-purple-600"/>
                                </div>
                            </div>
                        </Link>
                        
                        <Link to="/cashier/history" className="block w-full p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">View History</h4>
                                    <p className="text-gray-500 text-sm mt-1">Review past transactions & print receipts</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                                    <Clock size={20} className="text-gray-600"/>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <ReceiptText size={18} className="text-green-600"/> Recently Settled (Today)
                        </h3>
                        <Link to="/cashier/history" className="text-sm font-bold text-purple-600 hover:text-purple-800">View All</Link>
                    </div>
                    
                    {stats.recentSettled.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-xl">
                            No bills settled yet today.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentSettled.map(order => (
                                <div key={order._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                            <CheckCircle size={16} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{order.orderType === 'Dine In' ? `Table ${order.tableNumber || 'Any'}` : order.orderType}</p>
                                            <p className="text-xs font-medium text-gray-500">
                                                {new Date(order.paidAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.paymentMethod}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashierOverview;
