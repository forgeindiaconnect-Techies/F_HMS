import { useState, useEffect } from 'react';
import { Search, Plus, Bell, Megaphone, AlertCircle, Info, MailOpen, MoreHorizontal, X, Clock, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getIcon = (type) => {
    switch(type) {
        case 'Alert': return <AlertCircle size={20} className="text-red-500" />;
        case 'Info': return <Info size={20} className="text-blue-500" />;
        case 'Broadcast': return <Megaphone size={20} className="text-purple-500" />;
        case 'System': return <Info size={20} className="text-gray-500" />;
        default: return <Bell size={20} className="text-gray-500" />;
    }
};

const getBg = (type) => {
    switch(type) {
        case 'Alert': return 'bg-red-100';
        case 'Info': return 'bg-blue-100';
        case 'Broadcast': return 'bg-purple-100';
        default: return 'bg-gray-100';
    }
};

const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const NotificationCenter = () => {
    const { api } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All, Unread, Alerts
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNoteForView, setSelectedNoteForView] = useState(null);
    const [formData, setFormData] = useState({ title: '', desc: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const DUMMY_NOTIFICATIONS = [
        {
            _id: 'dummy-1',
            title: 'Low Stock Alert: Mozzarella Cheese',
            desc: 'Inventory for Mozzarella Cheese has dropped below 5 kg. Please submit a purchase requisition to restock.',
            type: 'Alert',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
            _id: 'dummy-2',
            title: 'New Table QR Dine-In Order #177D66',
            desc: 'Table 4 scanned QR menu and placed order #177D66 (2 Items - ₹36.00). KDS ticket generated.',
            type: 'Info',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
            _id: 'dummy-3',
            title: 'Scheduled System Maintenance: RESTOSYS-v3.2',
            desc: 'System maintenance scheduled tonight from 02:00 AM to 04:00 AM EST. POS offline mode remains functional.',
            type: 'Broadcast',
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        },
        {
            _id: 'dummy-4',
            title: 'Daily Sales Report Generated',
            desc: 'Branch gross sales report for yesterday (₹48,920.00) is ready for manager sign-off.',
            type: 'System',
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        }
    ];

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data && res.data.length > 0) {
                setNotifications(res.data);
            } else {
                setNotifications(DUMMY_NOTIFICATIONS);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            setNotifications(DUMMY_NOTIFICATIONS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            if (!id.startsWith('dummy-')) {
                await api.put(`/notifications/${id}/read`);
            }
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        }
    };

    const handleOpenViewModal = (note) => {
        setSelectedNoteForView(note);
        if (!note.read) {
            handleMarkAsRead(note._id);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        }
    };

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/notifications/broadcast', formData);
            fetchNotifications();
            setIsModalOpen(false);
            setFormData({ title: '', desc: '' });
            toast.success('Broadcast sent successfully');
        } catch (error) {
            console.error('Failed to create broadcast', error);
            const newDummy = {
                _id: `dummy-${Date.now()}`,
                title: formData.title,
                desc: formData.desc,
                type: 'Broadcast',
                read: false,
                createdAt: new Date().toISOString()
            };
            setNotifications([newDummy, ...notifications]);
            setIsModalOpen(false);
            setFormData({ title: '', desc: '' });
            toast.success('Broadcast notification added');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'Unread') return !n.read;
        if (filter === 'Alerts') return n.type === 'Alert';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Notification Center</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">View system alerts, messages, and broadcast announcements.</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800">
                    <button 
                        onClick={() => setFilter('All')}
                        className={`px-4 py-1.5 font-bold rounded-md text-sm transition-colors cursor-pointer ${filter === 'All' ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter('Unread')}
                        className={`px-4 py-1.5 font-medium rounded-md text-sm transition-colors flex items-center gap-1.5 cursor-pointer ${filter === 'Unread' ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                    >
                        Unread 
                        {unreadCount > 0 && <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{unreadCount}</span>}
                    </button>
                    <button 
                        onClick={() => setFilter('Alerts')}
                        className={`px-4 py-1.5 font-medium rounded-md text-sm transition-colors cursor-pointer ${filter === 'Alerts' ? 'bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                    >
                        Alerts
                    </button>
                </div>
                {unreadCount > 0 && (
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 font-medium hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                    >
                        <MailOpen size={16} /> Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden divide-y divide-gray-50 dark:divide-slate-800">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 dark:text-slate-400">
                        <Bell className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
                        <p>No notifications found in this view.</p>
                    </div>
                ) : filteredNotifications.map(note => (
                    <div key={note._id} className={`p-6 flex gap-4 transition-colors group ${note.read ? 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50' : 'bg-green-50/20 dark:bg-green-950/20 hover:bg-green-50/40 dark:hover:bg-green-950/40'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getBg(note.type)}`}>
                            {getIcon(note.type)}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`text-base font-bold ${note.read ? 'text-gray-700 dark:text-slate-200' : 'text-gray-900 dark:text-white'}`}>{note.title}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                        <Clock size={12} /> {formatTime(note.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">{note.desc}</p>
                            
                            <div className="mt-3 flex items-center gap-4">
                                <button 
                                    onClick={() => handleOpenViewModal(note)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    <Eye size={14} /> View Details
                                </button>

                                {!note.read && (
                                    <button 
                                        onClick={() => handleMarkAsRead(note._id)}
                                        className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-800 transition-colors cursor-pointer"
                                    >
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View Full Notification Modal */}
            {selectedNoteForView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNoteForView(null)}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/80 dark:bg-slate-950/80">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getBg(selectedNoteForView.type)}`}>
                                    {getIcon(selectedNoteForView.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedNoteForView.type || 'Notification'} Details</h3>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                        <Clock size={11} /> {new Date(selectedNoteForView.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNoteForView(null)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 block mb-1">Subject / Title</span>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white leading-snug">{selectedNoteForView.title}</h4>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 block mb-2">Notification Content</span>
                                <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">{selectedNoteForView.desc}</p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button 
                                    onClick={() => setSelectedNoteForView(null)}
                                    className="px-6 py-2.5 bg-gray-900 dark:bg-green-600 hover:bg-black dark:hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                    Close Notification
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Send New Broadcast</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <form onSubmit={handleBroadcastSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Broadcast Title *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        placeholder="e.g. System Maintenance Tonight"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Message Content *</label>
                                    <textarea 
                                        required
                                        rows="4"
                                        value={formData.desc}
                                        onChange={(e) => setFormData({...formData, desc: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium resize-none"
                                        placeholder="Type your message here..."
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1">This will be sent to all staff members immediately.</p>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm disabled:opacity-70"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Broadcast'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
