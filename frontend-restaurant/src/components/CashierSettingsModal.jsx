import { useState } from 'react';
import { 
    X, Settings, Printer, Volume2, VolumeX, Store, 
    Moon, Sun, Shield, Sliders, Check, Utensils, 
    Receipt, Sparkles, RefreshCw, Smartphone, Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeSettingCard } from './ThemeToggle';
import { 
    generateThermalReceiptHtml, generateThermalKOTHtml, 
    printReceiptViaWindow, printKOTViaWindow 
} from '../utils/receiptGenerator';

const CashierSettingsModal = ({
    isOpen,
    onClose,
    isPageMode = false,
    paperWidth = '80mm',
    onPaperWidthChange,
    autoPrintBillEnabled = true,
    toggleAutoPrintBill,
    autoPrintKOTEnabled = true,
    toggleAutoPrintKOT,
    soundEnabled = true,
    setSoundEnabled,
    readySoundEnabled = true,
    setReadySoundEnabled,
    restaurant
}) => {
    const [activeTab, setActiveTab] = useState('printer');

    if (!isOpen && !isPageMode) return null;

    const handleSelectPaperWidth = (width) => {
        if (onPaperWidthChange) {
            onPaperWidthChange(width);
        } else {
            localStorage.setItem('resto_cashier_paper_width', width);
        }
        toast.success(`Thermal paper width set to ${width}`, { id: 'cashier-setting-paper-width' });
    };

    const handleToggleSound = (enabled) => {
        if (setSoundEnabled) setSoundEnabled(enabled);
        localStorage.setItem('resto_cashier_sound', String(enabled));
        toast.success(enabled ? 'New order audio chime enabled' : 'New order audio chime muted', { id: 'cashier-setting-sound' });
    };

    const handleToggleReadySound = (enabled) => {
        if (setReadySoundEnabled) setReadySoundEnabled(enabled);
        localStorage.setItem('resto_cashier_ready_sound', String(enabled));
        toast.success(enabled ? 'Kitchen ready chime enabled' : 'Kitchen ready chime muted', { id: 'cashier-setting-ready-sound' });
    };

    // Play test audio chime
    const handleTestChime = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
            toast.success('Audio chime preview played successfully!', { id: 'cashier-setting-test-chime' });
        } catch (e) {
            toast.error('Unable to play audio preview in browser', { id: 'cashier-setting-test-chime' });
        }
    };

    // Test print sample bill
    const handleTestBillPrint = () => {
        const sampleOrder = {
            _id: 'TEST' + Math.floor(1000 + Math.random() * 9000),
            invoiceNumber: 'INV-TEST-001',
            kotNumbers: ['KOT-TEST'],
            createdAt: new Date(),
            orderType: 'Dine In',
            tableNumber: '05',
            customerName: 'Sample Guest',
            customerPhone: '9876543210',
            orderItems: [
                { name: 'Paneer Butter Masala', qty: 2, price: 240, lineTotal: 480 },
                { name: 'Butter Naan', qty: 4, price: 45, lineTotal: 180 },
                { name: 'Fresh Lime Soda', qty: 2, price: 70, lineTotal: 140 }
            ],
            taxPrice: 40,
            discountAmount: 0,
            deliveryCharge: 0,
            totalPrice: 840,
            isPaid: true,
            paymentMethod: 'Cash'
        };
        const html = generateThermalReceiptHtml(sampleOrder, restaurant, { paperWidth });
        printReceiptViaWindow(html);
        toast.success(`Printing test cashier bill (${paperWidth})...`, { id: 'cashier-test-bill-print' });
    };

    // Test print sample kitchen KOT
    const handleTestKOTPrint = () => {
        const sampleKOT = {
            _id: 'KOT' + Math.floor(1000 + Math.random() * 9000),
            kotNumber: 'KOT-TEST-01',
            createdAt: new Date(),
            orderType: 'Dine In',
            tableNumber: '05',
            kitchenStation: 'Main Kitchen',
            source: 'Cashier POS Test',
            notes: 'Less spicy, extra butter',
            items: [
                { name: 'Paneer Butter Masala', qty: 2, notes: 'Less spicy' },
                { name: 'Butter Naan', qty: 4 },
                { name: 'Fresh Lime Soda', qty: 2, notes: 'Sweet & salt' }
            ]
        };
        const html = generateThermalKOTHtml(sampleKOT, restaurant, { paperWidth });
        printKOTViaWindow(html);
        toast.success(`Printing test kitchen KOT (${paperWidth})...`, { id: 'cashier-test-kot-print' });
    };

    const isKotOnly = restaurant?.kitchenMode === 'KOT_ONLY' || 
                      restaurant?.restaurantConfig?.orderKitchen?.kitchenMode === 'KOT_ONLY' ||
                      restaurant?.restaurantConfig?.orderKitchen?.kdsEnabled === false;

    const content = (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col ${
            isPageMode ? 'w-full shadow-sm' : 'w-full max-w-4xl max-h-[88vh] shadow-2xl overflow-hidden'
        }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white px-5 sm:px-8 py-5 flex items-center justify-between border-b border-purple-800/40 shrink-0 rounded-t-2xl sm:rounded-t-3xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                        <Settings size={22} className="animate-spin-slow" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">Cashier POS Settings</h2>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-500/40 px-2.5 py-0.5 rounded-full">Terminal #1</span>
                        </div>
                        <p className="text-xs text-purple-200/80 font-medium mt-0.5">Configure receipt printing, kitchen routing, sound alerts & POS mode</p>
                    </div>
                </div>
                {!isPageMode && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 active:scale-95"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/60 px-5 sm:px-8 pt-3.5 gap-2 overflow-x-auto shrink-0 custom-scrollbar">
                {[
                    { id: 'printer', label: 'Thermal Printers', icon: Printer },
                    { id: 'audio', label: 'Sound Alerts', icon: Volume2 },
                    { id: 'kitchen', label: 'Kitchen & Routing', icon: Utensils },
                    { id: 'theme', label: 'Appearance', icon: Sun },
                    { id: 'station', label: 'Terminal Info', icon: Store }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                                isActive
                                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400 shadow-xs'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <Icon size={14} className={isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Modal Body Content */}
            <div className={`${isPageMode ? 'p-5 sm:p-7 md:p-8 space-y-6' : 'flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar'}`}>
                {/* Tab 1: Thermal Printers */}
                {activeTab === 'printer' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Paper Width Selection */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Printer size={16} className="text-purple-600 dark:text-purple-400" />
                                        Thermal Paper Roll Size
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Select the paper width loaded in your physical POS counter printer</p>
                                </div>
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                    Current: {paperWidth}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* 80mm Card */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectPaperWidth('80mm')}
                                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left cursor-pointer ${
                                        paperWidth === '80mm'
                                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${paperWidth === '80mm' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                        <Laptop size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-gray-900 dark:text-white">80mm Standard POS</p>
                                            {paperWidth === '80mm' && <Check size={14} className="text-purple-600 dark:text-purple-400 font-bold" />}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">3 1/8" standard counter thermal printer (Epson, Star, Citizen, TVS)</p>
                                    </div>
                                </button>

                                {/* 58mm Card */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectPaperWidth('58mm')}
                                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all text-left cursor-pointer ${
                                        paperWidth === '58mm'
                                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${paperWidth === '58mm' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                        <Smartphone size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-gray-900 dark:text-white">58mm Compact Mobile</p>
                                            {paperWidth === '58mm' && <Check size={14} className="text-purple-600 dark:text-purple-400 font-bold" />}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">2 1/4" mini Bluetooth or handheld POS (Sunmi, Pax, NGX)</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Automatic Printing Toggles */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 px-1">
                                Automatic Queue Triggers
                            </h3>

                            {/* Customer Bill Auto-Print */}
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Receipt size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white">Auto-Print Cashier Bill</p>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400">Trigger silent thermal bill receipt printing when customer order arrives</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleAutoPrintBill}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                        autoPrintBillEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        autoPrintBillEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Kitchen KOT Auto-Print */}
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Utensils size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white">Auto-Print Kitchen KOT Slips</p>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400">Print kitchen order ticket automatically for food prep staff on new order</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleAutoPrintKOT}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                        autoPrintKOTEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        autoPrintKOTEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        {/* Test Printing Action Buttons */}
                        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-purple-400" />
                                        Printer Hardware Diagnostics
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Generate a sample test slip to verify margin, alignment and cutter</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleTestBillPrint}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-xs active:scale-95"
                                >
                                    <Receipt size={14} className="text-emerald-400" />
                                    <span>Print Sample Cashier Bill</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTestKOTPrint}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-xs active:scale-95"
                                >
                                    <Utensils size={14} className="text-amber-400" />
                                    <span>Print Sample Kitchen KOT</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Audio Alerts */}
                {activeTab === 'audio' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Volume2 size={16} className="text-purple-600 dark:text-purple-400" />
                                Sound & Chime Notification Preferences
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Control audible notifications played through terminal speakers</p>
                        </div>

                        {/* Incoming Order Sound */}
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Volume2 size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white">New Order Chime</p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Play pleasant melodic bell chime when a new order appears in billing queue</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggleSound(!soundEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                    soundEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>

                        {/* Ready for Pickup Sound */}
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Volume2 size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white">Kitchen Ready Audio Alert</p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Play alert chime when kitchen finishes order preparation for pickup</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggleReadySound(!readySoundEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                    readySoundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    readySoundEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>

                        {/* Test Audio Button */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-purple-950 dark:text-purple-200">Test Terminal Speaker</p>
                                <p className="text-[11px] text-purple-800/70 dark:text-purple-300/70">Verify that the browser volume is unmuted and audible</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleTestChime}
                                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                                <Volume2 size={14} />
                                <span>Play Chime</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab 3: Kitchen & Routing */}
                {activeTab === 'kitchen' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Kitchen Operating Workflow</span>
                                <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                    isKotOnly 
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}>
                                    {isKotOnly ? 'KOT_ONLY (Paper Ticket)' : 'KDS (Digital Display)'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                {isKotOnly ? (
                                    <>
                                        This restaurant is operating in <strong>KOT_ONLY</strong> mode. Physical Kitchen Order Tickets (KOT) are automatically printed for kitchen staff. Waiters and floor managers track preparation progress directly without needing digital kitchen touchscreens.
                                    </>
                                ) : (
                                    <>
                                        This restaurant is operating in <strong>KDS (Kitchen Display System)</strong> mode. Orders stream dynamically to kitchen chef screens, while KOTs can still be printed on-demand.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-black text-gray-900 dark:text-white">Self-Pickup & Counter Tokens</p>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                                    Direct website takeaway orders appear in the Self-Pickup tab with auto-generated numeric tokens.
                                </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-black text-gray-900 dark:text-white">Dual Cashier + Kitchen Print</p>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                                    Incoming web and dine-in orders automatically sequence Kitchen KOT followed by Cashier Bill without print dialog collision.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 4: Appearance */}
                {activeTab === 'theme' && (
                    <div className="animate-in fade-in duration-200">
                        <ThemeSettingCard />
                    </div>
                )}

                {/* Tab 5: Terminal Info */}
                {activeTab === 'station' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Store size={16} className="text-purple-600 dark:text-purple-400" />
                                Branch & Terminal Registry
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1">
                                    <span className="text-gray-400 dark:text-slate-500 font-bold">Restaurant Name</span>
                                    <p className="font-black text-gray-900 dark:text-white">{restaurant?.name || 'FoodNest Dining'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-400 dark:text-slate-500 font-bold">POS Terminal</span>
                                    <p className="font-black text-gray-900 dark:text-white">Front Billing Counter #1</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-400 dark:text-slate-500 font-bold">Contact Phone</span>
                                    <p className="font-bold text-gray-800 dark:text-slate-200">{restaurant?.phone || restaurant?.contactPhone || 'Not specified'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-400 dark:text-slate-500 font-bold">GSTIN / Tax ID</span>
                                    <p className="font-mono font-bold text-gray-800 dark:text-slate-200">{restaurant?.gstin || restaurant?.gstNumber || 'Unregistered / Exempt'}</p>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <span className="text-gray-400 dark:text-slate-500 font-bold">Address</span>
                                    <p className="font-medium text-gray-800 dark:text-slate-200">{restaurant?.address || 'Main Branch Highway, Downtown'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50/90 dark:bg-slate-900/95 px-5 sm:px-8 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 rounded-b-2xl sm:rounded-b-3xl">
                <span className="text-xs text-gray-400 font-medium">Preferences saved automatically in POS terminal</span>
                <button
                    type="button"
                    onClick={onClose || (() => window.history.back())}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                    Save & Close
                </button>
            </div>
        </div>
    );

    if (isPageMode) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            {content}
        </div>
    );
};

export default CashierSettingsModal;
