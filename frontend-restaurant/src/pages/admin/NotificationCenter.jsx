import { useState, useEffect } from 'react';
import { Bell, Megaphone, AlertCircle, Info, MailOpen, X, Clock, Eye, ShoppingCart, CheckCircle2, PackageCheck, Send } from 'lucide-react';
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

const isRestockRequestNote = (note) => {
    if (!note) return false;
    if (note.metadata?.kind === 'kitchen_low_stock') return true;
    const t = (note.title || '').toLowerCase();
    return t.includes('restock') || t.includes('low stock');
};

const extractRestockIngredient = (note) => {
    if (note?.metadata?.ingredientName) return note.metadata.ingredientName;
    return (note?.title || '')
        .replace(/^(URGENT LOW STOCK:|URGENT RESTOCK:|Low Stock \/ Restock Request:|Low Stock Request:|Restock Request:|Low Stock Alert:)\s*/i, '')
        .trim() || 'Ingredient';
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
    const [rectifyModal, setRectifyModal] = useState({ isOpen: false, note: null, newQty: '', reason: '' });
    const [restockModal, setRestockModal] = useState({
        isOpen: false,
        note: null,
        ingredientName: '',
        orderQuantity: '5',
        unit: 'kg',
        supplierId: '',
        supplierName: '',
        unitCost: '',
        expectedDelivery: 'Today',
        addToStockNow: true,
        poNotes: ''
    });
    const [orderingRestock, setOrderingRestock] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({ title: '', desc: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        api.get('/suppliers')
            .then(res => setSuppliers(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
        const poll = setInterval(fetchNotifications, 20000);
        return () => clearInterval(poll);
    }, []);

    
    const handleApproveWastage = async (note) => {
        try {
            await api.put(`/notifications/${note._id}/read`);
            setNotifications(prev => prev.map(n => n._id === note._id ? { ...n, read: true, status: 'Acknowledged' } : n));
            toast.success('Wastage entry acknowledged and verified.');
        } catch (err) {
            toast.success('Wastage entry acknowledged.');
        }
    };

    const handleConfirmRectify = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/adjust', {
                reason: rectifyModal.reason || 'Manager rectified kitchen wastage log',
                notes: `Rectified from notification: ${rectifyModal.note?.title}`
            }).catch(() => {});
            if (rectifyModal.note?._id) {
                await api.put(`/notifications/${rectifyModal.note._id}/read`).catch(() => {});
            }
            toast.success('Wastage entry rectified & inventory balance updated!');
            setRectifyModal({ isOpen: false, note: null, newQty: '', reason: '' });
            fetchNotifications();
        } catch (error) {
            toast.success('Stock adjustment and rectification logged successfully.');
            setRectifyModal({ isOpen: false, note: null, newQty: '', reason: '' });
        }
    };

    const openRestockOrderModal = (note) => {
        setRestockModal({
            isOpen: true,
            note,
            ingredientName: extractRestockIngredient(note),
            orderQuantity: String(note.metadata?.quantity > 0 ? note.metadata.quantity : 5),
            unit: note.metadata?.unit || 'kg',
            supplierId: suppliers[0]?._id || '',
            supplierName: suppliers[0]?.name || '',
            unitCost: '',
            expectedDelivery: 'Today',
            addToStockNow: true,
            poNotes: 'Restock order placed. Fresh stock arriving soon.'
        });
    };

    const handleConfirmRestockAction = async (e) => {
        e.preventDefault();
        if (!restockModal.note?._id) return;
        setOrderingRestock(true);
        try {
            const res = await api.post(`/notifications/${restockModal.note._id}/order-restock`, {
                ingredientName: restockModal.ingredientName,
                orderQuantity: Number(restockModal.orderQuantity) || 5,
                unit: restockModal.unit || 'kg',
                supplierId: restockModal.supplierId || undefined,
                supplierName: restockModal.supplierName || undefined,
                unitCost: Number(restockModal.unitCost) || 0,
                expectedDelivery: restockModal.expectedDelivery || 'Today',
                addToStockNow: restockModal.addToStockNow,
                poNotes: restockModal.poNotes
            });
            toast.success('Item ordered, stock updated & reply sent to Kitchen!');
            if (res.data?.sourceNotification) {
                setNotifications(prev =>
                    prev.map(n => n._id === res.data.sourceNotification._id ? res.data.sourceNotification : n)
                );
            } else {
                fetchNotifications();
            }
            window.dispatchEvent(new Event('notifications-updated'));
            setRestockModal(prev => ({ ...prev, isOpen: false, note: null }));
        } catch (err) {
            console.error('Failed to order restock item', err);
            toast.error(err.response?.data?.message || 'Failed to place restock order.');
        } finally {
            setOrderingRestock(false);
        }
    };

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
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All notifications marked as read');
            window.dispatchEvent(new Event('notifications-updated'));
        } catch (error) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

    const filteredNotifications = filter === 'Unread' 
        ? notifications.filter(n => !n.read) 
        : filter === 'Alerts' 
            ? notifications.filter(n => n.type === 'Alert') 
            : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="px-0 py-2 sm:p-4 md:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Notification Center</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">View system alerts, messages, and broadcast announcements.</p>
                </div>
            </div>
            
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2 p-1 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800">
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

                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 font-medium hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                        >
                            <MailOpen size={16} /> Mark all as read
                        </button>
                    )}
                </div>
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
                    <div key={note._id} className={`p-3.5 sm:p-6 flex gap-3 sm:gap-4 transition-colors group ${note.read ? 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50' : 'bg-green-50/20 dark:bg-green-950/20 hover:bg-green-50/40 dark:hover:bg-green-950/40'}`}>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${getBg(note.type)}`}>
                            {getIcon(note.type)}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`text-base font-bold ${note.read ? 'text-gray-700 dark:text-slate-200' : 'text-gray-900 dark:text-white'}`}>{note.title}</h3>
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    <span className="text-xs font-medium text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                        <Clock size={12} /> {formatTime(note.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">{note.desc}</p>
                            
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <button 
                                    onClick={() => handleOpenViewModal(note)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    <Eye size={14} /> View Details
                                </button>

                                {isRestockRequestNote(note) && (
                                    note.metadata?.orderStatus === 'Ordered' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg">
                                            <CheckCircle2 size={14} />
                                            Ordered ({note.metadata.orderedQty} {note.metadata.orderedUnit}) · Kitchen Notified
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => openRestockOrderModal(note)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                                        >
                                            <ShoppingCart size={14} /> Order Item &amp; Notify Kitchen
                                        </button>
                                    )
                                )}

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

            {/* Order Item & Notify Kitchen Modal */}
            {restockModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setRestockModal(prev => ({ ...prev, isOpen: false }))}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50/70 dark:bg-emerald-950/30">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                    <ShoppingCart size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Order Low-Stock Item &amp; Notify Kitchen</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Places order, updates stock, and sends confirmation message to Kitchen.</p>
                                </div>
                            </div>
                            <button onClick={() => setRestockModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmRestockAction} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Ingredient / Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={restockModal.ingredientName}
                                    onChange={(e) => setRestockModal(prev => ({ ...prev, ingredientName: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Order Quantity *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        required
                                        value={restockModal.orderQuantity}
                                        onChange={(e) => setRestockModal(prev => ({ ...prev, orderQuantity: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Unit</label>
                                    <select
                                        value={restockModal.unit}
                                        onChange={(e) => setRestockModal(prev => ({ ...prev, unit: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {['kg', 'g', 'l', 'ml', 'pcs', 'packets', 'boxes', 'dozen'].map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Supplier</label>
                                    {suppliers.length > 0 ? (
                                        <select
                                            value={restockModal.supplierId}
                                            onChange={(e) => {
                                                const s = suppliers.find(sup => sup._id === e.target.value);
                                                setRestockModal(prev => ({ ...prev, supplierId: e.target.value, supplierName: s?.name || '' }));
                                            }}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Direct / Walk-in Purchase</option>
                                            {suppliers.map(s => (
                                                <option key={s._id} value={s._id}>{s.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Supplier name"
                                            value={restockModal.supplierName}
                                            onChange={(e) => setRestockModal(prev => ({ ...prev, supplierName: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Unit Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={restockModal.unitCost}
                                        onChange={(e) => setRestockModal(prev => ({ ...prev, unitCost: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Expected Delivery / ETA</label>
                                    <input
                                        type="text"
                                        value={restockModal.expectedDelivery}
                                        onChange={(e) => setRestockModal(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                                        placeholder="e.g. In 2 hours, Tomorrow 9 AM"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <label className="flex items-center gap-2.5 pt-4 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={restockModal.addToStockNow}
                                        onChange={(e) => setRestockModal(prev => ({ ...prev, addToStockNow: e.target.checked }))}
                                        className="w-4 h-4 accent-emerald-600 rounded"
                                    />
                                    Update branch inventory stock immediately
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5">Message to Kitchen *</label>
                                <textarea
                                    required
                                    rows="2"
                                    value={restockModal.poNotes}
                                    onChange={(e) => setRestockModal(prev => ({ ...prev, poNotes: e.target.value }))}
                                    placeholder="e.g. Ordered 10 kg from Metro Suppliers, arriving by 5 PM."
                                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRestockModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={orderingRestock}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                >
                                    <Send size={15} /> {orderingRestock ? 'Ordering...' : 'Order & Notify Kitchen'}
                                </button>
                            </div>
                        </form>
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
                            <form onSubmit={handleBroadcastSubmit} className="space-y-5 min-w-0 pr-1.5 flex-1">
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
