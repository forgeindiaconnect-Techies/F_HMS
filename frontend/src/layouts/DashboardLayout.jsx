import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';
import { Sparkles, ArrowRight, X, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

// ─── Route → Feature Key Mapping ──────────────────────────────────────────────
// Maps each gated route path to the exact feature key string stored in
// Plan.features in MongoDB (as set by SuperAdmin in FeatureManagement).
// fallbackMinPlan is used ONLY while DB plans are still loading.
const ROUTE_FEATURE_MAP = [
    // Pro-tier features
    { path: '/admin/analytics',    featureKey: 'Sales Reports',                 fallbackMinPlan: 'Pro' },
    { path: '/admin/inventory',    featureKey: 'Stock Levels',                   fallbackMinPlan: 'Pro' },
    { path: '/admin/suppliers',    featureKey: 'Vendor Management',              fallbackMinPlan: 'Pro' },
    { path: '/admin/reservations', featureKey: 'Advanced Table Management',      fallbackMinPlan: 'Pro' },
    { path: '/admin/offers',       featureKey: 'Customer Segmentation',          fallbackMinPlan: 'Pro' },
    { path: '/admin/delivery',     featureKey: 'Delivery Partner Management',    fallbackMinPlan: 'Pro' },

    // Enterprise-tier features
    { path: '/admin/franchise',        featureKey: 'Multi-Branch Management',   fallbackMinPlan: 'Enterprise' },
    { path: '/admin/central-kitchen',  featureKey: 'Stock Transfer',            fallbackMinPlan: 'Enterprise' },
    { path: '/admin/developer-config', featureKey: 'Advanced AI Insights',      fallbackMinPlan: 'Enterprise' },
    { path: '/admin/audit-logs',       featureKey: 'Business Health Score',     fallbackMinPlan: 'Enterprise' },
    { path: '/admin/bi',               featureKey: 'Sales Prediction',          fallbackMinPlan: 'Enterprise' },
    // NOTE: /admin/support is available to ALL plans — no gating
];

// Fallback static hierarchy used only when DB plans haven't loaded yet
const PLAN_ORDER_FALLBACK = { Basic: 0, Starter: 0, Pro: 1, Professional: 1, Enterprise: 2 };

const DashboardLayout = () => {
    const { restaurant, api } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [showPlansModal, setShowPlansModal] = useState(false);
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');

    // Checkout / QR payment states
    const [selectedPlanToBuy, setSelectedPlanToBuy] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'scanning' | 'processing' | 'success' | 'failed'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Dynamic plan feature data loaded from DB ────────────────────────────────
    // `allPlans` holds the live plan objects (including .features arrays) from MongoDB.
    // This is the source of truth for feature gating — SuperAdmin changes here
    // are immediately reflected on next render after this fetch completes.
    const [allPlans, setAllPlans] = useState([]);
    const [plansDataLoaded, setPlansDataLoaded] = useState(false);

    // Load plan feature configs from DB once on mount
    useEffect(() => {
        api.get('/plans')
            .then(res => { setAllPlans(res.data || []); setPlansDataLoaded(true); })
            .catch(() => { setPlansDataLoaded(true); /* use fallback gating */ });
    }, [api]);

    // ── Dynamic feature gating check ───────────────────────────────────────────
    // Returns true if the restaurant's current plan grants access to a given feature.
    // When DB plans have loaded: checks plan.features array (DB-driven, respects SuperAdmin config).
    // While loading or if plan not found: falls back to static PLAN_ORDER_FALLBACK hierarchy.
    const planHasFeature = (planName, featureKey, fallbackMinPlan) => {
        if (plansDataLoaded && allPlans.length > 0) {
            const planObj = allPlans.find(
                p => p.name && planName && p.name.toLowerCase() === planName.toLowerCase()
            );
            if (planObj) {
                return Array.isArray(planObj.features) && planObj.features.includes(featureKey);
            }
        }
        // Fallback: use static plan hierarchy while data loads or if plan name not found in DB
        return (PLAN_ORDER_FALLBACK[planName] ?? 0) >= (PLAN_ORDER_FALLBACK[fallbackMinPlan] ?? 99);
    };

    const isUnverified = restaurant && restaurant.verificationStatus !== 'Verified';
    const isVerificationPage = location.pathname === '/admin/verification';

    const plan = restaurant?.subscription?.plan || 'Basic';
    // Default to 'Active' so features aren't locked if subscription status isn't set yet
    const status = restaurant?.subscription?.status || 'Active';

    // Find the first matching route in our feature map for the current path
    const routeBlock = ROUTE_FEATURE_MAP.find(r => location.pathname.startsWith(r.path));

    // isPathBlocked is true when:
    // 1. Subscription is not Active, OR
    // 2. The restaurant's plan does NOT have the required feature (checked against live DB)
    const isPathBlocked = routeBlock
        ? (status !== 'Active' || !planHasFeature(plan, routeBlock.featureKey, routeBlock.fallbackMinPlan))
        : false;

    // Human-readable display: show the featureKey as the locked feature name
    const blockedFeature = routeBlock?.featureKey || '';
    // For display purposes, determine what plan tier unlocks this feature
    const requiredPlan = (() => {
        if (!routeBlock) return 'Pro';
        if (plansDataLoaded && allPlans.length > 0) {
            // Find the lowest-tier plan that has this feature
            const sorted = [...allPlans].sort(
                (a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0)
            );
            const lowestUnlockingPlan = sorted.find(
                p => Array.isArray(p.features) && p.features.includes(routeBlock.featureKey)
            );
            return lowestUnlockingPlan?.name || routeBlock.fallbackMinPlan;
        }
        return routeBlock.fallbackMinPlan;
    })();

    const handleOpenPlans = async () => {
        setShowPlansModal(true);
        setSelectedPlanToBuy(null);
        setPaymentStatus('idle');
        // Always refresh plans from DB when opening the modal, and sync to allPlans too
        setPlansLoading(true);
        try {
            const res = await api.get('/plans');
            const freshPlans = res.data || [];
            setPlans(freshPlans);
            // Also keep allPlans (used for gating) in sync with latest DB data
            setAllPlans(freshPlans);
        } catch (err) {
            console.error("Failed to load plans modal data", err);
            // Only set fallback plans for the modal display if we have no data at all
            if (plans.length === 0) {
                setPlans([
                    { _id: 'p1', name: 'Basic', monthlyPrice: 4999, yearlyPrice: 3999, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'] },
                    { _id: 'p2', name: 'Pro', monthlyPrice: 9999, yearlyPrice: 7999, features: ['Up to 3 Branches', 'Inventory & Waste Ops', 'Delivery Management', 'Sales Analytics', '24/7 Support'] },
                    { _id: 'p3', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 15999, features: ['Unlimited Branches', 'Business Intelligence AI', 'Franchise & Central Kitchen', 'White-Label APIs', 'Dedicated Support'] }
                ]);
            }
        } finally {
            setPlansLoading(false);
        }
    };

    const handleSelectPlanToUpgrade = (p) => {
        setSelectedPlanToBuy(p);
        setPaymentStatus('idle');
    };

    const handleConfirmPayment = async () => {
        if (!selectedPlanToBuy) return;
        setIsSubmitting(true);
        setPaymentStatus('processing');

        try {
            const res = await api.post('/restaurants/mine/upgrade', {
                planName: selectedPlanToBuy.name,
                billingCycle: billingCycle
            });

            setTimeout(() => {
                setPaymentStatus('success');
                setTimeout(() => {
                    setShowPlansModal(false);
                    // Reload to immediately refresh Auth context and un-gate page
                    window.location.reload();
                }, 1200);
            }, 1500);
        } catch (error) {
            console.error("Upgrade payment error", error);
            setPaymentStatus('failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Topbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 relative">
                    {isUnverified && !isVerificationPage ? (
                       <VerificationBlockedOverlay />
                    ) : (
                       <div className="relative w-full h-full min-h-[60vh]">
                           {isPathBlocked && (
                               <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[5px] rounded-3xl p-6">
                                   <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white/50 dark:border-slate-800 max-w-md w-full text-center flex flex-col items-center gap-5 transform animate-in zoom-in-95 duration-300">
                                       <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
                                           <Sparkles size={28} />
                                       </div>
                                       <div className="space-y-1">
                                           <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Upgrade Plan to Access</h3>
                                           <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                               The module <strong>{blockedFeature}</strong> is gated and requires a premium subscription.
                                           </p>
                                       </div>
                                       <div className="flex flex-wrap gap-2 justify-center py-2">
                                           <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                               Current: {plan}
                                           </span>
                                           <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                               Required: {requiredPlan}
                                           </span>
                                       </div>
                                       <button
                                           onClick={handleOpenPlans}
                                           className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                       >
                                           Upgrade Subscription <ArrowRight size={16} />
                                       </button>
                                   </div>
                               </div>
                           )}
                           <div className={isPathBlocked ? 'blur-[8px] pointer-events-none select-none transition-all duration-300' : 'transition-all duration-300'}>
                               <Outlet />
                           </div>
                       </div>
                    )}
                </main>
            </div>

            {/* Plans Selection Overlay Modal */}
            {showPlansModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        {/* Header */}
                        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">SUBSCRIPTION PLANS</span>
                                <h3 className="text-2xl font-black mt-0.5">Upgrade Your Restaurant Plan</h3>
                                <p className="text-xs text-slate-300 font-medium mt-1">Select a plan tier below to unlock gated enterprise modules and features.</p>
                            </div>
                            <button 
                                onClick={() => setShowPlansModal(false)}
                                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Toggle Billing Cycle */}
                        <div className="flex items-center justify-between px-8 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Choose Billing Period:</span>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                                        billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                                        billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Yearly
                                    <span className="text-[9px] bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-black">SAVE 15%</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: Either Plans Grid OR QR Code Checkout */}
                        {selectedPlanToBuy ? (
                            /* QR Code Payment Checkout Screen */
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95">
                                <button 
                                    onClick={() => setSelectedPlanToBuy(null)} 
                                    className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 self-start inline-flex items-center gap-1"
                                >
                                    &larr; Back to Plans
                                </button>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                                        Scan UPI QR Code to Activate
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                                        {selectedPlanToBuy.name} Plan ({billingCycle})
                                    </h3>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                        Total Amount Payable: <span className="text-slate-900 dark:text-white font-black text-lg">₹{((billingCycle === 'yearly' ? (selectedPlanToBuy.yearlyPrice || selectedPlanToBuy.monthlyPrice) : selectedPlanToBuy.monthlyPrice) || 0).toLocaleString('en-IN')}</span>
                                    </p>
                                </div>

                                {paymentStatus === 'idle' && (
                                    <div className="flex flex-col items-center gap-4">
                                        <div 
                                            onClick={handleConfirmPayment}
                                            className="relative w-52 h-52 bg-white p-4 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer group hover:scale-105 transition-transform"
                                            title="Click to simulate scanning QR Code"
                                        >
                                            <img 
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi%3A%2F%2Fpay%3Fpa%3Dresto%40upi%26pn%3DRestaurantHub%26am%3D${billingCycle === 'yearly' ? (selectedPlanToBuy.yearlyPrice || selectedPlanToBuy.monthlyPrice) : selectedPlanToBuy.monthlyPrice}%26cu%3DINR&bgcolor=ffffff&color=1e1b4b`}
                                                alt="Subscription QR Code" 
                                                className="w-44 h-44 object-contain"
                                            />
                                            <div className="absolute inset-0 bg-indigo-600/10 group-hover:opacity-100 opacity-0 transition-opacity rounded-3xl flex items-center justify-center font-black text-indigo-700 text-xs bg-white/90">
                                                Click to Simulate Payment &rarr;
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-w-sm">
                                            <div className="flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                                <span>Scan with GPay, PhonePe, Paytm, or BHIM UPI</span>
                                            </div>
                                            <button 
                                                onClick={handleConfirmPayment}
                                                disabled={isSubmitting}
                                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                                            >
                                                Confirm Payment & Upgrade <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {paymentStatus === 'processing' && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Processing subscription payment and updating permissions...</p>
                                    </div>
                                )}

                                {paymentStatus === 'success' && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-3 animate-in zoom-in-95">
                                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                                            <CheckCircle size={36} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Subscription Upgraded!</h3>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Unlocking enterprise modules now...</p>
                                    </div>
                                )}

                                {paymentStatus === 'failed' && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <p className="text-sm font-bold text-red-500">Payment transaction failed. Please try again.</p>
                                        <button 
                                            onClick={() => setPaymentStatus('idle')}
                                            className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-black"
                                        >
                                            Retry Payment
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Plans Grid */
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                                {plansLoading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {plans.map((p) => {
                                            const price = billingCycle === 'yearly' ? (p.yearlyPrice || p.monthlyPrice) : p.monthlyPrice;
                                            const isCurrent = plan === p.name;
                                            const isEnterprise = p.name === 'Enterprise';

                                            return (
                                                <div 
                                                    key={p._id || p.name} 
                                                    className={`rounded-3xl border-2 p-6 flex flex-col justify-between relative transition-all ${
                                                        isCurrent 
                                                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md' 
                                                        : isEnterprise 
                                                        ? 'border-indigo-400 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm'
                                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                                                    }`}
                                                >
                                                    {isEnterprise && (
                                                        <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                                            Recommended
                                                        </div>
                                                    )}

                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-black text-slate-900 dark:text-slate-100 text-xl">{p.name}</h4>
                                                            <div className="flex items-baseline gap-1 mt-2">
                                                                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{(price || 0).toLocaleString('en-IN')}</span>
                                                                <span className="text-xs text-slate-400 font-extrabold">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                                                            </div>
                                                        </div>

                                                        <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                            {(p.features || []).map((feat, idx) => (
                                                                <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                                    <span>{feat}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <button
                                                        onClick={() => handleSelectPlanToUpgrade(p)}
                                                        disabled={isCurrent}
                                                        className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all mt-6 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                                                            isCurrent
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                                                        }`}
                                                    >
                                                        {isCurrent ? 'Current Active Plan' : 'Select & Proceed →'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center shrink-0 flex items-center justify-between px-8">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Need custom enterprise features or multi-branch setup?</span>
                            <Link 
                                to="/admin/billing" 
                                onClick={() => setShowPlansModal(false)}
                                className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Go to Full Billing Portal &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
