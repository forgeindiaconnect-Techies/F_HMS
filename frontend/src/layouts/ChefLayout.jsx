import { Outlet } from 'react-router-dom';
import ChefSidebar from '../components/ChefSidebar';
import ChefTopbar from '../components/ChefTopbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

import SubscriptionFreezeOverlay from '../components/SubscriptionFreezeOverlay';

const ChefLayout = () => {
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
        <div className="flex flex-col h-screen overflow-hidden font-sans text-slate-900 dark:text-gray-200 bg-gray-50 dark:bg-[#151923]">
            <SubscriptionBanner />
            <div className="flex flex-1 overflow-hidden">
                <ChefSidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <ChefTopbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-[#151923]">
                    {isFrozen ? (
                        <SubscriptionFreezeOverlay onUnfrozen={() => fetchRestaurant()} />
                    ) : isUnverified ? (
                        <div className="text-gray-900">
                            <VerificationBlockedOverlay />
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
            </div>
        </div>
    );
};

export default ChefLayout;
