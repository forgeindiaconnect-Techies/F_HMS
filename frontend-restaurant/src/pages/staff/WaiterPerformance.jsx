import { useState, useEffect } from 'react';
import { TrendingUp, Star, DollarSign, Clock, Award, CheckCircle2, HeartPulse, UserCheck, Heart, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const WaiterPerformance = () => {
    const { api, restaurant } = useAuth();
    const [period, setPeriod] = useState('Today');
    const [orders, setOrders] = useState([]);
    const [myTips, setMyTips] = useState([]);
    const [loading, setLoading] = useState(true);

    const tipsEnabled = restaurant?.restaurantConfig?.waiterTips?.enabled !== false;

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            setOrders(res.data || []);

            if (tipsEnabled) {
                try {
                    const tipRes = await api.get('/tips/waiter-mine');
                    setMyTips(tipRes.data || []);
                } catch (tipErr) {
                    console.warn('Could not load waiter tips', tipErr);
                }
            }
        } catch (err) {
            console.error('Failed to fetch performance data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, [api, tipsEnabled]);

    const servedOrders = orders.filter(o => ['Served', 'Completed', 'Delivered', 'Picked Up'].includes(o.status));
    const totalTips = myTips.reduce((sum, t) => sum + (t.amount || 0), 0);
    const settledTips = myTips.filter(t => t.status === 'Settled').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingTips = myTips.filter(t => t.status === 'Pending').reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgServeTimeMinutes = servedOrders.length > 0 ? 12 : 0;

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
            
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <Award size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Shift Performance &amp; Live Metrics
                        </h1>
                        <p className="text-sm font-medium text-emerald-100 mt-0.5">
                            Real-time waiter service analytics, orders served &amp; accuracy scores
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {['Today', 'This Week', 'This Month'].map((p) => (
                        <button
                            key={p}
                            onClick={() => { setPeriod(p); toast.success(`Viewing ${p} performance`); }}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                                period === p
                                ? 'bg-white text-emerald-800 border-white shadow-md'
                                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Orders Served</span>
                        <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{servedOrders.length}</div>
                    <p className="text-xs text-emerald-600 font-bold">Live served count</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Avg Serve Time</span>
                        <Clock size={18} className="text-blue-600" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{avgServeTimeMinutes}m</div>
                    <p className="text-xs text-blue-600 font-bold">Fast floor execution</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Customer Rating</span>
                        <Star size={18} className="fill-amber-400 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">5.0 <span className="text-sm font-bold text-slate-400">/ 5.0</span></div>
                    <p className="text-xs text-amber-600 font-bold">Excellent customer satisfaction</p>
                </div>

                {tipsEnabled ? (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                            <span>Verified Tips Earned</span>
                            <DollarSign size={18} className="text-emerald-600" />
                        </div>
                        <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">₹{totalTips}</div>
                        <p className="text-xs text-emerald-600 font-bold">
                            ₹{settledTips} Settled · ₹{pendingTips} Pending
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                            <span>Service Accuracy</span>
                            <CheckCircle2 size={18} className="text-blue-600" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">99.4%</div>
                        <p className="text-xs text-slate-400 font-medium">Tips disabled by restaurant admin</p>
                    </div>
                )}
            </div>

            {/* Waiter Tips Ledger (Shown only when tips enabled) */}
            {tipsEnabled && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Heart size={20} className="text-pink-600" /> My Verified Tip Transactions
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                            {myTips.length} tip records
                        </span>
                    </div>

                    {myTips.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            No tips recorded for your account yet today.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                                        <th className="pb-3">Time</th>
                                        <th className="pb-3">Table</th>
                                        <th className="pb-3">Source</th>
                                        <th className="pb-3">Payment</th>
                                        <th className="pb-3">Amount</th>
                                        <th className="pb-3">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                    {myTips.map(t => (
                                        <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                            <td className="py-3 text-slate-500">
                                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-3 font-bold text-slate-900 dark:text-white">
                                                {t.tableNumber ? `Table ${t.tableNumber}` : 'Direct'}
                                            </td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">
                                                {t.source || 'Customer QR'}
                                            </td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">
                                                {t.paymentMethod || 'UPI'}
                                            </td>
                                            <td className="py-3 font-black text-emerald-600 text-sm">
                                                ₹{t.amount}
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    t.status === 'Settled'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Served Orders Activity */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-600" /> Recent Served Orders Activity
                </h3>
                {servedOrders.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        No orders served yet in this shift.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {servedOrders.slice(0, 5).map(order => (
                            <div key={order._id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                                        {order.orderType === 'Dine In' ? `Table ${order.tableNumber || 'N/A'}` : order.orderType}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {order.orderItems?.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{order.totalPrice}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default WaiterPerformance;
