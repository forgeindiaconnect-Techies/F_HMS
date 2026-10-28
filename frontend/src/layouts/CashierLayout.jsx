import { Outlet } from 'react-router-dom';
import CashierSidebar from '../components/CashierSidebar';
import CashierTopbar from '../components/CashierTopbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

import SubscriptionFreezeOverlay from '../components/SubscriptionFreezeOverlay';

const CashierLayout = () => {
    const { user, restaurant, fetchRestaurant } = useAuth();
    const status = restaurant?.subscription?.status || 'Active';
    const isTrialExpired = restaurant?.subscription?.trialActive && 
        restaurant?.subscription?.expiryDate && 
        (new Date() > new Date(restaurant.subscription.expiryDate));
        
    const isFrozen = user?.role !== 'SuperAdmin' && (
        status === 'Frozen' || 
        status === 'Expired' || 
        isTrialExpired
    );

    const isUnverified = restaurant && (restaurant.approvalStatus === 'Rejected' || restaurant.approvalStatus === 'Suspended');

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans">
            <SubscriptionBanner />
            <div className="flex flex-1 overflow-hidden bg-gray-50">
                <CashierSidebar />
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <CashierTopbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-2.5 sm:p-4 md:p-6 custom-scrollbar bg-gray-50 dark:bg-slate-950">
                    <div className="min-h-full flex flex-col">
                        {isFrozen ? (
                            <SubscriptionFreezeOverlay onUnfrozen={() => fetchRestaurant()} />
                        ) : isUnverified ? (
                            <VerificationBlockedOverlay />
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </main>
            </div>
            </div>
        </div>
    );
};

export default CashierLayout;
