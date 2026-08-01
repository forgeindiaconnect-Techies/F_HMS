import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Users, CreditCard, ShoppingBag, TrendingUp, AlertCircle, ArrowRight, X, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const { api } = useAuth();
    const [stats, setStats] = useState({
        totalRestaurants: 0,
        activeRestaurants: 0,
        frozenRestaurants: 0,
        totalUsers: 0,
        totalOrders: 0
    });
    const [restaurants, setRestaurants] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRestaurant, setViewingRestaurant] = useState(null);

    const calculateRemainingDays = (expiryDate) => {
        if (!expiryDate) return 'No expiry date set';
        const diffTime = new Date(expiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `Expired ${Math.abs(diffDays)} days ago`;
        }
        return `${diffDays} days remaining`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, restsRes, inquiriesRes, ticketsRes] = await Promise.all([
                    api.get('/super-admin/stats'),
                    api.get('/super-admin/restaurants'),
                    api.get('/inquiries/admin'),
                    api.get('/super-admin/tickets')
                ]);
                setStats(statsRes.data);
                setRestaurants(restsRes.data);
                setInquiries(inquiriesRes.data);
                setTickets(ticketsRes.data);
            } catch (error) {
                console.error("Failed to fetch super admin data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [api]);

    const handleUpdateInquiryStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'New' ? 'In Progress' : currentStatus === 'In Progress' ? 'Resolved' : 'New';
        try {
            await api.put(`/inquiries/admin/${id}`, { status: nextStatus });
            setInquiries(inquiries.map(inq => 
                inq._id === id ? { ...inq, status: nextStatus } : inq
            ));
            toast.success(`Inquiry status updated to ${nextStatus}!`);
        } catch (error) {
            toast.error('Failed to update inquiry status');
        }
    };

    const handleUpdateTicketStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'Open' ? 'In Progress' : currentStatus === 'In Progress' ? 'Resolved' : 'Open';
        try {
            await api.put(`/super-admin/tickets/${id}`, { status: nextStatus });
            setTickets(tickets.map(tkt => 
                tkt._id === id ? { ...tkt, status: nextStatus } : tkt
            ));
            toast.success(`Ticket status updated to ${nextStatus}!`);
        } catch (error) {
            toast.error('Failed to update ticket status');
        }
    };

    const handleFreezeAccount = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Frozen' : 'Active';
        try {
            await api.put(`/super-admin/restaurants/${id}/subscription`, { status: newStatus });
            setRestaurants(restaurants.map(r => 
                r._id === id ? { ...r, subscription: { ...r.subscription, status: newStatus } } : r
            ));
            toast.success(`Account status updated to ${newStatus}!`);
        } catch (error) {
            toast.error('Failed to update subscription');
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    const upcomingExpirations = restaurants.filter(r => {
        if (!r.subscription?.expiryDate) return false;
        const diffTime = new Date(r.subscription.expiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && r.subscription.status === 'Active';
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Expiry Alerts */}
            {upcomingExpirations.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-700">
                        <AlertCircle size={24} className="shrink-0 animate-bounce" />
                        <div>
                            <h3 className="text-lg font-bold">Subscription Renewal Alerts</h3>
                            <p className="text-sm text-red-600">The following restaurants have subscriptions expiring soon or expired.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingExpirations.map(r => {
                            const diffTime = new Date(r.subscription.expiryDate) - new Date();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return (
                                <div 
                                    key={r._id} 
                                    className="flex justify-between items-center bg-white border border-red-100/50 p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:border-red-200 transition-all"
                                    onClick={() => setViewingRestaurant(r)}
                                    title="Click to view subscription details"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg shrink-0 border border-red-200 overflow-hidden">
                                            {r.logo ? (
                                                <img src={r.logo} alt={r.name} className="w-full h-full object-cover" />
                                            ) : (
                                                r.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 block">{r.name}</span>
                                            <span className="text-xs text-gray-500 font-medium">Plan: {r.subscription.plan}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold inline-block ${
                                            diffDays < 0 
                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                                        }`}>
                                            {diffDays < 0 
                                                ? `Expired ${Math.abs(diffDays)}d ago` 
                                                : diffDays === 0 
                                                    ? 'Expires today!' 
                                                    : `Expires in ${diffDays}d`
                                            }
                                        </span>
                                        <span className="text-[10px] text-gray-400 block mt-1">End: {new Date(r.subscription.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total SaaS Revenue (MRR)', value: '₹12,450', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Active Restaurants', value: stats.activeRestaurants, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Frozen Accounts', value: stats.frozenRestaurants, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Total Platform Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:-translate-y-1 hover:shadow-md">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
                                <Icon size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Onboarded Restaurants Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Recent Onboarded Restaurants</h2>
                        <p className="text-sm text-gray-500 mt-1">Restaurants that have recently joined the platform.</p>
                    </div>
                    <Link to="/super-admin/restaurants" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-5 font-bold">Restaurant</th>
                                <th className="p-5 font-bold">Plan</th>
                                <th className="p-5 font-bold">Status</th>
                                <th className="p-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {restaurants.slice(0, 5).map(restaurant => (
                                <tr key={restaurant._id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                {restaurant.logo ? (
                                                    <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                                                        {restaurant.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block text-base">{restaurant.name}</span>
                                                <span className="text-xs text-gray-600 block font-semibold">Owner: {restaurant.ownerId?.name || 'N/A'}</span>
                                                <span className="text-[11px] text-gray-400 block">{restaurant.ownerId?.email || 'No Owner'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                                            {restaurant.subscription?.plan || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                                            restaurant.subscription?.status === 'Active' 
                                            ? 'bg-green-50 text-green-700 border-green-100' 
                                            : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {restaurant.subscription?.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button 
                                            onClick={() => handleFreezeAccount(restaurant._id, restaurant.subscription?.status)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                                restaurant.subscription?.status === 'Active' 
                                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                                            }`}
                                        >
                                            {restaurant.subscription?.status === 'Active' ? 'Freeze' : 'Unfreeze'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {restaurants.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center">
                                        <Store className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-500 font-medium text-lg">No restaurants registered yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        {/* Public Inquiries Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Public Inquiries & Leads</h2>
                <p className="text-sm text-gray-500 mt-1">Inquiries submitted from the landing page contact form.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="p-5 font-bold">Contact Details</th>
                            <th className="p-5 font-bold">Subject</th>
                            <th className="p-5 font-bold">Message</th>
                            <th className="p-5 font-bold">Status</th>
                            <th className="p-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {inquiries.map(inq => (
                            <tr key={inq._id} className="hover:bg-gray-50/80 transition-colors text-sm">
                                <td className="p-5">
                                    <div>
                                        <span className="font-bold text-gray-900 block">{inq.name}</span>
                                        <span className="text-xs text-gray-500 block font-semibold">{inq.restaurantName}</span>
                                        <span className="text-[11px] text-gray-400 block">{inq.email}</span>
                                        <span className="text-[11px] text-gray-500 block font-semibold">📞 {inq.phone}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                        inq.subject === 'Sales' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        inq.subject === 'Support' ? 'bg-red-50 text-red-700 border-red-100' :
                                        inq.subject === 'Demo' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        'bg-gray-50 text-gray-700 border-gray-100'
                                    }`}>
                                        {inq.subject}
                                    </span>
                                </td>
                                <td className="p-5 max-w-xs">
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-3" title={inq.message}>
                                        {inq.message}
                                    </p>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                                        inq.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                                        inq.status === 'In Progress' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                        'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                        {inq.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right whitespace-nowrap">
                                    <button 
                                        onClick={() => handleUpdateInquiryStatus(inq._id, inq.status)}
                                        className="px-3.5 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all active:scale-[0.97]"
                                    >
                                        {inq.status === 'New' ? 'Start Progress' : inq.status === 'In Progress' ? 'Resolve' : 'Reopen'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {inquiries.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-10 text-center">
                                    <MessageSquare className="mx-auto text-gray-300 mb-3" size={40} />
                                    <p className="text-gray-500 font-medium text-lg">No inquiries received yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Customer Support Enquiries (Tickets) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Customer Support Enquiries (Tickets)</h2>
                    <p className="text-sm text-gray-500 mt-1">Support tickets submitted by registered restaurant partners/customers.</p>
                </div>
                <Link to="/super-admin/support" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl">
                    Open Support Console <ArrowRight size={16} />
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="p-5 font-bold">Ticket ID / Restaurant</th>
                            <th className="p-5 font-bold">Category</th>
                            <th className="p-5 font-bold">Priority</th>
                            <th className="p-5 font-bold">Subject / Description</th>
                            <th className="p-5 font-bold">Status</th>
                            <th className="p-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tickets.slice(0, 10).map(tkt => (
                            <tr key={tkt._id} className="hover:bg-gray-50/80 transition-colors text-sm">
                                <td className="p-5">
                                    <div>
                                        <span className="font-bold text-blue-600 block">{tkt.ticketId}</span>
                                        <span className="text-xs text-gray-900 block font-semibold">{tkt.restaurantId?.name || 'Platform Customer'}</span>
                                        <span className="text-[11px] text-gray-450 block">{tkt.restaurantId?.email || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                                        {tkt.category}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                                        tkt.priority === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                        tkt.priority === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                        tkt.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                        {tkt.priority}
                                    </span>
                                </td>
                                <td className="p-5 max-w-xs">
                                    <div>
                                        <span className="font-bold text-gray-900 block truncate">{tkt.subject}</span>
                                        <span className="text-xs text-gray-500 line-clamp-2 mt-0.5" title={tkt.description}>{tkt.description}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                                        tkt.status === 'Resolved' || tkt.status === 'Closed' ? 'bg-green-50 text-green-700 border-green-100' :
                                        tkt.status === 'In Progress' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                        'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                        {tkt.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right whitespace-nowrap space-x-2">
                                    <button 
                                        onClick={() => handleUpdateTicketStatus(tkt._id, tkt.status)}
                                        className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all active:scale-[0.97]"
                                    >
                                        {tkt.status === 'Open' ? 'In Progress' : tkt.status === 'In Progress' ? 'Resolve' : 'Reopen'}
                                    </button>
                                    <Link 
                                        to={`/super-admin/support/tickets/${tkt._id}`}
                                        className="px-3 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all active:scale-[0.97] inline-block"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-10 text-center">
                                    <MessageSquare className="mx-auto text-gray-300 mb-3" size={40} />
                                    <p className="text-gray-500 font-medium text-lg">No support enquiries received yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

            {/* View Details Modal */}
            {viewingRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setViewingRestaurant(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Restaurant Subscription Details</h3>
                            <button onClick={() => setViewingRestaurant(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                    {viewingRestaurant.logo ? (
                                        <img src={viewingRestaurant.logo} alt={viewingRestaurant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-2xl">
                                            {viewingRestaurant.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">{viewingRestaurant.name}</h4>
                                    <p className="text-sm text-gray-700 font-medium">Owner: {viewingRestaurant.ownerId?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{viewingRestaurant.ownerId?.email || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Subscription Plan:</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                        {viewingRestaurant.subscription?.plan || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Subscription Status:</span>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                        viewingRestaurant.subscription?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {viewingRestaurant.subscription?.status || 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Start Date:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.createdAt ? new Date(viewingRestaurant.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Expiry / End Date:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.subscription?.expiryDate ? new Date(viewingRestaurant.subscription?.expiryDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
                                    <span className="text-gray-500 font-medium">Subscription Period:</span>
                                    <span className={`font-bold ${
                                        viewingRestaurant.subscription?.expiryDate && (new Date(viewingRestaurant.subscription?.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) <= 7
                                        ? 'text-red-600'
                                        : 'text-gray-900'
                                    }`}>
                                        {calculateRemainingDays(viewingRestaurant.subscription?.expiryDate)}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setViewingRestaurant(null)}
                                className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
