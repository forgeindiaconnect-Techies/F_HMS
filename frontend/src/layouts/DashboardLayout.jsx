import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';
import { Sparkles, ArrowRight } from 'lucide-react';

const DashboardLayout = () => {
    const { restaurant } = useAuth();
    const location = useLocation();

    const isUnverified = restaurant && restaurant.verificationStatus !== 'Verified';
    const isVerificationPage = location.pathname === '/admin/verification';

    const getPlanName = () => {
        if (!restaurant || !restaurant.subscription || !restaurant.subscription.plan) {
            return 'Basic';
        }
        return restaurant.subscription.plan;
    };

    const plan = getPlanName();
    const path = location.pathname;
    let isPathBlocked = false;
    let blockedFeature = '';

    if (plan === 'Basic' || plan === 'Starter') {
        if (path.includes('/admin/suppliers')) { isPathBlocked = true; blockedFeature = 'Supplier Management'; }
        else if (path.includes('/admin/analytics')) { isPathBlocked = true; blockedFeature = 'Analytics & Insights'; }
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Topbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
                    {isUnverified && !isVerificationPage ? (
                        <VerificationBlockedOverlay />
                    ) : isPathBlocked ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl mb-6 animate-bounce">
                                <Sparkles size={36} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Upgrade Subscription Required</h2>
                            <p className="text-sm text-gray-500 mb-6 max-w-md leading-relaxed">
                                The <strong>{blockedFeature}</strong> module is a premium feature. Please upgrade your active <strong>{plan}</strong> subscription plan to access this module.
                            </p>
                            <Link 
                                to="/admin/billing" 
                                className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                            >
                                View Pricing Plans <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
