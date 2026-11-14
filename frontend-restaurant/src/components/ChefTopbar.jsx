import { Bell, User, Clock, LogOut, Menu, ArrowLeft, Trash2, Eye, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

const ChefTopbar = () => {
    const { user, logout, api } = useAuth();
    const [time, setTime] = useState(new Date());
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [selectedOrderNote, setSelectedOrderNote] = useState(null);
    
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchNotifications();
        const pollInterval = setInterval(fetchNotifications, 20000);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        if (showNotifs) {
            fetchNotifications();
        }
    }, [showNotifs]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        }
    };

    const handleDeleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            setNotifications(prev => prev.filter(n => n._id !== id));
        }
    };

    const handleClearAll = async () => {
        try {
            await api.delete('/notifications/clear-all');
            setNotifications([]);
        } catch (error) {
            setNotifications([]);
        }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifs(false);
            if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const chefNotifications = notifications.filter(n => {
        const titleLower = (n.title || '').toLowerCase();
        // Exclude customer/waiter "Order Ready" / "Order Served" alerts from Chef's view
        if (titleLower.includes('order ready') || titleLower.includes('order served') || titleLower.includes('order completed')) {
            return false;
        }
        return (
            n.type === 'Order' ||
            n.metadata?.kind === 'admin_restock_reply' ||
            (Array.isArray(n.targetRole) && (n.targetRole.includes('Chef') || n.targetRole.includes('Kitchen')) && n.metadata?.kind !== 'kitchen_low_stock')
        );
    });
    const unreadCount = chefNotifications.filter(n => !n.read).length || 0;

    return (
        <header className="h-16 bg-white dark:bg-[#1e2330] border-b border-gray-100 dark:border-[#2a3040] flex items-center justify-between px-3 sm:px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                    onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} 
                    className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg shrink-0"
                    aria-label="Toggle Menu"
                >
                    <Menu size={22} />
                </button>
                <button
                    onClick={() => window.history.back()}
                    className="md:hidden p-1.5 px-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold border border-gray-200 dark:border-slate-800 shrink-0 shadow-xs"
                    aria-label="Go Back"
                    title="Back"
                >
                    <ArrowLeft size={15} />
                    <span className="text-[11px] font-bold">Back</span>
                </button>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-bold text-xs sm:text-sm bg-gray-50 dark:bg-[#151923] px-2.5 sm:px-4 py-1.5 rounded-lg border border-gray-100 dark:border-[#2a3040]">
                    <Clock size={15} className="text-orange-600 dark:text-orange-400 shrink-0" />
                    <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors bg-gray-50 dark:bg-[#151923] rounded-lg border border-gray-100 dark:border-[#2a3040]"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1e2330]"></span>}
                    </button>
 
                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1e2330] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2a3040] overflow-hidden z-50">
                            <div className="p-3.5 border-b border-gray-100 dark:border-[#2a3040] bg-gray-50 dark:bg-[#1a1e2a] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">Kitchen Alerts</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                {chefNotifications.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        className="text-[11px] font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Trash2 size={12} /> Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-[#2a3040]">
                                {chefNotifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold">
                                        No active kitchen alerts
                                    </div>
                                ) : (
                                    chefNotifications.slice(0, 15).map(note => (
                                        <div 
                                            key={note._id} 
                                            className={`p-3.5 transition-colors ${!note.read ? 'bg-orange-50/30 dark:bg-[#252b3b]' : 'hover:bg-gray-50 dark:hover:bg-[#232837]'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs leading-snug">
                                                    {note.title}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteNotification(note._id, e)}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer shrink-0"
                                                    title="Delete alert"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                {note.desc}
                                            </p>
                                            <div className="mt-2.5 flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOrderNote(note);
                                                        if (!note.read) handleMarkAsRead(note._id);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 dark:bg-orange-950/50 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Eye size={12} /> View Details
                                                </button>
                                                {!note.read && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleMarkAsRead(note._id, e)} 
                                                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* View Order Modal */}
                {selectedOrderNote && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <div className="bg-white dark:bg-[#1a1e2a] w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-[#2a3040] overflow-hidden text-left animate-in zoom-in-95 duration-200">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a3040] flex items-center justify-between bg-orange-50/60 dark:bg-[#252b3b]">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
                                        {selectedOrderNote.title}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                        {new Date(selectedOrderNote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Alert Details
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrderNote(null)}
                                    className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5 space-y-3.5">
                                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#151923] border border-gray-100 dark:border-[#2a3040]">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block mb-1">
                                        Order &amp; Food Details
                                    </span>
                                    <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                                        {selectedOrderNote.desc}
                                    </p>
                                </div>
                                {selectedOrderNote.metadata?.items && Array.isArray(selectedOrderNote.metadata.items) && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                                            Items List ({selectedOrderNote.metadata.items.length})
                                        </span>
                                        <div className="divide-y divide-gray-100 dark:divide-[#2a3040] border border-gray-100 dark:border-[#2a3040] rounded-xl overflow-hidden">
                                            {selectedOrderNote.metadata.items.map((it, idx) => (
                                                <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-semibold">
                                                    <span className="text-gray-800 dark:text-gray-200">{it.qty}x {it.name}</span>
                                                    <span className="text-gray-500 font-mono">₹{it.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="pt-2 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            handleDeleteNotification(selectedOrderNote._id, e);
                                            setSelectedOrderNote(null);
                                        }}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 size={13} /> Delete Notification
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOrderNote(null)}
                                        className="px-4 py-2 bg-slate-900 dark:bg-orange-600 hover:bg-black dark:hover:bg-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="relative" ref={profileRef}>
                    <div 
                        onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                        className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 md:pl-6 border-l border-gray-100 dark:border-[#2a3040] cursor-pointer group"
                    >
                        <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                            <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">{user?.name || 'Chef'}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Kitchen Staff'}</p>
                        </div>
                        <div className="w-9 h-9 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30 group-hover:bg-orange-500/30 transition-colors">
                            <User size={18} />
                        </div>
                    </div>
 
                    {showProfile && (
                        <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-[#1e2330] rounded-xl shadow-xl border border-gray-100 dark:border-[#2a3040] overflow-hidden z-50 py-1">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252b3b] hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ChefTopbar;
