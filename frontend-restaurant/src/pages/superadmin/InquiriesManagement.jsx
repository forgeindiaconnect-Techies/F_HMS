import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    CalendarCheck, Search, Filter, Phone, Mail, MessageSquare, 
    Trash2, Clock, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Building2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const InquiriesManagement = () => {
    const { api } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [subjectFilter, setSubjectFilter] = useState('ALL');

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inquiries/admin');
            setInquiries(res.data || []);
        } catch (err) {
            console.error('Failed to load inquiries', err);
            toast.error('Failed to load walkthrough leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (api) {
            fetchInquiries();
        }
    }, [api]);

    const handleUpdateStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'New' ? 'In Progress' : currentStatus === 'In Progress' ? 'Resolved' : 'New';
        try {
            await api.put(`/inquiries/admin/${id}`, { status: nextStatus });
            setInquiries(inquiries.map(inq => 
                inq._id === id ? { ...inq, status: nextStatus } : inq
            ));
            toast.success(`Lead status updated to ${nextStatus}!`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteInquiry = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete lead from "${name}"?`)) {
            return;
        }
        try {
            await api.delete(`/inquiries/admin/${id}`);
            setInquiries(inquiries.filter(inq => inq._id !== id));
            toast.success('Lead deleted successfully');
        } catch (error) {
            toast.error('Failed to delete lead');
        }
    };

    const filteredInquiries = useMemo(() => {
        return inquiries.filter(inq => {
            const matchesSearch = 
                (inq.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inq.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inq.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inq.message || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
            const matchesSubject = subjectFilter === 'ALL' || inq.subject === subjectFilter;

            return matchesSearch && matchesStatus && matchesSubject;
        });
    }, [inquiries, searchQuery, statusFilter, subjectFilter]);

    const stats = useMemo(() => {
        const total = inquiries.length;
        const demoWalkthroughs = inquiries.filter(i => i.subject === 'Demo').length;
        const newLeads = inquiries.filter(i => i.status === 'New').length;
        const resolved = inquiries.filter(i => i.status === 'Resolved').length;
        return { total, demoWalkthroughs, newLeads, resolved };
    }, [inquiries]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <CalendarCheck size={22} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            Leads & Walkthrough Requests
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 pl-13">
                        Manage inbound inventory demo walkthroughs, sales inquiries, and restaurant onboarding requests.
                    </p>
                </div>
                <button
                    onClick={fetchInquiries}
                    disabled={loading}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leads</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm bg-purple-50/20">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={13} /> Walkthrough Demos
                    </p>
                    <h3 className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">{stats.demoWalkthroughs}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm bg-blue-50/20">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={13} /> New / Pending Action
                    </p>
                    <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{stats.newLeads}</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm bg-green-50/20">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> Resolved / Contacted
                    </p>
                    <h3 className="text-2xl font-black text-green-700 dark:text-green-400 mt-1">{stats.resolved}</h3>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-96">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by restaurant, name, phone, or message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="New">Status: New</option>
                        <option value="In Progress">Status: In Progress</option>
                        <option value="Resolved">Status: Resolved</option>
                    </select>

                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                    >
                        <option value="ALL">All Types</option>
                        <option value="Demo">Demo / Walkthrough</option>
                        <option value="Sales">Sales</option>
                        <option value="Support">Support</option>
                    </select>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-[11px] text-gray-400 uppercase tracking-wider font-bold">
                                <th className="p-5">Lead / Contact Info</th>
                                <th className="p-5">Restaurant & Outlet</th>
                                <th className="p-5">Request Type</th>
                                <th className="p-5">Walkthrough Details</th>
                                <th className="p-5">Date Received</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {filteredInquiries.map((inq) => {
                                const cleanPhone = (inq.phone || '').replace(/\D/g, '');
                                return (
                                    <tr key={inq._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors text-sm">
                                        <td className="p-5">
                                            <div>
                                                <span className="font-bold text-gray-900 dark:text-white block text-sm">
                                                    {inq.name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <a 
                                                        href={`tel:${inq.phone}`}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md"
                                                        title="Click to call"
                                                    >
                                                        <Phone size={11} /> {inq.phone}
                                                    </a>
                                                    {cleanPhone && (
                                                        <a
                                                            href={`https://wa.me/${cleanPhone}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md"
                                                            title="Chat on WhatsApp"
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                                    {inq.restaurantName || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${
                                                inq.subject === 'Demo' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                                                : inq.subject === 'Sales'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300'
                                            }`}>
                                                {inq.subject === 'Demo' && <Sparkles size={12} />}
                                                {inq.subject || 'Demo'}
                                            </span>
                                        </td>
                                        <td className="p-5 max-w-sm">
                                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                                {inq.message}
                                            </p>
                                        </td>
                                        <td className="p-5 whitespace-nowrap text-xs text-gray-500 font-medium">
                                            {inq.createdAt ? new Date(inq.createdAt).toLocaleString('en-IN', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'Recently'}
                                        </td>
                                        <td className="p-5 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                                                inq.status === 'Resolved' 
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300'
                                                : inq.status === 'In Progress' 
                                                ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                                {inq.status || 'New'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(inq._id, inq.status)}
                                                    className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                >
                                                    {inq.status === 'New' ? 'Mark In Progress' : inq.status === 'In Progress' ? 'Mark Resolved' : 'Reopen'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInquiry(inq._id, inq.name)}
                                                    className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredInquiries.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <MessageSquare className="mx-auto text-gray-300 dark:text-slate-700 mb-3" size={40} />
                                        <p className="text-gray-500 font-bold text-base">No leads or walkthrough requests found</p>
                                        <p className="text-xs text-gray-400 mt-1">When prospective clients schedule a walkthrough on marketing pages, they will appear here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InquiriesManagement;
