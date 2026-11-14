import { Bell, User, Search, LogOut, Menu, Settings, X, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { setWaiterSearchQuery } from '../hooks/useWaiterSearch';

const WaiterTopbar = () => {
    const { user, api, logout } = useAuth();
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [selectedOrderNote, setSelectedOrderNote] = useState(null);
    const [searchTerm, setSearchTerm] = useState(() => {
        try {
            return sessionStorage.getItem('waiter_search_query') || '';
        } catch (_) {
            return '';
        }
    });
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setWaiterSearchQuery(val);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [api]);

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

    const unreadCount = notifications.filter(n => !n.read).length || 0;

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2 md:gap-4">
                <button 
                    onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} 
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
                >
                    <Menu size={24} />
                </button>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSearchChange(searchTerm);
                    }}
                    className="relative group flex items-center"
                >
                    <button
                        type="submit"
                        aria-label="Search tables or orders"
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 group-focus-within:text-green-500 hover:text-green-600 transition-colors cursor-pointer"
                    >
                        <Search size={16} />
                    </button>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search table or order..." 
                        className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-40 sm:w-64 font-medium"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => handleSearchChange('')}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                            aria-label="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </form>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                        className="relative p-2 text-gray-500 dark:text-slate-300 hover:text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50">
                            <div className="p-3.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm">Waiter Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-black">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Trash2 size={12} /> Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-slate-800">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-xs font-semibold">No new notifications</div>
                                ) : (
                                    notifications.slice(0, 15).map(note => (
                                        <div key={note._id} className={`p-3.5 transition-colors ${!note.read ? 'bg-green-50/40 dark:bg-slate-800/60' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-gray-900 dark:text-white text-xs leading-snug">{note.title}</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteNotification(note._id, e)}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer shrink-0"
                                                    title="Delete alert"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">{note.desc}</p>
                                            <div className="mt-2.5 flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOrderNote(note);
                                                        if (!note.read) handleMarkAsRead(note._id);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-950/50 hover:bg-green-200 text-green-700 dark:text-green-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Eye size={12} /> View Details
                                                </button>
                                                {!note.read && (
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleMarkAsRead(note._id, e)} 
                                                        className="text-[10px] font-bold text-green-600 hover:text-green-800 transition-colors cursor-pointer"
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
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden text-left animate-in zoom-in-95 duration-200">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-green-50/60 dark:bg-slate-800">
                                <div>
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
                                        {selectedOrderNote.title}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                        {new Date(selectedOrderNote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Details
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
                                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-green-600 block mb-1">
                                        Details
                                    </span>
                                    <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                                        {selectedOrderNote.desc}
                                    </p>
                                </div>
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
                                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer"
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
                        className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-slate-800 cursor-pointer group"
                    >
                        <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                            <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{user?.name || 'Waiter'}</p>
                            <p className="text-xs font-medium text-green-600 capitalize">{user?.role || 'Service Staff'}</p>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center font-bold border border-green-200 dark:border-green-800 group-hover:bg-green-200 transition-colors">
                            <User size={18} />
                        </div>
                    </div>
                    {showProfile && (
                        <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 py-1">
                            <Link 
                                to="/waiter/settings"
                                onClick={() => setShowProfile(false)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Settings size={16} /> Settings
                            </Link>
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-gray-100 dark:border-slate-800"
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

export default WaiterTopbar;
