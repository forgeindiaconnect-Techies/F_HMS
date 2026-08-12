import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UtensilsCrossed, ArrowRight, Mail, Lock, User as UserIcon, Tag, AlertCircle, Phone, CheckCircle2, QrCode, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/axiosInstance';
import axios from 'axios';
import toast from 'react-hot-toast';

const StaffAuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    
    // Determine initial mode from path or URL params
    const initialMode = location.pathname.includes('register') ? 'register' : 'login';
    const [mode, setMode] = useState(initialMode); // 'login' | 'register'
    const [step, setStep] = useState(1); // 1: Account, 2: Plan, 3: Scan, 4: Registering
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [scanActive, setScanActive] = useState(false);
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);

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
    
    const { login, register: registerUser } = useAuth();
    
    const { register, handleSubmit, watch, formState: { errors, isValid }, trigger, getValues, reset } = useForm({
        mode: 'onChange',
        defaultValues: {
            plan: searchParams.get('plan') || '',
            billingCycle: searchParams.get('billing') || 'monthly'
        }
    });

    // Fetch plans from API
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const API_URL = getApiUrl();
                const res = await axios.get(`${API_URL}/plans`);
                if (res.data && res.data.length > 0) {
                    setPlans(res.data);
                    // Auto-select the plan from URL params or first plan
                    const urlPlan = searchParams.get('plan');
                    if (!urlPlan || !res.data.find(p => p.name === urlPlan)) {
                        // Set default to first plan name if URL plan not found
                        reset({ plan: res.data[0].name, billingCycle: searchParams.get('billing') || 'monthly' });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch plans', err);
            } finally {
                setPlansLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const onSubmitLogin = async (data) => {
        setLoading(true);
        setAuthError('');
        const result = await login(data.email, data.password);
        setLoading(false);
        
        if (result.success) {
            const role = result.data.role.toLowerCase();
            let route = '/admin';
            if (role.includes('superadmin')) route = '/super-admin';
            else if (role.includes('manager')) route = '/manager';
            else if (role.includes('chef')) route = '/chef';
            else if (role.includes('waiter')) route = '/waiter';
            else if (role.includes('cashier')) route = '/cashier';
            else if (role.includes('customer')) route = '/profile';
            navigate(route);
        } else {
            setAuthError(result.message);
        }
    };

    const handleNextStep = async () => {
        let fieldsToValidate = [];
        if (step === 1) fieldsToValidate = ['name', 'email', 'phoneNumber', 'password', 'confirmPassword'];
        if (step === 2) fieldsToValidate = ['restaurantName', 'plan', 'billingCycle'];
        
        const isStepValid = await trigger(fieldsToValidate);
        if (isStepValid) {
            if (step === 2) {
                setStep(3);
            } else {
                setStep(step + 1);
            }
        }
    };

    const getPlanAmount = () => {
        const selectedPlanName = watch('plan');
        const isYearly = watch('billingCycle') === 'yearly';
        const found = plans.find(p => p.name === selectedPlanName);
        if (found) {
            return isYearly ? (found.yearlyPrice || 0).toFixed(2) : (found.monthlyPrice || 0).toFixed(2);
        }
        return '0.00';
    };

    const startDummyScan = () => {
        if (paymentStatus === 'success' || paymentStatus === 'processing') return;
        setPaymentStatus('idle');
        setScanActive(true);
        setTimeout(() => {
            setScanActive(false);
            setShowUpiModal(true);
        }, 1500);
    };

    const handleUpiPayment = (success) => {
        setPaymentStatus('processing');
        setTimeout(() => {
            if (success) {
                setPaymentStatus('success');
                setTimeout(() => {
                    setShowUpiModal(false);
                    setTimeout(() => {
                        setStep(5);
                        submitRegistration();
                    }, 500);
                }, 1500);
            } else {
                setPaymentStatus('failed');
            }
        }, 1500);
    };

    const submitRegistration = async () => {
        setLoading(true);
        setAuthError('');
        const data = getValues();
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('phoneNumber', data.phoneNumber);
        formData.append('roleName', 'RestaurantAdmin');
        formData.append('loginType', 'staff');
        formData.append('restaurantName', data.restaurantName);
        formData.append('plan', data.plan);
        formData.append('billingCycle', data.billingCycle);

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
            const API_URL = getApiUrl();

            await axios.post(`${API_URL}/auth/register`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const loginRes = await login(data.email, data.password);
            setLoading(false);
            if (loginRes.success) {
                navigate('/admin');
            } else {
                setAuthError('Account registered but auto-login failed. Please sign in manually.');
                setStep(6);
            }
        } catch (err) {
            setLoading(false);
            setAuthError(err.response?.data?.message || 'Registration and KYC submission failed. Please try again.');
            setStep(6);
        }
    };

    // Force cache bust: v3
    useEffect(() => {
        let timeout;
        if (mode === 'register' && step === 4 && paymentStatus === 'idle') {
            timeout = setTimeout(() => {
                // If they haven't manually clicked anything after 15 seconds, assume they paid on their phone
                startDummyScan();
            }, 15000);
        }
        return () => clearTimeout(timeout);
    }, [mode, step, paymentStatus]);

    const switchMode = (newMode) => {
        setMode(newMode);
        setStep(1);
        reset();
        setShowPassword(false);
        setShowConfirm(false);
        setAuthError('');
        setPaymentStatus('idle');
        setShowUpiModal(false);
        setScanActive(false);
    };

    const selectedPlan = watch('plan');
    const isYearly = watch('billingCycle') === 'yearly';

    const renderLoginForm = () => (
        <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-4">
            <div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500 transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Email Address"
                        {...register('email', { required: 'Email is required' })}
                        className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100'}`}
                    />
                </div>
            </div>
            <div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500 transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        {...register('password', { required: 'Password is required' })}
                        className={`w-full pl-11 pr-11 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100'}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-green-600/10 flex items-center justify-center gap-2 text-base cursor-pointer"
            >
                {loading ? 'Please wait...' : 'Sign In'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
        </form>
    );

    const renderRegisterStep1 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create your account</h2>
            
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                    <UserIcon size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Full Name"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 pl-1">{errors.name.message}</p>}
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    placeholder="Email Address"
                    {...register('email', { 
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 pl-1">{errors.email.message}</p>}
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                    <Phone size={18} />
                </div>
                <input
                    type="tel"
                    placeholder="Phone Number"
                    {...register('phoneNumber', { required: 'Phone number is required' })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                />
                {errors.phoneNumber && <p className="text-xs text-red-500 mt-1 pl-1">{errors.phoneNumber.message}</p>}
            </div>

            <div className="group">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create Password"
                        {...register('password', { 
                            required: 'Password is required', 
                            minLength: { value: 6, message: 'Password must be at least 6 characters long' } 
                        })}
                        className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1 pl-1">{errors.password.message}</p>}
            </div>

            <div className="group">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        {...register('confirmPassword', { 
                            required: 'Please confirm password',
                            validate: val => val === watch('password') || 'Passwords do not match'
                        })}
                        className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600"
                    >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 pl-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
                type="button"
                onClick={handleNextStep}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-green-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
                Next Step <ArrowRight size={18} />
            </button>
        </div>
    );

    const renderRegisterStep2 = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-2 inline-flex items-center gap-1">
                &larr; Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Choose your plan</h2>
            
            <div className="relative group mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                    <UtensilsCrossed size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Restaurant Name"
                    {...register('restaurantName', { required: 'Restaurant Name is required' })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                />
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button type="button" onClick={() => trigger().then(() => register('billingCycle').onChange({ target: { name: 'billingCycle', value: 'monthly' } }))} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isYearly ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Monthly</button>
                <button type="button" onClick={() => trigger().then(() => register('billingCycle').onChange({ target: { name: 'billingCycle', value: 'yearly' } }))} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isYearly ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Yearly (Save more)</button>
            </div>

            {plansLoading ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {(plans.length > 0 ? plans : [
                        { _id: 'p1', name: 'Starter', monthlyPrice: 49, yearlyPrice: 39, features: ['1 Branch', 'Basic Reporting', 'Email Support'] },
                        { _id: 'p2', name: 'Professional', monthlyPrice: 99, yearlyPrice: 79, features: ['3 Branches', 'Advanced Analytics', 'Priority Support'] },
                        { _id: 'p3', name: 'Enterprise', monthlyPrice: 199, yearlyPrice: 159, features: ['Unlimited Branches', 'Custom Features', '24/7 Support'] }
                    ]).map((plan, idx) => {
                        const mPrice = plan.monthlyPrice || plan.price || 0;
                        const yPrice = plan.yearlyPrice || mPrice;
                        const price = isYearly ? yPrice : mPrice;
                        const savings = mPrice && yPrice && mPrice > yPrice
                            ? Math.round((1 - yPrice / mPrice) * 100)
                            : 0;
                        return (
                            <label key={plan._id || idx} className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPlan === plan.name ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                <input type="radio" value={plan.name} {...register('plan')} className="hidden" />
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-900">{plan.name}</span>
                                    <span className="font-bold text-green-600">
                                        ₹{(price || 0).toLocaleString('en-IN')}/mo
                                        {isYearly && savings > 0 && (
                                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                                Save {savings}%
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium">
                                    {(plan.features || []).slice(0, 2).join(' · ')}{(plan.features || []).length > 2 ? ` · +${plan.features.length - 2} more` : ''}
                                </p>
                                {selectedPlan === plan.name && <CheckCircle2 size={18} className="absolute top-4 right-4 text-green-500" />}
                            </label>
                        );
                    })}
                </div>
            )}

            <button
                type="button"
                onClick={handleNextStep}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-green-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
                Continue to KYC Upload <ArrowRight size={18} />
            </button>
        </div>
    );

    const renderRegisterStepDocs = () => {
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
            
            // Proceed to scanning options
            setStep(4);
        };

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar text-left">
                <button onClick={() => setStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    &larr; Back
                </button>
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-green-100 text-green-700 p-1.5 rounded-lg">
                        <ShieldCheck size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Upload KYC Documents</h2>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-2">All mandatory documents must be uploaded. Format: PDF, JPG, JPEG, PNG under 5 MB.</p>

                {/* 1. FSSAI License */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">1. FSSAI License (Required)</label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange(setFssaiFile)}
                            className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold shrink-0">EXPIRY DATE:</span>
                            <input
                                type="date"
                                value={fssaiExpiryDate}
                                onChange={(e) => setFssaiExpiryDate(e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-200 rounded-lg outline-none bg-white flex-1"
                            />
                        </div>
                    </div>
                    {fssaiFile && <p className="text-[10px] text-green-600 font-semibold truncate">✓ {fssaiFile.name}</p>}
                </div>

                {/* 2. Business Registration */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">2. Business Registration Certificate (Required)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange(setBizFile)}
                        className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {bizFile && <p className="text-[10px] text-green-600 font-semibold truncate">✓ {bizFile.name}</p>}
                </div>

                {/* 3. PAN Card */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">3. Business/Owner PAN Card (Required)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange(setPanFile)}
                        className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {panFile && <p className="text-[10px] text-green-600 font-semibold truncate">✓ {panFile.name}</p>}
                </div>

                {/* 4. Aadhaar Card */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">4. Owner Aadhaar Card (Required)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange(setAadhaarFile)}
                        className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {aadhaarFile && <p className="text-[10px] text-green-600 font-semibold truncate">✓ {aadhaarFile.name}</p>}
                </div>

                {/* 5. Business Address */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">5. Business Address & Proof (Required)</label>
                    <textarea
                        placeholder="Enter full street address of the restaurant..."
                        value={addressText}
                        onChange={(e) => setAddressText(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none bg-white min-h-[50px] resize-none"
                    />
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange(setAddressFile)}
                        className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {addressFile && <p className="text-[10px] text-green-600 font-semibold truncate">✓ {addressFile.name}</p>}
                </div>

                {/* 6. Bank Proof */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">6. Bank Account Proof (Required)</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange(setBankFile)}
                        className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {bankFile && <p className="text-[10px] text-green-600 font-semibold truncate">✓ {bankFile.name}</p>}
                </div>

                {/* Optional items */}
                <div className="bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200 space-y-2">
                    <label className="text-xs font-bold text-gray-400 block">Optional Brand Assets</label>
                    <div className="space-y-2 text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 block mb-1">RESTAURANT LOGO (JPG/PNG)</span>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileChange(setLogoFile)}
                                className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-gray-100 file:text-gray-600"
                            />
                            {logoFile && <p className="text-[10px] text-green-600 truncate mt-0.5">✓ {logoFile.name}</p>}
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 block mb-1">MENU PDF</span>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange(setMenuFile)}
                                className="text-xs w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-gray-100 file:text-gray-600"
                            />
                            {menuFile && <p className="text-[10px] text-green-600 truncate mt-0.5">✓ {menuFile.name}</p>}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDocsSubmit}
                    className="w-full mt-4 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                    Continue to Payment <ArrowRight size={18} />
                </button>
            </div>
        );
    };

    const renderRegisterStep3 = () => (
        <div className="text-center animate-in fade-in zoom-in-95 duration-500 py-4">
            <button onClick={() => setStep(3)} disabled={scanActive} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1 self-start mr-auto block">
                &larr; Back
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Choose Payment Method</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Scan the QR code with your preferred UPI app to activate subscription.</p>

            <div 
                className="relative w-56 h-56 mx-auto mb-8 bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex items-center justify-center overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow"
                onClick={!scanActive ? startDummyScan : undefined}
                title="Click to simulate scanning the QR Code"
            >
                <div className={`transition-all duration-1000 flex flex-col items-center justify-center ${scanActive ? 'scale-110 opacity-30 blur-sm' : ''}`}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi%3A%2F%2Fpay%3Fpa%3Ddemo%40upi%26pn%3DRestoSys%26am%3D${getPlanAmount()}%26cu%3DINR&bgcolor=ffffff&color=1a73e8`} alt="QR Code" className="w-40 h-40" />
                    <div className="mt-4 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Secure UPI Payment</span>
                    </div>
                </div>
                
                {scanActive && (
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="w-full h-1 bg-green-500 shadow-[0_0_20px_#22c55e] animate-[scan_2s_ease-in-out_infinite]"></div>
                        <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <Loader2 className="animate-spin text-green-600" size={24} />
                            </div>
                            <span className="text-xs font-bold text-gray-800 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">Scanning...</span>
                        </div>
                    </div>
                )}
            </div>

            {paymentStatus === 'success' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                    <p className="text-sm font-bold text-green-800">Subscription Paid Successfully!</p>
                    <p className="text-xs text-green-600">Registering account and KYC documents...</p>
                </div>
            )}

            {paymentStatus === 'failed' && (
                <div className="mt-6 flex flex-col items-center gap-3 animate-in fade-in">
                    <p className="text-sm font-bold text-red-500">Payment Failed. Subscription Inactive.</p>
                    <button onClick={() => { setPaymentStatus('idle'); startDummyScan(); }} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg">
                        Retry Payment
                    </button>
                </div>
            )}
        </div>
    );

    const renderRegisterStep4 = () => (
        <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="animate-spin text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating your account...</h2>
            <p className="text-gray-500 font-medium">Registering and uploading KYC for {getValues('restaurantName')}</p>
        </div>
    );

    const renderRegisterStep5 = () => (
        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-red-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Failed</h2>
            <p className="text-red-500 font-medium mb-6 px-4">{authError}</p>
            <p className="text-gray-500 text-sm mb-8">If you're testing, make sure to use a different email address each time, as accounts cannot share emails.</p>
            <button 
                onClick={() => setStep(1)}
                className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-colors"
            >
                Start Over
            </button>
        </div>
    );

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans bg-gray-900">
            {/* Full screen background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
                    alt="Restaurant ambiance"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[10px]"></div>
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                
                {/* Branding Header */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center relative overflow-hidden">
                    <Link to="/" className="inline-flex items-center gap-2 mb-2 relative z-10">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <UtensilsCrossed size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>RestoSys</span>
                    </Link>
                    <p className="text-green-50 text-sm font-medium relative z-10 opacity-90">
                        {mode === 'login' ? 'Sign in to RestaurantHub Staff Portal' : 'Subscribe and Get Started'}
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-8">
                    {/* Tabs (Only show if not mid-registration) */}
                    {step === 1 && (
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8 relative">
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('register')}
                                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Subscribe Now
                            </button>
                        </div>
                    )}

                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-red-800">{authError}</p>
                        </div>
                    )}

                    {mode === 'login' && renderLoginForm()}
                    {mode === 'register' && step === 1 && renderRegisterStep1()}
                    {mode === 'register' && step === 2 && renderRegisterStep2()}
                    {mode === 'register' && step === 3 && renderRegisterStepDocs()}
                    {mode === 'register' && step === 4 && renderRegisterStep3()}
                    {mode === 'register' && step === 5 && renderRegisterStep4()}
                    {mode === 'register' && step === 6 && renderRegisterStep5()}
                </div>
            </div>

            {/* UPI Simulator Modal */}
            {showUpiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="bg-gray-50 p-6 text-center border-b border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-1">
                                Complete Payment
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">Paying for {getValues('restaurantName')} Subscription</p>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
                            {paymentStatus === 'idle' && (
                                <>
                                    <div className="text-3xl font-black text-gray-900 mb-6">
                                        ₹{getPlanAmount()}/mo
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 mb-4">Select UPI App:</p>
                                    <div className="flex flex-col w-full gap-3">
                                        <button onClick={() => handleUpiPayment(true)} className="flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all bg-white shadow-sm hover:shadow text-gray-900 font-bold">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-5 object-contain" />
                                            Google Pay
                                        </button>
                                        <button onClick={() => handleUpiPayment(true)} className="flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all bg-white shadow-sm hover:shadow text-gray-900 font-bold">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-6 object-contain" />
                                            PhonePe
                                        </button>
                                        <button onClick={() => handleUpiPayment(true)} className="flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all bg-white shadow-sm hover:shadow text-gray-900 font-bold">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-4 object-contain" />
                                            Paytm
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {paymentStatus === 'processing' && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-green-500" size={40} />
                                    <p className="font-bold text-gray-600 text-sm">Processing Payment...</p>
                                </div>
                            )}

                            {paymentStatus === 'success' && (
                                <div className="flex flex-col items-center gap-4 text-green-500">
                                    <CheckCircle2 size={48} className="animate-in zoom-in" />
                                    <p className="font-bold text-green-600 text-lg">Payment Successful</p>
                                </div>
                            )}

                            {paymentStatus === 'failed' && (
                                <div className="flex flex-col items-center gap-4 text-red-500">
                                    <AlertCircle size={48} className="animate-in zoom-in" />
                                    <p className="font-bold text-red-600 text-lg">Payment Failed</p>
                                    <button onClick={() => setShowUpiModal(false)} className="mt-2 text-sm font-bold text-gray-500 hover:text-gray-900">Close</button>
                                </div>
                            )}
                        </div>
                        
                        {(paymentStatus === 'idle') && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                <button 
                                    onClick={() => setShowUpiModal(false)}
                                    className="text-sm font-bold text-gray-500 hover:text-gray-900"
                                >
                                    Cancel Payment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan-line {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(192px); }
                    100% { transform: translateY(0); }
                }
                .animate-scan-line {
                    animation: scan-line 2s linear infinite;
                }
            `}} />
        </div>
    );
};

export default StaffAuthPage;
