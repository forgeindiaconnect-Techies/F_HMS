import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Sparkles, CheckCircle, ShieldCheck, ArrowRight, Zap, RefreshCw, AlertCircle, CreditCard, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionFreezeOverlay = ({ onUnfrozen }) => {
    const { api, fetchRestaurant, restaurant } = useAuth();
    
    const [isYearly, setIsYearly] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('Professional');
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'qr' | 'processing' | 'success'

    // Load available plans from backend
    useEffect(() => {
        setLoadingPlans(true);
        api.get('/plans')
            .then(res => {
                if (res.data && res.data.length > 0) {
                    setPlans(res.data);
                }
            })
            .catch(() => {})
            .finally(() => setLoadingPlans(false));
    }, [api]);

    const defaultPlans = [
        {
            _id: 'starter',
            name: 'Starter',
            monthlyPrice: 3999,
            yearlyPrice: 3199,
            description: 'Essential POS billing & table ordering for single location restaurants.',
            features: ['1 Branch Location', 'Basic POS Billing', 'QR Table Ordering', 'Standard Reports', 'Email Support']
        },
        {
            _id: 'professional',
            name: 'Professional',
            monthlyPrice: 7999,
            yearlyPrice: 6399,
            description: 'Advanced KDS, inventory & multi-terminal billing for growing kitchens.',
            popular: true,
            features: ['Up to 3 Branches', 'Kitchen Display System (KDS)', 'Inventory & Stock Tracking', 'Delivery Partner Integration', 'Priority 24/7 Support']
        },
        {
            _id: 'enterprise',
            name: 'Enterprise',
            monthlyPrice: 15999,
            yearlyPrice: 12799,
            description: 'Unlimited scale, franchise management, custom APIs & dedicated manager.',
            features: ['Unlimited Branches', 'Centralized Franchise Kitchen', 'AI Sales Forecasting', 'Custom Webhooks & APIs', 'Dedicated Account Manager']
        }
    ];

    const displayPlans = plans.length > 0 ? plans : defaultPlans;

    const handleSubscribe = async (planToBuy) => {
        setSelectedPlan(planToBuy.name);
        setShowPaymentModal(true);
        setPaymentStep('qr');
    };

    const handleConfirmPayment = async () => {
        setSubmitting(true);
        setPaymentStep('processing');

        try {
            const billingCycle = isYearly ? 'yearly' : 'monthly';
            await api.post('/restaurants/mine/upgrade', {
                planName: selectedPlan,
                billingCycle: billingCycle
            });

            setPaymentStep('success');
            toast.success(`🎉 Subscription Activated! Restaurant Dashboard Unfrozen.`);

            await fetchRestaurant();
            if (onUnfrozen) onUnfrozen();

            setTimeout(() => {
                setShowPaymentModal(false);
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process subscription. Please try again.');
            setPaymentStep('qr');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-300">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col my-auto relative animate-in zoom-in-95 duration-300">
                
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-8 sm:p-10 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-xs uppercase tracking-wider border border-white/30">
                                <Lock size={14} className="animate-bounce" /> 1-Day Free Trial Expired
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                                Your Dashboard is Currently Frozen ❄️
                            </h2>
                            <p className="text-rose-100 font-medium text-sm sm:text-base max-w-2xl">
                                Your 1-day free trial has completed. Subscribe to any plan below to immediately unfreeze your dashboard and resume POS billing, kitchen KDS, and order management.
                            </p>
                        </div>

                        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[160px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-200 block">Status</span>
                            <span className="text-xl font-black text-white flex items-center justify-center gap-1.5 mt-0.5">
                                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping inline-block" />
                                FROZEN
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 sm:p-10 space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {/* Billing Toggle */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Select Subscription Plan</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Choose monthly or yearly billing. Instant unfreeze upon activation.</p>
                        </div>

                        <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${!isYearly ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${isYearly ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                            >
                                Yearly Billing
                                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black">
                                    SAVE 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Subscription Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {displayPlans.map((planItem, idx) => {
                            const price = isYearly 
                                ? (planItem.yearlyPrice || planItem.price || 0)
                                : (planItem.monthlyPrice || planItem.price || 0);
                            const isPopular = planItem.popular || idx === 1;

                            return (
                                <div
                                    key={planItem._id || idx}
                                    className={`relative rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-300 border ${
                                        isPopular
                                            ? 'bg-white dark:bg-slate-800 border-rose-500 shadow-xl shadow-rose-500/10 ring-2 ring-rose-500'
                                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-rose-300'
                                    }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                                            Recommended & Most Popular
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{planItem.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium min-h-[36px]">
                                                {planItem.description || 'Full features for restaurant growth.'}
                                            </p>
                                        </div>

                                        <div className="py-2 border-y border-slate-100 dark:border-slate-700/60">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                                                    ₹{price.toLocaleString()}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    /{isYearly ? 'year' : 'month'}
                                                </span>
                                            </div>
                                        </div>

                                        <ul className="space-y-2.5 pt-2">
                                            {(planItem.features || []).slice(0, 5).map((feat, fIdx) => (
                                                <li key={fIdx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-6 mt-4">
                                        <button
                                            onClick={() => handleSubscribe(planItem)}
                                            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                                                isPopular
                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 hover:scale-[1.02]'
                                                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white hover:scale-[1.02]'
                                            }`}
                                        >
                                            <span>Subscribe & Unfreeze</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    🔒 SSL Encrypted 256-Bit Payment Gateway. Instant Activation upon confirmation.
                </div>
            </div>

            {/* Real-time Razorpay Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
                        
                        {paymentStep === 'qr' && (
                            <>
                                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                                    <CreditCard size={28} />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Activate {selectedPlan} Subscription</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Scan QR or click confirm below to activate subscription.
                                    </p>
                                </div>

                                <div 
                                    onClick={handleConfirmPayment}
                                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3 cursor-pointer group hover:scale-105 transition-transform"
                                    title="Click QR Code to Simulate Payment"
                                >
                                    <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-md border border-slate-200 flex items-center justify-center relative">
                                        <img 
                                            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=RestaurantHubSubscriptionPayment" 
                                            alt="Payment QR" 
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-rose-600/20 group-hover:opacity-100 opacity-0 transition-opacity rounded-xl flex items-center justify-center font-black text-rose-900 text-xs bg-white/90 p-2 text-center">
                                            Click QR to Simulate Payment →
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        Scan via GPay, PhonePe, Paytm, or click below
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={submitting}
                                        className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Payment & Unlock'}
                                    </button>
                                </div>
                            </>
                        )}

                        {paymentStep === 'processing' && (
                            <div className="py-8 space-y-4">
                                <RefreshCw size={40} className="animate-spin text-rose-600 mx-auto" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Verifying Payment...</h3>
                                <p className="text-xs text-slate-500">Unfreezing your restaurant dashboard...</p>
                            </div>
                        )}

                        {paymentStep === 'success' && (
                            <div className="py-8 space-y-4">
                                <CheckCircle size={48} className="text-emerald-500 mx-auto animate-bounce" />
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Dashboard Unfrozen! 🎉</h3>
                                <p className="text-xs text-slate-500 font-medium">Your subscription is active. Welcome back!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionFreezeOverlay;
