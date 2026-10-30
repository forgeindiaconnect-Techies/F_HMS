import { useState, useEffect } from 'react';
import { 
    Sparkles, CheckCircle2, Clock, Users, Calendar, Filter, 
    ArrowUpRight, RefreshCw, AlertCircle, DollarSign, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const TipManagement = () => {
    const { api, restaurant } = useAuth();
    const [tips, setTips] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedWaiter, setSelectedWaiter] = useState('All');
    const [settling, setSettling] = useState(false);
    
    // Settlement modal
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [settleTarget, setSettleTarget] = useState(null); // specific waiter or all
    const [settleNotes, setSettleNotes] = useState('');
    const [settleRef, setSettleRef] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tipsRes, summaryRes] = await Promise.all([
                api.get('/tips'),
                api.get('/tips/summary')
            ]);
            setTips(tipsRes.data || []);
            setSummary(summaryRes.data || null);
        } catch (error) {
            console.error('Failed to load tips data:', error);
            toast.error(error.response?.data?.message || 'Failed to load tip transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [api]);

    const handleSettle = async () => {
        setSettling(true);
        try {
            const payload = {
                notes: settleNotes || 'Cashier end-of-shift payout',
                transactionReference: settleRef || `SETTLE-${Date.now()}`
            };
            if (settleTarget && settleTarget.waiterId) {
                payload.waiterId = settleTarget.waiterId;
            } else if (settleTarget && settleTarget.tipId) {
                payload.tipIds = [settleTarget.tipId];
            }

            const res = await api.post('/tips/settle', payload);
            toast.success(res.data.message || 'Tips settled successfully!');
            setIsSettleModalOpen(false);
            setSettleTarget(null);
            setSettleNotes('');
            setSettleRef('');
            await fetchData();
        } catch (err) {
            console.error('Failed to settle tips:', err);
            toast.error(err.response?.data?.message || 'Settlement failed');
        } finally {
            setSettling(false);
        }
    };

    const isTipsEnabled = restaurant?.restaurantConfig?.waiterTips?.enabled !== false;

    const filteredTips = tips.filter(t => {
        if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
        if (selectedWaiter !== 'All' && t.waiterId?._id !== selectedWaiter) return false;
        return true;
    });

    const uniqueWaiters = summary?.waiterSummary || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
                            Gratuity Accounting
                        </span>
                        {!isTipsEnabled && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                                Feature Disabled in Settings
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Waiter Tips & Gratuity Reports
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Isolated tip ledger stored separately from normal sales revenue. Track date-wise and waiter-wise earnings with verified settlement.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={fetchData}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button 
                        onClick={() => { setSettleTarget({}); setIsSettleModalOpen(true); }}
                        disabled={!summary?.totals?.pendingTips || summary.totals.pendingTips <= 0}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all"
                    >
                        <CheckCircle2 size={16} />
                        <span>Settle All Pending Tips</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gratuity Collected</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{Number(summary?.totals?.totalTips || 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 block">{summary?.totals?.totalCount || 0} tip transaction(s) recorded</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Payout to Staff</span>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        ₹{Number(summary?.totals?.pendingTips || 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 block">{summary?.totals?.pendingCount || 0} unverified/unsettled tip(s)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Verified Settled Tips</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{Number(summary?.totals?.settledTips || 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 block">{summary?.totals?.settledCount || 0} settled transactions</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Active Tip Earners</span>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {uniqueWaiters.length} Waiters
                    </div>
                    <span className="text-[11px] text-slate-500 block">Separated from restaurant revenue</span>
                </div>
            </div>

            {/* Waiter Wise Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={18} className="text-amber-500" /> Waiter-Wise Tip Summary
                    </h3>
                    <span className="text-xs text-slate-400 font-bold">Audited Staff Earnings</span>
                </div>

                {uniqueWaiters.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No waiter tips have been recorded yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Waiter / Staff</th>
                                    <th className="py-3 px-4">Total Tips</th>
                                    <th className="py-3 px-4">Pending</th>
                                    <th className="py-3 px-4">Settled</th>
                                    <th className="py-3 px-4">Count</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {uniqueWaiters.map((w, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                            {w.waiterName || 'Table Service Staff'}
                                            {w.employeeId && <span className="text-[10px] text-slate-400 font-normal ml-1.5">({w.employeeId})</span>}
                                        </td>
                                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">₹{w.totalAmount}</td>
                                        <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">₹{w.pendingAmount}</td>
                                        <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹{w.settledAmount}</td>
                                        <td className="py-3.5 px-4 text-slate-500">{w.tipCount}</td>
                                        <td className="py-3.5 px-4 text-right">
                                            {w.pendingAmount > 0 ? (
                                                <button
                                                    onClick={() => {
                                                        setSettleTarget({ waiterId: w.waiterId, waiterName: w.waiterName, pendingAmount: w.pendingAmount });
                                                        setIsSettleModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                                >
                                                    Settle ₹{w.pendingAmount}
                                                </button>
                                            ) : (
                                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                                    Fully Settled
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Individual Tip Transactions Ledger */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b dark:border-slate-800">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Tip Transaction History
                        </h3>
                        <p className="text-xs text-slate-400">Every customer tip logged with payment method and settlement stamp</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status Filter */}
                        <select 
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending Only</option>
                            <option value="Settled">Settled Only</option>
                        </select>
                    </div>
                </div>

                {filteredTips.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                        No tip transactions matching the filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Table / Order</th>
                                    <th className="py-3 px-4">Assigned Waiter</th>
                                    <th className="py-3 px-4">Tip Amount</th>
                                    <th className="py-3 px-4">Tender</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Settlement Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {filteredTips.map((tip) => (
                                    <tr key={tip._id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                        <td className="py-3.5 px-4 text-slate-500">
                                            {new Date(tip.date || tip.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                            Table {tip.tableNumber || tip.orderId?.tableNumber || 'Any'}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                                            {tip.waiterId?.name || tip.waiterName || 'Table Waiter'}
                                        </td>
                                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                                            ₹{tip.amount}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                                {tip.paymentMethod || 'Online'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                tip.status === 'Settled'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                            }`}>
                                                {tip.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                                            {tip.status === 'Settled' ? (
                                                <span>Settled on {new Date(tip.settledAt).toLocaleDateString()} {tip.settledBy ? `by ${tip.settledBy.name || 'Admin'}` : ''}</span>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSettleTarget({ tipId: tip._id, amount: tip.amount, waiterName: tip.waiterName });
                                                        setIsSettleModalOpen(true);
                                                    }}
                                                    className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                                                >
                                                    Mark Settled
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Settle Modal */}
            {isSettleModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" size={20} />
                                Record Tip Settlement
                            </h3>
                            <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            {settleTarget?.waiterName ? (
                                <span>Settling pending tips of <strong>₹{settleTarget.pendingAmount || settleTarget.amount}</strong> for <strong>{settleTarget.waiterName}</strong>.</span>
                            ) : (
                                <span>Settling all pending verified tips for your restaurant floor staff.</span>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                                    Settlement Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={settleRef}
                                    onChange={(e) => setSettleRef(e.target.value)}
                                    placeholder="e.g. CASH-PAYOUT-OCT26 or UTR / Bank Slip"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                                    Notes / Audit Memo
                                </label>
                                <textarea
                                    value={settleNotes}
                                    onChange={(e) => setSettleNotes(e.target.value)}
                                    placeholder="e.g. Paid in cash at end of dinner service by cashier"
                                    rows={2}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsSettleModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSettle}
                                disabled={settling}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all"
                            >
                                <Check size={16} />
                                <span>{settling ? 'Recording...' : 'Confirm Settlement'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TipManagement;
