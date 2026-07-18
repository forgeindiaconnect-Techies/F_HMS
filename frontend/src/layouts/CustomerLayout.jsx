import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, User, UtensilsCrossed, Heart } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';

const CustomerLayout = () => {
    const { user, logout } = useCustomerAuth();
    const { cartCount, setIsCartOpen } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
            <CartDrawer />
            
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link to="/explore" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
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

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors">
                            <Heart size={24} />
                        </button>
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
                        >
                            <ShoppingCart size={24} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        
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
            
            <main className="flex-grow">
                <Outlet />
            </main>

            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <UtensilsCrossed className="text-green-500" /> RestoSys
                        </h3>
                        <p className="text-gray-400">The premium dining experience delivered directly to your table or doorstep.</p>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link to="/menu" className="hover:text-green-400 transition-colors">Browse Menu</Link></li>
                            <li><Link to="/reservations" className="hover:text-green-400 transition-colors">Book a Table</Link></li>
                            <li><Link to="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
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
