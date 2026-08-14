import { Bell, User, Clock, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

const ChefTopbar = () => {
    const { user, logout, api } = useAuth();
    const [time, setTime] = useState(new Date());
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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

    const chefNotifications = notifications.filter(n => n.type === 'Order');
    const unreadCount = chefNotifications.filter(n => !n.read).length || 0;

    return (
        <header className="h-16 bg-white dark:bg-[#1e2330] border-b border-gray-100 dark:border-[#2a3040] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))} 
                    className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg shrink-0"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-sm bg-gray-50 dark:bg-[#151923] px-4 py-1.5 rounded-lg border border-gray-100 dark:border-[#2a3040]">
                    <Clock size={16} className="text-orange-600 dark:text-orange-400" />
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors bg-gray-50 dark:bg-[#151923] rounded-lg border border-gray-100 dark:border-[#2a3040]"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1e2330]"></span>}
                    </button>
 
                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1e2330] rounded-xl shadow-xl border border-gray-100 dark:border-[#2a3040] overflow-hidden z-50">
                            <div className="p-3 border-b border-gray-100 dark:border-[#2a3040] bg-gray-50 dark:bg-[#1a1e2a]">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">New Orders</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {chefNotifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">No new order alerts</div>
                                ) : (
                                    chefNotifications.slice(0, 10).map(note => (
                                        <div key={note._id} className={`p-4 border-b border-gray-100 dark:border-[#2a3040] last:border-0 ${!note.read ? 'bg-orange-50/20 dark:bg-[#252b3b]' : ''}`}>
                                            <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{note.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.desc}</p>
                                            {!note.read && (
                                                <button onClick={() => handleMarkAsRead(note._id)} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-2 hover:text-orange-500 dark:hover:text-orange-300">
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
                        className="flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-[#2a3040] cursor-pointer group"
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
