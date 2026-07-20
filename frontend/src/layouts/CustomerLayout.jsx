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
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
            <CartDrawer />
            <WishlistDrawer />
            
            <header className="bg-white shadow-sm sticky top-0 z-40">
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
                        <Link to="/explore" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">Home</Link>
                        <Link to="/menu" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">Menu</Link>
                        <Link to="/reservations" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">Reservations</Link>
                    </nav>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-0 sm:gap-4">
                            <button 
                                onClick={() => setIsWishlistOpen(true)}
                                className="relative p-1 sm:p-2 text-gray-600 hover:text-orange-600 transition-colors cursor-pointer animate-in fade-in"
                            >
                                <Heart size={24} />
                                {wishlist && wishlist.length > 0 && (
                                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-200">
                                        {wishlist.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-1 sm:p-2 text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
                            >
                                <ShoppingCart size={24} />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 w-5 h-5 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-200">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        
                        {user ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                                    className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold transition-colors"
                                >
                                    <User size={16} />
                                    {user.name}
                                </button>
                                
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                                        <Link 
                                            to="/profile" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors"
                                        >
                                            Profile
                                        </Link>
                                        <Link 
                                            to="/profile/orders" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors"
                                        >
                                            Orders
                                        </Link>
                                        <Link 
                                            to="/profile/reservations" 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors"
                                        >
                                            Table Booking History
                                        </Link>

                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/register" className="text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors">
                                    <span className="md:hidden">Sign Up</span>
                                    <span className="hidden md:inline">Register</span>
                                </Link>
                                <Link to="/login" className="flex items-center gap-1.5 md:gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 md:px-5 md:py-2 rounded-full font-bold transition-colors shadow-sm shadow-orange-600/20 text-sm md:text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    <User size={14} className="md:w-4 md:h-4" />
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2.5 px-6 flex justify-between items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <Link to="/explore" className="flex flex-col items-center text-gray-500 hover:text-orange-600 transition-colors">
                    <UtensilsCrossed size={20} />
                    <span className="text-[10px] font-bold mt-1">Explore</span>
                </Link>
                <Link to="/menu" className="flex flex-col items-center text-gray-500 hover:text-orange-600 transition-colors">
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-bold mt-1">Menu</span>
                </Link>
                <Link to="/reservations" className="flex flex-col items-center text-gray-500 hover:text-orange-600 transition-colors">
                    <CalendarDays size={20} />
                    <span className="text-[10px] font-bold mt-1">Booking</span>
                </Link>
                <Link to="/profile" className="flex flex-col items-center text-gray-500 hover:text-orange-600 transition-colors">
                    <User size={20} />
                    <span className="text-[10px] font-bold mt-1">Account</span>
                </Link>
            </div>

            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <Link 
                            to="/explore" 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-2xl font-bold text-white mb-4 flex items-center gap-2 hover:text-green-400 transition-colors inline-flex cursor-pointer"
                        >
                            <UtensilsCrossed className="text-green-500" /> RestoSys
                        </Link>
                        <p className="text-gray-400">The premium dining experience delivered directly to your table or doorstep.</p>
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
                        <p className="text-gray-400">123 Culinary Ave, Food District</p>
                        <p className="text-gray-400">support@restosys.com</p>
                        <p className="text-gray-400">+1 234 567 8900</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CustomerLayout;
