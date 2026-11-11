import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubscriptionBanner = () => {
    const { restaurant, subscriptionState } = useAuth();

    if (!restaurant) return null;

    if (subscriptionState?.isFrozen) {
        const isManual = subscriptionState.isManualFrozen;
        const isPending = subscriptionState.isPendingApproval;
        const isOwner = subscriptionState.isOwner;

        return (
            <div className={`${isPending ? 'bg-amber-600' : isManual ? 'bg-slate-900' : 'bg-red-600'} text-white px-4 py-2 text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2 z-50`}>
                {isPending ? <Clock size={15} /> : isManual ? <ShieldAlert size={15} /> : <AlertTriangle size={15} />}
                <span>
                    {isPending
                        ? '7-Day Free Trial is pending Super Admin approval.'
                        : isManual
                        ? `Dashboard paused by Super Admin${subscriptionState.reason ? `: ${subscriptionState.reason}` : '.'}`
                        : subscriptionState.freezeType === 'failed'
                        ? 'Subscription payment failed. Access is paused until payment succeeds.'
                        : 'Subscription expired. Operational features are frozen until renewed.'}
                </span>
                {isOwner && !isPending && (
                    <Link to="/admin/billing" className="underline font-black ml-1 hover:text-amber-200">
                        Manage Subscription
                    </Link>
                )}
            </div>
        );
    }

    // Warn 24h before trial expiration while still active
    const sub = restaurant.subscription || {};
    const endRaw = sub.trialActive ? (sub.trialEndDate || sub.expiryDate) : (sub.subscriptionEndDate || sub.expiryDate);
    if (endRaw && sub.status === 'Active') {
        const msLeft = new Date(endRaw) - new Date();
        const hoursLeft = msLeft / (1000 * 60 * 60);
        if (hoursLeft > 0 && hoursLeft <= 24) {
            return (
                <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs sm:text-sm font-extrabold flex flex-wrap items-center justify-center gap-2 z-50">
                    <Clock size={15} />
                    <span>
                        Your {sub.trialActive ? '7-Day Free Trial' : `${sub.plan} subscription`} expires in {Math.max(1, Math.ceil(hoursLeft))} hour(s).
                    </span>
                    {subscriptionState?.isOwner && (
                        <Link to="/admin/billing" className="underline font-black">
                            Upgrade Now
                        </Link>
                    )}
                </div>
            );
        }
    }

    return null;
};

export default SubscriptionBanner;
