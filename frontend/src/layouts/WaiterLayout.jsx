import { Outlet } from 'react-router-dom';
import WaiterSidebar from '../components/WaiterSidebar';
import WaiterTopbar from '../components/WaiterTopbar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';

const WaiterLayout = () => {
    const { restaurant } = useAuth();
    const isUnverified = restaurant && restaurant.verificationStatus !== 'Verified' && restaurant.approvalStatus !== 'Approved';

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans">
            <SubscriptionBanner />
            <div className="flex flex-1 overflow-hidden bg-gray-50">
                <WaiterSidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <WaiterTopbar />
                
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
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

export default WaiterLayout;
