import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Users, CreditCard, ShoppingBag, TrendingUp, AlertCircle, ArrowRight, X, MessageSquare, Trash2, ShieldCheck, CheckCircle, Bell, Receipt, Search, Eye, Sparkles, Filter, Check, Calendar, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const { api } = useAuth();
    const location = useLocation();
    const [stats, setStats] = useState({
        totalRestaurants: 0,
        activeRestaurants: 0,
        frozenRestaurants: 0,
        totalUsers: 0,
        totalOrders: 0
    });
    const [restaurants, setRestaurants] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [billingDemos, setBillingDemos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRestaurant, setViewingRestaurant] = useState(null);
    const [restSearchQuery, setRestSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState('All');

    const calculateRemainingDays = (expiryDate) => {
        if (!expiryDate) return 'No expiry date set';
        const diffTime = new Date(expiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `Expired ${Math.abs(diffDays)} days ago`;
        }
        return `${diffDays} days remaining`;
    };

    const fetchDashboardData = async () => {
        try {
            const [statsRes, restsRes, verifsRes, inquiriesRes, ticketsRes, notifsRes, demosRes] = await Promise.all([
                api.get('/super-admin/stats').catch(() => ({ data: null })),
                api.get('/super-admin/restaurants').catch(() => ({ data: [] })),
                api.get('/restaurants/verification/all').catch(() => ({ data: [] })),
                api.get('/inquiries/admin').catch(() => ({ data: [] })),
                api.get('/super-admin/tickets').catch(() => ({ data: [] })),
                api.get('/super-admin/notifications').catch(() => ({ data: [] })),
                api.get('/billing-demos/admin').catch(() => ({ data: { data: [] } }))
            ]);
            if (statsRes.data) setStats(statsRes.data);
            setRestaurants(restsRes.data || []);
            setVerifications(verifsRes.data || []);
            setInquiries(inquiriesRes.data || []);
            setTickets(ticketsRes.data || []);
            setNotifications(notifsRes.data || []);
            setBillingDemos(demosRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch super admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [api]);

    useEffect(() => {
        if (location.hash === '#inquiries' && !loading) {
            const el = document.getElementById('inquiries');
            if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
            }
        }
    }, [location.hash, loading]);

    const handleApproveVerification = async (verifId, restaurantName) => {
        try {
            await api.put(`/restaurants/verification/${verifId}/review`, {
                status: 'Verified'
            });
            toast.success(`Approved "${restaurantName}"! Dashboard is now unlocked.`);
            fetchDashboardData();
        } catch (error) {
            console.error("Failed to approve verification", error);
            toast.error('Failed to approve verification');
        }
    };

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

    const handleDeleteInquiry = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the inquiry from "${name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await api.delete(`/inquiries/admin/${id}`);
            setInquiries(inquiries.filter(inq => inq._id !== id));
            toast.success('Inquiry deleted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete inquiry');
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

    const pendingVerifications = verifications.filter(v => 
        v.status === 'Pending' || v.status === 'Under Review' || v.restaurantId?.approvalStatus === 'Pending'
    );

    const upcomingExpirations = restaurants.filter(r => {
        if (!r.subscription?.expiryDate) return false;
        const diffTime = new Date(r.subscription.expiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && r.subscription?.status !== 'Cancelled';
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Billing Demo Requests Alert Banner */}
            {billingDemos.filter(d => d.status === 'Pending' || d.status === 'Demo Scheduled').length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3.5 text-blue-950">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                                <Receipt size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-black font-sans text-slate-900">
                                        Billing Demo & Custom POS Setup Requests
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                                        {billingDemos.filter(d => d.status === 'Pending' || d.status === 'Demo Scheduled').length} Action Required
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700 font-semibold mt-0.5">
                                    Restaurants waiting for walkthroughs, custom 12-module feature toggling, live preview, and 1-click dashboard activation.
                                </p>
                            </div>
                        </div>
                        <Link 
                            to="/super-admin/billing-demos" 
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 shrink-0 hover:-translate-y-0.5"
                        >
                            Review & Configure <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Pending Restaurant Verifications Banner */}
            {pendingVerifications.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-amber-900">
                            <ShieldCheck size={26} className="text-amber-600 shrink-0 animate-pulse" />
                            <div>
                                <h3 className="text-base sm:text-lg font-black font-sans">Pending Restaurant Verification Requests ({pendingVerifications.length})</h3>
                                <p className="text-xs text-amber-700 font-semibold">New restaurants subscribed and awaiting Super Admin approval before unlocking their dashboard.</p>
                            </div>
                        </div>
                        <Link to="/super-admin/verifications" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                            Manage Verifications <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingVerifications.map(v => (
                            <div key={v._id} className="bg-white border border-amber-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block mb-0.5">REQUESTED PLAN: {v.restaurantId?.subscription?.plan || 'Basic'}</span>
                                        <h4 className="font-black text-slate-900 text-base">{v.restaurantId?.name || 'Unnamed Restaurant'}</h4>
                                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Owner: {v.restaurantId?.ownerId?.name || 'N/A'}</p>
                                        <p className="text-[11px] font-medium text-slate-400">{v.restaurantId?.ownerId?.email || 'N/A'}</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                        {v.status || 'Pending'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => handleApproveVerification(v._id, v.restaurantId?.name || 'Restaurant')}
                                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle size={14} /> Approve & Unlock Dashboard
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Expiry Alerts */}
            {upcomingExpirations.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-red-700">
                            <AlertCircle size={24} className="shrink-0 animate-bounce" />
                            <div>
                                <h3 className="text-base sm:text-lg font-bold">Subscription Renewal Alerts</h3>
                                <p className="text-xs sm:text-sm text-red-600">The following restaurants have subscriptions expiring soon or expired.</p>
                            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-6">
                {[
                    { label: 'Total SaaS Revenue (MRR)', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Order Commission Earned', value: `₹${(stats.totalCommission || 0).toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Active Restaurants', value: stats.activeRestaurants || 0, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Frozen Accounts', value: stats.frozenRestaurants || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Total Platform Users', value: stats.totalUsers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-3.5 sm:gap-5 transition-all hover:-translate-y-1 hover:shadow-md">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
                                <Icon size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block leading-tight break-words">{stat.label}</p>
                                <h3 className="text-lg sm:text-xl font-black text-gray-900 truncate">{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Subscribed Platform Restaurants Management */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-sans tracking-tight">Active Subscribed Restaurants</h2>
                                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-blue-100 text-blue-700 border border-blue-200">
                                    {restaurants.length} Subscribed Outlets
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">All verified platform restaurants with active subscriptions, plan tiers, and billing status.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/super-admin/restaurants" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">
                                Full Registry <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by restaurant name, owner, city or phone..."
                                value={restSearchQuery}
                                onChange={(e) => setRestSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {restSearchQuery && (
                                <button onClick={() => setRestSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Plan Filter Badges */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
                            {[
                                { key: 'All', label: 'All Plans', count: restaurants.length },
                                { key: 'Enterprise', label: 'Enterprise', count: restaurants.filter(r => (r.subscription?.plan || '').toLowerCase() === 'enterprise').length },
                                { key: 'Pro', label: 'Pro', count: restaurants.filter(r => ['pro', 'professional'].includes((r.subscription?.plan || '').toLowerCase())).length },
                                { key: 'Basic', label: 'Basic', count: restaurants.filter(r => ['basic', 'starter'].includes((r.subscription?.plan || '').toLowerCase())).length },
                                { key: 'Custom POS', label: 'Custom Setup', count: restaurants.filter(r => r.billingConfig?.isCustomBillingActive).length },
                            ].map((tab) => {
                                const isActive = planFilter === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setPlanFilter(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                            isActive
                                                ? 'bg-gray-900 text-white shadow-sm'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-4 font-bold">Restaurant & Location</th>
                                <th className="p-4 font-bold">Owner & Contact</th>
                                <th className="p-4 font-bold">Plan & MRR</th>
                                <th className="p-4 font-bold">POS Setup</th>
                                <th className="p-4 font-bold">Renewal Status</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {restaurants
                                .filter(r => {
                                    const plan = (r.subscription?.plan || 'Basic').toLowerCase();
                                    let matchesPlan = true;
                                    if (planFilter === 'Enterprise') matchesPlan = plan === 'enterprise';
                                    else if (planFilter === 'Pro') matchesPlan = plan === 'pro' || plan === 'professional';
                                    else if (planFilter === 'Basic') matchesPlan = plan === 'basic' || plan === 'starter';
                                    else if (planFilter === 'Custom POS') matchesPlan = Boolean(r.billingConfig?.isCustomBillingActive);

                                    if (!matchesPlan) return false;

                                    if (!restSearchQuery.trim()) return true;
                                    const q = restSearchQuery.toLowerCase();
                                    const name = (r.name || '').toLowerCase();
                                    const ownerName = (r.ownerId?.name || '').toLowerCase();
                                    const ownerEmail = (r.ownerId?.email || '').toLowerCase();
                                    const address = (r.address || '').toLowerCase();
                                    const phone = (r.phone || '').toLowerCase();
                                    return name.includes(q) || ownerName.includes(q) || ownerEmail.includes(q) || address.includes(q) || phone.includes(q);
                                })
                                .map(restaurant => {
                                    const planLower = (restaurant.subscription?.plan || 'basic').toLowerCase();
                                    const isEnterprise = planLower === 'enterprise';
                                    const isPro = planLower === 'pro' || planLower === 'professional';
                                    const planPrice = restaurant.subscription?.price 
                                        ? `₹${restaurant.subscription.price.toLocaleString('en-IN')}` 
                                        : isEnterprise ? '₹12,999' : isPro ? '₹5,999' : '₹2,999';
                                    const cycle = restaurant.subscription?.billingCycle || 'monthly';
                                    const expiry = restaurant.subscription?.expiryDate;
                                    let diffDays = null;
                                    if (expiry) {
                                        diffDays = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
                                    }
                                    const hasCustomPOS = Boolean(restaurant.billingConfig?.isCustomBillingActive);
                                    const outletFormat = restaurant.billingConfig?.outletFormat || restaurant.posConfig?.outletFormat || 'Restaurant';

                                    return (
                                        <tr key={restaurant._id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                        {restaurant.logo ? (
                                                            <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-base">
                                                                {restaurant.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block text-sm">{restaurant.name}</span>
                                                        <span className="text-[11px] font-semibold text-gray-500 block">{outletFormat}</span>
                                                        {restaurant.address && (
                                                            <span className="text-[10px] text-gray-400 block truncate max-w-[180px]">{restaurant.address}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs font-bold text-gray-900">{restaurant.ownerId?.name || 'Authorized Admin'}</div>
                                                <div className="text-[11px] text-gray-500">{restaurant.ownerId?.email || 'N/A'}</div>
                                                {restaurant.phone && (
                                                    <div className="text-[10px] text-gray-400 font-medium">📞 {restaurant.phone}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                                                        isEnterprise 
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                            : isPro 
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}>
                                                        {restaurant.subscription?.plan || 'Basic'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-gray-700">
                                                        {planPrice}<span className="text-[10px] text-gray-400 font-normal">/{cycle === 'yearly' ? 'yr' : 'mo'}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {hasCustomPOS ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                                                        <Sparkles size={12} className="text-emerald-600" /> Custom POS
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium">
                                                        Standard POS
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {diffDays !== null ? (
                                                    <div>
                                                        <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold inline-block border ${
                                                            diffDays < 0
                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                : diffDays <= 7
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}>
                                                            {diffDays < 0 ? `Expired ${Math.abs(diffDays)}d ago` : diffDays === 0 ? 'Expires today' : `${diffDays} days left`}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block mt-0.5">
                                                            {new Date(expiry).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium">Ongoing</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                                                    restaurant.subscription?.status === 'Active' 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {restaurant.subscription?.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setViewingRestaurant(restaurant)}
                                                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                                        title="View Full Profile & Subscription"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFreezeAccount(restaurant._id, restaurant.subscription?.status)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                                            restaurant.subscription?.status === 'Active' 
                                                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                                                        }`}
                                                    >
                                                        {restaurant.subscription?.status === 'Active' ? 'Freeze' : 'Unfreeze'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {restaurants.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center">
                                        <Store className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-500 font-medium text-lg">No restaurants registered yet.</p>
                                    </td>
                                </tr>
                            )}
                            {restaurants.length > 0 && restaurants.filter(r => {
                                const plan = (r.subscription?.plan || 'Basic').toLowerCase();
                                if (planFilter === 'Enterprise' && plan !== 'enterprise') return false;
                                if (planFilter === 'Pro' && !['pro', 'professional'].includes(plan)) return false;
                                if (planFilter === 'Basic' && !['basic', 'starter'].includes(plan)) return false;
                                if (planFilter === 'Custom POS' && !r.billingConfig?.isCustomBillingActive) return false;
                                if (!restSearchQuery.trim()) return true;
                                const q = restSearchQuery.toLowerCase();
                                return (r.name || '').toLowerCase().includes(q) || (r.ownerId?.name || '').toLowerCase().includes(q);
                            }).length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        No subscribed restaurants match your filter or search query.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        {/* Public Inquiries Section */}
        <div id="inquiries" className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-sans tracking-tight">Public Inquiries & Demo Leads</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                            {inquiries.length} {inquiries.length === 1 ? 'Lead' : 'Leads'}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Walkthrough demo bookings and sales inquiries submitted from landing pages.</p>
                </div>
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
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleUpdateInquiryStatus(inq._id, inq.status)}
                                            className="px-3.5 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all active:scale-[0.97]"
                                        >
                                            {inq.status === 'New' ? 'Start Progress' : inq.status === 'In Progress' ? 'Resolve' : 'Reopen'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteInquiry(inq._id, inq.name)}
                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all active:scale-[0.97]"
                                            title="Delete Inquiry"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-gray-50/50">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-sans tracking-tight">Customer Support Enquiries (Tickets)</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Support tickets submitted by registered restaurant partners/customers.</p>
                </div>
                <Link to="/super-admin/support" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl self-start sm:self-auto">
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

        {/* System & Broadcast Notifications Preview */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Recent System Notifications</h2>
                    <p className="text-sm text-gray-500 mt-1">Platform broadcasts, system alerts, and automated activity notifications.</p>
                </div>
                <Link to="/super-admin/notifications" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl">
                    View Full Notifications <ArrowRight size={16} />
                </Link>
            </div>
            <div className="divide-y divide-gray-50">
                {notifications.slice(0, 5).map(n => (
                    <div key={n._id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bell size={18} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900 text-sm">{n.title}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">{n.type || 'System'}</span>
                                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{n.desc}</p>
                            </div>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium shrink-0">
                            {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <div className="p-10 text-center">
                        <Bell className="mx-auto text-gray-300 mb-3" size={40} />
                        <p className="text-gray-500 font-medium text-lg">No notifications found.</p>
                    </div>
                )}
            </div>
        </div>

            {/* View Details Modal */}
            {viewingRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setViewingRestaurant(null)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Restaurant Subscription & Profile</h3>
                                <p className="text-xs text-gray-500">Comprehensive membership and POS configuration details</p>
                            </div>
                            <button onClick={() => setViewingRestaurant(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                    {viewingRestaurant.logo ? (
                                        <img src={viewingRestaurant.logo} alt={viewingRestaurant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-2xl">
                                            {viewingRestaurant.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-lg font-black text-gray-900 truncate">{viewingRestaurant.name}</h4>
                                    <p className="text-xs text-gray-600 font-semibold mt-0.5">Owner: {viewingRestaurant.ownerId?.name || 'Partner Admin'}</p>
                                    <p className="text-[11px] text-gray-500 truncate">{viewingRestaurant.ownerId?.email || 'N/A'}</p>
                                    {viewingRestaurant.phone && (
                                        <p className="text-[11px] text-gray-500">📞 {viewingRestaurant.phone}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Subscription Tier:</span>
                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-lg border border-purple-200">
                                        {viewingRestaurant.subscription?.plan || 'Basic'} Tier
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Billing Cycle:</span>
                                    <span className="text-gray-900 font-bold capitalize">
                                        {viewingRestaurant.subscription?.billingCycle || 'monthly'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Recurring Price:</span>
                                    <span className="text-gray-900 font-black">
                                        ₹{(viewingRestaurant.subscription?.price || (
                                            (viewingRestaurant.subscription?.plan || '').toLowerCase() === 'enterprise' ? 12999 :
                                            (viewingRestaurant.subscription?.plan || '').toLowerCase() === 'pro' ? 5999 : 2999
                                        )).toLocaleString('en-IN')} / {viewingRestaurant.subscription?.billingCycle === 'yearly' ? 'year' : 'month'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Subscription Status:</span>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                                        viewingRestaurant.subscription?.status === 'Active' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {viewingRestaurant.subscription?.status || 'Active'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Member Since:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.createdAt ? new Date(viewingRestaurant.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Next Renewal:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.subscription?.expiryDate ? new Date(viewingRestaurant.subscription?.expiryDate).toLocaleDateString() : 'Perpetual'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-2.5">
                                    <span className="text-gray-500 font-medium">Renewal Countdown:</span>
                                    <span className="font-black text-blue-600">
                                        {calculateRemainingDays(viewingRestaurant.subscription?.expiryDate)}
                                    </span>
                                </div>
                            </div>

                            {/* Custom Billing POS Details */}
                            {viewingRestaurant.billingConfig?.isCustomBillingActive && (
                                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-2 mt-3">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                                        <Sparkles size={14} className="text-emerald-600" />
                                        Custom POS Architecture Active
                                    </div>
                                    <p className="text-xs text-gray-700">
                                        <span className="font-semibold">Format:</span> {viewingRestaurant.billingConfig?.outletFormat || 'Custom Outlet'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {Object.entries(viewingRestaurant.billingConfig?.modules || {})
                                            .filter(([_, active]) => active)
                                            .map(([mod]) => (
                                                <span key={mod} className="px-2 py-0.5 bg-white text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                                                    ✓ {mod.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {viewingRestaurant.address && (
                                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-xs text-gray-600">
                                    <span className="font-bold text-gray-700 block mb-0.5">Location / Address:</span>
                                    {viewingRestaurant.address}
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setViewingRestaurant(null)}
                                className="w-full mt-2 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
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
