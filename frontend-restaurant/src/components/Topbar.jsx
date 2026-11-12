import { useState, useEffect, useRef } from 'react';
import { Bell, User, Menu, ArrowLeft, Crown, Zap, Star, X, Loader2, AlertCircle, ArrowUpRight, Check, Store, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { buildDummyUpiQrUrl, confirmDummyQRSubscriptionPayment } from '../utils/subscriptionClient';
/* ─── Plan styling helpers ───────────────────────────────────────── */
const PLAN_META = {
    Basic:        { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   ring: 'ring-blue-400',   grad: 'from-blue-500 to-blue-600',   icon: Zap   },
    Starter:      { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   ring: 'ring-blue-400',   grad: 'from-blue-500 to-blue-600',   icon: Zap   },
    Pro:          { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-400', grad: 'from-purple-500 to-purple-600', icon: Star  },
    Professional: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', ring: 'ring-purple-400', grad: 'from-purple-500 to-purple-600', icon: Star  },
    Enterprise:   { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  ring: 'ring-amber-400',  grad: 'from-amber-500 to-amber-600',  icon: Crown },
};

const getPlanMeta = (name) => {
    if (!name) return null;
    return PLAN_META[name] ||
        Object.values(PLAN_META).find(m => m.icon && name.toLowerCase().includes(m.icon.displayName?.toLowerCase())) ||
        { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', ring: 'ring-gray-400', grad: 'from-gray-500 to-gray-600', icon: Star };
};

/* ─── Plan Upgrade Modal ────────────────────────────────────────── */
const PlanUpgradeModal = ({ currentPlan, plans, api, restaurant, subscriptionState, onClose, onUpgraded }) => {
    const [subscribing, setSubscribing] = useState(null);
    const [qrPlan, setQrPlan] = useState(null);
    const modalRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const handleUpgradeClick = (planItem) => {
        if (subscriptionState?.isManualFrozen || restaurant?.subscription?.manualFreeze) {
            toast.error('This restaurant is administratively frozen. Please contact Support.');
            return;
        }
        if (subscriptionState?.isPendingApproval) {
            toast.error('Free trial request is pending Super Admin approval.');
            return;
        }
        const price = planItem.monthlyPrice || planItem.price || 0;
        const refId = `QR-UPG-${Date.now().toString().slice(-6)}`;
        setQrPlan({
            planItem,
            price,
            refId,
            qrImageUrl: buildDummyUpiQrUrl({ amount: price, label: `${planItem.name} Upgrade` })
        });
    };

    const handleConfirmQRUpgrade = async () => {
        if (!qrPlan?.planItem || subscribing) return;
        setSubscribing(qrPlan.planItem.name);
        await confirmDummyQRSubscriptionPayment({
            api,
            planName: qrPlan.planItem.name,
            billingCycle: 'monthly',
            refId: qrPlan.refId,
            onSuccess: async () => {
                setSubscribing(null);
                await onUpgraded(qrPlan.planItem.name);
                onClose();
            },
            onFailure: () => {
                setSubscribing(null);
            }
        });
    };

    const tierRank = (name = '') => {
        const lower = String(name).trim().toLowerCase();
        if (lower.includes('basic') || lower.includes('starter')) return 0;
        if (lower.includes('pro')) return 1;
        if (lower.includes('enterprise')) return 2;
        return 3;
    };

    const rawPlans = plans.length > 0 ? plans : [
        { _id: 'p1', name: 'Basic',      monthlyPrice: 2999,  features: ['1 Branch', 'Basic Reporting', 'Email Support'] },
        { _id: 'p2', name: 'Pro',        monthlyPrice: 5999,  features: ['3 Branches', 'Advanced Analytics', 'Priority Support'] },
        { _id: 'p3', name: 'Enterprise', monthlyPrice: 12999, features: ['Unlimited Branches', 'Custom Features', '24/7 Support'] },
    ];
    const displayPlans = [...rawPlans].sort((a, b) => tierRank(a.name) - tierRank(b.name));

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 bg-white shrink-0">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Upgrade Your Plan</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Current plan: <span className="font-bold text-gray-800">{currentPlan || 'None'}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1">
                    {qrPlan ? (
                        <div className="p-8 flex flex-col items-center text-center space-y-5">
                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                                <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                                    <img src={qrPlan.qrImageUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">
                                    Scan &amp; Pay ₹{qrPlan.price.toLocaleString('en-IN')} for {qrPlan.planItem.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Scan with any UPI app (GPay, PhonePe, Paytm) · Ref: {qrPlan.refId}
                                </p>
                            </div>
                            <div className="flex w-full max-w-sm gap-3">
                                <button
                                    type="button"
                                    onClick={() => setQrPlan(null)}
                                    disabled={subscribing !== null}
                                    className="w-1/3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmQRUpgrade}
                                    disabled={subscribing !== null}
                                    className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {subscribing ? (
                                        <><Loader2 size={15} className="animate-spin" /> Confirming…</>
                                    ) : (
                                        <><QrCode size={15} /> Confirm QR Payment &amp; Upgrade</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Plans grid */}
                            <div className="p-6 sm:p-8 pt-9 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                                {displayPlans.map((plan, idx) => {
                                    const meta  = getPlanMeta(plan.name);
                                    const Icon  = meta?.icon || Star;
                                    const price = plan.monthlyPrice || plan.price || 0;
                                    const isCurrent = plan.name === currentPlan;
                                    const isPopular = tierRank(plan.name) === 1;

                                    return (
                                        <div
                                            key={plan._id || idx}
                                            className={`relative rounded-2xl border-2 p-6 flex flex-col h-full transition-all
                                                ${isCurrent
                                                    ? `${meta?.border || 'border-gray-300'} bg-gray-50 shadow-sm`
                                                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md bg-white'
                                                }
                                                ${isPopular && !isCurrent ? 'shadow-lg' : ''}
                                            `}
                                        >
                                            {/* Current / Popular badge */}
                                            {isCurrent ? (
                                                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${meta?.bg} ${meta?.text}`}>
                                                    Current Plan
                                                </div>
                                            ) : isPopular ? (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                                    Most Popular
                                                </div>
                                            ) : null}

                                            {/* Plan icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0 ${meta?.bg}`}>
                                                <Icon size={20} className={meta?.text} />
                                            </div>

                                            <h3 className="text-lg font-black text-gray-900 mb-1">{plan.name}</h3>

                                            <div className="mb-4 pb-4 border-b border-gray-100">
                                                <span className="text-3xl font-black text-gray-900">₹{price.toLocaleString('en-IN')}</span>
                                                <span className="text-gray-400 text-sm">/mo</span>
                                            </div>

                                            <ul className="space-y-2.5 mb-6 flex-1">
                                                {(plan.features || []).map((f, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-600 leading-snug">
                                                        <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="mt-auto pt-2">
                                                {isCurrent ? (
                                                    <div className={`w-full py-2.5 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-1.5 ${meta?.bg} ${meta?.text}`}>
                                                        <Check size={15} /> Active Plan
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpgradeClick(plan)}
                                                        disabled={subscribing !== null}
                                                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap
                                                            bg-gradient-to-r ${meta?.grad} text-white shadow-md hover:opacity-90 hover:shadow-lg
                                                            disabled:opacity-50 disabled:cursor-not-allowed
                                                        `}
                                                    >
                                                        <ArrowUpRight size={14} /> Upgrade to {plan.name}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-xs text-gray-400 pb-6 px-4">Instant UPI QR Scanner · Quick plan activation</p>
                        </>
                    )}
                    </div>
                </div>
            </div>
        </>
    );
};

/* ─── Topbar ────────────────────────────────────────────────────── */
const Topbar = () => {
    const { user, api, restaurant, fetchRestaurant, subscriptionState, plans: cachedPlans, fetchPlans } = useAuth();
    const [hasUnread, setHasUnread] = useState(false);
    const [plans, setPlans] = useState(cachedPlans || []);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    const subscriptionPlan = restaurant?.subscription?.plan || (restaurant ? 'Basic' : '');
    const subStatus = restaurant?.subscription?.status || 'Active';

    useEffect(() => {
        const handleThemeToggle = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('toggle-theme', handleThemeToggle);
        return () => window.removeEventListener('toggle-theme', handleThemeToggle);
    }, []);

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

    // Fetch available plans + branches (restaurant subscription comes from AuthContext)
    useEffect(() => {
        const isBranchStaff = user?.role === 'RestaurantAdmin' || user?.role === 'Admin' || user?.role === 'BranchManager';
        if (!isBranchStaff) return;

        const fetchData = async () => {
            try {
                const [plansData, branchesRes] = await Promise.allSettled([
                    fetchPlans ? fetchPlans() : api.get('/plans').then(r => r.data || []),
                    api.get('/branches')
                ]);
                if (plansData.status === 'fulfilled' && plansData.value?.length > 0) {
                    setPlans(plansData.value);
                }
                if (branchesRes.status === 'fulfilled' && branchesRes.value.data?.length > 0) {
                    setBranches(branchesRes.value.data);
                    setSelectedBranch(branchesRes.value.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch topbar data', error);
            }
        };
        fetchData();
    }, [user, api]);

    const meta   = getPlanMeta(subscriptionPlan);
    const Icon   = meta?.icon;
    const isAdmin = user?.role === 'RestaurantAdmin' || user?.role === 'Admin';

    return (
        <>
            <header className="h-16 sm:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 md:px-8 sticky top-0 z-10">
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 w-full md:w-auto flex-1 min-w-0">
                    <button
                        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                        className="md:hidden p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
                        aria-label="Toggle Menu"
                    >
                        <Menu size={22} />
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="md:hidden p-1.5 px-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold border border-gray-200 dark:border-slate-800 shrink-0 shadow-xs"
                        aria-label="Go Back"
                        title="Back"
                    >
                        <ArrowLeft size={15} />
                        <span className="text-[11px] font-bold">Back</span>
                    </button>

                    {/* Branch Badge / Name display */}
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs truncate">
                            <Store size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[200px]">
                                {selectedBranch?.name ? selectedBranch.name : 'Main Branch'}
                            </span>
                            {branches.length > 1 ? (
                                <select 
                                    value={selectedBranch?._id || ''}
                                    onChange={(e) => setSelectedBranch(branches.find(b => b._id === e.target.value))}
                                    className="bg-transparent text-emerald-800 dark:text-emerald-300 font-bold text-xs outline-none cursor-pointer border-none pl-1"
                                >
                                    {branches.map(b => (
                                        <option key={b._id} value={b._id} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 font-semibold">{b.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <Link to="/admin/branches" className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ml-1 shrink-0">
                                    Branches
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 ml-2 md:ml-0 shrink-0">

                    {/* Notifications */}
                    <Link
                        to={
                            user?.role === 'SuperAdmin'       ? '/super-admin/notifications' :
                            isAdmin                            ? '/admin/notifications' :
                            user?.role === 'BranchManager'    ? '/manager/notifications' :
                            '/admin/notifications'
                        }
                        className="relative p-1.5 sm:p-2 text-gray-500 dark:text-slate-400 hover:text-green-500 transition-colors"
                    >
                        <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
                        {hasUnread && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                    </Link>

                    {/* Profile corner */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 md:pl-6 border-l border-gray-200 dark:border-slate-800">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 capitalize">{user?.name || 'User'}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role || 'Staff'}</p>

                                {/* Plan badge — clickable for admins */}
                                {meta && isAdmin && (
                                    <>
                                        <span className="text-gray-300 dark:text-slate-600">·</span>
                                        {subscriptionState?.isFrozen || ['Frozen', 'Expired', 'Cancelled', 'Inactive'].includes(subStatus) ? (
                                            <button
                                                onClick={() => setShowUpgradeModal(true)}
                                                title="Subscription Over! Click to renew plan"
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors animate-pulse cursor-pointer shadow-xs"
                                            >
                                                <AlertCircle size={10} className="text-red-600" />
                                                Subscription Over ({subStatus})
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowUpgradeModal(true)}
                                                title="Click to upgrade your plan"
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text} hover:opacity-80 transition-opacity cursor-pointer`}
                                            >
                                                {Icon && <Icon size={9} />}
                                                {subscriptionPlan}
                                                <ArrowUpRight size={8} className="opacity-60" />
                                            </button>
                                        )}
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
                    restaurant={restaurant}
                    user={user}
                    subscriptionState={subscriptionState}
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgraded={async () => {
                        if (fetchRestaurant) await fetchRestaurant();
                    }}
                />
            )}
        </>
    );
};

export default Topbar;
