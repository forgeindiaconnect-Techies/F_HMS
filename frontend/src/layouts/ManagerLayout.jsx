import { Outlet } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import Topbar from '../components/Topbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

const ManagerLayout = () => {
    const { restaurant } = useAuth();
    const isUnverified = restaurant && restaurant.verificationStatus !== 'Verified' && restaurant.approvalStatus !== 'Approved';

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <SubscriptionBanner />
            <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
                <ManagerSidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Topbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8">
                    {isUnverified ? (
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
