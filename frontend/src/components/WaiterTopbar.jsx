import { Bell, User, Search, LogOut, Menu, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const WaiterTopbar = () => {
    const { user, api, logout } = useAuth();
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [api]);

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

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2 md:gap-4">
                <button 
                    onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} 
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
                >
                    <Menu size={24} />
                </button>
                <div className="relative group hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search table or order..." 
                        className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-64 font-medium"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                        className="relative p-2 text-gray-500 dark:text-slate-300 hover:text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50">
                            <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-850">
                                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                                ) : (
                                    notifications.slice(0, 5).map(note => (
                                        <div key={note._id} className={`p-4 border-b border-gray-100 dark:border-slate-800 last:border-0 ${!note.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{note.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{note.desc}</p>
                                            {!note.read && (
                                                <button onClick={() => handleMarkAsRead(note._id)} className="text-[10px] font-bold text-green-600 mt-2 hover:text-green-700">
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
                
                <div className="relative" ref={profileRef}>
                    <div 
                        onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                        className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-800 cursor-pointer group"
                    >
                        <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                            <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{user?.name || 'Waiter'}</p>
                            <p className="text-xs font-medium text-green-600 capitalize">{user?.role || 'Service Staff'}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center font-bold border border-green-200 dark:border-green-800 group-hover:bg-green-200 transition-colors">
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
