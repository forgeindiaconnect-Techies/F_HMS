import { useState, useMemo } from 'react';
import { 
    ShieldCheck, User, Lock, AlertTriangle, Search, Filter, 
    Calendar, LogIn, LogOut, PlusCircle, Edit3, Trash2, 
    Download, Eye, X, CheckCircle2, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_AUDIT_LOGS = [
    {
        id: 'aud-101',
        timestamp: '2026-08-12 13:42:15',
        staffName: 'Admin Sarah',
        staffRole: 'Restaurant Admin',
        userEmail: 'admin@pizzapalace.com',
        eventType: 'LOGIN',
        category: 'Authentication',
        action: 'User Session Login',
        details: 'Successfully authenticated via email/password password credentials.',
        ipAddress: '192.168.1.45',
        location: 'Mumbai, IN',
        userAgent: 'Chrome 122.0.0 (Windows 11)',
        status: 'Success'
    },
    {
        id: 'aud-102',
        timestamp: '2026-08-12 12:15:30',
        staffName: 'Chef Marcus',
        staffRole: 'Head Chef',
        userEmail: 'marcus.chef@pizzapalace.com',
        eventType: 'DELETE',
        category: 'Data Mutation',
        action: 'Deleted Recipe Item',
        details: 'Permanently removed recipe: "Garlic Butter Prawns (Batch #4)" from central database.',
        ipAddress: '192.168.1.12',
        location: 'Mumbai, IN',
        userAgent: 'Safari 17.2 (macOS)',
        status: 'Success'
    },
    {
        id: 'aud-103',
        timestamp: '2026-08-12 11:05:00',
        staffName: 'Manager David',
        staffRole: 'Branch Manager',
        userEmail: 'david.m@pizzapalace.com',
        eventType: 'UPDATE',
        category: 'Data Mutation',
        action: 'Updated Tax Settings',
        details: 'Changed CGST rate from 2.5% to 3.0% and updated GSTIN registration details.',
        ipAddress: '192.168.1.88',
        location: 'Delhi, IN',
        userAgent: 'Firefox 123.0 (Windows 10)',
        status: 'Success'
    },
    {
        id: 'aud-104',
        timestamp: '2026-08-12 10:20:12',
        staffName: 'Manager David',
        staffRole: 'Branch Manager',
        userEmail: 'david.m@pizzapalace.com',
        eventType: 'CREATE',
        category: 'Data Mutation',
        action: 'Created Staff Account',
        details: 'Registered new cashier account for staff user "Rahul Sharma (Cashier #02)".',
        ipAddress: '192.168.1.88',
        location: 'Delhi, IN',
        userAgent: 'Firefox 123.0 (Windows 10)',
        status: 'Success'
    },
    {
        id: 'aud-105',
        timestamp: '2026-08-12 09:10:45',
        staffName: 'Cashier Priya',
        staffRole: 'Cashier Staff',
        userEmail: 'priya.c@pizzapalace.com',
        eventType: 'LOGOUT',
        category: 'Authentication',
        action: 'User Session Logout',
        details: 'User voluntarily ended session and logged out from POS terminal #01.',
        ipAddress: '192.168.1.33',
        location: 'Gurugram, IN',
        userAgent: 'Chrome 122.0.0 (Windows 10)',
        status: 'Success'
    },
    {
        id: 'aud-106',
        timestamp: '2026-08-12 08:02:10',
        staffName: 'Unknown User',
        staffRole: 'Unassigned',
        userEmail: 'hacker_test@unknown.com',
        eventType: 'FAILED_LOGIN',
        category: 'Security Alert',
        action: 'Failed Login Attempt',
        details: 'Multiple invalid password attempts detected from suspicious external IP.',
        ipAddress: '45.89.20.180',
        location: 'Frankfurt, DE',
        userAgent: 'Python-urllib/3.10',
        status: 'Failed'
    },
    {
        id: 'aud-107',
        timestamp: '2026-08-11 18:30:00',
        staffName: 'Developer API',
        staffRole: 'Integrations API',
        userEmail: 'api-service@pizzapalace.com',
        eventType: 'CREATE',
        category: 'Data Mutation',
        action: 'Generated Webhook Secret',
        details: 'Created new OAuth2 bearer token for third-party food delivery webhook.',
        ipAddress: '202.45.190.2',
        location: 'Bengaluru, IN',
        userAgent: 'Node.js/v20.11.0',
        status: 'Success'
    },
    {
        id: 'aud-108',
        timestamp: '2026-08-11 15:45:22',
        staffName: 'Admin Sarah',
        staffRole: 'Restaurant Admin',
        userEmail: 'admin@pizzapalace.com',
        eventType: 'UPDATE',
        category: 'Data Mutation',
        action: 'Upgraded Subscription Plan',
        details: 'Successfully upgraded restaurant plan tier from Pro to Enterprise.',
        ipAddress: '192.168.1.45',
        location: 'Mumbai, IN',
        userAgent: 'Chrome 122.0.0 (Windows 11)',
        status: 'Success'
    }
];

const AuditLogs = () => {
    const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState('All');
    const [selectedEventType, setSelectedEventType] = useState('All');
    const [dateRange, setDateRange] = useState('All'); // 'All' | 'Today' | 'Yesterday' | 'Last 7 Days'
    const [selectedLogDetail, setSelectedLogDetail] = useState(null);

    // Extract unique users for filtering dropdown
    const uniqueUsers = useMemo(() => {
        const set = new Set(logs.map(l => l.staffName));
        return Array.from(set);
    }, [logs]);

    // Filtering logic (User, Date, Event Type, Search Query)
    const filteredLogs = useMemo(() => {
        const now = new Date();
        const todayStr = '2026-08-12'; // Relative to local workspace time

        return logs.filter(log => {
            // Search filter
            const matchesSearch = 
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

            // User filter
            const matchesUser = selectedUser === 'All' || log.staffName === selectedUser;

            // Event Type filter
            let matchesEvent = true;
            if (selectedEventType === 'Auth') {
                matchesEvent = log.eventType === 'LOGIN' || log.eventType === 'LOGOUT' || log.eventType === 'FAILED_LOGIN';
            } else if (selectedEventType === 'Create') {
                matchesEvent = log.eventType === 'CREATE';
            } else if (selectedEventType === 'Update') {
                matchesEvent = log.eventType === 'UPDATE';
            } else if (selectedEventType === 'Delete') {
                matchesEvent = log.eventType === 'DELETE';
            } else if (selectedEventType === 'SecurityAlerts') {
                matchesEvent = log.status === 'Failed' || log.category === 'Security Alert';
            }

            // Date Range filter
            let matchesDate = true;
            if (dateRange === 'Today') {
                matchesDate = log.timestamp.startsWith(todayStr);
            } else if (dateRange === 'Last 7 Days') {
                matchesDate = true; // Shows recent logs
            }

            return matchesSearch && matchesUser && matchesEvent && matchesDate;
        });
    }, [logs, searchQuery, selectedUser, selectedEventType, dateRange]);

    // Metrics
    const totalLogs = logs.length;
    const loginLogoutCount = logs.filter(l => l.eventType === 'LOGIN' || l.eventType === 'LOGOUT').length;
    const crudMutationsCount = logs.filter(l => ['CREATE', 'UPDATE', 'DELETE'].includes(l.eventType)).length;
    const securityAlertsCount = logs.filter(l => l.status === 'Failed' || l.category === 'Security Alert').length;

    // Export Audit Logs to CSV
    const handleExportCSV = () => {
        const headers = ["Timestamp", "Staff Name", "Role", "Email", "Event Type", "Action", "Details", "IP Address", "Status"];
        const rows = filteredLogs.map(l => [
            `"${l.timestamp}"`,
            `"${l.staffName}"`,
            `"${l.staffRole}"`,
            `"${l.userEmail}"`,
            `"${l.eventType}"`,
            `"${l.action}"`,
            `"${l.details.replace(/"/g, '""')}"`,
            `"${l.ipAddress}"`,
            `"${l.status}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Audit log export generated successfully!');
    };

    // Helper badge icon & styling for event types
    const getEventBadge = (type) => {
        switch (type) {
            case 'LOGIN':
                return { label: 'LOGIN', color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: LogIn };
            case 'LOGOUT':
                return { label: 'LOGOUT', color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: LogOut };
            case 'CREATE':
                return { label: 'CREATE', color: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: PlusCircle };
            case 'UPDATE':
                return { label: 'UPDATE', color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: Edit3 };
            case 'DELETE':
                return { label: 'DELETE', color: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: Trash2 };
            case 'FAILED_LOGIN':
                return { label: 'FAILED LOGIN', color: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse', icon: AlertTriangle };
            default:
                return { label: type, color: 'bg-gray-100 text-gray-700', icon: ShieldCheck };
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        System Audit Logs & Security Trail
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5">
                        Comprehensive ledger tracking user login/logout events, resource CREATE/UPDATE/DELETE actions, and IP security alerts.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download size={14} /> Export Audit CSV
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Audit Entries</span>
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-slate-100">{totalLogs} Records</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Immutable security transaction trail</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">User Auth (Login/Logout)</span>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <LogIn size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{loginLogoutCount} Events</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Active staff login & logout sessions</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Data CRUD Mutations</span>
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Edit3 size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400">{crudMutationsCount} Actions</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Create, Update, and Delete operations</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Security & Failures</span>
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
                            <ShieldAlert size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">{securityAlertsCount} Alerts</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Failed logins or unauthorized attempts</p>
                </div>
            </div>

            {/* Filter Bar (User Filter, Action Category, Date Range, Search) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search action, details, staff, email, IP..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    {/* User / Staff Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">User:</span>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                        >
                            <option value="All">All Users ({uniqueUsers.length})</option>
                            {uniqueUsers.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action Type Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Action:</span>
                        <select
                            value={selectedEventType}
                            onChange={(e) => setSelectedEventType(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                        >
                            <option value="All">All Actions</option>
                            <option value="Auth">Login / Logout Auth</option>
                            <option value="Create">Create Actions (+)</option>
                            <option value="Update">Update Actions (✎)</option>
                            <option value="Delete">Delete Actions (🗑)</option>
                            <option value="SecurityAlerts">Security Alerts (⚠)</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Date:</span>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                        >
                            <option value="All">All Time</option>
                            <option value="Today">Today Only</option>
                            <option value="Last 7 Days">Last 7 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Audit Log Entries Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/40">
                    <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                        Audit Trail History ({filteredLogs.length} Entries)
                    </h3>
                </div>

                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                        <ShieldCheck size={40} className="text-gray-300 dark:text-slate-600" />
                        <h4 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">No audit logs match your search filters</h4>
                        <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">Try clearing the date or user filter controls.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-slate-950/60 border-b border-gray-100 dark:border-slate-800 text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">Staff Member & Email</th>
                                    <th className="p-4">Event Type</th>
                                    <th className="p-4">Action & Mutation Details</th>
                                    <th className="p-4">Client IP / Location</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300">
                                {filteredLogs.map((log) => {
                                    const badge = getEventBadge(log.eventType);
                                    const BadgeIcon = badge.icon;

                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                            {/* Timestamp */}
                                            <td className="p-4 font-mono text-[11px] text-gray-400 dark:text-slate-400 whitespace-nowrap">
                                                {log.timestamp}
                                            </td>

                                            {/* Staff Member & Email */}
                                            <td className="p-4 space-y-0.5">
                                                <div className="font-bold text-gray-900 dark:text-slate-100">{log.staffName}</div>
                                                <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">{log.userEmail}</div>
                                                <span className="inline-block text-[9px] font-black text-gray-500 dark:text-slate-400 uppercase bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                    {log.staffRole}
                                                </span>
                                            </td>

                                            {/* Event Type Badge */}
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${badge.color}`}>
                                                    <BadgeIcon size={12} />
                                                    <span>{badge.label}</span>
                                                </span>
                                            </td>

                                            {/* Action Details */}
                                            <td className="p-4 space-y-0.5 max-w-md">
                                                <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{log.action}</div>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">{log.details}</p>
                                            </td>

                                            {/* IP Address */}
                                            <td className="p-4 space-y-0.5">
                                                <div className="font-mono text-xs font-bold text-gray-800 dark:text-slate-200">{log.ipAddress}</div>
                                                <div className="text-[10px] text-gray-400 dark:text-slate-500">{log.location}</div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    log.status === 'Success'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>

                                            {/* View Full Metadata Drawer */}
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLogDetail(log)}
                                                    className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                                                    title="View Metadata Trail"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL: AUDIT METADATA DRAWER */}
            {selectedLogDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-slate-100">Audit Metadata Details</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{selectedLogDetail.id}</p>
                            </div>
                            <button onClick={() => setSelectedLogDetail(null)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
                                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 pb-1.5">
                                    <span className="font-bold text-gray-400">Timestamp</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{selectedLogDetail.timestamp}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 pb-1.5">
                                    <span className="font-bold text-gray-400">Staff Account</span>
                                    <span className="font-bold text-gray-900 dark:text-slate-100">{selectedLogDetail.staffName} ({selectedLogDetail.userEmail})</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 pb-1.5">
                                    <span className="font-bold text-gray-400">Event Action</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLogDetail.action} [{selectedLogDetail.eventType}]</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 pb-1.5">
                                    <span className="font-bold text-gray-400">IP Address & Location</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{selectedLogDetail.ipAddress} ({selectedLogDetail.location})</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="font-bold text-gray-400">User Agent</span>
                                    <span className="font-mono text-[10px] text-gray-600 dark:text-slate-300 truncate max-w-xs">{selectedLogDetail.userAgent}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-black uppercase text-gray-500 dark:text-slate-400 mb-1">Full Log Description</h4>
                                <p className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-semibold leading-relaxed">
                                    {selectedLogDetail.details}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedLogDetail(null)}
                                className="px-5 py-2 bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
