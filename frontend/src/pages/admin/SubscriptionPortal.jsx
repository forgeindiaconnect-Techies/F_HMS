import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const SubscriptionPortal = () => {
    const { user, api } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submittingPlan, setSubmittingPlan] = useState(null);

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

    useEffect(() => {
        fetchRestaurantInfo();
    }, [api]);

    const handleSubscribe = async (planName, billingCycle = 'monthly') => {
        setSubmittingPlan(planName);
        try {
            const { data } = await api.put('/restaurants/subscribe', {
                plan: planName,
                billingCycle: billingCycle
            });
            setRestaurant(data);
            alert(`Successfully subscribed to ${planName} Plan!`);
            window.location.href = '/admin';
        } catch (error) {
            console.error("Failed to subscribe", error);
            alert(error.response?.data?.message || "Failed to update subscription");
        } finally {
            setSubmittingPlan(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    if (!restaurant) return <div className="p-8 text-center text-gray-500">Restaurant data not found.</div>;

    const sub = restaurant.subscription || {};
    // Calculate if expired based on expiryDate
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
                        <h3 className="text-red-800 font-bold text-lg">Account Frozen / Free Trial Expired</h3>
                        <p className="text-red-700 mt-1">Your 1-day free trial or subscription has expired. Your staff dashboards are currently locked and cannot accept new orders. Please subscribe to a plan to restore full access.</p>
                        <button 
                            onClick={() => handleSubscribe(sub.plan || 'Starter', sub.billingCycle || 'monthly')}
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
                    {['Starter', 'Professional', 'Enterprise'].map(plan => (
                        <div key={plan} className={`border-2 rounded-2xl p-6 transition-all ${
                            sub.plan === plan && !isFrozen ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{plan}</h4>
                            <div className="mb-6">
                                <span className="text-3xl font-black text-gray-900">
                                    {plan === 'Starter' ? '₹49' : plan === 'Professional' ? '₹99' : '₹199'}
                                </span>
                                <span className="text-gray-500">/mo</span>
                            </div>
                            
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <ShieldCheck size={16} className="text-blue-500" /> Basic POS Features
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <ShieldCheck size={16} className="text-blue-500" /> {plan === 'Starter' ? 'Single Branch' : 'Multi Branch Support'}
                                </li>
                                {plan !== 'Starter' && (
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <ShieldCheck size={16} className="text-blue-500" /> Self-Pickup Orders
                                    </li>
                                )}
                            </ul>
                            
                            <button 
                                onClick={() => handleSubscribe(plan, 'monthly')}
                                disabled={submittingPlan !== null}
                                className={`w-full py-2.5 rounded-xl font-bold transition-colors ${
                                    sub.plan === plan && !isFrozen
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {submittingPlan === plan ? 'Subscribing...' : (sub.plan === plan && !isFrozen ? 'Current Plan' : 'Subscribe')}
                            </button>
                        </div>
                    ))}
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
        </div>
    );
};

export default SubscriptionPortal;
