import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
    MessageSquare, CheckCircle, Clock, Star, Users, 
    TrendingUp, LifeBuoy, Search, ArrowRight, ShieldAlert,
    BookOpen, Sparkles, Calendar
} from 'lucide-react';

const CustomerCareDashboard = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [trend, setTrend] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [platformTickets, setPlatformTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kbSearch, setKbSearch] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            const capTimer = setTimeout(() => setLoading(false), 2000);
            try {
                const [statsRes, announceRes, ticketsRes] = await Promise.all([
                    api.get('/support/analytics').catch(err => {
                        console.warn('Analytics fetch warning:', err);
                        return { data: { summary: null, categories: [], trend: [] } };
                    }),
                    api.get('/support/announcements').catch(err => {
                        console.warn('Announcements fetch warning:', err);
                        return { data: [] };
                    }),
                    api.get('/support/tickets').catch(err => {
                        console.warn('Platform tickets fetch warning:', err);
                        return { data: [] };
                    })
                ]);
                
                if (statsRes && statsRes.data) {
                    setStats(statsRes.data.summary || null);
                    setCategories(statsRes.data.categories || []);
                    setTrend(statsRes.data.trend || []);
                }

                if (announceRes && Array.isArray(announceRes.data)) {
                    setAnnouncements(announceRes.data.slice(0, 3));
                }

                if (ticketsRes && Array.isArray(ticketsRes.data)) {
                    setPlatformTickets(ticketsRes.data);
                }
            } catch (error) {
                console.error('Failed to load support dashboard data:', error);
            } finally {
                clearTimeout(capTimer);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [api]);

    const handleSearchKb = (e) => {
        e.preventDefault();
        if (kbSearch.trim()) {
            navigate(`/admin/support/knowledge-base?search=${encodeURIComponent(kbSearch)}`);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-sans">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading Support Dashboard...</p>
            </div>
        );
    }

    // Default stats values if empty
    const summary = stats || {
        totalOpen: 0,
        totalAssigned: 0,
        totalInProgress: 0,
        totalWaiting: 0,
        totalResolved: 0,
        totalClosed: 0,
        totalCritical: 0,
        avgCsat: 0,
        totalRated: 0,
        activeAgentsCount: 0,
        createdThisWeek: 0,
        resolvedThisWeek: 0,
        avgResolutionTime: 0
    };

    const statCards = [
        { title: 'Open Tickets', value: summary.totalOpen, icon: LifeBuoy, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/50' },
        { title: 'In Progress', value: summary.totalInProgress + summary.totalAssigned, icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50' },
        { title: 'Waiting on Support', value: summary.totalWaiting, icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900/50' },
        { title: 'Resolved & Closed', value: summary.totalResolved + summary.totalClosed, icon: CheckCircle, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-100 dark:border-green-900/50' },
        { title: 'Critical Tickets', value: summary.totalCritical, icon: ShieldAlert, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/50 animate-pulse' },
        { title: 'CSAT Rating', value: summary.avgCsat ? `${summary.avgCsat} / 5` : 'N/A', icon: Star, color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-100 dark:border-yellow-900/50' },
        { title: 'Active Agents', value: summary.activeAgentsCount, icon: Users, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-100 dark:border-teal-900/50' },
        { title: 'Avg Resolution Time', value: summary.avgResolutionTime ? `${summary.avgResolutionTime}m` : 'N/A', icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50' }
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-slate-100">
            {/* Top Navigation Switcher: Admin & Customer vs Admin & Super Admin */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-slate-900/80 rounded-2xl w-fit border border-gray-200/80 dark:border-slate-800 shadow-inner">
                <Link
                    to="/admin/support/customer"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                    <MessageSquare size={16} />
                    <span>Admin & Customer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Diner Inquiries
                    </span>
                </Link>

                <button
                    type="button"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md transition-all cursor-default"
                >
                    <LifeBuoy size={16} />
                    <span>Admin & Super Admin</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Platform SLA
                    </span>
                </button>
            </div>

            {/* Header section with styling */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-8">
                    <LifeBuoy size={300} />
                </div>
                <div className="space-y-2 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={12} /> FoodNest Platform SLA Included
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black font-sans leading-tight">FoodNest Platform & Super Admin Helpdesk</h1>
                    <p className="text-slate-300 max-w-xl text-xs sm:text-sm leading-relaxed">
                        Welcome to your dedicated platform support hub. Report system issues to the Super Admin team, track tickets, search our knowledge base, and view system releases.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative z-10">
                    <Link 
                        to="/admin/support/tickets/create" 
                        className="px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
                    >
                        Create Support Ticket <LifeBuoy size={16} />
                    </Link>
                </div>
            </div>

            {/* Knowledge Base Search Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="p-3.5 bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-2xl">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white">Need immediate answers?</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Search our comprehensive documentation, troubleshooting guides, and FAQs.</p>
                    </div>
                </div>
                <form onSubmit={handleSearchKb} className="w-full md:max-w-md relative flex items-center">
                    <input 
                        type="text" 
                        value={kbSearch}
                        onChange={(e) => setKbSearch(e.target.value)}
                        placeholder="Search categories, POS billing, QR digital menus..." 
                        className="w-full pl-11 pr-24 py-3 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium transition-all"
                    />
                    <Search size={18} className="absolute left-4 text-gray-400 dark:text-slate-500" />
                    <button 
                        type="submit" 
                        className="absolute right-2 px-4 py-1.5 bg-gray-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-start justify-between min-w-0">
                            <div className="space-y-1 min-w-0 pr-1.5 flex-1">
                                <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block leading-tight break-words">{card.title}</span>
                                <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate">{card.value}</h2>
                            </div>
                            <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border shrink-0 ${card.color}`}>
                                <Icon size={16} className="sm:w-5 sm:h-5" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Middle Section: Announcements & Category Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Announcements Feed */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Support Announcements</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Scheduled maintenance, releases, and platform updates</p>
                        </div>
                        <Link 
                            to="/admin/support/announcements" 
                            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-bold flex items-center gap-1 hover:underline"
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="space-y-4 min-w-0 pr-1.5 flex-1">
                        {announcements.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm font-medium">
                                No active support updates or announcements.
                            </div>
                        ) : (
                            announcements.map((announce) => (
                                <div key={announce._id} className="p-4 rounded-2xl border border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30 flex items-start gap-4">
                                    <div className={`p-2.5 rounded-xl border text-xs font-extrabold capitalize ${
                                        announce.type === 'Scheduled Maintenance' ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50' :
                                        announce.type === 'Feature Releases' ? 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50' :
                                        announce.type === 'Service Updates' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' :
                                        'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50 animate-pulse'
                                    }`}>
                                        <Calendar size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{announce.title}</h4>
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{new Date(announce.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">{announce.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Common Issue Categories */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
                    <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Support Categories</h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Common distribution of reported issues</p>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {categories.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm font-medium">
                                No categorised ticket data yet.
                            </div>
                        ) : (
                            categories.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="space-y-1.5 min-w-0 pr-1.5 flex-1">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-gray-700 dark:text-slate-300">{item.category}</span>
                                        <span className="text-gray-400 dark:text-slate-500">{item.count} tickets</span>
                                    </div>
                                    <div className="w-full bg-gray-50 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full" 
                                            style={{ width: `${(item.count / summary.createdThisWeek) * 100 || 20}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-50 dark:border-slate-800">
                        <Link 
                            to="/admin/support/tickets" 
                            className="w-full py-3 bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white text-center font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-gray-100 dark:border-slate-800"
                        >
                            View Support Queue <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Platform Support Tickets (Admin & Super Admin) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-4">
                    <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">My Platform Support Tickets</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Technical issues, feature requests, and emergency tickets submitted to FoodNest Super Admin</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/admin/support/tickets"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                        >
                            View All ({platformTickets.length}) <ArrowRight size={14} />
                        </Link>
                        <Link
                            to="/admin/support/tickets/create"
                            className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                            New Ticket <LifeBuoy size={14} />
                        </Link>
                    </div>
                </div>

                {platformTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm font-medium space-y-2">
                        <p>No active platform support tickets submitted to Super Admin.</p>
                        <Link 
                            to="/admin/support/tickets/create" 
                            className="inline-block text-xs text-green-600 dark:text-green-400 font-bold hover:underline"
                        >
                            + Submit a new technical ticket
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {platformTickets.slice(0, 5).map((ticket) => (
                            <div 
                                key={ticket._id} 
                                onClick={() => navigate(`/admin/support/tickets/${ticket._id}`)}
                                className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-pointer"
                            >
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">
                                            #{ticket.ticketNumber || ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                                        </span>
                                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                                            {ticket.subject}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                                            ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                        }`}>
                                            {ticket.status || 'Open'}
                                        </span>
                                        {ticket.priority === 'Critical' && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 animate-pulse">
                                                Critical
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        Category: <strong className="text-gray-700 dark:text-slate-300">{ticket.category || 'General'}</strong> • Created {new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                    View Conversation <ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerCareDashboard;
