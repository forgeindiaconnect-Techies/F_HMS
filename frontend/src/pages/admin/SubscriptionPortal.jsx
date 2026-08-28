import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    CreditCard, CheckCircle, AlertTriangle, ShieldCheck, Loader2, 
    CheckCircle2, AlertCircle, Sparkles, Receipt, HelpCircle, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

const SaaS_FEATURES = [
    // Operations
    { key: 'Restaurant Management', category: 'Operations', desc: 'Define layouts, menu configurations, order flows.' },
    { key: 'Menu Management', category: 'Operations', desc: 'Set up menu items, pricing, custom categories.' },
    { key: 'QR Digital Menu', category: 'Operations', desc: 'Enable guests to order or view menus by scan.' },
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
    const { user, api } = useAuth();
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
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSelectPlan = async (plan) => {
        const sub = restaurant?.subscription || {};
        const isDowngrade = (plan.name === 'Basic' && sub.plan === 'Pro') || 
                            (plan.name === 'Basic' && sub.plan === 'Enterprise') ||
                            (plan.name === 'Pro' && sub.plan === 'Enterprise');
        
        if (isDowngrade) {
            // Process Downgrade immediately (scheduled for next cycle)
            if (window.confirm(`Are you sure you want to downgrade to the ${plan.name} plan? This downgrade will be scheduled to take effect at the end of your current billing period (${new Date(sub.expiryDate).toLocaleDateString()}).`)) {
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
        
        // Calculate upgrade pricing calculations
        const targetPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
        const currentPrice = sub.price || 0;
        
        const now = new Date();
        const expiry = sub.expiryDate ? new Date(sub.expiryDate) : now;
        const totalDuration = sub.billingCycle === 'yearly' ? 365 : 30;
        const remainingDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
        const remainingCredit = Math.floor((currentPrice / totalDuration) * remainingDays);
        const chargeAmount = Math.max(0, targetPrice - remainingCredit);

        setUpgradeSummary({
            targetPrice,
            currentPrice,
            remainingDays,
            remainingCredit,
            chargeAmount
        });

        // Fetch live scannable UPI / Razorpay QR code data
        try {
            const qrRes = await api.post('/restaurants/mine/razorpay-qr', {
                planName: plan.name,
                billingCycle: billingCycle
            });
            setQrData(qrRes.data);
        } catch (e) {
            console.error("Failed to generate subscription QR code", e);
        }

        setShowCheckoutModal(true);
    };

    const handleConfirmQRPayment = async () => {
        setIsSubmitting(true);
        setPaymentStatus('processing');
        try {
            const res = await api.post('/restaurants/mine/confirm-qr-payment', {
                planName: selectedPlanToBuy.name,
                billingCycle: billingCycle,
                refId: qrData?.refId || `PAY-QR-${Date.now()}`
            });
            setPaymentStatus('success');
            toast.success(res.data.message || "Subscription activated via QR Payment!");
            setTimeout(() => {
                setShowCheckoutModal(false);
                fetchData();
            }, 1200);
        } catch (error) {
            console.error("QR confirmation failed", error);
            setPaymentStatus('failed');
            toast.error(error.response?.data?.message || "Failed to confirm QR payment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleConfirmPayment = async () => {
        setIsSubmitting(true);
        setPaymentStatus('processing');
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Razorpay SDK failed to load. Please check your network.");
                setPaymentStatus('failed');
                setIsSubmitting(false);
                return;
            }

            // 1. Create Razorpay order via backend
            const { data: orderData } = await api.post('/restaurants/mine/razorpay-order', {
                planName: selectedPlanToBuy.name,
                billingCycle: billingCycle
            });

            const razorpayKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SlbQBi57McKtUc';

            // 2. Configure Razorpay popup options
            const options = {
                key: razorpayKey,
                amount: orderData.amountPaise,
                currency: orderData.currency || 'INR',
                name: 'RestoSys SaaS Platform',
                description: `${selectedPlanToBuy.name} Subscription (${billingCycle})`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        setPaymentStatus('processing');
                        const verifyRes = await api.post('/restaurants/mine/razorpay-verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planName: selectedPlanToBuy.name,
                            billingCycle: billingCycle
                        });
                        setPaymentStatus('success');
                        toast.success(verifyRes.data.message || "Subscription activated successfully via Razorpay!");
                        setTimeout(() => {
                            setShowCheckoutModal(false);
                            fetchData();
                            window.location.reload();
                        }, 1200);
                    } catch (verifyErr) {
                        console.error("Verification failed", verifyErr);
                        setPaymentStatus('failed');
                        toast.error("Payment verification failed: " + (verifyErr.response?.data?.message || verifyErr.message));
                    }
                },
                prefill: {
                    name: user?.name || restaurant?.name || 'Restaurant Admin',
                    email: user?.email || restaurant?.contactEmail || 'admin@restosys.com',
                    contact: restaurant?.phone || '9999999999'
                },
                theme: {
                    color: '#4f46e5'
                },
                modal: {
                    ondismiss: function() {
                        setIsSubmitting(false);
                        setPaymentStatus('idle');
                        toast('Payment window closed.', { icon: 'ℹ️' });
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error("Payment init failed", error);
            setPaymentStatus('failed');
            toast.error(error.response?.data?.message || "Payment initialization failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!restaurant) {
        return <div className="p-8 text-center text-slate-500">No restaurant data found.</div>;
    }

    const sub = restaurant.subscription || {};
    const isExpired = sub.expiryDate && new Date(sub.expiryDate) < new Date();
    const isActive = sub.status === 'Active' && !isExpired;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">SaaS Subscription & Access Control</h2>
                <p className="text-slate-500 text-sm font-medium">Upgrade plans, view invoice histories, and track locks dynamically.</p>
            </div>

            {/* Expired / Downgrade Warnings */}
            {isExpired && (
                <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 flex items-start gap-4">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
                    <div className="space-y-1">
                        <h3 className="text-red-800 font-black text-base">Subscription Expired</h3>
                        <p className="text-red-600 text-sm leading-relaxed font-semibold">Your plan expired on {new Date(sub.expiryDate).toLocaleDateString()}. Advanced features are currently locked. Please renew or upgrade below to restore operations.</p>
                    </div>
                </div>
            )}

            {sub.downgradeScheduledPlan && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={24} />
                    <div className="space-y-1">
                        <h3 className="text-amber-800 font-black text-base">Downgrade Scheduled</h3>
                        <p className="text-amber-600 text-sm leading-relaxed font-semibold">
                            You have scheduled a downgrade to the <strong>{sub.downgradeScheduledPlan}</strong> plan. 
                            Your current features remain unlocked until your billing period ends on <strong>{new Date(sub.downgradeScheduledDate).toLocaleDateString()}</strong>.
                        </p>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg border border-indigo-900/30">
                    <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">ACTIVE PLAN</span>
                                <h3 className="text-3xl font-black mt-1 font-sans">{sub.plan || 'Basic'}</h3>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-inner ${
                                isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                            }`}>
                                {isActive ? 'Active' : 'Inactive / Expired'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-white/10">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Billing Cycle</span>
                                <span className="font-extrabold capitalize text-sm">{sub.billingCycle || 'Monthly'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Price</span>
                                <span className="font-extrabold text-sm">₹{(sub.price || 0).toLocaleString('en-IN')}/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Expiry Date</span>
                                <span className="font-extrabold text-sm">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Start Date</span>
                                <span className="font-extrabold text-sm">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Limits Card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between gap-6">
                    <div>
                        <h4 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2">
                            <Sparkles className="text-indigo-600" size={18} />
                            Plan Quotas & Limits
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <span className="text-xs font-semibold text-slate-500">Branch Limit</span>
                                <span className="text-sm font-black text-slate-900">
                                    {(sub.plan === 'Basic' || sub.plan === 'Starter') ? '1 Branch' : (sub.plan === 'Pro' || sub.plan === 'Professional') ? '3 Branches' : 'Unlimited'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <span className="text-xs font-semibold text-slate-500">Staff Limit</span>
                                <span className="text-sm font-black text-slate-900">
                                    {sub.plan === 'Basic' ? '5 Accounts' : 'Unlimited'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">Support Level</span>
                                <span className="text-sm font-black text-slate-900">
                                    {sub.plan === 'Basic' ? 'Basic Email' : sub.plan === 'Pro' ? 'Priority 24/7' : 'Dedicated Agent'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const found = plans.find(p => p.name === sub.plan);
                            if (found) handleSelectPlan(found);
                        }}
                        className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                    >
                        Renew Subscription
                    </button>
                </div>
            </div>

            {/* Plans List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-base">Select Subscription Plan</h3>
                    
                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                                billingCycle === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
                                billingCycle === 'yearly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Yearly
                            <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-black">SAVE 15%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
                        const isCurrent = sub.plan === plan.name;
                        const isEnterprise = plan.name === 'Enterprise';

                        return (
                            <div key={plan._id} className={`bg-white rounded-3xl border-2 p-6 flex flex-col justify-between relative transition-all duration-300 ${
                                isCurrent && isActive
                                ? 'border-indigo-600 shadow-md shadow-indigo-50/50'
                                : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                            }`}>
                                {isEnterprise && (
                                    <div className="absolute top-4 right-4 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Popular
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg">{plan.name}</h4>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-3xl font-black text-slate-900">₹{price.toLocaleString('en-IN')}</span>
                                            <span className="text-xs text-slate-400 font-extrabold">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-2.5 pt-4 border-t border-slate-50">
                                        {plan.features.slice(0, 6).map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={isSubmitting}
                                    className={`w-full py-3 rounded-2xl font-black text-xs transition-all mt-6 ${
                                        isCurrent && isActive
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 cursor-default'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow shadow-indigo-100'
                                    }`}
                                >
                                    {isCurrent && isActive ? 'Your Current Plan' : 'Select Plan'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Feature Access Lock Matrix */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div>
                    <h3 className="font-black text-slate-900 text-base">Plan Feature Matrix</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Check which modules are unlocked or locked in your current tier.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SaaS_FEATURES.map(feat => {
                        const planObj = plans.find(p => p.name === sub.plan);
                        const isUnlocked = planObj?.features.includes(feat.key) || 
                                           (!planObj && ['Restaurant Management', 'Menu Management', 'QR Digital Menu', 'Order Management', 'Basic Inventory', 'Basic Reports', 'Customer Support'].includes(feat.key));

                        return (
                            <div key={feat.key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-slate-900">{feat.key}</span>
                                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm">{feat.desc}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isUnlocked 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                                }`}>
                                    {isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Billing & Invoice History */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-slate-900 text-base">Billing & Invoice History</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Transactional log of billing payments made to the platform.</p>
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
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Transaction ID</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Plan</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider">Cycle</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Amount</th>
                                    <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {billingHistory.map(payment => (
                                    <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-600">
                                        <td className="p-4 font-black text-slate-900">{payment.transactionId}</td>
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

            {/* Checkout UPI Simulator Modal */}
            {showCheckoutModal && selectedPlanToBuy && upgradeSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
                        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-900 mb-1">Confirm Subscription Update</h3>
                            <p className="text-xs text-slate-400 font-semibold">Verify upgrade differences before scanner verification</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span>Target Plan Tier</span>
                                    <span className="font-black text-slate-800">{selectedPlanToBuy.name} ({billingCycle})</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span>Standard Pricing</span>
                                    <span className="font-black text-slate-800">₹{upgradeSummary.targetPrice.toLocaleString('en-IN')}</span>
                                </div>
                                {upgradeSummary.remainingDays > 0 && (
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100/50 pt-2">
                                        <span>Pro-rata Refund ({upgradeSummary.remainingDays} days)</span>
                                        <span className="font-extrabold text-emerald-600">- ₹{upgradeSummary.remainingCredit.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                <span className="text-xs font-black text-indigo-700">Total Payable Amount</span>
                                <span className="text-lg font-black text-indigo-900">₹{upgradeSummary.chargeAmount.toLocaleString('en-IN')}</span>
                            </div>

                            {paymentStatus === 'idle' && (
                                <div className="flex flex-col items-center gap-4 py-2 text-center">
                                    {/* Live Scannable QR Card */}
                                    <div className="w-full bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-3 relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">SCAN & PAY WITH ANY UPI APP</span>
                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">● LIVE QR</span>
                                        </div>

                                        <div className="w-44 h-44 bg-white p-2.5 rounded-2xl mx-auto shadow-inner flex items-center justify-center">
                                            {qrData?.qrImageUrl ? (
                                                <img 
                                                    src={qrData.qrImageUrl} 
                                                    alt="Razorpay Live UPI Subscription QR" 
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                                            )}
                                        </div>

                                        <div className="text-center space-y-1">
                                            <p className="text-xs text-slate-300 font-bold">Scan using Google Pay, PhonePe, Paytm, CRED or BHIM</p>
                                            <p className="text-[10px] text-slate-400">Ref: {qrData?.refId || 'SUB-RAZORPAY-LIVE'}</p>
                                        </div>

                                        <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-800">
                                            <span className="text-[9px] bg-white/10 text-slate-300 font-extrabold px-2 py-0.5 rounded-full">GPay</span>
                                            <span className="text-[9px] bg-white/10 text-slate-300 font-extrabold px-2 py-0.5 rounded-full">PhonePe</span>
                                            <span className="text-[9px] bg-white/10 text-slate-300 font-extrabold px-2 py-0.5 rounded-full">Paytm</span>
                                            <span className="text-[9px] bg-white/10 text-slate-300 font-extrabold px-2 py-0.5 rounded-full">BHIM UPI</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleConfirmQRPayment}
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} /> I Have Paid via QR (Verify & Activate Live)
                                    </button>
                                </div>
                            )}

                            {paymentStatus === 'processing' && (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <Loader2 className="animate-spin text-indigo-600" size={36} />
                                    <p className="text-sm font-black text-slate-600">Verifying live payment status...</p>
                                </div>
                            )}

                            {paymentStatus === 'success' && (
                                <div className="flex flex-col items-center gap-3 py-10 text-emerald-500">
                                    <CheckCircle2 size={44} className="fill-emerald-500 text-white animate-in zoom-in" />
                                    <p className="text-base font-black text-emerald-600">Subscription Activated Live!</p>
                                </div>
                            )}

                            {paymentStatus === 'failed' && (
                                <div className="flex flex-col items-center gap-3 py-10 text-red-500">
                                    <AlertCircle size={44} className="fill-red-500 text-white animate-in zoom-in" />
                                    <p className="text-base font-black text-red-600">Verification Failed</p>
                                </div>
                            )}
                        </div>

                        {paymentStatus === 'idle' && (
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <button 
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="w-1/3 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmPayment}
                                    className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                >
                                    <CreditCard size={16} /> Pay via Razorpay Popup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPortal;
