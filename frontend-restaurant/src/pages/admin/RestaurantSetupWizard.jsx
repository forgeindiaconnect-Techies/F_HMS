import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Check, ArrowRight, ArrowLeft, ChefHat, MonitorDot, Receipt, Users, 
    QrCode, Store, UtensilsCrossed, Banknote, CreditCard, Sparkles, 
    ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Save, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
    { id: 1, title: 'Order & Kitchen', subtitle: 'KOT, KDS & Workflow' },
    { id: 2, title: 'Staff & Roles', subtitle: 'Team permissions' },
    { id: 3, title: 'QR Ordering & Tables', subtitle: 'Self & Waiter service' },
    { id: 4, title: 'Tips & Gratuity', subtitle: 'Customer tip collection' },
    { id: 5, title: 'Payment Methods', subtitle: 'Cash, UPI & Card' },
    { id: 6, title: 'Review & Activate', subtitle: 'Verify & Save' },
];

const RestaurantSetupWizard = ({ onComplete }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { api, restaurant, fetchRestaurant } = useAuth();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Configuration State
    const [config, setConfig] = useState({
        orderKitchen: {
            kotEnabled: true,
            kdsEnabled: true,
            kotPrintEnabled: true
        },
        waiterTips: {
            enabled: true,
            allowCustomerTips: true,
            tipPercentages: [5, 10, 15, 20],
            customTipAllowed: true
        },
        qrOrdering: {
            enabled: true,
            allowSelfDineIn: true,
            allowWaiterOrdering: true
        },
        paymentMethods: {
            cash: true,
            upi: true,
            card: true,
            onlineGateway: true
        },
        setupWizardCompleted: false
    });

    const [planInfo, setPlanInfo] = useState({
        planName: 'Basic',
        planFeatures: []
    });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                setLoading(true);
                const res = await api.get('/restaurants/mine/config');
                if (res.data && res.data.config) {
                    setConfig(prev => ({
                        ...prev,
                        ...res.data.config
                    }));
                    if (res.data.planName) {
                        setPlanInfo({
                            planName: res.data.planName,
                            planFeatures: res.data.planFeatures || []
                        });
                    }
                    if (res.data.config.setupStep && res.data.config.setupStep > 1 && res.data.config.setupStep <= 6) {
                        setCurrentStep(res.data.config.setupStep);
                    }
                }
            } catch (err) {
                console.error('Failed to load setup wizard config:', err);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [api]);

    // Validation for Payment Methods
    const isPaymentValid = () => {
        const { cash, upi, card, onlineGateway } = config.paymentMethods;
        return Boolean(cash || upi || card || onlineGateway);
    };

    const handleSaveAndContinue = async (stepToSave = currentStep, markComplete = false) => {
        if (currentStep === 5 && !isPaymentValid()) {
            toast.error('You must enable at least one payment method before continuing.');
            return;
        }

        const nextStep = Math.min(stepToSave + 1, 6);
        const updatedConfig = {
            ...config,
            setupStep: markComplete ? 6 : nextStep,
            setupWizardCompleted: markComplete ? true : config.setupWizardCompleted
        };

        setSaving(true);
        try {
            await api.put('/restaurants/mine/config', updatedConfig);
            if (fetchRestaurant) await fetchRestaurant();

            if (markComplete) {
                toast.success('🎉 Restaurant setup completed successfully!');
                if (onComplete) {
                    onComplete();
                } else {
                    navigate('/admin');
                }
            } else {
                setCurrentStep(nextStep);
            }
        } catch (error) {
            console.error('Error saving step:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-500">Loading Restaurant Setup Wizard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-4 px-2 sm:px-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                                Guided Configuration
                            </span>
                            <span className="text-xs text-slate-400 font-bold">Step {currentStep} of 6</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Restaurant Operations Setup Wizard
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configure your kitchen routing, QR table ordering, waiter tips, and payment options in minutes.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/settings?tab=operations')}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-center"
                    >
                        Skip to All Settings →
                    </button>
                </div>

                {/* Stepper Bar */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="grid grid-cols-6 gap-2">
                        {STEPS.map((s) => {
                            const isDone = currentStep > s.id;
                            const isCurrent = currentStep === s.id;
                            return (
                                <div 
                                    key={s.id}
                                    onClick={() => isDone && setCurrentStep(s.id)}
                                    className={`flex flex-col items-center text-center cursor-pointer group`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                        isDone 
                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                            : isCurrent 
                                            ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                        {isDone ? <Check size={14} /> : s.id}
                                    </div>
                                    <span className={`text-[11px] font-bold mt-2 truncate w-full hidden md:block ${
                                        isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                    }`}>
                                        {s.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Step Body */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[420px] flex flex-col justify-between">
                <div>
                    {/* STEP 1: ORDER & KITCHEN */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="border-b dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <ChefHat className="text-orange-500" size={22} /> Section 1: Order & Kitchen Setup
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Choose how food orders are communicated to your chefs and prep stations.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* KOT Toggle */}
                                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Kitchen Order Ticket (KOT)</h3>
                                                <p className="text-xs text-slate-500">Auto-routes items to prep stations</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={config.orderKitchen.kotEnabled}
                                                onChange={(e) => setConfig(prev => ({
                                                    ...prev,
                                                    orderKitchen: { ...prev.orderKitchen, kotEnabled: e.target.checked }
                                                }))}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        When enabled, incoming orders automatically generate Station KOTs (Main Kitchen, Bar/Beverage, Oven/Pizza, Desserts). When disabled, orders appear directly on the register.
                                    </p>
                                </div>

                                {/* KDS Toggle */}
                                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                                                <MonitorDot size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Kitchen Display System (KDS)</h3>
                                                <p className="text-xs text-slate-500">Interactive live digital screens for chefs</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={config.orderKitchen.kdsEnabled}
                                                onChange={(e) => setConfig(prev => ({
                                                    ...prev,
                                                    orderKitchen: { ...prev.orderKitchen, kdsEnabled: e.target.checked }
                                                }))}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Provides digital touch-screens for kitchen chefs to mark food Preparing, Ready for Service, or Picked Up with color-coded timers.
                                    </p>
                                </div>

                                {/* KOT Print Toggle */}
                                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3 md:col-span-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Printer size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white">KOT Physical Printing Support</h3>
                                                <p className="text-xs text-slate-500">Print paper tickets to thermal kitchen printers</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={config.orderKitchen.kotPrintEnabled}
                                                onChange={(e) => setConfig(prev => ({
                                                    ...prev,
                                                    orderKitchen: { ...prev.orderKitchen, kotPrintEnabled: e.target.checked }
                                                }))}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Support thermal ESC/POS 80mm ticket printing directly from the waiter floor app, cashier counter, and kitchen station printers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: STAFF & ROLES */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="border-b dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="text-indigo-500" size={22} /> Section 2: Staff & Roles Configuration
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    FoodNest provides specialized role-based operational dashboards for every member of your team.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { role: 'Branch Manager', desc: 'Complete branch oversight, inventory control, table reservations, staff and expense approvals.', badge: 'Supervisor' },
                                    { role: 'Chef / Kitchen Staff', desc: 'Active KDS display screen, station KOT routing, ingredient wastage, and dish readiness.', badge: 'Kitchen' },
                                    { role: 'Waiter', desc: 'Table captain floor desk, mobile order punching, customer service alerts, and gratuity tracking.', badge: 'Floor' },
                                    { role: 'Cashier', desc: 'POS billing terminal, cash drawer balance, split checks, and invoice GST printing.', badge: 'Billing' },
                                    { role: 'Delivery Partner', desc: 'Live GPS road tracking, delivery dispatch, customer OTP verification, and proof of drop-off.', badge: 'Logistics' },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{item.role}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                {item.badge}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">Ready to invite your team?</span>
                                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                                        You can create and manage unlimited staff profiles under <strong>Staff Management</strong> at any time.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/admin/staff')}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                                >
                                    Open Staff Console
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: QR ORDERING & TABLES */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="border-b dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <QrCode className="text-emerald-500" size={22} /> Section 3: QR Ordering & Service Mode Settings
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Control whether guests can scan their table QR code and which dining service formats are available.
                                </p>
                            </div>

                            {/* Master QR Ordering Toggle */}
                            <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 dark:text-white">Enable QR Table Ordering</span>
                                        {config.qrOrdering.enabled ? (
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Disabled</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">Allow seated customers to access the live digital menu via table QR code.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={config.qrOrdering.enabled}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            qrOrdering: { ...prev.qrOrdering, enabled: e.target.checked }
                                        }))}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Service Modes */}
                            {config.qrOrdering.enabled && (
                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                        Available Dining Service Modes on QR Menu:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Mode A: Self Dine-In */}
                                        <div className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                            config.qrOrdering.allowSelfDineIn 
                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                                                : 'border-slate-200 dark:border-slate-800 opacity-60'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                        <Store size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Self Dine-In (KFC Style)</h4>
                                                        <span className="text-[10px] text-amber-700 font-bold">Counter Pickup</span>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={config.qrOrdering.allowSelfDineIn}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        qrOrdering: { ...prev.qrOrdering, allowSelfDineIn: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" 
                                                />
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5">
                                                Customers place order and collect their own food from the designated pickup counter when their token number is called.
                                            </p>
                                        </div>

                                        {/* Mode B: Waiter Table Service */}
                                        <div className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                            config.qrOrdering.allowWaiterOrdering 
                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                                                : 'border-slate-200 dark:border-slate-800 opacity-60'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                                        <UtensilsCrossed size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Order with Waiter</h4>
                                                        <span className="text-[10px] text-blue-700 font-bold">Table Served</span>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={config.qrOrdering.allowWaiterOrdering}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        qrOrdering: { ...prev.qrOrdering, allowWaiterOrdering: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" 
                                                />
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5">
                                                Waiter receives order on their floor desk, picks up prepared dishes from kitchen, and serves directly to the customer's table.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: TIPS & GRATUITY */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="border-b dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="text-amber-500" size={22} /> Section 4: Waiter Tips & Gratuity
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Configure staff tip collection, customer tipping presets, and separate ledger accounting.
                                </p>
                            </div>

                            {/* Tips Master Toggle */}
                            <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">Enable Waiter Tips Feature</span>
                                    <p className="text-xs text-slate-500">Show Tips tab, performance ledger, and settlement tools on the Waiter Dashboard.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={config.waiterTips.enabled}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            waiterTips: { ...prev.waiterTips, enabled: e.target.checked }
                                        }))}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            {config.waiterTips.enabled && (
                                <div className="space-y-4 pt-2">
                                    {/* Customer QR Tips Toggle */}
                                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">Customer Tip Collection on QR Menu</span>
                                            <p className="text-[11px] text-slate-500">Allow customers to include a digital tip during table QR checkout.</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={config.waiterTips.allowCustomerTips}
                                            onChange={(e) => setConfig(prev => ({
                                                ...prev,
                                                waiterTips: { ...prev.waiterTips, allowCustomerTips: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" 
                                        />
                                    </div>

                                    {/* Tip Options */}
                                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                                        <span className="text-xs font-black text-amber-900 dark:text-amber-200 block">Available Tip Presets for Guests:</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {[5, 10, 15, 20].map(pct => (
                                                <span key={pct} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                    {pct}% Gratuity
                                                </span>
                                            ))}
                                            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                Custom Tip (Any ₹)
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                                            🔒 Tips are tracked in an isolated gratuity ledger separately from normal restaurant food revenue, and never marked paid without a recorded cashier or admin settlement.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 5: PAYMENT METHODS */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="border-b dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <CreditCard className="text-emerald-500" size={22} /> Section 5: Payment Methods Configuration
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Select which payment tenders are accepted at customer checkout and cashier terminals.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'cash', title: 'Cash', desc: 'Physical cash collected at counter or table', icon: Banknote, color: 'text-green-600 bg-green-50' },
                                    { key: 'upi', title: 'UPI / QR Payment', desc: 'Scan & Pay with Google Pay, PhonePe, Paytm, CRED', icon: QrCode, color: 'text-amber-600 bg-amber-50' },
                                    { key: 'card', title: 'Debit / Credit Card', desc: 'Physical card swiped on reader or recorded at cashier', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
                                    { key: 'onlineGateway', title: 'Online Payment Gateway', desc: 'Instant contactless digital payment gateway integration', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
                                ].map((pm) => {
                                    const Icon = pm.icon;
                                    const isChecked = config.paymentMethods[pm.key];
                                    return (
                                        <div 
                                            key={pm.key}
                                            onClick={() => setConfig(prev => ({
                                                ...prev,
                                                paymentMethods: { ...prev.paymentMethods, [pm.key]: !prev.paymentMethods[pm.key] }
                                            }))}
                                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                                isChecked 
                                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                                                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pm.color}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{pm.title}</h4>
                                                        <span className={`text-[10px] font-bold ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                            {isChecked ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        setConfig(prev => ({
                                                            ...prev,
                                                            paymentMethods: { ...prev.paymentMethods, [pm.key]: e.target.checked }
                                                        }));
                                                    }}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" 
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                {pm.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {!isPaymentValid() && (
                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs font-bold">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>You must keep at least one payment method enabled to ensure bills can be settled.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 6: REVIEW & SAVE */}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            <div className="border-b dark:border-slate-800 pb-4">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle2 className="text-emerald-500" size={22} /> Section 6: Review & Finalize
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Confirm your restaurant's operational configuration before activating.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Kitchen Card */}
                                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Kitchen & KOT</span>
                                    <div className="space-y-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <div className="flex justify-between"><span>KOT System:</span><span className={config.orderKitchen.kotEnabled ? 'text-emerald-600' : 'text-slate-400'}>{config.orderKitchen.kotEnabled ? 'Enabled' : 'Disabled'}</span></div>
                                        <div className="flex justify-between"><span>Digital KDS:</span><span className={config.orderKitchen.kdsEnabled ? 'text-blue-600' : 'text-slate-400'}>{config.orderKitchen.kdsEnabled ? 'Enabled' : 'Disabled'}</span></div>
                                        <div className="flex justify-between"><span>KOT Printing:</span><span className={config.orderKitchen.kotPrintEnabled ? 'text-emerald-600' : 'text-slate-400'}>{config.orderKitchen.kotPrintEnabled ? 'Enabled' : 'Disabled'}</span></div>
                                    </div>
                                </div>

                                {/* QR Ordering Card */}
                                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">QR & Service Modes</span>
                                    <div className="space-y-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <div className="flex justify-between"><span>QR Ordering:</span><span className={config.qrOrdering.enabled ? 'text-emerald-600' : 'text-slate-400'}>{config.qrOrdering.enabled ? 'Enabled' : 'Disabled'}</span></div>
                                        <div className="flex justify-between"><span>Self Dine-In:</span><span className={config.qrOrdering.allowSelfDineIn ? 'text-amber-600' : 'text-slate-400'}>{config.qrOrdering.allowSelfDineIn ? 'Active' : 'Hidden'}</span></div>
                                        <div className="flex justify-between"><span>Waiter Table Service:</span><span className={config.qrOrdering.allowWaiterOrdering ? 'text-blue-600' : 'text-slate-400'}>{config.qrOrdering.allowWaiterOrdering ? 'Active' : 'Hidden'}</span></div>
                                    </div>
                                </div>

                                {/* Tips Card */}
                                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Gratuity & Tips</span>
                                    <div className="space-y-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <div className="flex justify-between"><span>Waiter Tips:</span><span className={config.waiterTips.enabled ? 'text-emerald-600' : 'text-slate-400'}>{config.waiterTips.enabled ? 'Enabled' : 'Disabled'}</span></div>
                                        <div className="flex justify-between"><span>Customer QR Tips:</span><span className={config.waiterTips.allowCustomerTips ? 'text-emerald-600' : 'text-slate-400'}>{config.waiterTips.allowCustomerTips ? 'Active' : 'Disabled'}</span></div>
                                    </div>
                                </div>

                                {/* Payments Card */}
                                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Payment Methods</span>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {config.paymentMethods.cash && <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-[10px] font-bold">Cash</span>}
                                        {config.paymentMethods.upi && <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">UPI / QR</span>}
                                        {config.paymentMethods.card && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">Card</span>}
                                        {config.paymentMethods.onlineGateway && <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">Online Gateway</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 mt-6">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                        disabled={currentStep === 1 || saving}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                            currentStep === 1 
                                ? 'opacity-0 pointer-events-none' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    {currentStep < 6 ? (
                        <button
                            type="button"
                            onClick={() => handleSaveAndContinue(currentStep, false)}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all"
                        >
                            <span>Save &amp; Continue</span>
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleSaveAndContinue(6, true)}
                            disabled={saving}
                            className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Save size={18} />
                            <span>{saving ? 'Activating...' : 'Finish & Activate Restaurant'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantSetupWizard;
