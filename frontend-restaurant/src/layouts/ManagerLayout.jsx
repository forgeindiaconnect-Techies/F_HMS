import { Outlet } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import Topbar from '../components/Topbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

import SubscriptionFreezeOverlay from '../components/SubscriptionFreezeOverlay';

const ManagerLayout = () => {
    const { user, restaurant, subscriptionState, fetchRestaurant } = useAuth();
    const isFrozen = Boolean(subscriptionState?.isFrozen);

    const isApproved = restaurant?.approvalStatus === 'Approved' && restaurant?.subscription?.status !== 'Pending Approval';
    const isUnverified = user?.role !== 'SuperAdmin' && Boolean(
        restaurant && (
            !isApproved || 
            restaurant.approvalStatus === 'Pending' || 
            restaurant.approvalStatus === 'Rejected' || 
            restaurant.subscription?.status === 'Pending Approval' || 
            restaurant.verificationStatus === 'Rejected' || 
            restaurant.verificationStatus === 'Re-upload Required'
        )
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <SubscriptionBanner />
            <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
                <ManagerSidebar />
            
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <Topbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 sm:p-4 md:p-6 custom-scrollbar">
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

export default ManagerLayout;
