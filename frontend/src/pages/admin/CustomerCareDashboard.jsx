import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    MessageSquare, AlertCircle, CheckCircle, Clock, Star, Users, 
    TrendingUp, LifeBuoy, FileText, Calendar, Search, ArrowRight, ShieldAlert,
    BookOpen, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerCareDashboard = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [trend, setTrend] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kbSearch, setKbSearch] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch support analytics
                const statsRes = await api.get('/support/analytics');
                setStats(statsRes.data.summary);
                setCategories(statsRes.data.categories);
                setTrend(statsRes.data.trend);

                // Fetch active announcements
                const announceRes = await api.get('/support/announcements');
                setAnnouncements(announceRes.data.slice(0, 3)); // show top 3
            } catch (error) {
                console.error('Failed to load support dashboard data:', error);
                toast.error('Failed to load dashboard data.');
            } finally {
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                <p className="text-sm font-semibold text-gray-500">Loading your Care Dashboard...</p>
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
        { title: 'Open Tickets', value: summary.totalOpen, icon: LifeBuoy, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { title: 'In Progress', value: summary.totalInProgress + summary.totalAssigned, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        { title: 'Waiting for Customer', value: summary.totalWaiting, icon: MessageSquare, color: 'text-purple-600 bg-purple-50 border-purple-100' },
        { title: 'Resolved & Closed', value: summary.totalResolved + summary.totalClosed, icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100' },
        { title: 'Critical Tickets', value: summary.totalCritical, icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-100 animate-pulse' },
        { title: 'CSAT Rating', value: summary.avgCsat ? `${summary.avgCsat} / 5` : 'N/A', icon: Star, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
        { title: 'Active Agents', value: summary.activeAgentsCount, icon: Users, color: 'text-teal-600 bg-teal-50 border-teal-100' },
        { title: 'Avg Resolution Time', value: summary.avgResolutionTime ? `${summary.avgResolutionTime}m` : 'N/A', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with styling */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-8">
                    <LifeBuoy size={300} />
                </div>
                <div className="space-y-2 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={12} /> Enterprise Plan SLA Included
                    </div>
                    <h1 className="text-3xl font-black font-sans leading-tight">24/7 Enterprise Customer Care</h1>
                    <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
                        Welcome to your dedicated support portal. Create emergency tickets, track resolutions, browse our complete knowledge center, and check live system updates.
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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-gray-900">Need immediate answers?</h3>
                        <p className="text-xs text-gray-500 font-medium">Search our comprehensive documentation, troubleshooting guides, and FAQs.</p>
                    </div>
                </div>
                <form onSubmit={handleSearchKb} className="w-full md:max-w-md relative flex items-center">
                    <input 
                        type="text" 
                        value={kbSearch}
                        onChange={(e) => setKbSearch(e.target.value)}
                        placeholder="Search categories, POS billing, QR digital menus..." 
                        className="w-full pl-11 pr-24 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium transition-all"
                    />
                    <Search size={18} className="absolute left-4 text-gray-400" />
                    <button 
                        type="submit" 
                        className="absolute right-2 px-4 py-1.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start justify-between">
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
                                <h2 className="text-2xl font-black text-gray-900">{card.value}</h2>
                            </div>
                            <div className={`p-3 rounded-2xl border ${card.color}`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Middle Section: Announcements & Category Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Announcements Feed */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-lg">Support Announcements</h3>
                            <p className="text-xs text-gray-400 font-medium">Scheduled maintenance, releases, and platform updates</p>
                        </div>
                        <Link 
                            to="/admin/support/announcements" 
                            className="text-xs text-green-600 hover:text-green-700 font-bold flex items-center gap-1 hover:underline"
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm font-medium">
                                No active support updates or announcements.
                            </div>
                        ) : (
                            announcements.map((announce) => (
                                <div key={announce._id} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 flex items-start gap-4">
                                    <div className={`p-2.5 rounded-xl border text-xs font-extrabold capitalize ${
                                        announce.type === 'Scheduled Maintenance' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        announce.type === 'Feature Releases' ? 'bg-green-50 text-green-600 border-green-100' :
                                        announce.type === 'Service Updates' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-red-50 text-red-600 border-red-100 animate-pulse'
                                    }`}>
                                        <Calendar size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-gray-900">{announce.title}</h4>
                                            <span className="text-[10px] text-gray-400 font-semibold">{new Date(announce.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed font-medium">{announce.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Common Issue Categories */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
                    <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">Support Categories</h3>
                        <p className="text-xs text-gray-400 font-medium">Common distribution of reported issues</p>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {categories.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm font-medium">
                                No categorised ticket data yet.
                            </div>
                        ) : (
                            categories.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-gray-700">{item.category}</span>
                                        <span className="text-gray-400">{item.count} tickets</span>
                                    </div>
                                    <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full" 
                                            style={{ width: `${(item.count / summary.createdThisWeek) * 100 || 20}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <Link 
                            to="/admin/support/tickets" 
                            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 text-center font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-gray-100"
                        >
                            View Support Queue <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerCareDashboard;
