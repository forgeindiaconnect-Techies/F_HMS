import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Lock, CheckCircle, ArrowRight, RefreshCw,
    CreditCard, QrCode, Clock, ShieldAlert, LifeBuoy, XCircle, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { buildDummyUpiQrUrl, confirmDummyQRSubscriptionPayment } from '../utils/subscriptionClient';

const DEFAULT_FALLBACK_PLANS = [
    {
        _id: 'basic',
        name: 'Basic',
        monthlyPrice: 2999,
        yearlyPrice: 2399,
        description: 'Essential POS billing & QR ordering for single location restaurants.',
        features: ['1 Branch Location', 'Basic POS Billing', 'QR Table Ordering', 'Standard Reports', 'Email Support']
    },
    {
        _id: 'pro',
        name: 'Pro',
        monthlyPrice: 5999,
        yearlyPrice: 4799,
        description: 'Advanced KDS, inventory & multi-terminal billing for growing kitchens.',
        popular: true,
        features: ['Up to 3 Branches', 'Kitchen Display System (KDS)', 'Inventory & Stock Tracking', 'Online Ordering', 'Priority Support']
    },
    {
        _id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 12999,
        yearlyPrice: 10399,
        description: 'Unlimited branches, franchise control, AI insights & dedicated manager.',
        features: ['Unlimited Branches', 'Franchise & Central Kitchen', 'AI Sales Forecasting', 'Custom Webhooks & APIs', 'Dedicated Account Manager']
    }
];

