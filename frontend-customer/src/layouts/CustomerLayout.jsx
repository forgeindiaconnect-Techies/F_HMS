import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, User, UtensilsCrossed, Heart, CalendarDays, ShoppingBag, Truck } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';
import WishlistDrawer from '../components/WishlistDrawer';

const CustomerLayout = () => {
    const { user, logout } = useCustomerAuth();
    const { cartCount, setIsCartOpen, wishlist, setIsWishlistOpen } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const location = useLocation();
    const isLandingPage = location.pathname === '/' || location.pathname === '/explore';

    return (
        <div className="min-h-screen flex flex-col font-sans relative bg-white text-slate-800">
            <CartDrawer />
            <WishlistDrawer />
            
            {!isLandingPage && (
                <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                onClick={() => window.history.back()}
                                className="md:hidden p-1.5 px-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 flex items-center gap-1 text-xs font-bold border border-slate-200 shadow-xs"
                                aria-label="Go Back"
                                title="Back"
                            >
                                <ArrowLeft size={16} />
                                <span className="text-[11px] font-bold">Back</span>
                            </button>
                            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                                <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shadow-md shadow-[#FF5A1F]/25 group-hover:scale-105 transition-transform">
                                    <UtensilsCrossed size={22} className="stroke-[2.2]" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[22px] font-black tracking-tight text-slate-900 leading-none">
                                        Food<span className="text-[#FF5A1F]">Nest</span>
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 mt-1">
                                        Good Food, Better Mood
                                    </span>
                                </div>
                            </Link>
                        </div>

                        <nav className="hidden lg:flex items-center gap-7 text-[15px] font-semibold">
                            <Link to="/explore" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">Home</Link>
                            <Link to="/explore#featured-restaurants" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">Restaurants</Link>
                            <Link to="/menu" className="relative py-1.5 text-[#FF5A1F] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full">Menu</Link>
                            <Link to="/explore#offers" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">Offers</Link>
                            <Link to="/explore#how-it-works" className="text-slate-600 hover:text-[#FF5A1F] transition-colors py-1.5">About Us</Link>
                        </nav>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button 
                                    onClick={() => setIsWishlistOpen(true)}
                                    className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#FF5A1F] transition-colors cursor-pointer"
                                    title="Wishlist"
                                >
                                    <Heart size={20} />
                                    {wishlist && wishlist.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setIsCartOpen(true)}
                                    className="relative w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#FF5A1F] transition-colors cursor-pointer"
                                    title="Cart"
                                >
                                    <ShoppingBag size={20} />
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
                                    className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] px-3.5 py-1.5 rounded-full text-xs font-bold border border-orange-200 transition-colors"
                                >
                                    <User size={14} className="shrink-0" />
                                    <span className="hidden sm:inline truncate max-w-[85px]">{user.name}</span>
                                </Link>
                            ) : (
                                <Link 
                                    to="/customer/login" 
                                    className="bg-[#FF5A1F] hover:bg-[#e04f1a] text-white px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] shadow-sm shadow-[#FF5A1F]/30 hover:shadow-md transition-all cursor-pointer"
                                >
                                    Login / Sign Up
                                </Link>
                            )}
                        </div>
                    </div>
                </header>
            )}
            
            <main className={`flex-grow ${isLandingPage ? 'pb-0' : 'pb-16 md:pb-0'}`}>
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation (only on internal app views) */}
            {!isLandingPage && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-2 flex justify-around items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <Link to="/explore" className="flex flex-col items-center text-slate-500 hover:text-[#FF5A1F] transition-colors">
                        <UtensilsCrossed size={20} />
                        <span className="text-[10px] font-bold mt-1">Explore</span>
                    </Link>
                    <Link to="/menu" className="flex flex-col items-center text-[#FF5A1F] transition-colors">
                        <ShoppingBag size={20} />
                        <span className="text-[10px] font-bold mt-1">Menu</span>
                    </Link>
                    <Link to="/reservations" className="flex flex-col items-center text-slate-500 hover:text-[#FF5A1F] transition-colors">
                        <CalendarDays size={20} />
                        <span className="text-[10px] font-bold mt-1">Booking</span>
                    </Link>
                    <Link to="/profile" className="flex flex-col items-center text-slate-500 hover:text-[#FF5A1F] transition-colors">
                        <User size={20} />
                        <span className="text-[10px] font-bold mt-1">Account</span>
                    </Link>
                </div>
            )}

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
