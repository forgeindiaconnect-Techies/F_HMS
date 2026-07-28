import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Search, Filter, LifeBuoy, ChevronRight, AlertCircle, 
    ArrowRight, MessageSquare, Tag, AlertTriangle, PlayCircle, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const TicketList = () => {
    const { api } = useAuth();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await api.get('/support/tickets', { params });
            setTickets(res.data);
        } catch (error) {
            console.error('Failed to load tickets:', error);
            toast.error('Failed to retrieve support tickets.');
        } finally {
            setLoading(false);
        }
    }, [api, statusFilter, priorityFilter, searchQuery]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Badge styling helpers
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Assigned':
                return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'In Progress':
                return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
            case 'Waiting for Customer':
                return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Resolved':
                return 'bg-green-50 text-green-700 border-green-100';
            case 'Closed':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-100 text-red-800 border-red-200 font-extrabold animate-pulse';
            case 'High':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'Medium':
                return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'Low':
                return 'bg-gray-50 text-gray-600 border-gray-100';
            default:
                return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Support Tickets</h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">Manage and track your reported support tickets.</p>
                </div>
                <Link 
                    to="/admin/support/tickets/create" 
                    className="px-5 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                    Create New Ticket <LifeBuoy size={16} />
                </Link>
            </div>

            {/* Filter toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ID or subject..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-semibold transition-all"
                        />
                        <Search size={16} className="absolute left-3.5 text-gray-400" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    {/* Status filter */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1.5">Status</span>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer py-1 pr-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting for Customer">Waiting for Customer</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>

                    {/* Priority filter */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1.5">Priority</span>
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer py-1 pr-2"
                        >
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Support Tickets queue table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    /* Loading Skeleton */
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="flex items-center justify-between py-4 border-b border-gray-50 animate-pulse">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                                    <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                                    <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
                        <div className="p-4 bg-green-50 text-green-600 rounded-full">
                            <LifeBuoy size={40} />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="font-extrabold text-gray-900 text-lg">No tickets found</h3>
                            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                                You don't have any support tickets registered under these filters. Need help? Create a new ticket right away.
                            </p>
                        </div>
                        <Link 
                            to="/admin/support/tickets/create" 
                            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                        >
                            Create Ticket <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    /* Ticket List Layout */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <th className="p-5">Ticket Info</th>
                                    <th className="p-5">Category</th>
                                    <th className="p-5">Priority</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5">Last Updated</th>
                                    <th className="p-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tickets.map((ticket) => (
                                    <tr 
                                        key={ticket._id} 
                                        onClick={() => navigate(`/admin/support/tickets/${ticket._id}`)}
                                        className="hover:bg-gray-50/30 transition-colors cursor-pointer group"
                                    >
                                        {/* Ticket Subject/ID */}
                                        <td className="p-5 max-w-sm">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md font-mono">{ticket.ticketId}</span>
                                                    {ticket.priority === 'Critical' && (
                                                        <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-800 group-hover:text-green-600 transition-colors line-clamp-1">{ticket.subject}</h4>
                                                {ticket.branchId && (
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Branch: {ticket.branchId.name}</span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        {/* Category */}
                                        <td className="p-5">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                                <Tag size={12} className="text-gray-400" />
                                                <span>{ticket.category}</span>
                                            </div>
                                        </td>

                                        {/* Priority */}
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${getPriorityStyle(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusStyle(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>

                                        {/* Last Updated */}
                                        <td className="p-5">
                                            <span className="text-xs font-semibold text-gray-400">
                                                {new Date(ticket.lastUpdated).toLocaleString()}
                                            </span>
                                        </td>

                                        {/* Action Arrow */}
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end text-gray-300 group-hover:text-green-500 transition-colors">
                                                <ChevronRight size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketList;