const SubscriptionFreezeOverlay = ({ onUnfrozen }) => {
    const { api, fetchRestaurant, restaurant, user, logout, subscriptionState } = useAuth();

    const [isYearly, setIsYearly] = useState(false);
    const [plans, setPlans] = useState([]);
    const [submittingPlan, setSubmittingPlan] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [qrCheckoutPlan, setQrCheckoutPlan] = useState(null);

    const sub = restaurant?.subscription || {};
    const isOwner = subscriptionState?.isOwner;
    const isManualFrozen = Boolean(subscriptionState?.isManualFrozen);
    const isPending = Boolean(subscriptionState?.isPendingApproval);
    const isRejected = Boolean(subscriptionState?.isRejected);
    const isFailed = subscriptionState?.freezeType === 'failed';
    const isTrial = Boolean(subscriptionState?.isTrial);

    useEffect(() => {
        if (!isOwner) return;
        api.get('/plans')
            .then(res => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setPlans(res.data);
                }
            })
            .catch(() => {});
    }, [api, isOwner]);

    const displayPlans = plans.length > 0 ? plans : DEFAULT_FALLBACK_PLANS;

    const handleRefreshStatus = async () => {
        setRefreshing(true);
        try {
            const updated = await fetchRestaurant();
            if (updated?.subscription?.status === 'Active') {
                toast.success('Subscription status synced!');
                if (onUnfrozen) onUnfrozen();
            } else {
                toast('Status refreshed — still awaiting activation.', { icon: 'ℹ️' });
            }
        } finally {
            setRefreshing(false);
        }
    };

    const handleOpenQRScanner = (planItem) => {
        if (submittingPlan) return;
        const billingCycle = isYearly ? 'yearly' : 'monthly';
        const price = isYearly
            ? (planItem.yearlyPrice || planItem.monthlyPrice || 0)
            : (planItem.monthlyPrice || planItem.price || 0);
        const refId = `QR-UNFREEZE-${Date.now().toString().slice(-6)}`;
        setQrCheckoutPlan({
            planItem,
            billingCycle,
            price,
            refId,
            qrImageUrl: buildDummyUpiQrUrl({ amount: price, label: `${planItem.name} (${billingCycle})` })
        });
    };

    const handleConfirmQRUnlock = async () => {
        if (!qrCheckoutPlan || submittingPlan) return;
        setSubmittingPlan(qrCheckoutPlan.planItem.name);
        await confirmDummyQRSubscriptionPayment({
            api,
            planName: qrCheckoutPlan.planItem.name,
            billingCycle: qrCheckoutPlan.billingCycle,
            refId: qrCheckoutPlan.refId,
            onSuccess: async () => {
                setSubmittingPlan('');
                setQrCheckoutPlan(null);
                await fetchRestaurant();
                if (onUnfrozen) onUnfrozen();
            },
            onFailure: async () => {
                setSubmittingPlan('');
                await fetchRestaurant();
            }
        });
    };

    // Non-owner staff roles see a clean read-only hold screen without admin billing actions
    if (!isOwner) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
                <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-8 space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isPending
                            ? 'Trial Approval Pending'
                            : isManualFrozen
                            ? 'Restaurant Dashboard Frozen'
                            : 'Restaurant Subscription Expired'}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isPending
                            ? 'Your restaurant’s 7-day free trial is awaiting Super Admin approval. Operations will automatically unlock once approved.'
                            : isManualFrozen
                            ? (sub.freezeReason || 'An administrative hold was placed on this restaurant account. Please contact your Restaurant Owner.')
                            : 'Your restaurant’s subscription plan has expired. Please notify your Restaurant Owner / Admin to renew the subscription.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleRefreshStatus}
                            disabled={refreshing}
                            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Checking...' : 'Check Status'}
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const canSelfSubscribe = !isManualFrozen && !isPending;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col my-auto relative">

                {/* Contextual Header Banner */}
                {isManualFrozen ? (
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-zinc-900 p-7 sm:p-10 text-white">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-amber-300 font-extrabold text-xs uppercase tracking-wider border border-white/20">
                                    <ShieldAlert size={14} /> Administrative Hold
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    Dashboard Frozen by Super Admin
                                </h2>
                                <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                                    {sub.freezeReason ? `Reason: ${sub.freezeReason}` : 'An administrative freeze has been placed on this restaurant dashboard.'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    All your orders, inventory data, and settings remain safely preserved.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                                <Link
                                    to="/admin/support"
                                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <LifeBuoy size={16} /> Contact Support Desk
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleRefreshStatus}
                                    disabled={refreshing}
                                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Status
                                </button>
                            </div>
                        </div>
                    </div>
                ) : isPending ? (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-7 sm:p-10 text-white">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider border border-white/30">
                                    <Clock size={14} /> Free Trial Pending Super Admin Approval
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    Your 7-Day Free Trial is Under Review
                                </h2>
                                <p className="text-amber-50 text-sm sm:text-base max-w-2xl">
                                    Your free trial request has been submitted. <strong>The 7-day countdown begins only after Super Admin approval</strong>, ensuring you receive the full duration.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 min-w-[170px]">
                                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 block">Status</span>
                                    <span className="text-lg font-black text-white block mt-0.5">PENDING</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRefreshStatus}
                                    disabled={refreshing}
                                    className="py-2.5 px-4 rounded-xl bg-white text-amber-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Status
                                </button>
                            </div>
                        </div>
                    </div>
                ) : isRejected ? (
                    <div className="bg-gradient-to-r from-red-600 to-rose-700 p-7 sm:p-10 text-white">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider border border-white/30">
                                    <XCircle size={14} /> Trial Request Not Approved
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    Free Trial Request Was Not Approved
                                </h2>
                                <p className="text-red-100 text-sm sm:text-base max-w-2xl">
                                    {sub.rejectionReason ? `Reason: ${sub.rejectionReason}` : 'Documentation requirements could not be confirmed.'} Choose a paid plan below or contact support.
                                </p>
                            </div>
                            <Link
                                to="/admin/support"
                                className="px-5 py-3 rounded-xl bg-white text-red-600 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shrink-0"
                            >
                                <LifeBuoy size={16} /> Contact Support
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-7 sm:p-10 text-white">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider border border-white/30">
                                    <Lock size={14} /> {isFailed ? 'Last Payment Failed' : isTrial ? '7-Day Free Trial Expired' : 'Subscription Expired'}
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                                    Your Dashboard is Currently Frozen
                                </h2>
                                <p className="text-rose-100 text-sm sm:text-base max-w-2xl">
                                    {isFailed
                                        ? 'Your recent subscription payment did not succeed. Scan the QR code below to immediately unlock your dashboard.'
                                        : `Your ${isTrial ? '7-day free trial' : 'subscription'} has ended. Subscribe or renew below via UPI QR Scanner to restore POS, KDS, and all operations immediately.`}
                                </p>
                            </div>
                            <div className="shrink-0 bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-[150px]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-100 block">Status</span>
                                <span className="text-xl font-black text-white block mt-0.5">FROZEN</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plan Selection (Only when owner can pay to unlock/upgrade) */}
                {canSelfSubscribe && qrCheckoutPlan ? (
                    <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5 bg-slate-50/60 dark:bg-slate-900/60">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg max-w-md w-full space-y-4">
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                                Scan QR to Activate {qrCheckoutPlan.planItem.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Total Payable: <span className="font-black text-rose-600">₹{Number(qrCheckoutPlan.price).toLocaleString('en-IN')}</span> ({qrCheckoutPlan.billingCycle})
                            </p>
                            <div className="mx-auto w-48 h-48 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                                <img src={qrCheckoutPlan.qrImageUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-[11px] font-mono text-slate-500">Ref: {qrCheckoutPlan.refId}</p>
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    disabled={Boolean(submittingPlan)}
                                    onClick={() => setQrCheckoutPlan(null)}
                                    className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    disabled={Boolean(submittingPlan)}
                                    onClick={handleConfirmQRUnlock}
                                    className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    <QrCode size={16} />
                                    <span>{submittingPlan ? 'Activating...' : 'Confirm QR Payment & Unfreeze'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : canSelfSubscribe && (
                    <div className="p-6 sm:p-8 space-y-6 bg-slate-50/60 dark:bg-slate-900/60">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Select Subscription Plan to Activate</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant UPI QR Scanner activation. Unlocks all modules immediately.</p>
                            </div>

                            <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsYearly(false)}
                                    className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${!isYearly ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                                >
                                    Monthly Billing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsYearly(true)}
                                    className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${isYearly ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                                >
                                    Yearly Billing
                                    <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black">SAVE 20%</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                            {displayPlans.map((planItem, idx) => {
                                const price = isYearly
                                    ? (planItem.yearlyPrice || planItem.monthlyPrice || 0)
                                    : (planItem.monthlyPrice || planItem.price || 0);
                                const isPopular = planItem.popular || idx === 1;
                                const isPayingThis = submittingPlan === planItem.name;

                                return (
                                    <div
                                        key={planItem._id || idx}
                                        className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all border ${
                                            isPopular
                                                ? 'bg-white dark:bg-slate-800 border-rose-500 shadow-xl ring-2 ring-rose-500'
                                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                                                Most Popular
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{planItem.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                                                    {planItem.description || 'Complete tools for restaurant operations.'}
                                                </p>
                                            </div>

                                            <div className="py-2 border-y border-slate-100 dark:border-slate-700/60 flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                                                    ₹{Number(price).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    /{isYearly ? 'year' : 'month'}
                                                </span>
                                            </div>

                                            <ul className="space-y-2 pt-1">
                                                {(planItem.features || []).slice(0, 5).map((feat, fIdx) => (
                                                    <li key={fIdx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                type="button"
                                                disabled={Boolean(submittingPlan)}
                                                onClick={() => handleOpenQRScanner(planItem)}
                                                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                                                    isPopular
                                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white'
                                                }`}
                                            >
                                                <QrCode size={16} />
                                                <span>{isPayingThis ? 'Processing...' : 'Pay via UPI QR & Unfreeze'}</span>
                                                {!isPayingThis && <ArrowRight size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium px-6">
                    <span>UPI QR Scanner Checkout • Instant Activation upon confirmation</span>
                    <div className="flex items-center gap-4">
                        <Link to="/admin/billing" className="text-rose-600 hover:underline font-bold">Subscription Portal</Link>
                        <Link to="/admin/support" className="hover:underline">Contact Support</Link>
                        <button type="button" onClick={logout} className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer">
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionFreezeOverlay;
