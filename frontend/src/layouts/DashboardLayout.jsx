import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import VerificationBlockedOverlay from '../components/VerificationBlockedOverlay';
import { Sparkles, ArrowRight } from 'lucide-react';

// ─── Central Plan Feature Access Config ───────────────────────────────────────
const ROUTE_PLAN_REQUIREMENTS = [
    // Pro features
    { path: '/admin/analytics',    minPlan: 'Pro',        feature: 'Sales Analytics' },
    { path: '/admin/branches',     minPlan: 'Pro',        feature: 'Multi-Branch Management' },
    { path: '/admin/inventory',    minPlan: 'Pro',        feature: 'Inventory Management' },
    { path: '/admin/suppliers',    minPlan: 'Pro',        feature: 'Vendor Management' },
    { path: '/admin/reservations', minPlan: 'Pro',        feature: 'Reservation Management' },
    { path: '/admin/offers',       minPlan: 'Pro',        feature: 'Coupons & Promotions' },
    { path: '/admin/delivery',     minPlan: 'Pro',        feature: 'Delivery Management' },

    // Enterprise features
    { path: '/admin/franchise',        minPlan: 'Enterprise', feature: 'Franchise Management' },
    { path: '/admin/central-kitchen',  minPlan: 'Enterprise', feature: 'Central Kitchen Ops' },
    { path: '/admin/developer-config', minPlan: 'Enterprise', feature: 'Developer APIs & White Label' },
    { path: '/admin/audit-logs',       minPlan: 'Enterprise', feature: 'Security Audit Logs' },
    { path: '/admin/bi',               minPlan: 'Enterprise', feature: 'Business Intelligence Console' },
    { path: '/admin/support',          minPlan: 'Enterprise', feature: '24/7 Premium Support' },
];

const PLAN_ORDER = { Basic: 0, Starter: 0, Pro: 1, Professional: 1, Enterprise: 2 };

const planMeetsRequirement = (currentPlan, minPlan) => {
    return (PLAN_ORDER[currentPlan] ?? 0) >= (PLAN_ORDER[minPlan] ?? 99);
};

const DashboardLayout = () => {
    const { restaurant } = useAuth();
    const location = useLocation();

    const isUnverified = restaurant && restaurant.verificationStatus !== 'Verified';
    const isVerificationPage = location.pathname === '/admin/verification';

    const plan = restaurant?.subscription?.plan || 'Basic';
    const status = restaurant?.subscription?.status || 'Inactive';

    // Find the first matching route requirement for the current path
    const routeBlock = ROUTE_PLAN_REQUIREMENTS.find(r => location.pathname.startsWith(r.path));
    const isPathBlocked = routeBlock
        ? (status !== 'Active' || !planMeetsRequirement(plan, routeBlock.minPlan))
        : false;
    const blockedFeature = routeBlock?.feature || '';
    const requiredPlan = routeBlock?.minPlan || 'Pro';

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Topbar />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8 relative">
                    {isUnverified && !isVerificationPage ? (
                       <VerificationBlockedOverlay />
                    ) : (
                       <div className="relative w-full h-full min-h-[60vh]">
                           {isPathBlocked && (
                               <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/10 backdrop-blur-[5px] rounded-3xl p-6">
                                   <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white/50 max-w-md w-full text-center flex flex-col items-center gap-5 transform animate-in zoom-in-95 duration-300">
                                       <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                                           <Sparkles size={28} />
                                       </div>
                                       <div className="space-y-1">
                                           <h3 className="text-xl font-black text-slate-900">Upgrade Plan to Access</h3>
                                           <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                               The module <strong>{blockedFeature}</strong> is gated and requires a premium subscription.
                                           </p>
                                       </div>
                                       <div className="flex flex-wrap gap-2 justify-center py-2">
                                           <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                               Current: {plan}
                                           </span>
                                           <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                               Required: {requiredPlan}
                                           </span>
                                       </div>
                                       <Link
                                           to="/admin/billing"
                                           className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                       >
                                           Upgrade Subscription <ArrowRight size={16} />
                                       </Link>
                                   </div>
                               </div>
                           )}
                           <div className={isPathBlocked ? 'blur-[8px] pointer-events-none select-none transition-all duration-300' : 'transition-all duration-300'}>
                               <Outlet />
                           </div>
                       </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
