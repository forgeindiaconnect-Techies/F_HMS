import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle, AlertTriangle, ShieldCheck, QrCode, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import dummyScanner from '../../assets/dummy_scanner.png';

const SubscriptionPortal = () => {
    const { user, api } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submittingPlan, setSubmittingPlan] = useState(null);
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
    const [plans, setPlans] = useState([]);
    const [selectedPlanToBuy, setSelectedPlanToBuy] = useState(null);

    const fetchRestaurantInfo = async () => {
        try {
            const res = await api.get(`/restaurants/mine`);
            setRestaurant(res.data);
        } catch (error) {
            console.error("Failed to fetch restaurant", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plans');
            if (res.data && res.data.length > 0) {
                setPlans(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch plans", error);
        }
    };

    useEffect(() => {
        fetchRestaurantInfo();
        fetchPlans();
    }, [api]);

    const getPlanAmount = (planName) => {
        const found = plans.find(p => p.name === planName);
        if (found) {
            return (found.monthlyPrice || found.price || 0).toFixed(2);
        }
        if (planName === 'Starter') return '49.00';
        if (planName === 'Professional') return '99.00';
        return '199.00';
    };

    const triggerPaymentFlow = (planName) => {
        setSelectedPlanToBuy(planName);
        setPaymentStatus('idle');
        setShowUpiModal(true);
    };

    const handleUpiPayment = (success) => {
        setPaymentStatus('processing');
        setTimeout(() => {
            if (success) {
                setPaymentStatus('success');
                setTimeout(async () => {
                    setShowUpiModal(false);
                    setSubmittingPlan(selectedPlanToBuy);
                    try {
                        const { data } = await api.put('/restaurants/subscribe', {
                            plan: selectedPlanToBuy,
                            billingCycle: 'monthly'
                        });
                        setRestaurant(data);
                        alert(`Successfully subscribed to ${selectedPlanToBuy} Plan!`);
                        window.location.href = '/admin';
                    } catch (error) {
                        console.error("Failed to subscribe", error);
                        alert(error.response?.data?.message || "Failed to update subscription");
                    } finally {
                        setSubmittingPlan(null);
                    }
                }, 1500);
            } else {
                setPaymentStatus('failed');
            }
        }, 1500);
    };

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    if (!restaurant) return <div className="p-8 text-center text-gray-500">Restaurant data not found.</div>;

    const sub = restaurant.subscription || {};
    const isExpired = sub.expiryDate && new Date(sub.expiryDate) < new Date();
    const isFrozen = sub.status === 'Frozen' || isExpired;
    
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Subscription & Billing</h2>
                <p className="text-gray-500">Manage your SaaS platform subscription and billing details.</p>
            </div>

            {isFrozen && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                    <AlertTriangle className="text-red-500 mt-1 shrink-0" size={24} />
                    <div>
                        <h3 className="text-red-800 font-bold text-lg">Account Frozen / Subscription Expired</h3>
                        <p className="text-red-700 mt-1">Your platform subscription has expired. Your staff dashboards are currently locked and cannot accept new orders. Please subscribe to a plan to restore full access.</p>
                        <button 
                            onClick={() => triggerPaymentFlow(sub.plan || 'Starter')}
                            disabled={submittingPlan !== null}
                            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {submittingPlan ? 'Renewing...' : 'Renew Subscription Now'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Plan</p>
                        <h3 className="text-3xl font-black text-gray-900 font-sans">{sub.plan || 'Starter'}</h3>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                            isFrozen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {isFrozen ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                            {isFrozen ? 'Expired / Frozen' : (sub.status || 'Active')}
                        </span>
                        {sub.expiryDate && (
                            <p className="text-sm text-gray-500 mt-2">
                                Expiry Date: <span className="font-bold text-gray-900">{new Date(sub.expiryDate).toLocaleDateString()}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(plans.length > 0 ? plans : [
                        { name: 'Starter', monthlyPrice: 49, features: ['Basic POS Features', 'Single Branch'] },
                        { name: 'Professional', monthlyPrice: 99, features: ['Basic POS Features', 'Multi Branch Support', 'Self-Pickup Orders'] },
                        { name: 'Enterprise', monthlyPrice: 199, features: ['Basic POS Features', 'Multi Branch Support', 'Self-Pickup Orders'] }
                    ]).map(planItem => {
                        const planName = typeof planItem === 'string' ? planItem : planItem.name;
                        const price = typeof planItem === 'object' ? (planItem.monthlyPrice || planItem.price || 0) : (planName === 'Starter' ? 49 : planName === 'Professional' ? 99 : 199);
                        const featuresList = typeof planItem === 'object' && planItem.features ? planItem.features : ['Basic POS Features', 'Multi Branch Support'];
                        
                        return (
                            <div key={planName} className={`border-2 rounded-2xl p-6 transition-all flex flex-col justify-between ${
                                sub.plan === planName && !isFrozen ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                            }`}>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg mb-2">{planName}</h4>
                                    <div className="mb-6">
                                        <span className="text-3xl font-black text-gray-900">
                                            ₹{price.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                    
                                    <ul className="space-y-3 mb-8">
                                        {featuresList.map((feat, fIdx) => (
                                            <li key={fIdx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <ShieldCheck size={16} className="text-blue-500 shrink-0" /> {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <button 
                                    onClick={() => triggerPaymentFlow(planName)}
                                    disabled={submittingPlan !== null}
                                    className={`w-full py-2.5 rounded-xl font-bold transition-colors ${
                                        sub.plan === planName && !isFrozen
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {submittingPlan === planName ? 'Subscribing...' : (sub.plan === planName && !isFrozen ? 'Current Plan' : 'Subscribe')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Payment Method</h4>
                        <p className="text-sm text-gray-500">Visa ending in 4242</p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-colors text-sm border border-gray-200">
                    Update Card
                </button>
            </div>

            {/* UPI Simulator Modal */}
            {showUpiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="bg-gray-50 p-6 text-center border-b border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-1">
                                Complete Payment
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">Paying for {restaurant.name} Subscription</p>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
                            {paymentStatus === 'idle' && (
                                <>
                                    <div className="text-3xl font-black text-gray-900 mb-6">
                                        ₹{getPlanAmount(selectedPlanToBuy)}
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 mb-4">Select UPI App:</p>
                                    <div className="flex flex-col w-full gap-3">
                                        <button onClick={() => handleUpiPayment(true)} className="flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all bg-white shadow-sm hover:shadow text-gray-900 font-bold">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-5 object-contain" />
                                            Google Pay
                                        </button>
                                        <button onClick={() => handleUpiPayment(true)} className="flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all bg-white shadow-sm hover:shadow text-gray-900 font-bold">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-6 object-contain" />
                                            PhonePe
                                        </button>
                                        <button onClick={() => handleUpiPayment(true)} className="flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all bg-white shadow-sm hover:shadow text-gray-900 font-bold">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-4 object-contain" />
                                            Paytm
                                        </button>
                                    </div>
                                    
                                    <div className="mt-8 flex flex-col items-center justify-center border border-gray-100 p-4 rounded-2xl bg-gray-50 w-full">
                                        <div className="w-32 h-32 flex items-center justify-center rounded-xl overflow-hidden bg-white border border-gray-100 mb-2">
                                            <img src={dummyScanner} alt="UPI QR Scanner" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or Scan QR on Mobile</span>
                                    </div>
                                </>
                            )}
                            
                            {paymentStatus === 'processing' && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-green-500" size={40} />
                                    <p className="font-bold text-gray-600 text-sm">Processing Payment...</p>
                                </div>
                            )}

                            {paymentStatus === 'success' && (
                                <div className="flex flex-col items-center gap-4 text-green-500">
                                    <CheckCircle2 size={48} className="animate-in zoom-in" />
                                    <p className="font-bold text-green-600 text-lg">Payment Successful</p>
                                </div>
                            )}

                            {paymentStatus === 'failed' && (
                                <div className="flex flex-col items-center gap-4 text-red-500">
                                    <AlertCircle size={48} className="animate-in zoom-in" />
                                    <p className="font-bold text-red-600 text-lg">Payment Failed</p>
                                    <button onClick={() => setShowUpiModal(false)} className="mt-2 text-sm font-bold text-gray-500 hover:text-gray-900">Close</button>
                                </div>
                            )}
                        </div>
                        
                        {(paymentStatus === 'idle') && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                <button 
                                    onClick={() => setShowUpiModal(false)}
                                    className="text-sm font-bold text-gray-500 hover:text-gray-900"
                                >
                                    Cancel Payment
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
