import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    TrendingUp, Award, Receipt, Store, 
    Calendar, ShieldAlert, ArrowUpRight, DollarSign, Loader2, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const RevenueAnalytics = () => {
    const { api } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, paymentsRes] = await Promise.all([
                api.get('/super-admin/subscription-analytics'),
                api.get('/super-admin/billing-history')
            ]);
            setAnalytics(analyticsRes.data);
            setPayments(paymentsRes.data || []);
        } catch (error) {
            console.error("Failed to load analytics data", error);
            toast.error("Failed to load revenue and billing details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [api]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const stats = analytics?.stats || {};
    const trends = analytics?.trends || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">Revenue & Subscription Analytics</h2>
                <p className="text-slate-500 mt-1 text-sm font-medium">Global platform revenue, monthly metrics, and active transaction audits.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { 
                        label: 'Monthly Recurring Revenue (MRR)', 
                        value: `₹${(stats.monthlyRecurringRevenue || 0).toLocaleString('en-IN')}`, 
                        icon: TrendingUp, 
                        color: 'text-emerald-600', 
                        bg: 'bg-emerald-50 border-emerald-100', 
                        desc: 'Normalized monthly income' 
                    },
                    { 
                        label: 'Annual Recurring Revenue (ARR)', 
                        value: `₹${(stats.annualRecurringRevenue || 0).toLocaleString('en-IN')}`, 
                        icon: Award, 
                        color: 'text-indigo-600', 
                        bg: 'bg-indigo-50 border-indigo-100', 
                        desc: 'Annualized recurring projection' 
                    },
                    { 
                        label: 'Subscription Renewal Rate', 
                        value: `${stats.renewalRate || 100}%`, 
                        icon: ArrowUpRight, 
                        color: 'text-sky-600', 
                        bg: 'bg-sky-50 border-sky-100', 
                        desc: 'Active vs expired ratios' 
                    },
                    { 
                        label: 'SaaS Subscriber Churn', 
                        value: `${stats.churnRate || 0}%`, 
                        icon: ArrowDownRight, 
                        color: 'text-rose-600', 
                        bg: 'bg-rose-50 border-rose-100', 
                        desc: 'Cancellation percentiles' 
                    }
                ].map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={idx} className={`bg-white rounded-3xl p-6 shadow-sm border flex items-center gap-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${kpi.bg}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kpi.color} bg-white shadow-inner shrink-0`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-slate-900 font-sans">{kpi.value}</h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{kpi.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Subscription Tier Distribution */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 text-base mb-1">Subscriber Tier Distribution</h3>
                        <p className="text-xs text-slate-400 font-semibold mb-6">Distribution of active restaurants across plans.</p>
                        
                        <div className="space-y-4">
                            {[
                                { name: 'Basic', count: stats.basicSubscribers || 0, color: 'bg-emerald-500' },
                                { name: 'Pro', count: stats.proSubscribers || 0, color: 'bg-indigo-500' },
                                { name: 'Enterprise', count: stats.enterpriseSubscribers || 0, color: 'bg-amber-500' }
                            ].map(tier => {
                                const total = (stats.basicSubscribers || 0) + (stats.proSubscribers || 0) + (stats.enterpriseSubscribers || 0) || 1;
                                const pct = Math.round((tier.count / total) * 100);
                                return (
                                    <div key={tier.name} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-800 font-bold">{tier.name}</span>
                                            <span className="text-slate-500">{tier.count} ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${tier.color}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Billing Summary / Totals */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 text-base mb-1">Revenue Performance Matrix</h3>
                        <p className="text-xs text-slate-400 font-semibold mb-6">SaaS tier contribution statistics.</p>
                        
                        <div className="divide-y divide-slate-50">
                            {[
                                { plan: 'Basic Tier', rate: '₹49/mo', count: stats.basicSubscribers || 0, total: (stats.basicSubscribers || 0) * 49 },
                                { plan: 'Pro Tier', rate: '₹99/mo', count: stats.proSubscribers || 0, total: (stats.proSubscribers || 0) * 99 },
                                { plan: 'Enterprise Tier', rate: '₹199/mo', count: stats.enterpriseSubscribers || 0, total: (stats.enterpriseSubscribers || 0) * 199 },
                            ].map((row, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3 text-xs font-semibold">
                                    <div>
                                        <span className="text-slate-900 font-black">{row.plan}</span>
                                        <span className="text-slate-400 ml-2">({row.rate} × {row.count} Active)</span>
                                    </div>
                                    <span className="text-slate-900 font-black">₹{row.total.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">ESTIMATED RUNNING MRR</span>
                        <span className="text-xl font-black text-emerald-600">₹{(stats.monthlyRecurringRevenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {/* Global Billing Transaction Logs */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 text-base">Global Transaction Audit Logs</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">SaaS invoices and checkouts across all system tenants.</p>
                    </div>
                    <Receipt className="text-slate-400" size={20} />
                </div>

                {payments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-semibold text-sm">
                        No transactions registered yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Restaurant</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Transaction ID</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Plan</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Cycle</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Amount</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map(payment => (
                                    <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-600">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900">{payment.restaurantId?.name || 'Deleted Restaurant'}</span>
                                                <span className="text-[10px] text-slate-400">{payment.restaurantId?.contactEmail || ''}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-slate-500">{payment.transactionId}</td>
                                        <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-extrabold text-slate-800">{payment.planName}</td>
                                        <td className="p-4 capitalize">{payment.billingCycle}</td>
                                        <td className="p-4 font-black text-slate-900 text-right">₹{payment.amount.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                payment.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueAnalytics;
