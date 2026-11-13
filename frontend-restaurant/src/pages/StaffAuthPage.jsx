import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
    Eye, EyeOff, UtensilsCrossed, ArrowRight, Mail, Lock, User as UserIcon, 
    AlertCircle, Phone, CheckCircle2, QrCode, Loader2, ShieldCheck, X, Truck, 
    Sparkles, Clock, Check, Building2, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { getApiUrl } from '../utils/axiosInstance';
import { buildDummyUpiQrUrl } from '../utils/subscriptionClient';
import axios from 'axios';
import toast from 'react-hot-toast';

const DEFAULT_PLANS = [
    { 
        _id: 'p1', 
        name: 'Starter', 
        badge: 'Single Outlet',
        description: 'Essential cloud POS billing and QR table ordering for single cafes and food trucks.',
        monthlyPrice: 49, 
        yearlyPrice: 39, 
        features: [
            '1 Restaurant Branch Outlet',
            'Full POS Billing & KOT Generation',
            'QR Code Table Dine-In Ordering',
            'Real-Time Menu & Catalog Control',
            'Email & Chat Technical Support'
        ] 
    },
    { 
        _id: 'p2', 
        name: 'Professional', 
        badge: 'Most Popular',
        description: 'Complete operations suite with Kitchen Display Systems, shifts & advanced reports.',
        monthlyPrice: 99, 
        yearlyPrice: 79, 
        features: [
            'Up to 3 Restaurant Outlets',
            'Interactive Kitchen Display System (KDS)',
            'Staff Attendance, Shifts & Overtime Tracker',
            'Recipe Stock Depletion & Low Stock Alerts',
            'Executive Sales & Profit Analytics',
            '24/7 Priority Support'
        ] 
    },
    { 
        _id: 'p3', 
        name: 'Enterprise', 
        badge: 'All-Inclusive',
        description: 'Full multi-outlet enterprise management with AI demand predictions & custom integrations.',
        monthlyPrice: 199, 
        yearlyPrice: 159, 
        features: [
            'Unlimited Restaurant Outlets & Franchises',
            'AI-Powered Sales & Inventory Demand Forecasting',
            'Centralized Multi-Outlet Stock Transfer',
            'Dedicated Account Manager & 99.9% Uptime SLA',
            'Custom Webhooks & External API Access'
        ] 
    }
];

const StaffAuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    
    // Determine initial mode from path or URL params
    const initialMode = location.pathname.includes('register') || searchParams.get('mode') === 'register' ? 'register' : 'login';
    const [mode, setMode] = useState(initialMode); // 'login' | 'register'
    const [step, setStep] = useState(1); // 1: Plan, 2: Account, 3: KYC, 4: Payment, 5: Processing, 6: Success/Pending, 7: Error
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [plansLoading, setPlansLoading] = useState(false);

    // KYC File upload states
    const [fssaiFile, setFssaiFile] = useState(null);
    const [fssaiExpiryDate, setFssaiExpiryDate] = useState('');
    const [bizFile, setBizFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [addressText, setAddressText] = useState('');
    const [addressFile, setAddressFile] = useState(null);
    const [bankFile, setBankFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [menuFile, setMenuFile] = useState(null);
    const [imagesFiles, setImagesFiles] = useState([]);
    
    const { login } = useAuth();
    
    const urlPlan = searchParams.get('plan');
    const initialPlan = (!urlPlan || urlPlan.toLowerCase().includes('trial') || urlPlan.toLowerCase().includes('free'))
        ? 'Free Trial'
        : urlPlan;

    const { register, handleSubmit, watch, formState: { errors }, trigger, getValues, reset, setValue } = useForm({
        mode: 'onChange',
        defaultValues: {
            plan: initialPlan,
            billingCycle: searchParams.get('billing') || 'monthly',
            restaurantName: '',
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: ''
        }
    });

    // Force Light Mode on Auth Pages even after page refresh
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    // Fetch plans from API asynchronously in background
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setPlansLoading(true);
                const res = await api.get('/plans', { timeout: 5000 });
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setPlans(res.data);
                    const qPlan = searchParams.get('plan');
                    if (qPlan && (qPlan.toLowerCase().includes('trial') || qPlan.toLowerCase().includes('free'))) {
                        setValue('plan', 'Free Trial');
                    } else if (qPlan) {
                        const match = res.data.find(p => p.name.toLowerCase() === qPlan.toLowerCase());
                        if (match) setValue('plan', match.name);
                    }
                }
            } catch (err) {
                console.error('Background fetch for plans failed, using default plans', err);
            } finally {
                setPlansLoading(false);
            }
        };
        fetchPlans();
    }, [searchParams, setValue]);

    const selectedPlan = watch('plan') || 'Free Trial';
    const isYearly = watch('billingCycle') === 'yearly';
    const isTrialSelected = selectedPlan === 'Free Trial' || selectedPlan.toLowerCase().includes('trial') || selectedPlan.toLowerCase().includes('free');

    const onSubmitLogin = async (data) => {
        setLoading(true);
        setAuthError('');
        const result = await login(data.email, data.password);
        setLoading(false);
        
        if (result.success) {
            const role = (result.data?.role || '').toLowerCase();
            let route = '/admin';
            if (role.includes('superadmin')) route = '/super-admin';
            else if (role.includes('supportagent')) route = '/super-admin/support';
            else if (role.includes('manager')) route = '/manager';
            else if (role.includes('chef')) route = '/chef';
            else if (role.includes('waiter')) route = '/waiter';
            else if (role.includes('cashier')) route = '/cashier';
            else if (role.includes('delivery')) route = '/delivery/dashboard';
            else if (role.includes('customer')) {
                window.location.href = `${import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5174'}/profile`;
                return;
            }
            navigate(route);
        } else {
            setAuthError(result.message);
        }
    };

    const getPlanAmount = () => {
        if (isTrialSelected) return '0.00';
        const found = plans.find(p => p.name.toLowerCase() === selectedPlan.toLowerCase());
        if (found) {
            return isYearly ? (found.yearlyPrice || 0).toFixed(2) : (found.monthlyPrice || 0).toFixed(2);
        }
        return isYearly ? '39.00' : '49.00';
    };

    const handleConfirmQRRegistration = async () => {
        if (paymentStatus === 'processing') return;
        setPaymentStatus('processing');
        setAuthError('');
        const qrRef = `QR-REG-${Date.now().toString().slice(-8)}`;
        toast.success('QR Payment confirmed! Completing restaurant registration...');
        setStep(5);
        await submitRegistration(qrRef);
    };

    const [regStatusMessage, setRegStatusMessage] = useState('Connecting to server...');

    const submitRegistration = async (paymentProof = null) => {
        setLoading(true);
        setAuthError('');
        setRegStatusMessage('Uploading KYC documents & restaurant information...');
        const data = getValues();
        const effectivePlan = isTrialSelected ? 'Basic' : (data.plan || selectedPlan || 'Basic');
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('phoneNumber', data.phoneNumber);
        formData.append('roleName', 'RestaurantAdmin');
        formData.append('loginType', 'staff');
        formData.append('restaurantName', data.restaurantName);
        formData.append('plan', effectivePlan);
        formData.append('isTrial', isTrialSelected ? 'true' : 'false');
        formData.append('trialPlanName', '7-Day Free Trial');
        formData.append('billingCycle', data.billingCycle || (isYearly ? 'yearly' : 'monthly'));
        if (typeof paymentProof === 'string' && paymentProof) {
            formData.append('qrPaymentId', paymentProof);
            formData.append('paymentReference', paymentProof);
        }

        if (fssaiFile) formData.append('fssai', fssaiFile);
        if (fssaiExpiryDate) formData.append('fssaiExpiryDate', fssaiExpiryDate);
        if (bizFile) formData.append('businessRegistration', bizFile);
        if (panFile) formData.append('panCard', panFile);
        if (aadhaarFile) formData.append('aadhaarCard', aadhaarFile);
        if (addressText) formData.append('addressText', addressText);
        if (addressFile) formData.append('addressProof', addressFile);
        if (bankFile) formData.append('bankProof', bankFile);
        if (logoFile) formData.append('logo', logoFile);
        if (menuFile) formData.append('menuPdf', menuFile);
        if (imagesFiles && imagesFiles.length > 0) {
            imagesFiles.forEach(img => {
                formData.append('images', img);
            });
        }

        try {
            setRegStatusMessage('Processing registration on server...');

            try {
                await api.post('/auth/register', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 45000
                });
            } catch (postErr) {
                const isNetErr = !postErr.response || postErr.code === 'ERR_NETWORK' || postErr.code === 'ECONNABORTED';
                if (isNetErr) {
                    await axios.post('https://backend-ochre-five-29.vercel.app/api/auth/register', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        timeout: 60000
                    });
                } else {
                    throw postErr;
                }
            }

            setRegStatusMessage('Signing into restaurant portal...');
            try {
                await login(data.email, data.password);
            } catch (loginErr) {
                console.warn('Auto-login background notice:', loginErr);
            }

            setLoading(false);
            if (isTrialSelected) {
                toast.success('🎉 7-Day Free Trial Request Submitted! Pending Super Admin Approval.');
                setStep(6);
            } else {
                toast.success('Registration & Payment Successful!');
                navigate('/admin');
            }
        } catch (err) {
            setLoading(false);
            const errMsg = err.response?.data?.message || err.message || '';

            if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('user exists') || errMsg.toLowerCase().includes('duplicate') || errMsg.toLowerCase().includes('e11000')) {
                setRegStatusMessage('Account already registered. Logging you in...');
                const loginRes = await login(data.email, data.password);
                if (loginRes.success) {
                    toast.success('Signed in successfully!');
                    navigate('/admin');
                    return;
                } else {
                    toast.error('An account with this email already exists. Please sign in.');
                    switchMode('login');
                    return;
                }
            }

            setAuthError(errMsg || 'Registration and KYC submission failed. Please try again.');
            setStep(7);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setStep(1);
        reset();
        setShowPassword(false);
        setShowConfirm(false);
        setAuthError('');
        setPaymentStatus('idle');
    };

    const handleFileChange = (setter) => (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Maximum file size allowed is 5 MB per document.");
                return;
            }
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
                toast.error("Only PDF, JPG, JPEG, and PNG files are allowed.");
                return;
            }
            setter(file);
        }
    };

    const handleDocsSubmit = () => {
        if (!fssaiFile) {
            toast.error("Please upload your FSSAI License document (Required).");
            return;
        }
        if (!fssaiExpiryDate) {
            toast.error("Please select the FSSAI License expiry date (Required).");
            return;
        }
        const expiry = new Date(fssaiExpiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(expiry.getTime()) || expiry < today) {
            toast.error("FSSAI License expiry date must be today or a future date.");
            return;
        }
        if (!bizFile) {
            toast.error("Please upload your Business Registration Certificate (Required).");
            return;
        }
        if (!panFile) {
            toast.error("Please upload your Business/Owner PAN Card (Required).");
            return;
        }
        if (!aadhaarFile) {
            toast.error("Please upload the Owner Aadhaar Card (Required).");
            return;
        }
        if (!addressText.trim()) {
            toast.error("Please enter the restaurant's physical address (Required).");
            return;
        }
        if (!addressFile) {
            toast.error("Please upload the Business Address Proof document (Required).");
            return;
        }
        if (!bankFile) {
            toast.error("Please upload your Bank Account Proof (Required).");
            return;
        }
        
        if (isTrialSelected) {
            // Free trial does not require payment QR step! Submit directly
            setStep(5);
            submitRegistration('');
        } else {
            // Paid plans proceed to payment scan QR
            setStep(4);
        }
    };

    // =========================================================================
    // RENDER: LOGIN FORM
    // =========================================================================
    const renderLoginForm = () => (
        <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-4 min-w-0 pr-1.5 flex-1 text-left">
            <div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F] transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Email Address"
                        {...register('email', { 
                            required: 'Email is required',
                            validate: (val) => !/[A-Z]/.test(val) || 'Only lowercase letters allowed in email'
                        })}
                        onInput={(e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9@._+-]/g, ''); }}
                        onKeyDown={(e) => {
                            if (e.key && e.key.length === 1 && /[A-Z]/.test(e.key)) {
                                e.preventDefault();
                                const start = e.target.selectionStart;
                                const end = e.target.selectionEnd;
                                const val = e.target.value;
                                e.target.value = val.substring(0, start) + e.key.toLowerCase() + val.substring(end);
                                e.target.setSelectionRange(start + 1, start + 1);
                                e.target.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }}
                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-slate-200 hover:border-slate-300 focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100'}`}
                    />
                </div>
            </div>
            <div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F] transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        {...register('password', { required: 'Password is required' })}
                        className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-slate-200 hover:border-slate-300 focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100'}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#FF5A1F] transition-colors cursor-pointer"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-[#FF5A1F] to-[#E04812] hover:from-[#E04812] hover:to-[#C83B09] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
            >
                {loading ? 'Please wait...' : 'Sign In'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
        </form>
    );

    // =========================================================================
    // STEP 1: SUBSCRIPTION PLAN SELECTION (WITH DEDICATED 7-DAY FREE TRIAL)
    // =========================================================================
    const renderRegisterStep1Plan = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
            {/* Step Indicator */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-[#FF5A1F]">Step 1 of 3: Plan Selection</span>
                <span>Next: Restaurant Details</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                <div className="bg-[#FF5A1F] h-full w-1/3 rounded-full transition-all duration-300" />
            </div>

            <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Choose Your Subscription Plan</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Start risk-free with our 7-Day Free Trial or choose a paid plan for instant continuous access.
                </p>
            </div>

            {/* DEDICATED 7-DAY FREE TRIAL CARD */}
            <div 
                onClick={() => setValue('plan', 'Free Trial')}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isTrialSelected 
                        ? 'border-[#FF5A1F] bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/20' 
                        : 'border-slate-200 bg-white hover:border-orange-200'
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#FF5A1F] bg-orange-100/90 px-2.5 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                            <Sparkles size={12} className="text-[#FF5A1F]" /> Recommended
                        </span>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
                            Super Admin Approval Required
                        </span>
                    </div>
                    {isTrialSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-baseline mb-2">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">7-Day Free Trial Plan</h3>
                        <p className="text-xs text-slate-500 font-medium">Complete access to all restaurant operational features</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-emerald-600">Free</div>
                        <div className="text-[11px] font-bold text-slate-400">7 Days Duration</div>
                    </div>
                </div>

                {/* Important Approval notice */}
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-2 mb-3">
                    <Clock size={15} className="text-[#FF5A1F] shrink-0 mt-0.5" />
                    <span>
                        <strong>Approval Countdown Rule:</strong> The 7-day trial countdown begins <u>strictly after</u> Super Admin approves your account, not when you submit.
                    </span>
                </div>

                {/* Features Included */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-orange-100 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Full POS Billing & Table QR</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Kitchen Display (KOT / KDS)</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Menu & Category Management</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Table Occupancy & Floor Plan</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Staff Permissions & Shifts</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Live Inventory & Stock Alerts</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Reports & Analytics</div>
                    <div className="flex items-center gap-1.5"><Check size={13} className="text-[#FF5A1F]" /> Safe Expiry (Data Preserved)</div>
                </div>
            </div>

            {/* DIVIDER: OR CHOOSE A PAID PLAN */}
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Or Choose A Paid Plan</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    type="button" 
                    onClick={() => setValue('billingCycle', 'monthly')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isYearly ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Monthly
                </button>
                <button 
                    type="button" 
                    onClick={() => setValue('billingCycle', 'yearly')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${isYearly ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Yearly <span className="text-[#FF5A1F] text-[10px] font-extrabold">(Save 20%)</span>
                </button>
            </div>

            {/* Paid Plans Grid */}
            <div className="space-y-3">
                {(plans.length > 0 ? plans : DEFAULT_PLANS).map((plan, idx) => {
                    const mPrice = plan.monthlyPrice || plan.price || 0;
                    const yPrice = plan.yearlyPrice || Math.round(mPrice * 0.8);
                    const price = isYearly ? yPrice : mPrice;
                    const isSelected = !isTrialSelected && selectedPlan.toLowerCase() === plan.name.toLowerCase();
                    const defaultPlanData = DEFAULT_PLANS.find(p => p.name.toLowerCase() === plan.name.toLowerCase()) || plan;
                    const planDesc = plan.description || defaultPlanData.description || 'Comprehensive restaurant operations';
                    const planBadge = plan.badge || defaultPlanData.badge || (plan.name === 'Professional' ? 'Popular' : 'Active');
                    const planFeatures = (plan.features && plan.features.length > 2) ? plan.features : (defaultPlanData.features || []);

                    return (
                        <div
                            key={plan._id || idx}
                            onClick={() => setValue('plan', plan.name)}
                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                isSelected 
                                    ? 'border-[#FF5A1F] bg-gradient-to-br from-orange-50/70 via-white to-amber-50/30 shadow-md ring-2 ring-orange-500/15' 
                                    : 'border-slate-200 bg-white hover:border-orange-200'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                                        isSelected ? 'border-[#FF5A1F] bg-[#FF5A1F]' : 'border-slate-300'
                                    }`}>
                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900 text-base">{plan.name}</span>
                                            {planBadge && (
                                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-full border border-orange-200">
                                                    {planBadge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                                            {planDesc}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-black text-slate-900 text-lg leading-tight">₹{price}<span className="text-xs font-medium text-slate-400">/mo</span></div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        {isYearly ? 'Billed annually' : 'Billed monthly'}
                                    </div>
                                </div>
                            </div>

                            {/* Plan Features Bullet Points */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                                {planFeatures.map((feat, fIdx) => (
                                    <div key={fIdx} className="flex items-center gap-1.5">
                                        <Check size={13} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                                        <span className="truncate">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-4 bg-gradient-to-r from-[#FF5A1F] to-[#E04812] hover:from-[#E04812] hover:to-[#C83B09] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
                <span>Continue with {isTrialSelected ? '7-Day Free Trial' : `${selectedPlan} Plan`}</span>
                <ArrowRight size={18} />
            </button>
        </div>
    );

    // =========================================================================
    // STEP 2: RESTAURANT & OWNER CREDENTIALS
    // =========================================================================
    const renderRegisterStep2Account = () => {
        const handleProceedToKYC = async () => {
            const isValidStep = await trigger(['restaurantName', 'name', 'email', 'phoneNumber', 'password', 'confirmPassword']);
            if (isValidStep) {
                setStep(3);
            }
        };

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                {/* Step Indicator */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span className="text-[#FF5A1F]">Step 2 of 3: Restaurant &amp; Account</span>
                    <span>Next: KYC Verification</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div className="bg-[#FF5A1F] h-full w-2/3 rounded-full transition-all duration-300" />
                </div>

                <div className="flex items-center justify-between">
                    <button 
                        type="button"
                        onClick={() => setStep(1)} 
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                        &larr; Change Plan
                    </button>
                    <span className="text-xs font-bold text-[#FF5A1F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                        {isTrialSelected ? '7-Day Free Trial (₹0)' : `${selectedPlan} Plan`}
                    </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">Create Restaurant Account</h2>
                
                {/* Restaurant Name */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F]">
                        <UtensilsCrossed size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Restaurant / Business Name"
                        {...register('restaurantName', { required: 'Restaurant Name is required' })}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all"
                    />
                    {errors.restaurantName && <p className="text-xs text-red-500 mt-1 pl-1">{errors.restaurantName.message}</p>}
                </div>

                {/* Owner Name */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F]">
                        <UserIcon size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Owner Full Name"
                        {...register('name', { required: 'Owner Name is required' })}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1 pl-1">{errors.name.message}</p>}
                </div>

                {/* Owner Email */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F]">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        placeholder="Owner Email Address"
                        {...register('email', { 
                            required: 'Email is required',
                            pattern: { value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, message: 'Invalid lowercase email address' },
                            validate: (val) => !/[A-Z]/.test(val) || 'Only lowercase letters allowed in email'
                        })}
                        onInput={(e) => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9@._+-]/g, ''); }}
                        onKeyDown={(e) => {
                            if (e.key && e.key.length === 1 && /[A-Z]/.test(e.key)) {
                                e.preventDefault();
                                const start = e.target.selectionStart;
                                const end = e.target.selectionEnd;
                                const val = e.target.value;
                                e.target.value = val.substring(0, start) + e.key.toLowerCase() + val.substring(end);
                                e.target.setSelectionRange(start + 1, start + 1);
                                e.target.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1 pl-1">{errors.email.message}</p>}
                </div>

                {/* Owner Phone */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F]">
                        <Phone size={18} />
                    </div>
                    <input
                        type="tel"
                        placeholder="Mobile Number (10 digits, starts with 6-9)"
                        {...register('phoneNumber', { 
                            required: 'Phone number is required',
                            pattern: { value: /^[6-9]\d{9}$/, message: 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9' }
                        })}
                        onInput={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 10);
                        if (v.length > 0 && !/^[6-9]/.test(v)) v = '';
                        e.target.value = v;
                    }}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all"
                    />
                    {errors.phoneNumber && <p className="text-xs text-red-500 mt-1 pl-1">{errors.phoneNumber.message}</p>}
                </div>

                {/* Password */}
                <div className="group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F]">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create Password"
                            {...register('password', { 
                                required: 'Password is required', 
                                minLength: { value: 6, message: 'Password must be at least 6 characters long' } 
                            })}
                            className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#FF5A1F] cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1 pl-1">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF5A1F]">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            {...register('confirmPassword', { 
                                required: 'Please confirm password',
                                validate: val => val === watch('password') || 'Passwords do not match'
                            })}
                            className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#FF5A1F] cursor-pointer"
                        >
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 pl-1">{errors.confirmPassword.message}</p>}
                </div>

                <button
                    type="button"
                    onClick={handleProceedToKYC}
                    className="w-full mt-6 bg-gradient-to-r from-[#FF5A1F] to-[#E04812] hover:from-[#E04812] hover:to-[#C83B09] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                    Continue to KYC Upload <ArrowRight size={18} />
                </button>
            </div>
        );
    };

    // =========================================================================
    // STEP 3: KYC DOCUMENT UPLOAD
    // =========================================================================
    const renderRegisterStep3KYC = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar text-left">
            {/* Step Indicator */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-[#FF5A1F]">Step 3 of 3: KYC Verification</span>
                <span>Final Step</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                <div className="bg-[#FF5A1F] h-full w-full rounded-full transition-all duration-300" />
            </div>

            <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer">
                &larr; Back to Account Details
            </button>
            
            <div className="flex items-center gap-2 mb-1">
                <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Upload KYC Documents</h2>
                    <p className="text-[11px] text-slate-500">Government compliance verification documents</p>
                </div>
            </div>

            {/* Free Trial Banner in KYC */}
            {isTrialSelected && (
                <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#FF5A1F] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={13} /> 7-Day Free Trial
                        </span>
                        <span className="text-xs font-black text-emerald-700">₹0 Due Today</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                        No credit card or payment required. Submitting this request initiates Super Admin review. Your 7-day countdown begins strictly after approval.
                    </p>
                </div>
            )}

            {/* 1. FSSAI License */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">1. FSSAI License (Required)</label>
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange(setFssaiFile)}
                        className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">EXPIRY DATE:</span>
                        <input
                            type="date"
                            value={fssaiExpiryDate}
                            onChange={(e) => setFssaiExpiryDate(e.target.value)}
                            className="text-xs px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white flex-1"
                        />
                    </div>
                </div>
                {fssaiFile && <p className="text-[10px] text-emerald-600 font-semibold truncate">✓ {fssaiFile.name}</p>}
            </div>

            {/* 2. Business Registration */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">2. Business Registration Certificate (Required)</label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange(setBizFile)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {bizFile && <p className="text-[10px] text-emerald-600 font-semibold truncate">✓ {bizFile.name}</p>}
            </div>

            {/* 3. PAN Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">3. Business/Owner PAN Card (Required)</label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange(setPanFile)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {panFile && <p className="text-[10px] text-emerald-600 font-semibold truncate">✓ {panFile.name}</p>}
            </div>

            {/* 4. Aadhaar Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">4. Owner Aadhaar Card (Required)</label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange(setAadhaarFile)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {aadhaarFile && <p className="text-[10px] text-emerald-600 font-semibold truncate">✓ {aadhaarFile.name}</p>}
            </div>

            {/* 5. Business Address */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">5. Business Address &amp; Proof (Required)</label>
                <textarea
                    placeholder="Enter full street address of the restaurant..."
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white min-h-[50px] resize-none"
                />
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange(setAddressFile)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {addressFile && <p className="text-[10px] text-emerald-600 font-semibold truncate">✓ {addressFile.name}</p>}
            </div>

            {/* 6. Bank Proof */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">6. Bank Account Proof (Required)</label>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange(setBankFile)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {bankFile && <p className="text-[10px] text-emerald-600 font-semibold truncate">✓ {bankFile.name}</p>}
            </div>

            {/* Optional items */}
            <div className="bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-400 block">Optional Brand Assets</label>
                <div className="space-y-2 text-xs">
                    <div>
                        <span className="text-[10px] text-slate-400 block mb-1">RESTAURANT LOGO (JPG/PNG)</span>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleFileChange(setLogoFile)}
                            className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-600"
                        />
                        {logoFile && <p className="text-[10px] text-emerald-600 truncate mt-0.5">✓ {logoFile.name}</p>}
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 block mb-1">MENU PDF</span>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange(setMenuFile)}
                            className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-600"
                        />
                        {menuFile && <p className="text-[10px] text-emerald-600 truncate mt-0.5">✓ {menuFile.name}</p>}
                    </div>
                </div>
            </div>

            {/* ACTION BUTTON */}
            {isTrialSelected ? (
                <button
                    type="button"
                    onClick={handleDocsSubmit}
                    className="w-full mt-4 py-3.5 bg-gradient-to-r from-[#FF5A1F] to-[#E04812] hover:from-[#E04812] hover:to-[#C83B09] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer text-sm"
                >
                    <span>Submit 7-Day Free Trial Request (No Card Required)</span>
                    <ArrowRight size={18} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleDocsSubmit}
                    className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer text-sm"
                >
                    <span>Continue to Payment (₹{getPlanAmount()})</span>
                    <ArrowRight size={18} />
                </button>
            )}
        </div>
    );

    // =========================================================================
    // STEP 4: PAYMENT (ONLY FOR PAID PLANS) - DUMMY QR SCANNER
    // =========================================================================
    const renderRegisterStep4Payment = () => {
        const planLabel = watch('plan') || selectedPlan || 'Basic';
        const amountStr = getPlanAmount();
        const qrImageUrl = buildDummyUpiQrUrl({
            amount: parseFloat(amountStr) || 0,
            label: `${planLabel} Registration`
        });

        return (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500 py-2">
                <button onClick={() => setStep(3)} disabled={paymentStatus === 'processing'} className="text-xs font-bold text-slate-500 hover:text-slate-900 mb-3 inline-flex items-center gap-1 self-start mr-auto block cursor-pointer">
                    &larr; Back to KYC
                </button>
                <h2 className="text-2xl font-black text-slate-900 mb-1">Activate {planLabel} Plan</h2>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                    Scan the UPI QR code below for <span className="font-bold text-slate-800">₹{amountStr}</span> to register and activate your restaurant.
                </p>

                <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 mb-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>Selected Plan</span>
                        <span className="text-slate-900 font-black">{planLabel} ({isYearly ? 'Yearly' : 'Monthly'})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>Restaurant</span>
                        <span className="text-slate-900 font-black">{watch('restaurantName') || 'New Restaurant'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-600">Payable Total</span>
                        <span className="text-xl font-black text-emerald-700">₹{amountStr}</span>
                    </div>

                    {/* Dummy UPI QR Scanner Box */}
                    <div className="pt-2 flex flex-col items-center">
                        <div className="w-40 h-40 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                            <img
                                src={qrImageUrl}
                                alt="Registration UPI QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 mt-2">
                            Scan with GPay, PhonePe or Paytm &amp; confirm below
                        </span>
                    </div>
                </div>

                {paymentStatus === 'failed' && (
                    <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-center gap-2">
                        <AlertCircle size={15} />
                        Payment confirmation failed. Please retry below.
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleConfirmQRRegistration}
                    disabled={paymentStatus === 'processing'}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
                >
                    {paymentStatus === 'processing' ? (
                        <>
                            <Loader2 className="animate-spin text-white" size={18} />
                            Confirming QR Payment...
                        </>
                    ) : (
                        <>
                            <QrCode size={18} /> Confirm QR Payment &amp; Complete Registration <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </div>
        );
    };

    // =========================================================================
    // STEP 5: REGISTRATION IN PROGRESS
    // =========================================================================
    const renderRegisterStep5Processing = () => (
        <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="animate-spin text-[#FF5A1F]" size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Creating Your Account...</h2>
            <p className="text-xs font-bold text-[#FF5A1F] bg-orange-50 py-1.5 px-4 rounded-full inline-block mb-3 border border-orange-200 animate-pulse">
                {regStatusMessage}
            </p>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mb-6">
                Registering and uploading KYC for <span className="font-bold text-slate-800">{getValues('restaurantName')}</span>. This may take a few seconds.
            </p>
        </div>
    );

    // =========================================================================
    // STEP 6: SUBMISSION RESULT / PENDING APPROVAL SCREEN
    // =========================================================================
    const renderRegisterStep6Success = () => {
        const restaurantName = getValues('restaurantName');
        const ownerEmail = getValues('email');

        if (isTrialSelected) {
            return (
                <div className="text-center py-6 animate-in fade-in zoom-in duration-500 space-y-4">
                    {/* Glowing Amber Hourglass Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 text-[#FF5A1F] rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-orange-200/50">
                        <Clock size={40} strokeWidth={2.5} />
                    </div>

                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs uppercase tracking-wider mb-2 border border-amber-200">
                            ⏳ Pending Super Admin Approval
                        </span>
                        <h2 className="text-2xl font-black text-slate-900">7-Day Free Trial Request Submitted!</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Your trial request for <strong className="text-slate-800">{restaurantName}</strong> has been received.
                        </p>
                    </div>

                    {/* Information Summary Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                            <span className="text-slate-500 font-semibold">Selected Plan:</span>
                            <span className="font-black text-slate-900">7-Day Free Trial Plan</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                            <span className="text-slate-500 font-semibold">Amount Due:</span>
                            <span className="font-black text-emerald-600">₹0 (Free / No Card Required)</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                            <span className="text-slate-500 font-semibold">Trial Duration:</span>
                            <span className="font-black text-slate-900">7 Full Days (168 Hours)</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                            <span className="text-slate-500 font-semibold">Countdown Start:</span>
                            <span className="font-bold text-[#FF5A1F]">Strictly after Super Admin Approval</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-500 font-semibold">Email Notification:</span>
                            <span className="font-bold text-slate-800 truncate max-w-[180px]">{ownerEmail}</span>
                        </div>
                    </div>

                    {/* Explanatory callout */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left text-[11px] text-amber-900 font-medium leading-relaxed">
                        🛡️ <strong>Zero Trial Days Consumed While Waiting:</strong> Your 7-day countdown has <u>not</u> started yet. Once the Super Admin approves your account, you will receive an activation email and get 7 full days of unrestricted access.
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="w-full py-3.5 bg-gradient-to-r from-[#FF5A1F] to-[#E04812] hover:from-[#E04812] hover:to-[#C83B09] text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <span>Open Restaurant Dashboard</span>
                            <ArrowRight size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                            Return to Home Page
                        </button>
                    </div>
                </div>
            );
        }

        // Paid success
        return (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500 space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={44} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Subscription Active!</h2>
                <p className="text-xs text-slate-500">Welcome to FoodNest! Your account and KYC have been submitted.</p>
                <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
                >
                    Go to Dashboard →
                </button>
            </div>
        );
    };

    // =========================================================================
    // STEP 7: ERROR SCREEN
    // =========================================================================
    const renderRegisterStep7Error = () => (
        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-red-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Failed</h2>
            <p className="text-red-500 font-medium mb-6 px-4 text-xs">{authError}</p>
            <p className="text-slate-500 text-xs mb-8">Please check your details and try again. Each restaurant account must use a unique email address.</p>
            <button 
                onClick={() => setStep(1)}
                className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-colors text-sm cursor-pointer"
            >
                Start Over
            </button>
        </div>
    );

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans bg-[#FFFDF9] selection:bg-[#FF5A1F] selection:text-white auth-page overflow-x-hidden">
            {/* Ambient warm background glow matching landing page */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-50/60 rounded-full blur-3xl" />
                <img
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
                    alt="Restaurant ambiance"
                    className="w-full h-full object-cover opacity-10"
                />
            </div>

            {/* Glass Card - Dynamically wider for plan selection & KYC */}
            <div className={`relative z-10 w-full ${mode === 'register' && (step === 1 || step === 3 || step === 6) ? 'max-w-xl' : 'max-w-md'} bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-orange-100/80 transition-all duration-300`}>
                
                {/* Branding Header with Warm Vibrant FoodNest Orange */}
                <div className="bg-gradient-to-br from-[#FF5A1F] to-[#E04812] p-7 text-center relative overflow-hidden shadow-md shadow-orange-500/20">
                    <Link to="/" className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all z-20 cursor-pointer">
                        <X size={18} />
                    </Link>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider mb-2 relative z-10 backdrop-blur-xs">
                        <ShieldCheck size={13} /> Restaurant Partner &amp; Staff Portal
                    </div>

                    <Link to="/" className="inline-flex items-center justify-center gap-2 mb-1 relative z-10 w-full group">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm group-hover:scale-105 transition-transform">
                            <UtensilsCrossed size={26} className="text-white" />
                        </div>
                        <span className="text-3xl font-extrabold text-white tracking-tight">FoodNest</span>
                    </Link>
                    <p className="text-orange-100 text-xs font-semibold relative z-10 opacity-95">
                        {mode === 'login' ? 'Sign in to manage POS billing, KDS, inventory & staff' : 'Start your 7-Day Free Trial or register your restaurant'}
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-6 sm:p-8 bg-white auth-form-container">
                    {/* Tabs (Only show if not mid-registration) */}
                    {(mode === 'login' || step === 1) && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 relative">
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('register')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Get Started Free
                            </button>
                        </div>
                    )}

                    {authError && step !== 7 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-red-800">{authError}</p>
                        </div>
                    )}

                    {mode === 'login' && renderLoginForm()}
                    {mode === 'register' && step === 1 && renderRegisterStep1Plan()}
                    {mode === 'register' && step === 2 && renderRegisterStep2Account()}
                    {mode === 'register' && step === 3 && renderRegisterStep3KYC()}
                    {mode === 'register' && step === 4 && renderRegisterStep4Payment()}
                    {mode === 'register' && step === 5 && renderRegisterStep5Processing()}
                    {mode === 'register' && step === 6 && renderRegisterStep6Success()}
                    {mode === 'register' && step === 7 && renderRegisterStep7Error()}

                    {/* Portal Switcher Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
                        <p className="text-[11px] text-slate-400 font-medium">Looking for another portal?</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Link 
                                to="/delivery/login" 
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#FF5A1F] bg-slate-50 hover:bg-orange-50/60 px-4 py-2 rounded-xl transition-all border border-slate-200 hover:border-orange-200 shadow-2xs"
                            >
                                <Truck size={14} className="text-[#FF5A1F]" /> Delivery Partner Portal
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffAuthPage;
