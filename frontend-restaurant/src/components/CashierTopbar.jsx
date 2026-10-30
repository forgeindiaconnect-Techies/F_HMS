import { Bell, User, Search, LogOut, Menu, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

const CashierTopbar = () => {
    const { user, api, logout } = useAuth();
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        if (showNotifs) {
            fetchNotifications();
        }
    }, [showNotifs]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
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

    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        window.dispatchEvent(new CustomEvent('cashier-search', { detail: val }));
    };

    return (
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-10 shadow-xs">
            <div className="flex-1 flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0">
                <button 
                    onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} 
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                >
                    <Menu size={22} />
                </button>
                <div className="relative flex-1 max-w-[170px] sm:max-w-xs md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search bill or table..."
                        className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => handleSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                        className="relative p-2 text-gray-400 hover:text-purple-600 transition-colors hover:bg-purple-50 rounded-lg"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                                ) : (
                                    notifications.slice(0, 5).map(note => (
                                        <div key={note._id} className={`p-4 border-b border-gray-100 last:border-0 ${!note.read ? 'bg-purple-50/50' : ''}`}>
                                            <p className="font-bold text-gray-900 text-sm">{note.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{note.desc}</p>
                                            {!note.read && (
                                                <button onClick={() => handleMarkAsRead(note._id)} className="text-[10px] font-bold text-purple-600 mt-2 hover:text-purple-700">
                                                    Mark as Read
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cashier POS Settings Button */}
                <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('open-cashier-settings'))}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg group cursor-pointer"
                    title="Cashier POS Settings"
                >
                    <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
                </button>

                <div className="h-6 sm:h-8 w-px bg-gray-200 dark:bg-slate-800"></div>

                <div className="relative" ref={profileRef}>
                    <div 
                        onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
                    >
                        <div className="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
                            <p className="text-sm font-bold text-gray-900 capitalize">{user?.name || 'Cashier User'}</p>
                            <p className="text-xs font-medium text-purple-600 capitalize">{user?.role || 'Cashier'}</p>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center border border-purple-200 text-purple-700 group-hover:bg-purple-200 transition-colors">
                            <User size={18} />
                        </div>
                    </div>
                    {showProfile && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
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

export default CashierTopbar;
