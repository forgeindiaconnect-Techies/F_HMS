import { useState, useEffect } from 'react';
import { Gift, Clock, Star, MapPin, ChevronRight, ShoppingBag, Heart } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
    const { user, logout } = useCustomerAuth();
    const [reservations, setReservations] = useState([]);

    useEffect(() => {
        const localRes = JSON.parse(localStorage.getItem('customerReservations') || '[]');
        const defaultReservations = [
            { date: 'Oct 10, 2026', time: '8:00 PM', guests: 4, type: 'Outdoor', status: 'Completed', statusColor: 'bg-gray-100 text-gray-600 border-gray-200' },
            { date: 'Sep 24, 2026', time: '1:00 PM', guests: 2, type: 'Bar', status: 'Completed', statusColor: 'bg-gray-100 text-gray-600 border-gray-200' }
        ];
        setReservations([...localRes, ...defaultReservations]);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Welcome */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                        <span className="text-3xl font-bold text-orange-600 font-sans">
                            {user?.name?.charAt(0) || 'C'}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight">
                            Welcome back, {user?.name || 'Foodie'}!
                        </h1>
                        <p className="text-gray-500 mt-1">Ready for your next culinary adventure?</p>
                    </div>
                </div>
                <div className="flex gap-4">

                    <Link 
                        to="/menu"
                        className="px-6 py-2.5 rounded-full bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
                    >
                        Order Now <ChevronRight size={18} />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Loyalty & Quick Stats */}
                <div className="space-y-8">
                    {/* Loyalty Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/30 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-orange-400 mb-6 font-bold tracking-widest text-xs uppercase">
                                <Star size={16} className="fill-orange-400" /> Gold Member
                            </div>
                            <h2 className="text-5xl font-bold font-sans tracking-tighter mb-2">2,450</h2>
                            <p className="text-gray-400 text-sm">Resto Rewards Points</p>
                            
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-sm font-medium mb-3 flex justify-between">
                                    <span>Progress to Platinum</span>
                                    <span className="text-orange-400">550 pts needed</span>
                                </p>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 w-[80%] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Coupons */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-orange-500" /> Available Offers
                        </h3>
                        <div className="space-y-3">
                            <div className="border border-orange-100 bg-orange-50/50 rounded-2xl p-4 flex justify-between items-center border-dashed">
                                <div>
                                    <p className="font-bold text-orange-900">20% OFF WEEKEND</p>
                                    <p className="text-xs text-orange-700/70 mt-1">Valid until Sunday</p>
                                </div>
                                <button className="text-xs font-bold bg-white text-orange-600 px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                                    Copy
                                </button>
                            </div>
                            <div className="border border-gray-100 bg-gray-50 rounded-2xl p-4 flex justify-between items-center border-dashed">
                                <div>
                                    <p className="font-bold text-gray-900">FREE DESSERT</p>
                                    <p className="text-xs text-gray-500 mt-1">On orders over ₹50</p>
                                </div>
                                <button className="text-xs font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle & Right Column: Orders & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Recent Orders */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 font-sans">Recent Orders</h3>
                            <Link to="/profile/orders" className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: '#ORD-8821', date: 'Yesterday', items: 'Ribeye Steak, Craft IPA', total: '₹42.00', status: 'Delivered' },
                                { id: '#ORD-8805', date: 'Oct 12, 2026', items: 'Paneer Tikka, Green Wrap', total: '₹28.50', status: 'Delivered' }
                            ].map((order, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{order.items}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{order.id} • {order.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                        <span className="font-bold text-gray-900">{order.total}</span>
                                        <button className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                                            Reorder
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Reservation History */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">Reservation History</h3>
                            </div>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
                                {reservations.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-400 font-medium bg-gray-50 rounded-2xl">
                                        No reservations made yet.
                                    </div>
                                ) : (
                                    reservations.map((res, i) => (
                                        <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs sm:text-sm">
                                            <div>
                                                <p className="font-bold text-gray-900">{res.date} • {res.time}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Table for {res.guests} ({res.type})</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs font-bold border rounded-lg ${res.statusColor}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Favorite Items */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900">Your Favorites</h3>
                                <Link to="/menu" className="text-xs font-bold text-orange-600">Browse Menu</Link>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'Avocado Bowl', price: '₹15.00' },
                                    { name: 'Crispy Calamari', price: '₹12.00' }
                                ].map((fav, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Heart size={16} className="fill-red-500 text-red-500" />
                                            <span className="font-medium text-gray-900 text-sm">{fav.name}</span>
                                        </div>
                                        <button className="text-xs font-bold text-orange-600">Add</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
