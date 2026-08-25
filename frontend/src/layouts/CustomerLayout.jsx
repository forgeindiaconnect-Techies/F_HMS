import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, User, UtensilsCrossed, Heart, CalendarDays, ShoppingBag } from 'lucide-react';
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
            
            <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link to="/explore" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 sm:gap-3 group mr-3 sm:mr-0 shrink-0">
                        <div className="bg-orange-500 text-white p-2 rounded-lg group-hover:scale-105 transition-transform">
                            <UtensilsCrossed size={24} />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-300 transition-colors">
                            RestoSys
                        </h1>
                    </Link>

                    <nav className="hidden md:flex gap-8">
                        <Link to="/explore" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">Home</Link>
                        <Link to="/menu" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">Menu</Link>
                        <Link to="/reservations" className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors">Reservations</Link>
                    </nav>

                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button 
                                onClick={() => setIsWishlistOpen(true)}
                                className="relative p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer animate-in fade-in"
                            >
                                <Heart size={22} />
                                {wishlist && wishlist.length > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-in zoom-in duration-200">
                                        {wishlist.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                            >
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900 animate-in zoom-in duration-200">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        
                        {user ? (
                            <Link 
                                to="/profile" 
                                className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 p-2 sm:px-4 sm:py-2 rounded-full font-bold transition-colors"
                            >
                                <User size={16} className="shrink-0" />
                                <span className="hidden sm:inline truncate max-w-[80px]">{user.name}</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/customer/register" className="hidden sm:inline text-sm font-bold text-slate-650 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                                    Register
                                </Link>
                                <Link to="/customer/login" className="flex items-center gap-1 bg-orange-600 hover:bg-orange-750 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-colors shadow-sm shadow-orange-600/20 text-xs sm:text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    <User size={12} className="shrink-0" />
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>
            
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
