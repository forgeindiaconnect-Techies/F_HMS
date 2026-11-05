import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, User, UtensilsCrossed, Heart, CalendarDays, ShoppingBag, MapPin, ChevronDown } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';
import WishlistDrawer from '../components/WishlistDrawer';
import LocationPickerModal from '../components/LocationPickerModal';
import { getSavedLocation, EVENT_LOCATION_UPDATED } from '../utils/locationHelper';

const CustomerLayout = () => {
    const { user } = useCustomerAuth();
    const { cartCount, setIsCartOpen, wishlist, setIsWishlistOpen } = useCart();
    const [userLocation, setUserLocation] = useState(() => getSavedLocation());
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [restaurants, setRestaurants] = useState([]);

    const location = useLocation();
    const isLandingPage = location.pathname === '/' || location.pathname === '/explore';

    // Synchronize location across dashboards
    useEffect(() => {
        const handleLocationUpdate = (e) => {
            if (e?.detail?.location !== undefined) {
                setUserLocation(e.detail.location);
            } else {
                setUserLocation(getSavedLocation());
            }
        };

        window.addEventListener(EVENT_LOCATION_UPDATED, handleLocationUpdate);
        window.addEventListener('storage', handleLocationUpdate);
        return () => {
            window.removeEventListener(EVENT_LOCATION_UPDATED, handleLocationUpdate);
            window.removeEventListener('storage', handleLocationUpdate);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans relative bg-white text-slate-800">
            <CartDrawer />
            <WishlistDrawer />
            
            <LocationPickerModal
                isOpen={isLocationPickerOpen}
                onClose={() => setIsLocationPickerOpen(false)}
                currentLocation={userLocation}
                onSelectLocation={(loc) => setUserLocation(loc)}
                restaurants={restaurants}
            />

            {!isLandingPage && (
                <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-14 sm:h-[76px] flex items-center justify-between gap-1 sm:gap-4 overflow-hidden">
                        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0">
                            {/* Back Icon Button (Compact for Mobile Apps without word 'Back') */}
                            <button
                                onClick={() => window.history.back()}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors shrink-0 flex items-center justify-center border border-slate-200 shadow-xs cursor-pointer"
                                aria-label="Go Back"
                                title="Go Back"
                            >
                                <ArrowLeft size={16} className="text-slate-700 stroke-[2.2]" />
                            </button>
                            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-[#FF5A1F]/25 group-hover:scale-105 transition-transform shrink-0">
                                    <UtensilsCrossed size={17} className="sm:hidden stroke-[2.2]" />
                                    <UtensilsCrossed size={22} className="hidden sm:block stroke-[2.2]" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-base sm:text-[22px] font-black tracking-tight text-slate-900 leading-none">
                                        Food<span className="text-[#FF5A1F]">Nest</span>
                                    </span>
                                    <span className="hidden sm:block text-[10px] font-medium text-slate-400 mt-1">
                                        Good Food, Better Mood
                                    </span>
                                </div>
                            </Link>

                            {/* Location Detect & Change Pill */}
                            <button
                                type="button"
                                onClick={() => setIsLocationPickerOpen(true)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 hover:border-orange-200 bg-slate-50 hover:bg-orange-50/70 text-slate-700 hover:text-[#FF5A1F] text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer max-w-[80px] xs:max-w-[110px] sm:max-w-[180px] shrink truncate ml-0.5 sm:ml-1"
                                title="Click to detect or change delivery location"
                            >
                                <MapPin size={12} className="text-[#FF5A1F] shrink-0" />
                                <span className="truncate">{userLocation ? userLocation.split(',')[0] : 'Location'}</span>
                                <ChevronDown size={11} className="text-slate-400 shrink-0 hidden sm:block" />
                            </button>
                        </div>

                        <nav className="hidden lg:flex items-center gap-7 text-[15px] font-semibold">
                            <Link to="/explore" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">Home</Link>
                            <Link to="/explore#featured-restaurants" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">Restaurants</Link>
                            <Link to="/menu" className="relative py-1.5 text-[#FF5A1F] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full">Menu</Link>
                            <Link to="/explore#offers" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">Offers</Link>
                            <Link to="/explore#how-it-works" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">About Us</Link>
                        </nav>

                        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                            <div className="flex items-center gap-0.5 sm:gap-2">
                                <button 
                                    onClick={() => setIsWishlistOpen(true)}
                                    className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#FF5A1F] transition-colors cursor-pointer shrink-0"
                                    title="Wishlist"
                                >
                                    <Heart size={18} className="sm:hidden" />
                                    <Heart size={20} className="hidden sm:block" />
                                    {wishlist && wishlist.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setIsCartOpen(true)}
                                    className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#FF5A1F] transition-colors cursor-pointer shrink-0"
                                    title="Cart"
                                >
                                    <ShoppingBag size={18} className="sm:hidden" />
                                    <ShoppingBag size={20} className="hidden sm:block" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A1F] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            
                            {user ? (
                                <Link 
                                    to="/profile" 
                                    className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] sm:border sm:border-orange-200 flex items-center justify-center sm:gap-1.5 transition-colors shrink-0"
                                    title="My Profile"
                                >
                                    <div className="w-7 h-7 sm:w-5 sm:h-5 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center text-xs font-black shrink-0">
                                        {user.name ? user.name.charAt(0).toUpperCase() : <User size={13} />}
                                    </div>
                                    <span className="hidden sm:inline text-xs font-bold truncate max-w-[85px]">{user.name}</span>
                                </Link>
                            ) : (
                                <Link 
                                    to="/customer/login" 
                                    className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-[13px] shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    <span className="sm:hidden">Login</span>
                                    <span className="hidden sm:inline">Login / Sign Up</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </header>
            )}}
            
            <main className="flex-grow pb-20 md:pb-0">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation (Persistent native app bar with active indicator and safe-area support) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <Link 
                    to="/explore" 
                    className={`flex flex-col items-center transition-colors ${
                        location.pathname === '/' || location.pathname === '/explore' 
                            ? 'text-[#FF5A1F]' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <UtensilsCrossed size={19} className="stroke-[2.2]" />
                    <span className="text-[10px] font-bold mt-1">Explore</span>
                </Link>
                <Link 
                    to="/menu" 
                    className={`flex flex-col items-center transition-colors ${
                        location.pathname.startsWith('/menu') 
                            ? 'text-[#FF5A1F]' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ShoppingBag size={19} className="stroke-[2.2]" />
                    <span className="text-[10px] font-bold mt-1">Menu</span>
                </Link>
                <Link 
                    to="/reservations" 
                    className={`flex flex-col items-center transition-colors ${
                        location.pathname.startsWith('/reservations') 
                            ? 'text-[#FF5A1F]' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <CalendarDays size={19} className="stroke-[2.2]" />
                    <span className="text-[10px] font-bold mt-1">Dine In</span>
                </Link>
                <Link 
                    to="/profile" 
                    className={`flex flex-col items-center transition-colors ${
                        location.pathname.startsWith('/profile') 
                            ? 'text-[#FF5A1F]' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <User size={19} className="stroke-[2.2]" />
                    <span className="text-[10px] font-bold mt-1">Account</span>
                </Link>
            </div>

            {!isLandingPage && (
                <footer className="bg-slate-950 text-slate-300 py-12 border-t border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center">
                                    <UtensilsCrossed size={19} />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xl font-black text-white tracking-tight leading-none">
                                        Food<span className="text-[#FF5A1F]">Nest</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium mt-1">
                                        Good Food, Better Mood
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                                Your favourite dishes and restaurants delivered fast, fresh, and hot right to your doorstep.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">Quick Links</h4>
                            <ul className="space-y-2 text-xs font-medium">
                                <li><Link to="/explore" className="hover:text-[#FF5A1F] transition-colors">Home</Link></li>
                                <li><Link to="/explore#featured-restaurants" className="hover:text-[#FF5A1F] transition-colors">Restaurants</Link></li>
                                <li><Link to="/menu" className="hover:text-[#FF5A1F] transition-colors">Menu</Link></li>
                                <li><Link to="/explore#offers" className="hover:text-[#FF5A1F] transition-colors">Offers</Link></li>
                                <li><Link to="/explore#how-it-works" className="hover:text-[#FF5A1F] transition-colors">About Us</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">Help</h4>
                            <ul className="space-y-2 text-xs font-medium">
                                <li>
                                    <Link 
                                        to="/explore#how-it-works" 
                                        onClick={() => {
                                            setTimeout(() => {
                                                const el = document.getElementById('how-it-works');
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                        className="hover:text-[#FF5A1F] transition-colors no-underline outline-none"
                                    >
                                        How It Works
                                    </Link>
                                </li>
                                <li><Link to="/reservations" className="hover:text-[#FF5A1F] transition-colors no-underline">Book a Table</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-white mb-3.5 tracking-wider uppercase">Download Our App</h4>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-700 transition-colors">
                                    <span>Google Play</span>
                                </div>
                                <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-700 transition-colors">
                                    <span>App Store</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default CustomerLayout;
