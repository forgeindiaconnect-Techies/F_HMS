import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    Receipt, Clock, CheckCircle2, Flame, Printer, Search, RefreshCw, 
    Filter, AlertCircle, ChefHat, Sparkles, Utensils, Coffee, Pizza, 
    IceCream, Salad, CheckSquare, Square, ChevronRight, User, AlertTriangle, MonitorDot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import KOTPrintModal from '../../components/KOTPrintModal';

const STATION_OPTIONS = [
    { id: 'All', label: 'All Stations', icon: ChefHat },
    { id: 'Main Kitchen', label: 'Main Kitchen', icon: Utensils },
    { id: 'Beverages', label: 'Beverages & Bar', icon: Coffee },
    { id: 'Desserts', label: 'Desserts & Bakery', icon: IceCream },
    { id: 'Pizza / Oven', label: 'Pizza & Oven', icon: Pizza },
    { id: 'Cold / Salad', label: 'Cold Bar & Salads', icon: Salad }
];

const STATUS_OPTIONS = [
    { id: 'Active', label: 'Active Queue' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Preparing', label: 'Cooking' },
    { id: 'Ready', label: 'Ready' },
    { id: 'Served', label: 'Served' },
    { id: 'All', label: 'All Tickets' }
];

const ChefKOTManagement = () => {
    const { api, user, restaurant } = useAuth();
    const [kots, setKots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalToday: 0,
        pendingCount: 0,
        preparingCount: 0,
        readyCount: 0,
        avgPrepMinutes: 12
    });

    const [selectedStation, setSelectedStation] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('Active');
    const [searchQuery, setSearchQuery] = useState('');

    // Item checklist state: kotId-itemIdx -> boolean
    const [checkedItems, setCheckedItems] = useState({});

    // Thermal Print Modal State
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedKotForPrint, setSelectedKotForPrint] = useState(null);

    // Live clock
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Play kitchen bell audio
    const playKitchenBell = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        } catch (e) {}
    };

    const fetchKOTData = async () => {
        try {
            const params = {};
            if (selectedStatus !== 'All') params.status = selectedStatus;
            if (selectedStation !== 'All') params.station = selectedStation;

            const [kotRes, summaryRes] = await Promise.all([
                api.get('/kot', { params }),
                api.get('/kot/summary').catch(() => ({ data: {} }))
            ]);

            setKots(kotRes.data || []);
            if (summaryRes.data) {
                setSummary(prev => ({ ...prev, ...summaryRes.data }));
            }
        } catch (error) {
            console.error('Failed to fetch KOT data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKOTData();
        const pollInterval = setInterval(fetchKOTData, 5000);
        return () => clearInterval(pollInterval);
    }, [selectedStation, selectedStatus]);

    // WebSocket real-time listener for incoming KOTs
    useEffect(() => {
        let ws;
        const connectWS = () => {
            try {
                let baseURL = getApiUrl();
                let wsURL = baseURL.replace(/^http/, 'ws').replace(/\/api$/, '');
                ws = new WebSocket(wsURL);

                ws.onopen = () => {
                    const rawRestId = user?.restaurantId;
                    const cleanRestId = (rawRestId && typeof rawRestId === 'object') ? (rawRestId._id || rawRestId.id) : rawRestId;
                    ws.send(JSON.stringify({
                        type: 'register',
                        restaurantId: cleanRestId || null,
                        role: 'chef'
                    }));
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (['new_kot', 'kot_status_updated', 'new_order', 'order_updated'].includes(msg.type)) {
                            fetchKOTData();

                            if (msg.type === 'new_kot') {
                                playKitchenBell();
                                const kotNum = msg.data?.kotNumber || 'New KOT';
                                const tableInfo = msg.data?.tableNumber ? `Table ${msg.data.tableNumber}` : 'Counter';
                                toast.success(`🔔 ${kotNum} Received for ${tableInfo}!`, {
                                    duration: 6000,
                                    position: 'top-right'
                                });
                            }
                        }
                    } catch (e) {}
                };

                ws.onclose = () => {
                    setTimeout(connectWS, 5000);
                };
            } catch (wsErr) {
                console.error('WebSocket connection error in ChefKOTManagement', wsErr);
            }
        };

        connectWS();
        return () => {
            if (ws) ws.close();
        };
    }, [user]);

    // Status transition handler with invalid status guard
    const handleUpdateStatus = async (kotId, newStatus) => {
        try {
            await api.put(`/kot/${kotId}/status`, { status: newStatus });
            toast.success(`KOT marked as ${newStatus}`);
            if (newStatus === 'Ready') {
                playKitchenBell();
            }
            fetchKOTData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update KOT status';
            toast.error(msg);
        }
    };

    const handleOpenPrint = (kot) => {
        setSelectedKotForPrint(kot);
        setPrintModalOpen(true);
    };

    const toggleItemCheck = (kotId, idx) => {
        const key = `${kotId}-${idx}`;
        setCheckedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Calculate time elapsed
    const getElapsedMinutes = (dateStr) => {
        if (!dateStr) return 0;
        const diffMs = currentTime - new Date(dateStr);
        return Math.max(0, Math.floor(diffMs / (60 * 1000)));
    };

    // Filter tickets by search query
    const filteredKots = kots.filter(kot => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (kot.kotNumber && kot.kotNumber.toLowerCase().includes(q)) ||
            (kot.orderNumber && kot.orderNumber.toLowerCase().includes(q)) ||
            (kot.tableNumber && String(kot.tableNumber).toLowerCase().includes(q)) ||
            (kot.customerName && kot.customerName.toLowerCase().includes(q)) ||
            (kot.items && kot.items.some(i => i.name.toLowerCase().includes(q)))
        );
    });

    if (restaurant?.restaurantConfig?.orderKitchen?.kotEnabled === false) {
        return (
            <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Kitchen Order Ticket (KOT) System Disabled</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    The KOT ticket generation system is currently disabled in your Restaurant Settings. Orders are handled directly or via the digital Kitchen Display System.
                </p>
                {restaurant?.restaurantConfig?.orderKitchen?.kdsEnabled !== false && (
                    <Link to="/chef" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer">
                        <MonitorDot size={16} /> Open Digital KDS Screen
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto p-4 sm:p-6 space-y-6 min-h-screen">
            
            {/* -------------------------------------------------- */}
            {/* TOP BAR / STATS OVERVIEW */}
            {/* -------------------------------------------------- */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Kitchen Order Tickets (KOT)
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Real-time station ticket routing, line cooking progression, and 80mm thermal printing
                            </p>
                        </div>
                    </div>
                </div>

                {/* Live Stats Pills */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block tracking-wider">Cooking</span>
                        <span className="text-xl font-black text-amber-900 dark:text-amber-200">{summary.preparingCount}</span>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">Ready Plated</span>
                        <span className="text-xl font-black text-emerald-900 dark:text-emerald-200">{summary.readyCount}</span>
                    </div>
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block tracking-wider">Total Today</span>
                        <span className="text-xl font-black text-blue-900 dark:text-blue-200">{summary.totalToday}</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg Prep</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{summary.avgPrepMinutes}m</span>
                        </div>
                    </div>
                    <button
                        onClick={fetchKOTData}
                        className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Refresh Tickets"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* STATION ROUTING TABS */}
            {/* -------------------------------------------------- */}
            <div className="flex flex-wrap gap-2 pt-1">
                {STATION_OPTIONS.map(station => {
                    const Icon = station.icon;
                    const isSelected = selectedStation === station.id;
                    return (
                        <button
                            key={station.id}
                            onClick={() => setSelectedStation(station.id)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
                                isSelected
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Icon size={15} />
                            <span>{station.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* -------------------------------------------------- */}
            {/* SEARCH & STATUS FILTER BAR */}
            {/* -------------------------------------------------- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setSelectedStatus(opt.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                selectedStatus === opt.id
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Table, KOT #, or Item..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* TICKETS GRID */}
            {/* -------------------------------------------------- */}
            {filteredKots.length === 0 ? (
                <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">All KOTs Plated & Cleared!</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        There are currently no active tickets waiting in {selectedStation === 'All' ? 'any station' : selectedStation}. New tickets will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredKots.map(kot => {
                        const elapsedMins = getElapsedMinutes(kot.createdAt);
                        const isOverdue = elapsedMins >= 18;
                        const isWarning = elapsedMins >= 10 && !isOverdue;

                        const tableText = kot.tableNumber && kot.tableNumber !== 'Any' && kot.tableNumber !== 'Takeout'
                            ? (kot.tableNumber.startsWith('Table') ? kot.tableNumber : `Table ${kot.tableNumber}`)
                            : (kot.orderType === 'Delivery' ? 'Delivery' : 'Counter Pickup');

                        const isReady = kot.status === 'Ready';
                        const isCooking = kot.status === 'Preparing';
                        const isPending = kot.status === 'Pending';
                        const isServed = kot.status === 'Served';

                        return (
                            <div
                                key={kot._id}
                                className={`bg-white dark:bg-slate-900 rounded-3xl border-2 shadow-sm flex flex-col justify-between transition-all duration-200 ${
                                    isOverdue ? 'border-rose-500 shadow-rose-500/10' :
                                    isReady ? 'border-emerald-500 shadow-emerald-500/10' :
                                    isCooking ? 'border-amber-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <div>
                                    {/* Ticket Top Header */}
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 rounded-t-3xl flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black font-mono text-base text-slate-900 dark:text-white">
                                                    {kot.kotNumber}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {kot.orderNumber}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                    {tableText}
                                                </span>
                                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {kot.kitchenStation}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Timer Stopwatch Badge */}
                                        <div className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-black flex items-center gap-1 border shrink-0 ${
                                            isOverdue ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
                                            isWarning ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                        }`}>
                                            <Clock size={12} />
                                            <span>{elapsedMins}m</span>
                                        </div>
                                    </div>

                                    {/* Add-on Banner */}
                                    {kot.isAddon && (
                                        <div className="bg-amber-500 text-black text-[10px] font-black px-4 py-1 flex items-center justify-between tracking-wider uppercase">
                                            <span>⚡ RUNNING / ADD-ON ORDER</span>
                                            <span>CHECK TICKET</span>
                                        </div>
                                    )}

                                    {/* Guest & Server info */}
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center text-[11px] text-slate-500">
                                        <span className="truncate">👤 {kot.customerName || 'Walk-in Guest'}</span>
                                        <span className="text-slate-400">Wait: {kot.serverName || 'Staff'}</span>
                                    </div>

                                    {/* Ticket Items Checklist */}
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pb-1">
                                            <span>Items to Prepare ({kot.items?.length || 0})</span>
                                            <span>Status</span>
                                        </div>

                                        <div className="space-y-1.5">
                                            {kot.items?.map((item, idx) => {
                                                const checkKey = `${kot._id}-${idx}`;
                                                const isChecked = checkedItems[checkKey];
                                                return (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => toggleItemCheck(kot._id, idx)}
                                                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                                                            isChecked
                                                                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 line-through opacity-60 text-slate-400'
                                                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400'
                                                        }`}
                                                    >
                                                        <div className="mt-0.5 text-amber-600 shrink-0">
                                                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-extrabold text-xs">
                                                                    {item.qty}x {item.name}
                                                                </span>
                                                            </div>
                                                            {item.notes && (
                                                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium italic mt-0.5">
                                                                    * {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Cooking Notes Box */}
                                        {kot.notes && (
                                            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2.5 rounded-xl border border-yellow-200 dark:border-yellow-800/50 mt-2">
                                                <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block">
                                                    Special Instructions:
                                                </span>
                                                <p className="text-xs font-semibold text-amber-950 dark:text-amber-200 mt-0.5 whitespace-pre-wrap">
                                                    {kot.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Card Actions Footer */}
                                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 rounded-b-3xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        {isPending && (
                                            <button
                                                onClick={() => handleUpdateStatus(kot._id, 'Preparing')}
                                                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                            >
                                                <Flame size={14} /> Start Cooking
                                            </button>
                                        )}
                                        {isCooking && (
                                            <button
                                                onClick={() => handleUpdateStatus(kot._id, 'Ready')}
                                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                            >
                                                <Sparkles size={14} /> Mark KOT Ready
                                            </button>
                                        )}
                                        {isReady && (
                                            <button
                                                onClick={() => handleUpdateStatus(kot._id, 'Served')}
                                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                            >
                                                <CheckCircle2 size={14} /> Mark Plated & Served
                                            </button>
                                        )}
                                        {isServed && (
                                            <div className="flex-1 py-1.5 text-center text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                Served & Done
                                            </div>
                                        )}

                                        {/* Print KOT Button */}
                                        <button
                                            onClick={() => handleOpenPrint(kot)}
                                            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                            title="Print 80mm Thermal KOT"
                                        >
                                            <Printer size={14} />
                                            <span className="hidden sm:inline">Print</span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {/* 80mm Thermal Print Modal */}
            <KOTPrintModal
                isOpen={printModalOpen}
                onClose={() => setPrintModalOpen(false)}
                kot={selectedKotForPrint}
                onPrinted={fetchKOTData}
            />

        </div>
    );
};

export default ChefKOTManagement;
