import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Truck, Power, User, MapPin, Phone, MessageSquare, DollarSign, 
    CheckCircle2, Clock, Navigation, AlertTriangle, ArrowUpRight, 
    LogOut, Calendar, Wallet, ListTodo
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DeliveryPartnerDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [activeSection, setActiveSection] = useState('tasks'); // tasks, earnings, profile
    const [loading, setLoading] = useState(true);

    // Withdrawal input
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawDetails, setWithdrawDetails] = useState('');
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // Mock maps modal
    const [showNavigationModal, setShowNavigationModal] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedProgress, setSimulatedProgress] = useState(0);
    const [simLat, setSimLat] = useState(13.0827);
    const [simLng, setSimLng] = useState(80.2707);
    const [simEta, setSimEta] = useState(15);
    const [simDistance, setSimDistance] = useState(3.5);

    const getApiUrl = () => {
        let baseURL = import.meta.env.VITE_API_URL;
        if (baseURL) {
            if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
            if (!baseURL.endsWith('/api')) baseURL += '/api';
            return baseURL;
        }
        const hostname = window.location.hostname;
        const isLocalIp = hostname.startsWith('192.168.') || 
                          hostname.startsWith('10.') || 
                          hostname.startsWith('172.');
        if (isLocalIp) {
            return `http://${hostname}:5000/api`;
        }
        return 'http://localhost:5000/api';
    };
    const API_URL = getApiUrl();

    // Axios client with auth header
    const getClient = () => {
        const stored = localStorage.getItem('restosys_staff_user');
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return axios.create({
            baseURL: API_URL,
            headers: {
                Authorization: `Bearer ${parsed.token}`
            }
        });
    };

    const client = getClient();

    const loadData = async () => {
        if (!client) {
            navigate('/delivery/login');
            return;
        }
        try {
            const [profileRes, ordersRes, earningsRes, withdrawalsRes] = await Promise.all([
                client.get('/delivery/profile'),
                client.get('/delivery/orders/assigned'),
                client.get('/delivery/earnings'),
                client.get('/delivery/withdrawals')
            ]);
            setProfile(profileRes.data);
            setAssignedOrders(ordersRes.data);
            setEarnings(earningsRes.data);
            setWithdrawals(withdrawalsRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('restosys_staff_user');
                navigate('/delivery/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('restosys_staff_user');
        if (!stored) {
            navigate('/delivery/login');
            return;
        }
        setUser(JSON.parse(stored));
        loadData();
    }, []);

    useEffect(() => {
        if (!showNavigationModal) {
            setSimulatedProgress(0);
            setIsSimulating(false);
            return;
        }

        // Initialize simulation coordinates and initial distance
        const baseLat = 13.0827 + (Math.random() - 0.5) * 0.01;
        const baseLng = 80.2707 + (Math.random() - 0.5) * 0.01;
        setSimLat(baseLat);
        setSimLng(baseLng);
        setSimEta(15);
        setSimDistance(3.5);
        setSimulatedProgress(0);
        setIsSimulating(false);
    }, [showNavigationModal]);

    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(() => {
            setSimulatedProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsSimulating(false);
                    return 100;
                }
                const next = prev + 5; // 5% progress per second
                
                // Slightly adjust GPS coordinates
                setSimLat(l => l + (Math.random() - 0.2) * 0.0008);
                setSimLng(g => g + (Math.random() - 0.2) * 0.0008);
                
                // Decrement ETA and distance proportionally
                setSimEta(Math.max(1, Math.ceil(15 * (1 - next / 100))));
                setSimDistance(Number((3.5 * (1 - next / 100)).toFixed(1)));

                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isSimulating]);

    const handleToggleStatus = async () => {
        if (!client || !profile) return;
        const nextStatus = profile.status === 'Online' ? 'Offline' : 'Online';
        try {
            await client.put('/delivery/profile/status', { status: nextStatus });
            setProfile(prev => ({ ...prev, status: nextStatus }));
            toast.success(`You are now ${nextStatus}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        if (!client) return;
        try {
            await client.put(`/delivery/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as: ${newStatus}`);
            loadData(); // Reload list
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleRequestWithdrawal = async (e) => {
        e.preventDefault();
        if (!client || !profile) return;
        try {
            await client.post('/delivery/withdrawals', {
                amount: Number(withdrawAmount),
                payoutDetails: withdrawDetails
            });
            toast.success('Withdrawal request submitted successfully!');
            setIsWithdrawOpen(false);
            setWithdrawAmount('');
            setWithdrawDetails('');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-20 flex flex-col">
            {/* Header */}
            <header className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                        <Truck size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-wide leading-none">{user?.name}</h1>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Delivery Partner</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Online Toggle */}
                    <button
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                            profile?.status === 'Online' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                    >
                        <Power size={12} className={profile?.status === 'Online' ? 'animate-pulse' : ''} />
                        {profile?.status}
                    </button>

                    <button onClick={handleLogout} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* TAB CONTAINER */}
            <main className="flex-1 px-4 py-6 w-full max-w-md mx-auto space-y-6">

                {/* ─── TAB 1: ACTIVE TASKS ────────────────────────────────── */}
                {activeSection === 'tasks' && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Assigned Tasks</h2>

                        {/* Ready Orders Glowing Notifications */}
                        {assignedOrders.filter(o => o.deliveryStatus === 'Accepted' && (o.status === 'Ready' || o.status === 'Ready for Pickup')).map(order => (
                            <div key={`ready-alert-${order._id}`} className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 animate-pulse shadow-md shadow-emerald-500/5">
                                <span className="relative flex h-3.5 w-3.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                </span>
                                <div className="flex-1 text-xs">
                                    <p className="font-extrabold text-emerald-400 uppercase tracking-wider text-[9px]">Kitchen Ready Notification</p>
                                    <p className="text-slate-200 mt-0.5 font-bold">Order <span className="text-emerald-400">#{order._id.substring(order._id.length - 4).toUpperCase()}</span> is prepared! Head to the counter to collect the food.</p>
                                </div>
                            </div>
                        ))}

                        {assignedOrders.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 p-12 rounded-[2rem] text-center text-slate-400 flex flex-col items-center gap-3">
                                <ListTodo size={32} className="text-slate-600" />
                                <p className="font-bold text-sm">No active tasks assigned.</p>
                                <p className="text-[10px] text-slate-500 max-w-[200px]">Go online to accept pending order delivery runs near you.</p>
                            </div>
                        ) : (
                            assignedOrders.map(order => (
                                <div key={order._id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl space-y-5">
                                    {/* Order Meta */}
                                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Order</p>
                                            <h3 className="text-base font-black text-white mt-1">#{order._id.substring(order._id.length - 4).toUpperCase()}</h3>
                                            <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded mt-2 border ${
                                                order.status === 'Ready' || order.status === 'Ready for Pickup'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                Kitchen: {order.status}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                                                {order.deliveryStatus}
                                            </span>
                                            <p className="text-sm font-black text-emerald-400 mt-1">₹{order.deliveryCharge}</p>
                                        </div>
                                    </div>

                                    {/* Distance & Info */}
                                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Restaurant Pickup</span>
                                            <p className="truncate">Local Hub</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Customer Destination</span>
                                            <p className="truncate">{order.shippingAddress?.address || 'Customer Location'}</p>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4">
                                        <button 
                                            onClick={() => setShowNavigationModal(true)}
                                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                                        >
                                            <Navigation size={14} className="text-emerald-400" /> Map
                                        </button>
                                        <a 
                                            href="tel:12345678"
                                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                                        >
                                            <Phone size={14} className="text-blue-400" /> Phone
                                        </a>
                                        <a 
                                            href="sms:12345678"
                                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                                        >
                                            <MessageSquare size={14} className="text-purple-400" /> Support
                                        </a>
                                    </div>

                                    {/* Status transit controller */}
                                    <div className="pt-2">
                                        {order.deliveryStatus === 'Pending Assignment' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleUpdateOrderStatus(order._id, 'Accepted')}
                                                    className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-colors"
                                                >
                                                    Accept Order
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateOrderStatus(order._id, 'Rejected')}
                                                    className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl text-xs font-black tracking-wider uppercase transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {order.deliveryStatus === 'Accepted' && (
                                            (order.status === 'Ready' || order.status === 'Ready for Pickup' || order.status === 'Out for Delivery') ? (
                                                <button
                                                    onClick={() => handleUpdateOrderStatus(order._id, 'Picked Up')}
                                                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-colors"
                                                >
                                                    Collect Food (Mark Picked Up)
                                                </button>
                                            ) : (
                                                <div className="text-center p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-xs font-black text-slate-400 tracking-wide">
                                                    ⏳ Kitchen is preparing your food...
                                                </div>
                                            )
                                        )}

                                        {order.deliveryStatus === 'Picked Up' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order._id, 'On the Way')}
                                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-colors"
                                            >
                                                Mark On the Way
                                            </button>
                                        )}

                                        {order.deliveryStatus === 'On the Way' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order._id, 'Delivered')}
                                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-colors shadow-lg shadow-emerald-500/10"
                                            >
                                                Mark Order Delivered
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ─── TAB 2: WALLET & EARNINGS ────────────────────────────── */}
                {activeSection === 'earnings' && (
                    <div className="space-y-6">
                        {/* Payout metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] flex items-center gap-3 shadow-lg">
                                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Wallet</span>
                                    <h3 className="text-lg font-black text-white mt-0.5">₹{earnings?.stats?.walletBalance}</h3>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] flex items-center gap-3 shadow-lg">
                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Earnings</span>
                                    <h3 className="text-lg font-black text-white mt-0.5">₹{earnings?.stats?.totalEarnings}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Withdraw button */}
                        <button
                            onClick={() => setIsWithdrawOpen(true)}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <ArrowUpRight size={16} /> Request Withdrawal
                        </button>

                        {/* Completed Deliveries */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Delivered Tasks</h3>
                            
                            {earnings?.history?.length === 0 ? (
                                <div className="py-10 text-center text-slate-500 font-bold text-xs">
                                    No completed deliveries yet.
                                </div>
                            ) : (
                                earnings?.history?.map(h => (
                                    <div key={h._id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-white">Order #{h._id.substring(h._id.length - 4).toUpperCase()}</p>
                                            <p className="text-[9px] text-slate-500 mt-0.5">{new Date(h.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className="font-extrabold text-emerald-400">+₹{h.deliveryCharge}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: PROFILE ──────────────────────────────────────── */}
                {activeSection === 'profile' && profile && (
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl space-y-6">
                        {/* Image & Header */}
                        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-800">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-xl shadow-lg">
                                {profile.userId?.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">{profile.userId?.name}</h3>
                                <p className="text-[10px] text-slate-400 mt-1 font-bold">Registered Mobile: +91 {profile.userId?.phoneNumber}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4 text-xs font-semibold text-slate-300">
                            <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Approval State</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                                    profile.verificationStatus === 'Approved' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                    {profile.verificationStatus}
                                </span>
                            </div>
                            
                            <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Vehicle registered</span>
                                <p className="text-sm font-bold mt-1 text-white">{profile.vehicleDetails?.type} · {profile.vehicleDetails?.model || 'Generic Model'}</p>
                            </div>

                            <div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">License Number</span>
                                <p className="text-sm font-bold mt-1 text-white">{profile.vehicleDetails?.licenseNumber || 'DL-XXXX'}</p>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Bottom Nav Bar */}
            <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-850 py-3 px-6 flex justify-around items-center z-20 shadow-2xl">
                {[
                    { id: 'tasks', label: 'Tasks', icon: ListTodo },
                    { id: 'earnings', label: 'Earnings', icon: Wallet },
                    { id: 'profile', label: 'Profile', icon: User }
                ].map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex flex-col items-center gap-1 transition-all ${
                                isActive ? 'text-emerald-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Icon size={18} />
                            <span className="text-[9px] tracking-wider uppercase font-semibold">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* WITHDRAWAL MODAL */}
            {isWithdrawOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-850 p-6 rounded-[2rem] shadow-2xl w-full max-w-sm relative">
                        <h3 className="font-black text-white text-lg mb-4">Request Payout Withdrawal</h3>
                        <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Withdrawal Amount (₹)</label>
                                <input 
                                    type="number"
                                    required
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount to withdraw"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                                    max={profile?.walletBalance}
                                />
                                <p className="text-[9px] text-slate-500 mt-1">Available balance: ₹{profile?.walletBalance}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">UPI ID or Bank Details</label>
                                <input 
                                    type="text"
                                    required
                                    value={withdrawDetails}
                                    onChange={(e) => setWithdrawDetails(e.target.value)}
                                    placeholder="e.g. upi@okaxis or Account No..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsWithdrawOpen(false)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MOCK MAPS / DIRECTIONS MODAL */}
            {showNavigationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-850 p-6 rounded-[2rem] shadow-2xl w-full max-w-sm relative text-center space-y-5">
                        
                        {/* Simulated Route Header */}
                        <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
                                <Navigation size={14} className={isSimulating ? "animate-bounce text-emerald-400" : "text-slate-450"} />
                                <span className={isSimulating ? "text-emerald-400" : "text-slate-450"}>
                                    {isSimulating ? "GPS Active" : "GPS Paused"}
                                </span>
                            </div>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-black text-slate-455 uppercase tracking-widest font-mono">
                                {simulatedProgress === 100 ? 'Arrived' : `${simulatedProgress}%`}
                            </span>
                        </div>

                        {/* Coordinates Box (matches screenshot style, filled dynamically) */}
                        <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-left">
                            <Navigation size={18} className="text-emerald-400 shrink-0 transform rotate-45" />
                            <div className="font-semibold text-xs space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Simulated Geolocation</p>
                                <p className="text-slate-100 font-black font-mono">
                                    Lat: {simLat.toFixed(6)}° N
                                </p>
                                <p className="text-slate-100 font-black font-mono">
                                    Lng: {simLng.toFixed(6)}° E
                                </p>
                            </div>
                        </div>

                        {/* Progress Route */}
                        <div className="space-y-2 text-left">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Restaurant Hub</span>
                                <span>Delivery Address</span>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div 
                                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${simulatedProgress}%` }}
                                />
                            </div>

                            {/* Journey stats */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center">
                                <div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Remaining</span>
                                    <strong className="text-xs font-black text-slate-200">{simDistance} km</strong>
                                </div>
                                <div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Est. Time</span>
                                    <strong className="text-xs font-black text-slate-200">{simEta} Mins</strong>
                                </div>
                                <div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Speed</span>
                                    <strong className="text-xs font-black text-emerald-400 font-mono">
                                        {!isSimulating && simulatedProgress === 0 ? '0 km/h' : simulatedProgress === 100 ? '0 km/h' : '32 km/h'}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Leg description */}
                        <div className="text-[10px] bg-slate-950/40 p-2.5 rounded-xl text-slate-400 font-bold border border-slate-850 min-h-[40px] flex items-center justify-center text-center">
                            {!isSimulating && simulatedProgress === 0 ? (
                                <span className="text-slate-500">🚦 Ready to start route navigation simulation.</span>
                            ) : (
                                <>
                                    {simulatedProgress === 0 && "📍 Starting navigation run..."}
                                    {simulatedProgress > 0 && simulatedProgress <= 25 && "🛵 Departing Hub. Navigating main bypass road."}
                                    {simulatedProgress > 25 && simulatedProgress <= 60 && "🛵 Cruising. Traffic flow normal."}
                                    {simulatedProgress > 60 && simulatedProgress <= 90 && "🛵 Entering customer neighborhood zone."}
                                    {simulatedProgress > 90 && simulatedProgress < 100 && "🛵 Searching for building block & door number."}
                                    {simulatedProgress === 100 && "🎉 Arrived! Deliver order to customer counter."}
                                </>
                            )}
                        </div>

                        {/* Start Navigation Action Button */}
                        {!isSimulating && simulatedProgress === 0 && (
                            <button
                                type="button"
                                onClick={() => setIsSimulating(true)}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Start Navigation
                            </button>
                        )}

                        {isSimulating && (
                            <div className="py-2 text-xs text-slate-500 font-bold animate-pulse uppercase tracking-widest font-black">
                                Simulating movement...
                            </div>
                        )}

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setShowNavigationModal(false)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 text-slate-200 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
                        >
                            Close Directions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPartnerDashboard;
