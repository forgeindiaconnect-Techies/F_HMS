import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Plus, Trash2, CheckCheck, Send, AlertCircle, Info, Megaphone, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
    System:    { icon: Bell,        bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'System' },
    Alert:     { icon: AlertCircle, bg: 'bg-red-50',    text: 'text-red-600',    label: 'Alert' },
    Info:      { icon: Info,        bg: 'bg-sky-50',    text: 'text-sky-600',    label: 'Info' },
    Broadcast: { icon: Megaphone,   bg: 'bg-purple-50', text: 'text-purple-600', label: 'Broadcast' },
};

const NotificationManagement = () => {
    const { api } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ title: '', desc: '', type: 'System' });

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/super-admin/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [api]);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.desc.trim()) {
            toast.error('Title and message are required.');
            return;
        }
        setSending(true);
        try {
            const res = await api.post('/super-admin/notifications/broadcast', form);
            setNotifications([res.data, ...notifications]);
            setForm({ title: '', desc: '', type: 'System' });
            setShowForm(false);
            toast.success('Notification broadcast successfully!');
        } catch (error) {
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/super-admin/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
            toast.success('Notification deleted.');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/super-admin/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => api.put(`/super-admin/notifications/${n._id}/read`).catch(() => {})));
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read!');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight">Notification Management</h2>
                    <p className="text-gray-500 mt-1">Create and manage platform-wide system notifications and broadcasts.</p>
                </div>
                <div className="flex gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                        >
                            <CheckCheck size={16} /> Mark All Read
                        </button>
                    )}
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-blue-200"
                    >
                        <Plus size={16} /> New Broadcast
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: notifications.length, color: 'text-gray-900' },
                    { label: 'Unread', value: unreadCount, color: 'text-red-600' },
                    { label: 'Read', value: notifications.filter(n => n.read).length, color: 'text-green-600' },
                    { label: 'Broadcasts', value: notifications.filter(n => n.type === 'Broadcast').length, color: 'text-purple-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">All Notifications</h3>
                    <Link to="/super-admin/notifications" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl">
                        View Full Notifications <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500 font-medium text-lg">No notifications yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Create your first broadcast to get started.</p>
                        </div>
                    ) : (
                        notifications.map(n => {
                            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.Info;
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={n._id}
                                    className={`flex items-start gap-4 p-5 transition-colors ${!n.read ? 'bg-blue-50/30' : 'hover:bg-gray-50/60'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.text} shrink-0 mt-0.5`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="font-bold text-gray-900 text-sm">{n.title}</span>
                                                <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{n.type}</span>
                                                {!n.read && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.desc}</p>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        {!n.read && (
                                            <button
                                                onClick={() => handleMarkRead(n._id)}
                                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <CheckCheck size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(n._id)}
                                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Broadcast Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                <Send size={18} className="text-blue-600" /> Broadcast Notification
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleBroadcast} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, type }))}
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                                                    form.type === type
                                                    ? `${cfg.bg} ${cfg.text} border-transparent ring-2 ring-offset-1 ring-blue-400`
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                <Icon size={14} /> {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Notification title…"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Message</label>
                                <textarea
                                    value={form.desc}
                                    onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                                    placeholder="Enter the notification message…"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-60 shadow-lg shadow-blue-200"
                                >
                                    {sending ? 'Sending…' : <><Send size={14} /> Broadcast</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationManagement;
