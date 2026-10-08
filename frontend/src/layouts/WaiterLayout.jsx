import { Outlet } from 'react-router-dom';
import WaiterSidebar from '../components/WaiterSidebar';
import WaiterTopbar from '../components/WaiterTopbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

import SubscriptionFreezeOverlay from '../components/SubscriptionFreezeOverlay';

const WaiterLayout = () => {
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
                <WaiterSidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <WaiterTopbar />
                
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {isFrozen ? (
                        <SubscriptionFreezeOverlay onUnfrozen={() => fetchRestaurant()} />
                    ) : isUnverified ? (
                        <VerificationBlockedOverlay />
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
            </div>
        </div>
    );
};

export default WaiterLayout;
