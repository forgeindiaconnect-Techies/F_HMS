import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { buildDummyUpiQrUrl, confirmDummyQRSubscriptionPayment } from '../../utils/subscriptionClient';
import {
    CreditCard, QrCode, CheckCircle, AlertTriangle, ShieldCheck, Loader2,
    CheckCircle2, AlertCircle, Sparkles, Receipt, HelpCircle, ArrowRight,
    Clock, ShieldAlert, XCircle, LifeBuoy, Zap, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const SaaS_FEATURES = [
    // Operations
    { key: 'Restaurant Management', category: 'Operations', desc: 'Define layouts, menu configurations, order flows.' },
    { key: 'Menu Management', category: 'Operations', desc: 'Set up menu items, pricing, custom categories.' },
    { key: 'QR Digital Menu', category: 'Operations', desc: 'Enable guests to order or view menus by scan.' },
    { key: 'Kitchen Order Ticket (KOT)', category: 'Operations', desc: 'Kitchen order ticket generation, station routing, and physical print.' },
    { key: 'Kitchen Display System (KDS)', category: 'Operations', desc: 'Real-time interactive digital kitchen order screens for chefs.' },
    { key: 'Waiter Tips & Gratuity', category: 'Operations', desc: 'Tip recording, customer QR tipping, and waiter tip settlements.' },
    { key: 'Online Payment Gateway', category: 'Operations', desc: 'Accept direct credit/debit cards and online gateway payments.' },
    { key: 'Order Management', category: 'Operations', desc: 'Processes counter orders, takeaways, deliveries.' },
    { key: 'Multi-Branch Management', category: 'Operations', desc: 'Create, monitor and track multiple branches.' },
    { key: 'Advanced Staff Management', category: 'Operations', desc: 'Detailed permissions, roles, and shift check-ins.' },
    { key: 'Delivery Partner Management', category: 'Operations', desc: 'Assign and track real-time delivery orders.' },
    { key: 'Advanced Order Analytics', category: 'Operations', desc: 'Track sales performance, hourly volumes, and payment status.' },
    { key: 'Advanced Table Management', category: 'Operations', desc: 'Manage reservations, table occupancy, and layout grids.' },

    // Inventory
    { key: 'Raw Materials', category: 'Inventory', desc: 'Track stock of raw ingredients and recipe items.' },
    { key: 'Stock Levels', category: 'Inventory', desc: 'Real-time monitoring of quantity on hand.' },
    { key: 'Low Stock Alerts', category: 'Inventory', desc: 'Automatic email and system notifications when stock is low.' },
    { key: 'Expiry Tracking', category: 'Inventory', desc: 'Trace perishables and track shelf life expiration.' },
    { key: 'Purchase Orders', category: 'Inventory', desc: 'Create procurement workflows and orders for vendors.' },
    { key: 'Vendor Management', category: 'Inventory', desc: 'Manage suppliers, contacts, and historical prices.' },
    { key: 'Stock Transfer', category: 'Inventory', desc: 'Transfer stock items safely between branch outlets.' },
    { key: 'Waste Management', category: 'Inventory', desc: 'Log daily food wastage logs, values and sources.' },

    // Reports & Analytics
    { key: 'Sales Reports', category: 'Reports & Analytics', desc: 'Basic sales reports and daily sales tracking.' },
    { key: 'Profit & Loss', category: 'Reports & Analytics', desc: 'Compute operational profitability metrics.' },
    { key: 'Inventory Reports', category: 'Reports & Analytics', desc: 'Historical consumption and valuation reports.' },
    { key: 'Staff Performance', category: 'Reports & Analytics', desc: 'Track staff order count, speed, and accuracy.' },
    { key: 'Customer Analytics', category: 'Reports & Analytics', desc: 'Analyze purchase frequency and preferences.' },
    { key: 'Order Analytics', category: 'Reports & Analytics', desc: 'Detailed hourly, category, and payment report metrics.' },
    { key: 'Tax Reports', category: 'Reports & Analytics', desc: 'Generate reports for SGST/CGST and service tax audits.' },
    { key: 'PDF Export', category: 'Reports & Analytics', desc: 'Export reports to PDF format.' },
    { key: 'Excel Export', category: 'Reports & Analytics', desc: 'Export reports to CSV/Excel format.' },

    // Customer Management
    { key: 'Advanced Customer Analytics', category: 'Customer Management', desc: 'Deconstruct lifetime values and loyalty.' },
    { key: 'Customer Segmentation', category: 'Customer Management', desc: 'Categorize customers by frequency, spending, and tags.' },
    { key: 'Customer Complaints', category: 'Customer Management', desc: 'Manage guest complaints and resolution tracking.' },
    { key: 'Refund Requests', category: 'Customer Management', desc: 'Initiate and manage order refund workflows.' },
    { key: 'Ticket History', category: 'Customer Management', desc: 'Review completed support interactions.' },

    // Subscription
    { key: 'Upgrade/Downgrade', category: 'Subscription', desc: 'Change plans dynamically with pro-rata refunds.' },
    { key: 'Billing History', category: 'Subscription', desc: 'Audit invoices and platform payments.' },
    { key: 'Payment History', category: 'Subscription', desc: 'Review complete list of transactions.' },
    { key: 'Renewal', category: 'Subscription', desc: 'Renew your subscription before plan expiry.' },
    { key: 'Feature Access', category: 'Subscription', desc: 'Control permission locks on specific features.' },

    // Advanced Enterprise Features
    { key: 'Advanced AI Insights', category: 'AI Tools (Enterprise)', desc: 'AI-generated platform improvement insights.' },
    { key: 'Sales Prediction', category: 'AI Tools (Enterprise)', desc: 'Forecast sales using machine learning.' },
    { key: 'Inventory Forecast', category: 'AI Tools (Enterprise)', desc: 'AI forecasts for ingredient depletion.' },
    { key: 'Demand Forecast', category: 'AI Tools (Enterprise)', desc: 'Predict high-demand menu items.' },
    { key: 'Menu Recommendations', category: 'AI Tools (Enterprise)', desc: 'AI pricing and menu engineering tips.' },
    { key: 'Business Health Score', category: 'AI Tools (Enterprise)', desc: 'Calculate operational health index.' },
    { key: 'Live Chat / Priority Support', category: 'Support (Enterprise)', desc: 'Real-time chat with support agents.' },
];

const SubscriptionPortal = () => {
    const { user, api, fetchRestaurant, subscriptionState } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);

    // Switch state (monthly / yearly)
    const [billingCycle, setBillingCycle] = useState('monthly');

    // Checkout states
    const [selectedPlanToBuy, setSelectedPlanToBuy] = useState(null);
    const [upgradeSummary, setUpgradeSummary] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestingTrial, setRequestingTrial] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [restRes, plansRes, historyRes] = await Promise.all([
                api.get('/restaurants/mine'),
                api.get('/plans'),
                api.get('/restaurants/mine/billing-history')
            ]);
            setRestaurant(restRes.data);
            setPlans(plansRes.data || []);
            setBillingHistory(historyRes.data || []);

            if (restRes.data?.subscription?.billingCycle) {
                setBillingCycle(restRes.data.subscription.billingCycle);
            }
        } catch (error) {
            console.error("Failed to load subscription data", error);
            toast.error("Failed to load subscription details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [api]);

    // Handle Submitting 7-Day Free Trial Request
    const handleRequestTrial = async () => {
        if (requestingTrial) return;
        setRequestingTrial(true);
        try {
            const res = await api.post('/restaurants/trial-request', { plan: 'Pro' });
            toast.success(res.data.message || '7-Day Free Trial requested! Pending Super Admin approval.');
            await fetchData();
            if (fetchRestaurant) await fetchRestaurant();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit free trial request.');
        } finally {
            setRequestingTrial(false);
        }
    };

    const handleActivationSuccess = async (message) => {
        setPaymentStatus('success');
        toast.success(message || `Subscription to ${selectedPlanToBuy?.name || 'Plan'} activated!`);
        setShowCheckoutModal(false);
        setQrData(null);
        await fetchData();
        if (fetchRestaurant) await fetchRestaurant();
    };

    const handleSelectPlan = async (plan) => {
        const sub = restaurant?.subscription || {};
        if (subscriptionState?.isManualFrozen || sub.manualFreeze || sub.status === 'Frozen') {
            toast.error('This restaurant is administratively frozen. Please contact Support.');
            return;
        }
        if (subscriptionState?.isPendingApproval || sub.status === 'Pending Approval') {
            toast.error('Trial approval is pending Super Admin review.');
            return;
        }

        const isDowngrade = (plan.name === 'Basic' && sub.plan === 'Pro') ||
            (plan.name === 'Basic' && sub.plan === 'Enterprise') ||
            (plan.name === 'Pro' && sub.plan === 'Enterprise');

        if (isDowngrade) {
            if (window.confirm(`Are you sure you want to downgrade to the ${plan.name} plan? This downgrade will take effect at the end of your current period (${sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'next billing'}).`)) {
                try {
                    setIsSubmitting(true);
                    const res = await api.post('/restaurants/mine/downgrade', { planName: plan.name });
                    setRestaurant(res.data.restaurant);
                    toast.success(`Downgrade to ${plan.name} scheduled successfully.`);
                    fetchData();
                } catch (error) {
                    toast.error(error.response?.data?.message || "Failed to schedule downgrade.");
                } finally {
                    setIsSubmitting(false);
                }
            }
            return;
        }

        // It is an Upgrade or Renewal
        setSelectedPlanToBuy(plan);
        setPaymentStatus('idle');
        setQrData(null);

        const targetPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
        const currentPrice = sub.price || 0;

        const now = new Date();
        const expiry = sub.subscriptionEndDate || sub.expiryDate ? new Date(sub.subscriptionEndDate || sub.expiryDate) : now;
        const totalDuration = sub.billingCycle === 'yearly' ? 365 : 30;
        const remainingDays = sub.paymentStatus === 'Paid'
            ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)))
            : 0;
        const remainingCredit = Math.floor((currentPrice / totalDuration) * remainingDays);
        const chargeAmount = Math.max(0, targetPrice - remainingCredit);

        setUpgradeSummary({
            targetPrice,
            currentPrice,
            remainingDays,
            remainingCredit,
            chargeAmount
        });

        setShowCheckoutModal(true);
        setQrLoading(false);

        const refId = `QR-SUB-${Date.now().toString().slice(-6)}`;
        setQrData({
            qrCodeId: refId,
            refId,
            qrImageUrl: buildDummyUpiQrUrl({
                amount: chargeAmount,
                label: `${plan.name} Plan (${billingCycle})`
            })
        });
    };

    const handleConfirmDummyQRPayment = async () => {
        if (!selectedPlanToBuy || isSubmitting) return;
        setIsSubmitting(true);
        setPaymentStatus('processing');
        await confirmDummyQRSubscriptionPayment({
            api,
            planName: selectedPlanToBuy.name,
            billingCycle,
            refId: qrData?.refId,
            onSuccess: async (data) => {
                setIsSubmitting(false);
                await handleActivationSuccess(data?.message);
            },
            onFailure: () => {
                setIsSubmitting(false);
                setPaymentStatus('failed');
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
        );
    }

    if (!restaurant) {
        return <div className="p-8 text-center text-slate-500">No restaurant data found.</div>;
    }

    const sub = restaurant.subscription || {};
    const now = new Date();

    // Status helpers
    const isManualFrozen = sub.manualFreeze || sub.status === 'Frozen';
    const isPendingApproval = sub.status === 'Pending Approval';
    const isRejected = sub.status === 'Rejected';
    const isTrialActive = Boolean(sub.trialActive && sub.trialEndDate && now <= new Date(sub.trialEndDate));
    const isTrialExpired = Boolean(sub.trialActive && sub.trialEndDate && now > new Date(sub.trialEndDate)) || (sub.status === 'Expired' && sub.paymentStatus === 'Trial');
    const isPaidExpired = Boolean(sub.paymentStatus === 'Paid' && sub.subscriptionEndDate && now > new Date(sub.subscriptionEndDate)) || (sub.status === 'Expired' && sub.paymentStatus === 'Paid');
    const isPaidActive = Boolean((sub.paymentStatus === 'Paid' || sub.status === 'Active') && !isPaidExpired && !isManualFrozen);
    const hasUsedTrial = Boolean(sub.trialStartDate || sub.trialActive || sub.paymentStatus === 'Trial');

    // Trial countdown calculations
    let trialDaysLeft = 0;
    let trialHoursLeft = 0;
    let isExpiringSoon = false;
    if (isTrialActive && sub.trialEndDate) {
        const diffMs = new Date(sub.trialEndDate).getTime() - now.getTime();
        trialDaysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        trialHoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        isExpiringSoon = diffMs <= 24 * 60 * 60 * 1000;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">SaaS Subscription & Plan Portal</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage your 7-day free trial, billing plans, and operational feature access.</p>
                </div>
            </div>

            {/* DYNAMIC SUBSCRIPTION STATUS BANNER (9 UI STATES) */}
            {isManualFrozen && (
                <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex items-start gap-4">
                    <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl shrink-0">
                        <ShieldAlert size={28} />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[11px] uppercase tracking-wider">
                            Dashboard Manually Frozen
                        </div>
                        <h3 className="text-lg font-black text-white">Administrative Hold Active</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {sub.freezeReason ? `Reason: ${sub.freezeReason}` : 'A Super Admin has temporarily placed an administrative freeze on your restaurant dashboard.'}
                        </p>
                        <p className="text-xs text-slate-400">All orders, products, and configurations are securely preserved. Please contact platform support.</p>
                    </div>
                </div>
            )}

            {isPendingApproval && (
                <div className="bg-amber-500 text-white rounded-3xl p-6 border border-amber-600 shadow-xl flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                        <Clock size={28} className="animate-spin" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider">
                            Pending Super Admin Approval
                        </div>
                        <h3 className="text-lg font-black text-white">7-Day Free Trial Request Submitted ⏳</h3>
                        <p className="text-sm text-amber-50 leading-relaxed font-medium">
                            Your free trial request was received on {sub.trialRequestDate ? new Date(sub.trialRequestDate).toLocaleString() : 'recently'}.
                            <strong> The 7-day countdown will begin only after Super Admin approval</strong>, guaranteeing you the full 7-day period.
                        </p>
                        <p className="text-xs text-amber-100">You will receive an email as soon as Super Admin verifies and activates your trial.</p>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="bg-rose-600 text-white rounded-3xl p-6 border border-rose-700 shadow-xl flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                        <XCircle size={28} />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider">
                            Request Not Approved
                        </div>
                        <h3 className="text-lg font-black text-white">Free Trial Request Rejected</h3>
                        <p className="text-sm text-rose-100 leading-relaxed font-medium">
                            {sub.rejectionReason ? `Reason: ${sub.rejectionReason}` : 'Documentation verification requirements could not be confirmed.'}
                        </p>
                        <p className="text-xs text-rose-200">You can choose one of the direct subscription plans below to unlock your dashboard immediately.</p>
                    </div>
                </div>
            )}

            {isTrialActive && (
                <div className={`${isExpiringSoon ? 'bg-gradient-to-r from-orange-600 to-amber-600' : 'bg-gradient-to-r from-emerald-600 to-teal-700'} text-white rounded-3xl p-6 shadow-xl flex items-start gap-4`}>
                    <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                        <Zap size={28} />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider">
                            {isExpiringSoon ? '⏰ Trial Expiring Soon (<24 Hours)' : '✓ 7-Day Free Trial Active'}
                        </div>
                        <h3 className="text-lg font-black text-white">
                            {isExpiringSoon ? `Only ${trialHoursLeft} Hours Remaining on Trial!` : `${trialDaysLeft} Days and ${trialHoursLeft} Hours Remaining`}
                        </h3>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">
                            Your approved trial provides full access to POS billing, kitchen KDS, menu, staff, and tables until <strong>{new Date(sub.trialEndDate).toLocaleDateString()} at {new Date(sub.trialEndDate).toLocaleTimeString()}</strong>.
                        </p>
                        {isExpiringSoon && (
                            <p className="text-xs text-amber-100 font-bold">
                                Upgrade to a paid plan now to avoid service interruption and dashboard freezing.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {(isTrialExpired || isPaidExpired) && (
                <div className="bg-red-600 text-white rounded-3xl p-6 border border-red-700 shadow-xl flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                        <Lock size={28} />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider">
                            Dashboard Frozen
                        </div>
                        <h3 className="text-lg font-black text-white">
                            {isTrialExpired ? '7-Day Free Trial Expired' : 'Paid Subscription Expired'}
                        </h3>
                        <p className="text-sm text-red-100 leading-relaxed font-medium">
                            Operational features are currently frozen. Select a plan below to immediately unfreeze your dashboard and resume operations. All your data is 100% safe.
                        </p>
                    </div>
                </div>
            )}

            {/* Current Plan Overview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg border border-slate-700">
                    <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">CURRENT PLAN</span>
                                <h3 className="text-3xl font-black mt-1 font-sans">
                                    {sub.plan || 'Free Trial'} {isTrialActive && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full ml-2">7-Day Trial</span>}
                                </h3>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-inner ${isPaidActive || isTrialActive
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : isPendingApproval
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                }`}>
                                {isManualFrozen ? 'Manually Frozen' : isPendingApproval ? 'Pending Approval' : isTrialActive ? 'Trial Active' : isPaidActive ? 'Paid Active' : 'Frozen / Inactive'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-white/10">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Status</span>
                                <span className="font-extrabold capitalize text-sm">{sub.paymentStatus || 'Trial'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Plan Price</span>
                                <span className="font-extrabold text-sm">
                                    {sub.paymentStatus === 'Trial' ? 'Free (₹0)' : `₹${(sub.price || 0).toLocaleString('en-IN')}`}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Trial / Expiry</span>
                                <span className="font-extrabold text-sm">
                                    {sub.trialEndDate ? new Date(sub.trialEndDate).toLocaleDateString() : (sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Awaiting Approval')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Approval Date</span>
                                <span className="font-extrabold text-sm">
                                    {sub.approvedAt ? new Date(sub.approvedAt).toLocaleDateString() : (isPendingApproval ? 'Pending' : 'N/A')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Free Trial / Quick Action Box */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm flex flex-col justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold text-xs mb-3">
                            <Sparkles size={14} /> 7-Day Free Trial
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg">
                            Try FoodNest Risk-Free
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                            Full access to POS, kitchen orders, inventory, and analytics. 7-day countdown begins strictly after Super Admin approval.
                        </p>
                    </div>

                    {!hasUsedTrial ? (
                        <button
                            onClick={handleRequestTrial}
                            disabled={requestingTrial}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {requestingTrial ? <Loader2 size={16} className="animate-spin" /> : 'Request 7-Day Free Trial'}
                            {!requestingTrial && <ArrowRight size={14} />}
                        </button>
                    ) : isPendingApproval ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-700 dark:text-amber-300">
                            ⏳ Trial Request Pending Approval
                        </div>
                    ) : isTrialActive ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            ✓ Trial Active ({trialDaysLeft}d {trialHoursLeft}h left)
                        </div>
                    ) : (
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/40 rounded-xl text-center text-xs font-bold text-slate-500">
                            Trial Utilized — Choose a Paid Plan
                        </div>
                    )}
                </div>
            </div>

            {/* Plans List & Pricing */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">Select Subscription Plan</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant activation & dashboard unlock upon payment verification.</p>
                    </div>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Yearly
                            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-black">SAVE 15%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                        const isCurrent = sub.plan === plan.name;
                        const isEnterprise = plan.name === 'Enterprise';

                        return (
                            <div key={plan._id} className={`bg-white dark:bg-slate-800 rounded-3xl border-2 p-6 flex flex-col justify-between relative transition-all duration-300 ${isCurrent && isPaidActive
                                ? 'border-orange-500 shadow-md shadow-orange-500/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                                }`}>
                                {isEnterprise && (
                                    <div className="absolute top-4 right-4 bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Popular
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg">{plan.name}</h4>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">₹{price.toLocaleString('en-IN')}</span>
                                            <span className="text-xs text-slate-400 font-extrabold">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                                        {plan.features.slice(0, 6).map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={isSubmitting}
                                    className={`w-full py-3 rounded-2xl font-black text-xs transition-all mt-6 cursor-pointer ${isCurrent && isPaidActive
                                        ? 'bg-orange-50 text-orange-600 border border-orange-200 cursor-default'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                                        }`}
                                >
                                    {isCurrent && isPaidActive ? 'Your Current Plan' : 'Select Plan & Unlock'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Feature Access Lock Matrix */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">Plan Feature Matrix</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Check which modules are unlocked or locked in your current tier.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SaaS_FEATURES.map(feat => {
                        const planObj = plans.find(p => p.name === sub.plan);
                        const isUnlocked = isTrialActive || (isPaidActive && (planObj?.features.includes(feat.key) || ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management'].includes(feat.key)));

                        return (
                            <div key={feat.key} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="space-y-0.5 min-w-0 pr-1.5 flex-1">
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{feat.key}</span>
                                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm">{feat.desc}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isUnlocked
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800'
                                    }`}>
                                    {isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Billing & Invoice History */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">Billing & Invoice History</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Audit log of subscription invoices and transactions.</p>
                    </div>
                    <Receipt className="text-slate-400" size={20} />
                </div>

                {billingHistory.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-semibold text-sm">
                        No transactions registered yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Transaction ID</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Plan</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Cycle</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Amount</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {billingHistory.map(payment => (
                                    <tr key={payment._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <td className="p-4 font-black text-slate-900 dark:text-slate-100">{payment.transactionId}</td>
                                        <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-extrabold">{payment.planName}</td>
                                        <td className="p-4 capitalize">{payment.billingCycle}</td>
                                        <td className="p-4 font-black text-slate-900 dark:text-slate-100 text-right">₹{payment.amount.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 border-rose-200'
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

            {/* Dummy QR Scanner Payment Modal */}
            {showCheckoutModal && selectedPlanToBuy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
                        <div className="text-center space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Activate {selectedPlanToBuy.name} Plan</h3>
                            <p className="text-xs text-slate-500 font-medium">Scan the UPI QR code below and confirm to activate your subscription immediately.</p>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700 text-xs">
                            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300">
                                <span>Plan &amp; Cycle:</span>
                                <span className="font-black text-slate-900 dark:text-slate-100">{selectedPlanToBuy.name} ({billingCycle})</span>
                            </div>
                            {upgradeSummary?.remainingCredit > 0 && (
                                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                    <span>Unused Plan Credit ({upgradeSummary.remainingDays} days):</span>
                                    <span>-₹{upgradeSummary.remainingCredit.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                                <span>Total Payable:</span>
                                <span className="text-base font-black text-orange-600">
                                    ₹{(upgradeSummary?.chargeAmount ?? (billingCycle === 'yearly' ? selectedPlanToBuy.yearlyPrice : selectedPlanToBuy.monthlyPrice)).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {paymentStatus === 'failed' && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                Payment confirmation failed. Please try again.
                            </div>
                        )}

                        {/* Dummy UPI QR Code Scanner */}
                        {qrData?.qrImageUrl && (
                            <div className="p-5 bg-orange-50/50 dark:bg-slate-800/80 rounded-2xl border border-orange-200 dark:border-orange-900/40 flex flex-col items-center gap-2.5">
                                <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                                    <img
                                        src={qrData.qrImageUrl}
                                        alt="UPI QR Scanner"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-[11px] font-mono text-slate-500">Ref: {qrData.refId}</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                                    Scan with any UPI app (GPay, PhonePe, Paytm) &amp; click Confirm below
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-1">
                            <button
                                onClick={() => {
                                    setShowCheckoutModal(false);
                                    setQrData(null);
                                }}
                                className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDummyQRPayment}
                                disabled={isSubmitting}
                                className="w-2/3 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> Activating Plan...</>
                                ) : (
                                    <><QrCode size={16} /> Confirm QR Payment &amp; Activate</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPortal;
