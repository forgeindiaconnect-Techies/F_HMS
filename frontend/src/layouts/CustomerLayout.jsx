import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, User, UtensilsCrossed, Heart, CalendarDays, ShoppingBag, Truck } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';
import WishlistDrawer from '../components/WishlistDrawer';

const CustomerLayout = () => {
    const { user, logout } = useCustomerAuth();
    const { cartCount, setIsCartOpen, wishlist, setIsWishlistOpen } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans relative text-slate-900 dark:text-slate-100 transition-colors">
            <CartDrawer />
            <WishlistDrawer />
            
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
            )}
            
            <main className="flex-grow pb-16 md:pb-0">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-2 flex justify-around items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <Link to="/explore" className="flex flex-col items-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                    <UtensilsCrossed size={20} />
                    <span className="text-[10px] font-bold mt-1">Explore</span>
                </Link>
                <Link to="/menu" className="flex flex-col items-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-bold mt-1">Menu</span>
                </Link>
                <Link to="/reservations" className="flex flex-col items-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                    <CalendarDays size={20} />
                    <span className="text-[10px] font-bold mt-1">Booking</span>
                </Link>
                <Link to="/profile" className="flex flex-col items-center text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                    <User size={20} />
                    <span className="text-[10px] font-bold mt-1">Account</span>
                </Link>
            </div>

            <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <Link 
                            to="/explore" 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-2xl font-bold text-white mb-4 flex items-center gap-2 hover:text-green-400 transition-colors inline-flex cursor-pointer"
                        >
                            <UtensilsCrossed className="text-green-500" /> RestoSys
                        </Link>
                        <p className="text-slate-400">The premium dining experience delivered directly to your table or doorstep.</p>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link to="/menu" className="hover:text-green-400 transition-colors">Browse Menu</Link></li>
                            <li><Link to="/reservations" className="hover:text-green-400 transition-colors">Book a Table</Link></li>
                            <li><Link to="/delivery/login" className="hover:text-emerald-400 text-slate-300 font-semibold transition-colors flex items-center gap-1.5"><Truck size={14} className="text-emerald-400" /> Delivery Partner Portal</Link></li>
                            <li><Link to="/login" className="hover:text-green-400 text-slate-400 transition-colors">Restaurant Owner & Staff Login</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Contact Us</h4>
                        <p className="text-slate-400">123 Culinary Ave, Food District</p>
                        <p className="text-slate-400">support@restosys.com</p>
                        <p className="text-slate-400">+1 234 567 8900</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CustomerLayout;
