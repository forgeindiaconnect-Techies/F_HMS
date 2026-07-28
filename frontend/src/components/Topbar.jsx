import { useState, useEffect, useRef } from 'react';
import { Bell, User, Menu, Crown, Zap, Star, X, CheckCircle2, Loader2, AlertCircle, ArrowUpRight, Check, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import dummyQrPayment from '../assets/dummy_qr_payment.png';
/* ─── Plan styling helpers ───────────────────────────────────────── */
const PLAN_META = {
    Starter:      { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   ring: 'ring-blue-400',   grad: 'from-blue-500 to-blue-600',   icon: Zap   },
    Professional: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-400', grad: 'from-purple-500 to-purple-600', icon: Star  },
    Enterprise:   { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  ring: 'ring-amber-400',  grad: 'from-amber-500 to-amber-600',  icon: Crown },
};

const getPlanMeta = (name) => {
    if (!name) return null;
    return PLAN_META[name] ||
        Object.values(PLAN_META).find(m => m.icon && name.toLowerCase().includes(m.icon.displayName?.toLowerCase())) ||
        { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', ring: 'ring-gray-400', grad: 'from-gray-500 to-gray-600', icon: Star };
};

/* ─── UPI Payment Modal — 3-step flow ──────────────────────────── */
// step: 'scan' → show QR image  |  'upi' → show UPI app list  |  'processing' | 'success' | 'failed'
const UpiModal = ({ plan, planPrice, onClose, onSuccess }) => {
    const [step, setStep] = useState('scan');

    const handlePay = () => {
        setStep('processing');
        // Simulate payment processing
        setTimeout(() => {
            setStep('success');
            setTimeout(() => onSuccess(), 2000);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Complete Payment</p>
                        <h3 className="text-lg font-black text-gray-900">{plan} Plan</h3>
                    </div>
                    {(step === 'scan' || step === 'upi') && (
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Price */}
                {(step === 'scan' || step === 'upi') && (
                    <div className="text-center pt-5 pb-1">
                        <div className="text-4xl font-black text-gray-900">₹{planPrice}</div>
                        <p className="text-xs text-gray-400 mt-1">per month · cancel anytime</p>
                    </div>
                )}

                <div className="p-6 flex flex-col items-center justify-center">

                    {/* STEP 1 — Dummy QR Scanner */}
                    {step === 'scan' && (
                        <div className="w-full flex flex-col items-center gap-4">
                            <div className="w-56 h-56 flex items-center justify-center rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                                <img src={dummyQrPayment} alt="QR Code" className="w-full h-full object-contain p-4 bg-white" />
                            </div>
                            <button
                                onClick={handlePay}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
                            >
                                <QrCode size={16} /> Simulate Scan & Pay
                            </button>
                            <button
                                onClick={() => setStep('upi')}
                                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors mt-1"
                            >
                                Or pay using UPI Apps →
                            </button>
                        </div>
                    )}

                    {/* STEP 2 — UPI App Selection */}
                    {step === 'upi' && (
                        <div className="w-full flex flex-col gap-3">
                            <p className="text-xs font-bold text-gray-500 text-center mb-1">Choose your UPI app to confirm payment</p>
                            {[
                                { name: 'Google Pay',  src: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg',                    hover: 'hover:border-blue-400   hover:bg-blue-50'   },
                                { name: 'PhonePe',     src: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg',                        hover: 'hover:border-purple-400 hover:bg-purple-50' },
                                { name: 'Paytm',       src: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg',          hover: 'hover:border-sky-400    hover:bg-sky-50'    },
                            ].map(app => (
                                <button
                                    key={app.name}
                                    onClick={handlePay}
                                    className={`flex items-center gap-4 py-3 px-4 rounded-2xl border-2 border-gray-100 ${app.hover} transition-all bg-white shadow-sm text-gray-900 font-semibold text-sm w-full`}
                                >
                                    <img src={app.src} alt={app.name} className="h-6 object-contain w-16 shrink-0" />
                                    <span>{app.name}</span>
                                    <span className="ml-auto text-gray-300">›</span>
                                </button>
                            ))}

                            <button
                                onClick={() => setStep('scan')}
                                className="text-xs text-gray-400 hover:text-gray-600 font-semibold mt-1 self-center transition-colors"
                            >
                                ← Back to QR
                            </button>
                        </div>
                    )}

                    {/* STEP 3 — Processing */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="relative">
                                <Loader2 size={52} className="animate-spin text-green-400" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-green-100 rounded-full" />
                                </div>
                            </div>
                            <p className="font-bold text-gray-700">Processing payment…</p>
                            <p className="text-xs text-gray-400">Please wait, do not close this window</p>
                        </div>
                    )}

                    {/* STEP 4 — Success */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <p className="font-black text-green-600 text-xl">Payment Successful!</p>
                            <p className="text-sm text-gray-500 text-center">
                                Your <span className="font-bold text-gray-800">{plan}</span> plan is now active 🎉
                            </p>
                            <p className="text-xs text-gray-400">Redirecting…</p>
                        </div>
                    )}

                    {/* Failed */}
                    {step === 'failed' && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <AlertCircle size={48} className="text-red-500" />
                            <p className="font-black text-red-600 text-lg">Payment Failed</p>
                            <div className="flex gap-2">
                                <button onClick={() => setStep('scan')} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors">Retry</button>
                                <button onClick={onClose}               className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {(step === 'scan' || step === 'upi') && (
                    <div className="px-6 pb-5">
                        <button 
                            onClick={onClose} 
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center"
                        >
                            Cancel Payment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Plan Upgrade Modal ────────────────────────────────────────── */
const PlanUpgradeModal = ({ currentPlan, plans, api, onClose, onUpgraded }) => {
    const [selectedPlan, setSelectedPlan] = useState(null); // opens UPI modal
    const [subscribing, setSubscribing] = useState(null);
    const modalRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const handleUpgradeSuccess = async (planItem) => {
        setSubscribing(planItem.name);
        try {
            await api.put('/restaurants/subscribe', { plan: planItem.name, billingCycle: 'monthly' });
            onUpgraded(planItem.name);
            onClose();
        } catch (err) {
            console.error('Subscription update failed', err);
            alert(err.response?.data?.message || 'Failed to update subscription');
        } finally {
            setSubscribing(null);
            setSelectedPlan(null);
        }
    };

    const displayPlans = plans.length > 0 ? plans : [
        { _id: 'p1', name: 'Starter',      monthlyPrice: 49,  features: ['1 Branch', 'Basic Reporting', 'Email Support'] },
        { _id: 'p2', name: 'Professional', monthlyPrice: 99,  features: ['3 Branches', 'Advanced Analytics', 'Priority Support'] },
        { _id: 'p3', name: 'Enterprise',   monthlyPrice: 299, features: ['Unlimited Branches', 'Custom Features', '24/7 Support'] },
    ];

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
                    style={{ maxHeight: '90vh', overflowY: 'auto' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Upgrade Your Plan</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Current plan: <span className="font-bold text-gray-800">{currentPlan || 'None'}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Plans grid */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {displayPlans.map((plan, idx) => {
                            const meta  = getPlanMeta(plan.name);
                            const Icon  = meta?.icon || Star;
                            const price = plan.monthlyPrice || plan.price || 0;
                            const isCurrent = plan.name === currentPlan;
                            const isPopular  = idx === 1;

                            return (
                                <div
                                    key={plan._id || idx}
                                    className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all
                                        ${isCurrent
                                            ? `${meta?.border || 'border-gray-300'} bg-gray-50`
                                            : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                                        }
                                        ${isPopular && !isCurrent ? 'shadow-lg' : ''}
                                    `}
                                >
                                    {/* Popular badge */}
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                            Most Popular
                                        </div>
                                    )}

                                    {/* Current badge */}
                                    {isCurrent && (
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${meta?.bg} ${meta?.text}`}>
                                            Current Plan
                                        </div>
                                    )}

                                    {/* Plan icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${meta?.bg}`}>
                                        <Icon size={20} className={meta?.text} />
                                    </div>

                                    <h3 className="text-lg font-black text-gray-900 mb-1">{plan.name}</h3>

                                    <div className="mb-5">
                                        <span className="text-3xl font-black text-gray-900">₹{price.toLocaleString('en-IN')}</span>
                                        <span className="text-gray-400 text-sm">/mo</span>
                                    </div>

                                    <ul className="space-y-2 mb-6 flex-1">
                                        {(plan.features || []).map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrent ? (
                                        <div className={`w-full py-2.5 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-1.5 ${meta?.bg} ${meta?.text}`}>
                                            <Check size={15} /> Active Plan
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedPlan(plan)}
                                            disabled={subscribing !== null}
                                            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all
                                                bg-gradient-to-r ${meta?.grad} text-white shadow-md hover:opacity-90 hover:shadow-lg
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                            `}
                                        >
                                            {subscribing === plan.name ? (
                                                <><Loader2 size={14} className="animate-spin" /> Activating…</>
                                            ) : (
                                                <><ArrowUpRight size={14} /> Upgrade to {plan.name}</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-center text-xs text-gray-400 pb-6">All plans include a 30-day money-back guarantee · Cancel anytime</p>
                </div>
            </div>

            {/* UPI Modal on top */}
            {selectedPlan && (
                <UpiModal
                    plan={selectedPlan.name}
                    planPrice={(selectedPlan.monthlyPrice || selectedPlan.price || 0).toLocaleString('en-IN')}
                    onClose={() => setSelectedPlan(null)}
                    onSuccess={() => handleUpgradeSuccess(selectedPlan)}
                />
            )}
        </>
    );
};

/* ─── Topbar ────────────────────────────────────────────────────── */
const Topbar = () => {
    const { user, api } = useAuth();
    const [hasUnread, setHasUnread] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState(null);
    const [plans, setPlans] = useState([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setHasUnread(res.data.some(n => !n.read));
            } catch (error) {
                console.error('Failed to fetch notifications for topbar', error);
            }
        };
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 60000);
        return () => clearInterval(intervalId);
    }, []);

    // Fetch restaurant subscription plan + all available plans
    useEffect(() => {
        const isAdmin = user?.role === 'RestaurantAdmin' || user?.role === 'Admin';
        if (!isAdmin) return;

        const fetchData = async () => {
            try {
                const [restaurantRes, plansRes] = await Promise.all([
                    api.get('/restaurants/mine'),
                    api.get('/plans'),
                ]);
                const plan = restaurantRes.data?.subscription?.plan;
                if (plan) setSubscriptionPlan(plan);
                if (plansRes.data?.length > 0) setPlans(plansRes.data);
            } catch (error) {
                console.error('Failed to fetch plan data', error);
            }
        };
        fetchData();
    }, [user, api]);

    const meta   = getPlanMeta(subscriptionPlan);
    const Icon   = meta?.icon;
    const isAdmin = user?.role === 'RestaurantAdmin' || user?.role === 'Admin';

    return (
        <>
            <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto flex-1">
                    <button
                        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                        className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-2 md:gap-6 ml-2 md:ml-0 shrink-0">
                    {/* Notifications */}
                    <Link
                        to={
                            user?.role === 'SuperAdmin'       ? '/super-admin/notifications' :
                            isAdmin                            ? '/admin/notifications' :
                            user?.role === 'BranchManager'    ? '/manager/notifications' :
                            '/admin/notifications'
                        }
                        className="relative p-2 text-gray-500 hover:text-green-500 transition-colors"
                    >
                        <Bell size={22} />
                        {hasUnread && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
                        )}
                    </Link>

                    {/* Profile corner */}
                    <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-800 capitalize">{user?.name || 'User'}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Staff'}</p>

                                {/* Plan badge — clickable for admins */}
                                {meta && isAdmin && (
                                    <>
                                        <span className="text-gray-300">·</span>
                                        <button
                                            onClick={() => setShowUpgradeModal(true)}
                                            title="Click to upgrade your plan"
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text} hover:opacity-80 transition-opacity cursor-pointer`}
                                        >
                                            {Icon && <Icon size={9} />}
                                            {subscriptionPlan}
                                            <ArrowUpRight size={8} className="opacity-60" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                            <div
                                onClick={() => isAdmin && meta && setShowUpgradeModal(true)}
                                className={`w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold border border-green-200 ${isAdmin && meta ? 'cursor-pointer hover:ring-2 ring-offset-1 ' + (meta.ring || 'ring-green-400') : ''} transition-all`}
                            >
                                <User size={20} />
                            </div>
                            {/* Tiny plan icon on avatar */}
                            {meta && Icon && isAdmin && (
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${meta.bg} border-2 border-white shadow-sm`}>
                                    <Icon size={9} className={meta.text} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Upgrade Modal */}
            {showUpgradeModal && isAdmin && (
                <PlanUpgradeModal
                    currentPlan={subscriptionPlan}
                    plans={plans}
                    api={api}
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgraded={(newPlan) => {
                        setSubscriptionPlan(newPlan);
                    }}
                />
            )}
        </>
    );
};

export default Topbar;
