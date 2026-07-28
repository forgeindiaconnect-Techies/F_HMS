import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    MessageSquare, Users, BookOpen, Megaphone, Search, Filter,
    CheckCircle, ShieldAlert, Clock, Play, UserPlus, Trash, Edit, Star, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const SuperAdminSupportConsole = () => {
    const { api } = useAuth();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('tickets');
    const [tickets, setTickets] = useState([]);
    const [agents, setAgents] = useState([]);
    const [kbArticles, setKbArticles] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    
    const [loading, setLoading] = useState(true);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Promote Agent Form State
    const [newAgentEmail, setNewAgentEmail] = useState('');
    const [promoting, setPromoting] = useState(false);

    // Knowledge Base Form State
    const [kbTitle, setKbTitle] = useState('');
    const [kbContent, setKbContent] = useState('');
    const [kbCategory, setKbCategory] = useState('Getting Started');
    const [submittingKb, setSubmittingKb] = useState(false);

    // Announcement Form State
    const [annTitle, setAnnTitle] = useState('');
    const [annContent, setAnnContent] = useState('');
    const [annType, setAnnType] = useState('Scheduled Maintenance');
    const [submittingAnn, setSubmittingAnn] = useState(false);

    const categories = [
        'Getting Started', 'Subscription', 'Orders', 'POS', 'QR Digital Menu',
        'Kitchen', 'Inventory', 'Payments', 'Delivery', 'Troubleshooting', 'FAQs'
    ];

    const fetchTickets = useCallback(async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (searchQuery) params.search = searchQuery;
            const res = await api.get('/support/tickets', { params });
            setTickets(res.data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
    }, [api, statusFilter, priorityFilter, searchQuery]);

    const fetchAgents = useCallback(async () => {
        try {
            const res = await api.get('/support/agents');
            setAgents(res.data);
        } catch (error) {
            console.error('Failed to fetch support agents:', error);
        }
    }, [api]);

    const fetchKbArticles = useCallback(async () => {
        try {
            const res = await api.get('/support/knowledge-base');
            setKbArticles(res.data);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        }
    }, [api]);

    const fetchAnnouncements = useCallback(async () => {
        try {
            const res = await api.get('/support/announcements');
            setAnnouncements(res.data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        }
    }, [api]);

    const loadData = useCallback(async () => {
        setLoading(true);
        if (activeTab === 'tickets') await fetchTickets();
        else if (activeTab === 'agents') await fetchAgents();
        else if (activeTab === 'kb') await fetchKbArticles();
        else if (activeTab === 'announcements') await fetchAnnouncements();
        setLoading(false);
    }, [activeTab, fetchTickets, fetchAgents, fetchKbArticles, fetchAnnouncements]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAssignAgent = async (ticketId, agentId) => {
        try {
            await api.put(`/support/tickets/${ticketId}`, { assignedAgentId: agentId || null });
            toast.success('Ticket assignment updated successfully!');
            fetchTickets();
        } catch (error) {
            toast.error('Failed to assign agent.');
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            await api.put(`/support/tickets/${ticketId}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchTickets();
        } catch (error) {
            toast.error('Failed to update ticket status.');
        }
    };

    const handlePromoteAgent = async (e) => {
        e.preventDefault();
        if (!newAgentEmail) return;
        setPromoting(true);
        try {
            // Find user by email or try to register it
            // We can resolve it by getting users and setting role, or simply calling POST /api/support/agents
            // Let's call the promote agent endpoint on the backend
            // But we need the userId. We'll search users or call endpoint
            const usersRes = await api.get('/users');
            const foundUser = usersRes.data.find(u => u.email.toLowerCase() === newAgentEmail.toLowerCase());
            
            if (!foundUser) {
                toast.error('No user found with this email. Users must register first.');
                return;
            }

            await api.post('/support/agents', { userId: foundUser._id, isActive: true });
            toast.success(`${foundUser.name} promoted to Support Agent successfully!`);
            setNewAgentEmail('');
            fetchAgents();
        } catch (error) {
            toast.error('Failed to promote user to support agent.');
        } finally {
            setPromoting(false);
        }
    };

    const handleAgentStatusToggle = async (userId, currentActive) => {
        try {
            await api.post('/support/agents', { userId, isActive: !currentActive });
            toast.success('Agent status updated.');
            fetchAgents();
        } catch (error) {
            toast.error('Failed to update agent status.');
        }
    };

    const handleCreateKbArticle = async (e) => {
        e.preventDefault();
        if (!kbTitle || !kbContent) return;
        setSubmittingKb(true);
        try {
            await api.post('/support/knowledge-base', {
                title: kbTitle,
                content: kbContent,
                category: kbCategory
            });
            toast.success('Knowledge base article published!');
            setKbTitle('');
            setKbContent('');
            fetchKbArticles();
        } catch (error) {
            toast.error('Failed to create help article.');
        } finally {
            setSubmittingKb(false);
        }
    };

    const handleDeleteKbArticle = async (articleId) => {
        if (!window.confirm('Delete this article?')) return;
        try {
            await api.delete(`/support/knowledge-base/${articleId}`);
            toast.success('Article deleted.');
            fetchKbArticles();
        } catch (error) {
            toast.error('Failed to delete article.');
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!annTitle || !annContent) return;
        setSubmittingAnn(true);
        try {
            await api.post('/support/announcements', {
                title: annTitle,
                content: annContent,
                type: annType
            });
            toast.success('Announcement published!');
            setAnnTitle('');
            setAnnContent('');
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to publish announcement.');
        } finally {
            setSubmittingAnn(false);
        }
    };

    const handleDeactivateAnnouncement = async (annId) => {
        try {
            await api.put(`/support/announcements/${annId}`, { isActive: false });
            toast.success('Announcement deactivated.');
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to deactivate announcement.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 font-sans">Support Operations Console</h2>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">Manage SLA support tickets, platform agents, articles, and global maintenance schedules.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-100 pb-3">
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                        activeTab === 'tickets' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <MessageSquare size={14} /> Tickets Queue
                </button>
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                        activeTab === 'agents' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Users size={14} /> Support Agents
                </button>
                <button
                    onClick={() => setActiveTab('kb')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                        activeTab === 'kb' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <BookOpen size={14} /> Manage Knowledge Base
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                        activeTab === 'announcements' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Megaphone size={14} /> Announcements
                </button>
            </div>

            {/* Content view based on active tab */}
            {activeTab === 'tickets' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-72">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search subject or ID..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                            />
                            <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
                        </div>
                        <div className="flex gap-3">
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="Open">Open</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting for Customer">Waiting for Customer</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                            <select 
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none"
                            >
                                <option value="">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center animate-pulse">Loading queue...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-xs font-bold text-gray-400">No support tickets found matching current filters.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            <th className="p-4">Restaurant</th>
                                            <th className="p-4">Subject</th>
                                            <th className="p-4">Priority / Status</th>
                                            <th className="p-4">Assigned Agent</th>
                                            <th className="p-4">Change Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {tickets.map((t) => (
                                            <tr key={t._id} className="hover:bg-gray-50/20 transition-all text-xs">
                                                <td className="p-4">
                                                    <div className="space-y-0.5">
                                                        <h4 className="font-bold text-gray-900">{t.restaurantId?.name || 'Unknown'}</h4>
                                                        <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">{t.ticketId}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 cursor-pointer" onClick={() => navigate(`/super-admin/support/tickets/${t._id}`)}>
                                                    <h4 className="font-bold text-gray-800 hover:text-blue-600 transition-colors line-clamp-1">{t.subject}</h4>
                                                    <p className="text-[10px] text-gray-400 line-clamp-1">{t.description}</p>
                                                </td>
                                                <td className="p-4 space-y-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border mr-1.5 ${
                                                        t.priority === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {t.priority}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                                                        t.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <select 
                                                        value={t.assignedAgentId?._id || ''}
                                                        onChange={(e) => handleAssignAgent(t._id, e.target.value)}
                                                        className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {agents.map(a => (
                                                            <option key={a.userId?._id} value={a.userId?._id}>{a.userId?.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    <select 
                                                        value={t.status}
                                                        onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                                                        className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700"
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="Assigned">Assigned</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Waiting for Customer">Waiting for Customer</option>
                                                        <option value="Resolved">Resolved</option>
                                                        <option value="Closed">Closed</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'agents' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Promotion Form */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">Promote Support Agent</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">Convert platform staff/users into support team members</p>
                        </div>
                        <form onSubmit={handlePromoteAgent} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Registered Staff Email</label>
                                <input 
                                    type="email"
                                    value={newAgentEmail}
                                    onChange={(e) => setNewAgentEmail(e.target.value)}
                                    placeholder="agent@platform.com"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={promoting}
                                className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <UserPlus size={14} /> Promote User
                            </button>
                        </form>
                    </div>

                    {/* Agents list */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">On-Duty Support Agents</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">Availability, workload stats, and resolved queues</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">Loading agents...</div>
                        ) : agents.length === 0 ? (
                            <div className="text-center py-4 text-xs font-bold text-gray-400">No support agents configured. Promote a staff user.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {agents.map((agent) => (
                                    <div key={agent._id} className="py-4 flex items-center justify-between gap-4 text-xs">
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-gray-950">{agent.userId?.name}</h4>
                                            <span className="text-[10px] text-gray-400">{agent.userId?.email}</span>
                                        </div>
                                        <div className="flex gap-6 items-center text-center">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Workload</span>
                                                <span className="font-extrabold text-slate-800">{agent.workload} active</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Resolved</span>
                                                <span className="font-extrabold text-green-600">{agent.totalResolved} resolved</span>
                                            </div>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => handleAgentStatusToggle(agent.userId?._id, agent.isActive)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                                    agent.isActive 
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                }`}
                                            >
                                                {agent.isActive ? 'Active / On-Duty' : 'Inactive / Off-Duty'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'kb' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Article Form */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">Publish KB Article</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">Add new documentation or FAQs entry</p>
                        </div>
                        <form onSubmit={handleCreateKbArticle} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Category</label>
                                <select 
                                    value={kbCategory}
                                    onChange={(e) => setKbCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Title</label>
                                <input 
                                    type="text"
                                    value={kbTitle}
                                    onChange={(e) => setKbTitle(e.target.value)}
                                    placeholder="POS Billing config..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Article Content</label>
                                <textarea 
                                    value={kbContent}
                                    onChange={(e) => setKbContent(e.target.value)}
                                    placeholder="Detailed help content..."
                                    rows={6}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={submittingKb}
                                className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <BookOpen size={14} /> Publish Article
                            </button>
                        </form>
                    </div>

                    {/* Articles list */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">Published Documentation</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">View and manage support documentation</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">Loading articles...</div>
                        ) : kbArticles.length === 0 ? (
                            <div className="text-center py-4 text-xs font-bold text-gray-400">No help articles published yet.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {kbArticles.map((art) => (
                                    <div key={art._id} className="py-4 flex items-center justify-between gap-4 text-xs">
                                        <div className="space-y-1 flex-1 pr-6">
                                            <span className="text-[8px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                                {art.category}
                                            </span>
                                            <h4 className="font-extrabold text-gray-800 mt-1">{art.title}</h4>
                                            <p className="text-[10px] text-gray-400 line-clamp-1">{art.content}</p>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-3">
                                            <div className="text-right text-[10px] font-semibold text-gray-400 pr-2">
                                                <span>{art.views} views</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteKbArticle(art._id)}
                                                className="p-2 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Delete Article"
                                            >
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'announcements' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Announcement Form */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">Publish Announcement</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">Publish maintenance notices, updates, known issues</p>
                        </div>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Announcement Type</label>
                                <select 
                                    value={annType}
                                    onChange={(e) => setAnnType(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                >
                                    <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                                    <option value="Feature Releases">Feature Releases</option>
                                    <option value="Service Updates">Service Updates</option>
                                    <option value="Known Issues">Known Issues</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Title</label>
                                <input 
                                    type="text"
                                    value={annTitle}
                                    onChange={(e) => setAnnTitle(e.target.value)}
                                    placeholder="Scheduled maintenance notice..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600">Announcement Content</label>
                                <textarea 
                                    value={annContent}
                                    onChange={(e) => setAnnContent(e.target.value)}
                                    placeholder="Details..."
                                    rows={5}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs font-semibold"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={submittingAnn}
                                className="w-full py-3 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Megaphone size={14} /> Publish Announcement
                            </button>
                        </form>
                    </div>

                    {/* Announcement list */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-sm">Active System Announcements</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">Check platform service status feeds</p>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">Loading announcements...</div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-4 text-xs font-bold text-gray-400">No active announcements.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {announcements.map((ann) => (
                                    <div key={ann._id} className="py-4 flex items-center justify-between gap-4 text-xs">
                                        <div className="space-y-1 flex-1 pr-6">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                                                ann.type === 'Scheduled Maintenance' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                ann.type === 'Feature Releases' ? 'bg-green-50 text-green-700 border-green-100' :
                                                'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                                {ann.type}
                                            </span>
                                            <h4 className="font-extrabold text-gray-800 mt-1">{ann.title}</h4>
                                            <p className="text-[10px] text-gray-400 line-clamp-1">{ann.content}</p>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => handleDeactivateAnnouncement(ann._id)}
                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-bold transition-all border border-red-100"
                                            >
                                                Deactivate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminSupportConsole;
