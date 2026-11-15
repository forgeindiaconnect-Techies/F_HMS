import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutGrid, Store, ShoppingBag, Calendar, Heart, 
    Crown, Wallet, Gift, MessageSquare, Star, Settings, 
    X, LogOut, ChevronRight, User, UtensilsCrossed, BookOpen
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const CUSTOMER_DASHBOARD_TABS = [
    { id: 'overview', name: 'Overview', icon: LayoutGrid, desc: 'Activity & Quick Stats' },
    { id: 'outlets', name: 'Nearby Outlets', icon: Store, desc: 'Verified Outlets & Locations' },
    { id: 'orders', name: 'Orders & Tracking', icon: ShoppingBag, desc: 'Live Kitchen & Order Status' },
    { id: 'reservations', name: 'Reservations', icon: Calendar, desc: 'Table Bookings & History' },
    { id: 'favorites', name: 'Favorite Items', icon: Heart, desc: 'Saved Dishes & Foods' },
    { id: 'loyalty', name: 'Loyalty & Rewards', icon: Crown, desc: 'Points & VIP Tiers' },
    { id: 'wallet', name: 'Wallet', icon: Wallet, desc: 'Balance & Deposit Funds' },
    { id: 'offers', name: 'Offers & Coupons', icon: Gift, desc: 'Discounts & Promos' },
    { id: 'feedback', name: 'Feedback & Inquiries', icon: MessageSquare, desc: 'Support Tickets & Help' },
    { id: 'reviews', name: 'My Reviews & Story', icon: Star, desc: 'Ratings & Testimonials' },
    { id: 'profile', name: 'Profile & Settings', icon: Settings, desc: 'Account Details & Password' }
];

const CustomerNavDrawer = ({ isOpen, onClose, activeTab, onSelectTab }) => {
    const { user, logout } = useCustomerAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close drawer on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Determine current active tab
    const currentTab = activeTab || (() => {
        try {
            return new URLSearchParams(location.search).get('tab') || 'overview';
        } catch {
            return 'overview';
        }
    })();

    const handleTabClick = (tabId) => {
        onClose();
        if (onSelectTab) {
            onSelectTab(tabId);
        }
        if (location.pathname === '/profile' || location.pathname === '/dashboard') {
            navigate(`/profile?tab=${tabId}`);
            window.dispatchEvent(new CustomEvent('customer-tab-change', { detail: { tab: tabId } }));
        } else {
            navigate(`/profile?tab=${tabId}`);
        }
    };

    const handleQuickLink = (path) => {
        onClose();
        navigate(path);
    };

    const handleLogout = () => {
        onClose();
        if (logout) logout();
    };

    return (
        <>
            {/* Backdrop Overlay */}
            <div 
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-out Navigation Drawer Panel */}
            <aside 
                className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                aria-label="Customer Navigation Drawer"
            >
                {/* Drawer Top Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-[#FF5A1F]/25">
                            <UtensilsCrossed size={18} className="stroke-[2.2]" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-base font-black tracking-tight text-slate-900 leading-none">
                                Food<span className="text-[#FF5A1F]">Nest</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                Customer Portal
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                        aria-label="Close menu"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User Summary Card */}
                {user ? (
                    <div className="p-3.5 mx-3.5 mt-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FF5A1F] to-orange-400 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-black text-slate-900 truncate">
                                {user.name || 'Foodie Member'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                                {user.email || user.phoneNumber || 'Loyalty Member'}
                            </p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-orange-100/80 text-[#FF5A1F] text-[9px] font-black uppercase tracking-wider">
                                {user.loyaltyPoints ? `${user.loyaltyPoints} Points` : 'Member'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-3.5 mx-3.5 mt-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between gap-3 text-left">
                        <div>
                            <p className="text-xs font-black text-slate-900">Welcome to FoodNest</p>
                            <p className="text-[10px] text-slate-500">Sign in to track orders & earn points</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { onClose(); navigate('/customer/login'); }}
                            className="px-3 py-1.5 rounded-xl bg-[#FF5A1F] text-white text-xs font-bold shadow-xs hover:bg-[#e04f1a] transition-all cursor-pointer shrink-0"
                        >
                            Sign In
                        </button>
                    </div>
                )}

                {/* Drawer Scrollable Navigation Content */}
                <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 text-left custom-scrollbar">
                    {/* Dashboard Sections */}
                    <div>
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Dashboard Sections
                        </div>
                        <div className="space-y-1 mt-1">
                            {CUSTOMER_DASHBOARD_TABS.map(tab => {
                                const IconComponent = tab.icon;
                                const isCurrentTab = (location.pathname === '/profile' || location.pathname === '/dashboard') && currentTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleTabClick(tab.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                                            isCurrentTab
                                                ? 'bg-[#FF5A1F] text-white shadow-xs shadow-[#FF5A1F]/25'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className={isCurrentTab ? 'text-white' : 'text-slate-400'}>
                                                <IconComponent size={17} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate leading-tight">{tab.name}</p>
                                                <p className={`text-[10px] font-medium truncate ${isCurrentTab ? 'text-white/80' : 'text-slate-400'}`}>
                                                    {tab.desc}
                                                </p>
                                            </div>
                                        </div>
                                        {isCurrentTab ? (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                                        ) : (
                                            <ChevronRight size={14} className="text-slate-300 shrink-0 ml-1.5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Portal Navigation Links */}
                    <div className="pt-2 border-t border-slate-100">
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Explore FoodNest
                        </div>
                        <div className="space-y-1 mt-1">
                            <button
                                type="button"
                                onClick={() => handleQuickLink('/explore')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2.5">
                                    <UtensilsCrossed size={16} className="text-slate-400" />
                                    <span>Explore Restaurants</span>
                                </div>
                                <ChevronRight size={14} className="text-slate-300" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLink('/menu')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2.5">
                                    <BookOpen size={16} className="text-slate-400" />
                                    <span>Full Food Menu</span>
                                </div>
                                <ChevronRight size={14} className="text-slate-300" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLink('/reservations')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span>Book Table / Dine In</span>
                                </div>
                                <ChevronRight size={14} className="text-slate-300" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Drawer Action (Logout) */}
                {user && (
                    <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                            <LogOut size={15} />
                            <span>Log Out of FoodNest</span>
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
};

export default CustomerNavDrawer;

