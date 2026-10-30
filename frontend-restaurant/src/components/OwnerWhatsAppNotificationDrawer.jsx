import { useState } from 'react';
import { 
    X, MessageSquare, Phone, Bell, Volume2, VolumeX, Send, 
    ExternalLink, Copy, CheckCheck, Sparkles, AlertCircle, ShoppingBag, 
    BarChart3, Boxes, User, RefreshCw, Trash2, Check, ShieldCheck
} from 'lucide-react';
import { useWhatsAppNotifications } from '../context/WhatsAppNotificationContext';
import toast from 'react-hot-toast';

export const OwnerWhatsAppFloatingToast = () => {
    const { activePopup, setActivePopup, setIsDrawerOpen } = useWhatsAppNotifications();

    if (!activePopup) return null;

    const handleOpenInWhatsApp = () => {
        const encoded = encodeURIComponent(activePopup.message);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
        setActivePopup(null);
    };

    const handleViewInDrawer = () => {
        setIsDrawerOpen(true);
        setActivePopup(null);
    };

    return (
        <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="bg-[#0A192F] text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 relative overflow-hidden">
                {/* Emerald accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#25D366] via-emerald-400 to-[#128C7E]" />

                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                            <Phone size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">WhatsApp Alert</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{activePopup.title}</h4>
                        </div>
                    </div>
                    <button
                        onClick={() => setActivePopup(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>

                <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed font-sans bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    {activePopup.message.replace(/[*_#•]/g, ' ')}
                </p>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
                    <button
                        onClick={handleOpenInWhatsApp}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-xs"
                    >
                        <ExternalLink size={12} />
                        <span>Open WhatsApp</span>
                    </button>
                    <button
                        onClick={handleViewInDrawer}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                        View Hub
                    </button>
                </div>
            </div>
        </div>
    );
};

export const OwnerWhatsAppNotificationDrawer = () => {
    const {
        ownerPhone,
        setOwnerPhone,
        isSyncActive,
        setIsSyncActive,
        isSoundEnabled,
        setIsSoundEnabled,
        triggers,
        setTriggers,
        alerts,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        triggerTestNotification,
        dispatchDailyClosingSummary,
        sendDirectMessage,
        markAllRead,
        markAsRead,
        deleteAlert,
        clearAllAlerts
    } = useWhatsAppNotifications();

    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'chat' | 'settings'
    const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'order' | 'closing' | 'inventory'

    // Direct chat form state
    const [chatPhone, setChatPhone] = useState('');
    const [chatMessage, setChatMessage] = useState('');

    // Phone editing in settings
    const [tempPhone, setTempPhone] = useState(ownerPhone);

    if (!isDrawerOpen) return null;

    const CHAT_TEMPLATES = [
        {
            label: 'Table is Ready 🍽️',
            text: 'Dear Guest, your dining table at Downtown Gourmet Bistro is ready! Please proceed to the host desk. We look forward to hosting you!'
        },
        {
            label: 'Order Dispatched 🛵',
            text: 'Your fresh order is prepared and on its way with our delivery rider! ETA: ~15 minutes. Track live status here: https://foodnest.app/track'
        },
        {
            label: 'Delay Apology + 20% Voucher 🎁',
            text: 'We sincerely apologize for the slight delay during peak dinner rush! Please enjoy a complimentary chef dessert today + 20% off with code: SORRY20 on your next visit.'
        },
        {
            label: 'Digital Bill Receipt 🧾',
            text: 'Thank you for dining with us! Here is your digital tax invoice receipt: https://foodnest.app/invoice/INV-2026-8492. Have a wonderful evening!'
        },
        {
            label: 'Chef Stock Reorder 📦',
            text: 'ATTN Store Inventory / Supplier: Kitchen requires urgent restocking of Fresh Mozzarella Cheese (15 Kg) by 09:30 AM tomorrow. PO #PO-941.'
        }
    ];

    const handleApplyTemplate = (tmpl) => {
        setChatMessage(tmpl.text);
    };

    const handleSendDirectChat = (e) => {
        e.preventDefault();
        if (!chatPhone.trim()) {
            toast.error('Please enter recipient phone number');
            return;
        }
        if (!chatMessage.trim()) {
            toast.error('Please type a message');
            return;
        }
        sendDirectMessage({ phone: chatPhone, message: chatMessage });
        setChatMessage('');
    };

    const handleSavePhone = (e) => {
        e.preventDefault();
        if (!tempPhone.trim() || tempPhone.length < 8) {
            toast.error('Please enter a valid phone number with country code');
            return;
        }
        setOwnerPhone(tempPhone.trim());
        toast.success(`Owner WhatsApp phone updated to ${tempPhone.trim()}`);
    };

    const handleCopyAlert = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            toast.success('WhatsApp alert text copied!');
        }
    };

    const handleOpenInWhatsApp = (msg) => {
        const encoded = encodeURIComponent(msg);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    };

    const filteredAlerts = alerts.filter(a => {
        if (feedFilter === 'all') return true;
        return a.type === feedFilter;
    });

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
                
                {/* Header */}
                <div className="bg-[#075E54] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg font-black shrink-0">
                            <Phone size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-base leading-tight">WhatsApp Alerts & Chat</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                    isSyncActive ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-200'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isSyncActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                                    {isSyncActive ? 'Live Sync' : 'Muted'}
                                </span>
                            </div>
                            <p className="text-[11px] text-emerald-100 font-mono mt-0.5">
                                Connected to: <span className="font-bold underline">{ownerPhone}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                            title={isSoundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
                            className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800/40 transition-colors cursor-pointer"
                        >
                            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-emerald-300/60" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800/40 transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Sub-header Navigation Tabs */}
                <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 shrink-0 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'feed'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <Bell size={14} className={activeTab === 'feed' ? 'text-emerald-600' : ''} />
                        <span>Live Alerts Feed</span>
                        {unreadCount > 0 && (
                            <span className="bg-[#25D366] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'chat'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <MessageSquare size={14} className={activeTab === 'chat' ? 'text-emerald-600' : ''} />
                        <span>Direct Chat</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'settings'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <ShieldCheck size={14} className={activeTab === 'settings' ? 'text-emerald-600' : ''} />
                        <span>Triggers & Phone</span>
                    </button>
                </div>

                {/* Main Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

                    {/* TAB 1: LIVE ALERTS FEED */}
                    {activeTab === 'feed' && (
                        <div className="space-y-4">
                            {/* Action Bar */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1 text-[11px]">
                                    <button
                                        onClick={() => setFeedFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                                            feedFilter === 'all'
                                                ? 'bg-[#075E54] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        All ({alerts.length})
                                    </button>
                                    <button
                                        onClick={() => setFeedFilter('order')}
                                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                                            feedFilter === 'order'
                                                ? 'bg-[#075E54] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        Orders
                                    </button>
                                    <button
                                        onClick={() => setFeedFilter('closing')}
                                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                                            feedFilter === 'closing'
                                                ? 'bg-[#075E54] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        P&L Reports
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={triggerTestNotification}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                                    >
                                        <Bell size={11} />
                                        <span>Test Ping</span>
                                    </button>
                                    <button
                                        onClick={() => dispatchDailyClosingSummary()}
                                        className="px-2.5 py-1 rounded-lg bg-[#0A192F] hover:bg-slate-900 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs"
                                    >
                                        <BarChart3 size={11} />
                                        <span>Send P&L</span>
                                    </button>
                                </div>
                            </div>

                            {/* Feed Items */}
                            {filteredAlerts.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                                    <MessageSquare size={32} className="mx-auto opacity-40 text-emerald-600" />
                                    <p className="text-sm font-semibold">No alerts found in this filter</p>
                                    <p className="text-xs">Click 'Test Ping' to dispatch a simulated live order notification.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredAlerts.map(alert => (
                                        <div
                                            key={alert.id}
                                            onClick={() => markAsRead(alert.id)}
                                            className={`p-3.5 rounded-2xl border transition-all ${
                                                alert.read
                                                    ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                                                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 shadow-xs ring-1 ring-emerald-500/20'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                                        alert.type === 'order' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700' :
                                                        alert.type === 'closing' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' :
                                                        alert.type === 'inventory' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700' :
                                                        'bg-purple-100 dark:bg-purple-900/40 text-purple-700'
                                                    }`}>
                                                        {alert.type === 'order' && <ShoppingBag size={14} />}
                                                        {alert.type === 'closing' && <BarChart3 size={14} />}
                                                        {alert.type === 'inventory' && <Boxes size={14} />}
                                                        {alert.type === 'customer' && <User size={14} />}
                                                    </span>
                                                    <div>
                                                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{alert.title}</h4>
                                                        <span className="text-[10px] text-slate-400 font-medium">{alert.time}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                                        <CheckCheck size={13} />
                                                        <span>Sent</span>
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteAlert(alert.id); }}
                                                        className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                                                        title="Delete alert"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* WhatsApp Message Preview Bubble */}
                                            <div className="mt-2.5 bg-[#EFEAE2] dark:bg-slate-900/90 rounded-xl p-3 border border-[#E0D7C6] dark:border-slate-700 font-sans text-xs text-slate-800 dark:text-slate-200 space-y-1">
                                                <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed select-all">
                                                    {alert.message}
                                                </pre>
                                            </div>

                                            {/* Card Action Buttons */}
                                            <div className="mt-2.5 flex items-center justify-end gap-1.5 pt-1">
                                                <button
                                                    onClick={() => handleCopyAlert(alert.message)}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                                >
                                                    <Copy size={11} />
                                                    <span>Copy</span>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenInWhatsApp(alert.message)}
                                                    className="px-3 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-[10px] flex items-center gap-1 transition-transform active:scale-95 shadow-2xs cursor-pointer"
                                                >
                                                    <ExternalLink size={11} />
                                                    <span>Open WhatsApp</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {alerts.length > 0 && (
                                <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                                    <button
                                        onClick={markAllRead}
                                        className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"
                                    >
                                        ✓ Mark all as read
                                    </button>
                                    <button
                                        onClick={clearAllAlerts}
                                        className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                    >
                                        Clear Feed
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: DIRECT CHAT & BROADCAST */}
                    {activeTab === 'chat' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs">
                                <span className="font-black text-emerald-900 dark:text-emerald-300 block">Instant WhatsApp Dispatch</span>
                                <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                                    Directly ping diners, floor managers, or delivery riders on WhatsApp with verified restaurant message templates.
                                </span>
                            </div>

                            <form onSubmit={handleSendDirectChat} className="space-y-3.5">
                                <div>
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                                        Recipient Phone Number:
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. +91 98110 54321"
                                        value={chatPhone}
                                        onChange={(e) => setChatPhone(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                                            Quick Restaurant Templates:
                                        </label>
                                        <span className="text-[10px] text-slate-400">Tap to load</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CHAT_TEMPLATES.map((tmpl, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleApplyTemplate(tmpl)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                                            >
                                                {tmpl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                                        Message Body:
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="Type your WhatsApp message or select a template above..."
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
                                >
                                    <Send size={15} />
                                    <span>Launch WhatsApp Web Chat</span>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: TRIGGERS & OWNER PHONE SETTINGS */}
                    {activeTab === 'settings' && (
                        <div className="space-y-5">
                            {/* Phone configuration */}
                            <form onSubmit={handleSavePhone} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                                        Restaurant Owner Registered WhatsApp
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        All live order pings, KDS delays, and closing P&L summaries will be dispatched to this mobile number.
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        value={tempPhone}
                                        onChange={(e) => setTempPhone(e.target.value)}
                                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-xl bg-[#075E54] hover:bg-emerald-800 text-white font-black text-xs shadow-xs cursor-pointer transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>

                            {/* Trigger Toggles */}
                            <div className="space-y-3">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                                    Automated Notification Triggers
                                </span>

                                <div className="space-y-2.5">
                                    <label className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                🛎️ Live Order Instant Ping
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                Receive instant alert whenever an online, QR dine-in or takeaway bill is created.
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={triggers.newOrder}
                                            onChange={(e) => setTriggers({ ...triggers, newOrder: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                                        />
                                    </label>

                                    <label className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                ⏳ Kitchen Delay Warning (KDS &gt; 20 Mins)
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                Alert owner when table prep times exceed 20 mins to prevent customer churn.
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={triggers.kotDelay}
                                            onChange={(e) => setTriggers({ ...triggers, kotDelay: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                                        />
                                    </label>

                                    <label className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                📦 Low Stock Buffer Alert
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                Automatic warning when pantry ingredients drop below minimum threshold.
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={triggers.lowStock}
                                            onChange={(e) => setTriggers({ ...triggers, lowStock: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                                        />
                                    </label>

                                    <label className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                📊 Nightly Executive P&L Closing Summary
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                Auto-dispatch complete sales, GST audit and cash drawer numbers at 11:45 PM.
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={triggers.dailyClosing}
                                            onChange={(e) => setTriggers({ ...triggers, dailyClosing: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                                        />
                                    </label>

                                    <label className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                                                👑 VIP Guest Arrival Alert
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                Ping floor staff and owner when high-spending loyalty members enter.
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={triggers.vipArrival}
                                            onChange={(e) => setTriggers({ ...triggers, vipArrival: e.target.checked })}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Master sync switch */}
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 block">
                                        Master WhatsApp Sync
                                    </span>
                                    <span className="text-[11px] text-emerald-800 dark:text-emerald-400">
                                        Toggle all automated bot alerts across the restaurant.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSyncActive(!isSyncActive);
                                        toast.success(isSyncActive ? 'WhatsApp bot alerts paused' : 'WhatsApp bot alerts active!');
                                    }}
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                                        isSyncActive ? 'bg-[#25D366] text-white shadow-xs' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {isSyncActive ? 'Active' : 'Disabled'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-5 shrink-0">
                    <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        FoodNest Cloud WhatsApp Gateway v3.4
                    </span>
                    <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};
