import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Truck, Power, User, MapPin, Phone, MessageSquare, DollarSign, 
    CheckCircle2, Clock, Navigation, AlertTriangle, ArrowUpRight, 
    LogOut, Calendar, Wallet, ListTodo, ShieldCheck, Award, ChevronRight, KeyRound, Lock, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';

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

    // OTP Modal states
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [selectedOtpOrder, setSelectedOtpOrder] = useState(null);
    const [customerOtpInput, setCustomerOtpInput] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);

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
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleOpenOtpModal = (order) => {
        setSelectedOtpOrder(order);
        setCustomerOtpInput('');
        setShowOtpModal(true);
    };

    const handleVerifyAndDeliver = async (e) => {
        e.preventDefault();
        if (!selectedOtpOrder || !client) return;
        if (!customerOtpInput || customerOtpInput.trim().length < 4) {
            toast.error('Please enter the 4-digit customer OTP');
            return;
        }
        setVerifyingOtp(true);
        try {
            await client.put(`/delivery/orders/${selectedOtpOrder._id}/status`, { 
                status: 'Delivered', 
                otp: customerOtpInput.trim()
            });
            toast.success('🎉 Customer OTP Verified! Delivery Completed Successfully!');
            setShowOtpModal(false);
            setSelectedOtpOrder(null);
            setCustomerOtpInput('');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid Delivery OTP');
        } finally {
            setVerifyingOtp(false);
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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest animate-pulse">Initializing Portal...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-28 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300 transition-colors">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center sticky top-0 z-20 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/10 transition-transform hover:scale-105">
                        <Truck size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-wide leading-none text-slate-900 dark:text-white">{user?.name}</h1>
                        <div className="flex items-center gap-1 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">Active Agent</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Premium Sliding Toggle Switch */}
                    <button
                        onClick={handleToggleStatus}
                        className={`relative flex items-center w-24 h-9 p-1 rounded-full transition-all duration-300 cursor-pointer border ${
                            profile?.status === 'Online' 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                            : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                    >
                        <div className={`w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-350 ${
                            profile?.status === 'Online' ? 'translate-x-14' : 'translate-x-0'
                        }`}>
                            <Power size={12} className={profile?.status === 'Online' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'} />
                        </div>
                        <span className={`absolute text-[9px] font-black uppercase tracking-wider transition-opacity duration-300 ${
                            profile?.status === 'Online' ? 'left-3 text-white' : 'right-3 text-slate-600 dark:text-slate-400'
                        }`}>
                            {profile?.status}
                        </span>
                    </button>

                    <button 
                        onClick={handleLogout} 
                        className="p-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-red-500/10 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all active:scale-95 cursor-pointer"
                        title="Logout Session"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* TAB CONTAINER */}
            <main className="flex-1 px-6 py-10 w-full max-w-6xl mx-auto space-y-6">

                {/* Shift Attendance Clock In / Clock Out Status Bar */}
                <StaffShiftClockWidget userRole="Delivery Runner Partner" userName={user?.name || "Delivery Agent"} />

                {/* ─── TAB 1: ACTIVE TASKS ────────────────────────────────── */}
                {activeSection === 'tasks' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Main deliveries listing */}
                        <div className="lg:col-span-2 space-y-5">
                            <div className="flex justify-between items-center px-1">
                                <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Assigned Deliveries</h2>
                                <span className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-full text-slate-700 dark:text-slate-400 font-extrabold shadow-sm">{assignedOrders.length} Runs</span>
                            </div>

                            {/* Ready Orders Glowing Notifications */}
                            {assignedOrders.filter(o => o.deliveryStatus === 'Accepted' && (o.status === 'Ready' || o.status === 'Ready for Pickup')).map(order => (
                                <div key={`ready-alert-${order._id}`} className="bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4.5 rounded-3xl flex items-center gap-4.5 animate-pulse shadow-lg shadow-emerald-500/5">
                                    <span className="relative flex h-3.5 w-3.5 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                    </span>
                                    <div className="flex-1 text-xs">
                                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                                            <Award size={10} /> Kitchen Alert
                                        </p>
                                        <p className="text-slate-800 dark:text-slate-200 mt-1 font-bold">Order <span className="text-emerald-600 dark:text-emerald-400">#{order._id.substring(order._id.length - 4).toUpperCase()}</span> is fully prepared! Please proceed to pickup.</p>
                                    </div>
                                </div>
                            ))}

                            {assignedOrders.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-12 rounded-[2.5rem] text-center text-slate-600 dark:text-slate-400 flex flex-col items-center justify-center gap-4 shadow-xl">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-700 shadow-inner">
                                        <ListTodo size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-900 dark:text-white text-sm">All caught up!</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-500 max-w-[220px] mx-auto leading-relaxed">Toggle your status to Online to accept new incoming delivery runs.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {assignedOrders.map(order => (
                                        <div key={order._id} className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/80 shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-emerald-500/30 transition-all duration-300 space-y-6">
                                            {/* Order Meta Header */}
                                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/50 pb-4.5">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Run Reference</p>
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">#{order._id.substring(order._id.length - 4).toUpperCase()}</h3>
                                                    <span className={`inline-flex text-[9px] font-black px-2 py-0.5 rounded-md mt-2 border ${
                                                        order.status === 'Ready' || order.status === 'Ready for Pickup'
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                                    }`}>
                                                        Kitchen: {order.status}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                                                        {order.deliveryStatus}
                                                    </span>
                                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2">₹{order.deliveryCharge}</p>
                                                </div>
                                            </div>

                                            {/* Interactive progress stepper */}
                                            <div className="relative py-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
                                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
                                                <div className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 -translate-y-1/2 z-0 transition-all duration-500"
                                                    style={{
                                                        width: order.deliveryStatus === 'Pending Assignment' ? '0%' :
                                                               order.deliveryStatus === 'Accepted' ? '33%' :
                                                               order.deliveryStatus === 'Picked Up' ? '66%' :
                                                               order.deliveryStatus === 'On the Way' ? '85%' : '100%'
                                                    }}
                                                ></div>
                                                
                                                {[
                                                    { name: 'Assigned', active: true },
                                                    { name: 'Prepared', active: ['Ready', 'Ready for Pickup', 'Out for Delivery'].includes(order.status) },
                                                    { name: 'Picked Up', active: ['Picked Up', 'On the Way', 'Delivered'].includes(order.deliveryStatus) },
                                                    { name: 'Delivered', active: order.deliveryStatus === 'Delivered' }
                                                ].map((step, idx) => (
                                                    <div key={idx} className="flex flex-col items-center gap-1 z-10 bg-white dark:bg-slate-900 px-1.5 rounded">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[8px] font-black ${
                                                            step.active 
                                                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' 
                                                            : 'bg-slate-100 dark:bg-slate-850 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-400'
                                                        }`}>
                                                            {step.active ? '✓' : idx + 1}
                                                        </div>
                                                        <span className={`text-[8px] font-extrabold tracking-wide uppercase ${step.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{step.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Distance & Info */}
                                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350 pt-1 text-left">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">Restaurant Pickup</span>
                                                    <p className="truncate text-slate-900 dark:text-white font-extrabold">Hub Kitchen Counter</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">Customer Destination</span>
                                                    <p className="truncate text-slate-900 dark:text-white font-extrabold">{order.shippingAddress?.address || 'Customer Location'}</p>
                                                </div>
                                            </div>

                                            {/* Quick Actions Grid */}
                                            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                                                <button 
                                                    onClick={() => setShowNavigationModal(true)}
                                                    className="py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                                                >
                                                    <Navigation size={14} className="text-emerald-500 dark:text-emerald-400" /> Map
                                                </button>
                                                <a 
                                                    href="tel:12345678"
                                                    className="py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                                                >
                                                    <Phone size={14} className="text-blue-500 dark:text-blue-400" /> Phone
                                                </a>
                                                <a 
                                                    href="sms:12345678"
                                                    className="py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                                                >
                                                    <MessageSquare size={14} className="text-purple-500 dark:text-purple-400" /> Support
                                                </a>
                                            </div>

                                            {/* Status transit controls */}
                                            <div className="pt-2">
                                                {order.deliveryStatus === 'Pending Assignment' && (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'Accepted')}
                                                            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer active:scale-98"
                                                        >
                                                            Accept Run
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'Rejected')}
                                                            className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-2xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {order.deliveryStatus === 'Accepted' && (
                                                    (order.status === 'Ready' || order.status === 'Ready for Pickup' || order.status === 'Out for Delivery') ? (
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'Picked Up')}
                                                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer active:scale-98"
                                                        >
                                                            Collect Food (Confirm Pickup)
                                                        </button>
                                                    ) : (
                                                        <div className="text-center p-3.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-black text-slate-500 tracking-wide flex items-center justify-center gap-1.5">
                                                            <Clock size={12} className="animate-spin text-slate-500" /> Kitchen is preparing order...
                                                        </div>
                                                    )
                                                )}

                                                {order.deliveryStatus === 'Picked Up' && (
                                                    <button
                                                        onClick={() => handleUpdateOrderStatus(order._id, 'On the Way')}
                                                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-emerald-500/10 cursor-pointer active:scale-98"
                                                    >
                                                        Start Transit (Mark On the Way)
                                                    </button>
                                                )}

                                                {order.deliveryStatus === 'On the Way' && (
                                                    <button
                                                        onClick={() => handleOpenOtpModal(order)}
                                                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-650 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/15 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                                                    >
                                                        <ShieldCheck size={16} /> Complete Delivery (Verify Customer OTP)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar info columns */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Shift Summary Cards */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 text-left">
                                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Shift Summary</h3>
                                <div className="space-y-3.5 pt-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Agent Status</span>
                                        <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                                            profile?.status === 'Online' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                                        }`}>{profile?.status}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Registered Vehicle</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{profile?.vehicleDetails?.type || 'Bike'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Current Wallet Balance</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">₹{earnings?.stats?.walletBalance || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Total Deliveries Completed</span>
                                        <span className="text-slate-900 dark:text-white font-black">{earnings?.stats?.totalDeliveries || 0}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Rider Guidelines Panel */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 text-left">
                                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Rider guidelines</h3>
                                <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside leading-relaxed font-semibold">
                                    <li>Wear your helmet at all times during runs.</li>
                                    <li>Verify package contents & receipt before departure.</li>
                                    <li>Contact customer support directly for address issues.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: WALLET & EARNINGS ────────────────────────────── */}
                {activeSection === 'earnings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Stats & Actions */}
                        <div className="lg:col-span-1 space-y-6">
                            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 text-left">Metrics</h3>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 rounded-[2.2rem] flex items-center gap-3.5 shadow-xl text-left">
                                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">Wallet</span>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{earnings?.stats?.walletBalance || 0}</h3>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 rounded-[2.2rem] flex items-center gap-3.5 shadow-xl text-left">
                                    <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-inner">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider font-sans">Earnings</span>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{earnings?.stats?.totalEarnings || 0}</h3>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsWithdrawOpen(true)}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                                <ArrowUpRight size={16} /> Request Withdrawal
                            </button>
                        </div>

                        {/* Delivery History (2 columns wide) */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Delivery History</h3>
                                <span className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-bold">{earnings?.history?.length || 0} Runs Completed</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                                {earnings?.history?.length === 0 ? (
                                    <div className="col-span-2 py-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-[2rem] text-center text-slate-500 font-bold text-xs">
                                        No completed deliveries yet.
                                    </div>
                                ) : (
                                    earnings?.history?.map(h => (
                                        <div key={h._id} className="p-4.5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                                            <div className="space-y-1 text-left">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">Order #{h._id.substring(h._id.length - 4).toUpperCase()}</p>
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-medium pl-3">{new Date(h.updatedAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{h.deliveryCharge}</span>
                                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Paid</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: PROFILE & SETTINGS ───────────────────────────── */}
                {activeSection === 'profile' && profile && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Profile Info */}
                        <div className="lg:col-span-1 bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xl space-y-6">
                            {/* Profile Header */}
                            <div className="flex flex-col items-center text-center space-y-3.5 pb-6 border-b border-slate-100 dark:border-slate-800/60">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-2xl shadow-xl">
                                    {profile.userId?.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">{profile.userId?.name}</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">Verification Status</p>
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                        Approved Agent
                                    </span>
                                </div>
                            </div>

                            {/* Verification Stats */}
                            <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350 text-left">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center gap-3">
                                    <ShieldCheck className="text-emerald-500 dark:text-emerald-400 shrink-0" size={18} />
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Registered Mobile</span>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">+91 {profile.userId?.phoneNumber || '—'}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center gap-3">
                                    <Truck className="text-emerald-500 dark:text-emerald-400 shrink-0" size={18} />
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Vehicle Details</span>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{profile.vehicleDetails?.type || 'Bike'} · {profile.vehicleDetails?.model || 'Activa CG'}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center gap-3">
                                    <Award className="text-emerald-500 dark:text-emerald-400 shrink-0" size={18} />
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">License Number</span>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">{profile.vehicleDetails?.licenseNumber || 'DL-XXXX'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance analytics & announcements */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 text-left">Performance Overview</h3>
                            
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xl space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-3xl space-y-1">
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Delivery Success Rate</span>
                                        <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">99.2%</h4>
                                        <p className="text-[9px] text-slate-500">Top 5% among branch partners this week</p>
                                    </div>

                                    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-3xl space-y-1">
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Average Ratings</span>
                                        <h4 className="text-2xl font-black text-teal-600 dark:text-teal-400">4.9 ★</h4>
                                        <p className="text-[9px] text-slate-500">Excellent feedback on behavior & timeliness</p>
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-3xl text-left space-y-2">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-350 uppercase tracking-wider">System notifications</h4>
                                    <p className="text-[10px] text-slate-600 dark:text-slate-450 leading-relaxed font-semibold">
                                        🚨 <strong>Rain Surcharge Active:</strong> High precipitation alert in branch limits. Delivery per-KM fees are increased by ₹15 for all runs accepted between 6:00 PM and 10:00 PM today.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Bottom Navigation Tabs */}
            <nav className="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 py-3 px-6 flex justify-around items-center z-20 shadow-lg dark:shadow-[0_-10px_35px_rgba(0,0,0,0.6)]">
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
                            className={`flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                isActive ? 'text-emerald-600 dark:text-emerald-400 scale-105 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon size={18} />
                            <span className="text-[9px] tracking-widest uppercase font-black">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* WITHDRAWAL MODAL */}
            {isWithdrawOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-2xl w-full max-w-sm relative space-y-4">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">Request Payout Withdrawal</h3>
                        <form onSubmit={handleRequestWithdrawal} className="space-y-4 text-left">
                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Withdrawal Amount (₹)</label>
                                <input 
                                    type="number"
                                    required
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount to withdraw"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    max={profile?.walletBalance}
                                />
                                <p className="text-[9px] text-slate-500 mt-1">Available balance: ₹{profile?.walletBalance || 0}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">UPI ID or Bank Details</label>
                                <input 
                                    type="text"
                                    required
                                    value={withdrawDetails}
                                    onChange={(e) => setWithdrawDetails(e.target.value)}
                                    placeholder="e.g. upi@okaxis or Account No..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsWithdrawOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-2xl w-full max-w-sm relative text-center space-y-5">
                        
                        {/* Simulated Route Header */}
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-widest">
                                <Navigation size={14} className={isSimulating ? "animate-bounce text-emerald-500" : "text-slate-400"} />
                                <span className={isSimulating ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                                    {isSimulating ? "GPS Tracking Active" : "GPS Signal Idle"}
                                </span>
                            </div>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest font-mono">
                                {simulatedProgress === 100 ? 'Arrived' : `${simulatedProgress}%`}
                            </span>
                        </div>

                        {/* Coordinates Box */}
                        <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-left">
                            <Navigation size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0 transform rotate-45" />
                            <div className="font-semibold text-xs space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Simulated Geolocation</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black font-mono">
                                    Lat: {simLat.toFixed(6)}° N
                                </p>
                                <p className="text-slate-900 dark:text-slate-100 font-black font-mono">
                                    Lng: {simLng.toFixed(6)}° E
                                </p>
                            </div>
                        </div>

                        {/* Progress Route Map Graphic */}
                        <div className="space-y-3 text-left">
                            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <span>Kitchen Counter</span>
                                <span>Customer Home</span>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                                <div 
                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${simulatedProgress}%` }}
                                />
                            </div>

                            {/* Journey stats */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-center">
                                <div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Remaining</span>
                                    <strong className="text-xs font-black text-slate-900 dark:text-slate-200">{simDistance} km</strong>
                                </div>
                                <div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Est. Time</span>
                                    <strong className="text-xs font-black text-slate-900 dark:text-slate-200">{simEta} Mins</strong>
                                </div>
                                <div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Speed</span>
                                    <strong className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                        {!isSimulating && simulatedProgress === 0 ? '0 km/h' : simulatedProgress === 100 ? '0 km/h' : '32 km/h'}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Leg description */}
                        <div className="text-[10px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl text-slate-700 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-800 min-h-[40px] flex items-center justify-center text-center">
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

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {!isSimulating && simulatedProgress === 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsSimulating(true)}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-650 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                                >
                                    Start Navigation
                                </button>
                            )}

                            {isSimulating && (
                                <div className="py-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse uppercase tracking-widest font-black">
                                    Simulating Rider Transit...
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowNavigationModal(false)}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Close Directions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer OTP Verification Modal */}
            {showOtpModal && selectedOtpOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full shadow-2xl relative space-y-6 text-left">
                        <button
                            onClick={() => setShowOtpModal(false)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner">
                                <KeyRound size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Customer OTP Verification</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-bold">Order #{selectedOtpOrder._id.substring(selectedOtpOrder._id.length - 4).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400" /> Enter 4-Digit Customer OTP
                            </p>
                            <p className="text-[11px] opacity-90">Please ask the customer for the OTP displayed on their order tracking dashboard before handing over the food package.</p>
                        </div>

                        <form onSubmit={handleVerifyAndDeliver} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Customer Delivery OTP Code</label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    placeholder="e.g. 4829"
                                    value={customerOtpInput}
                                    onChange={(e) => setCustomerOtpInput(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                    className="w-full text-center text-3xl font-black tracking-[0.4em] font-mono py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOtpModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={verifyingOtp}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {verifyingOtp ? 'Verifying...' : 'Verify & Deliver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPartnerDashboard;
