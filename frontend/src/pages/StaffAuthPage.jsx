import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UtensilsCrossed, ArrowRight, Mail, Lock, User as UserIcon, Tag, AlertCircle, Phone, CheckCircle2, QrCode, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    const [selectedPayment, setSelectedPayment] = useState('gpay');
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
    
    const { login, register: registerUser } = useAuth();
    
    const { register, handleSubmit, watch, formState: { errors, isValid }, trigger, getValues, reset } = useForm({
        mode: 'onChange',
        defaultValues: {
            plan: searchParams.get('plan') || 'Basic',
            billingCycle: searchParams.get('billing') || 'monthly'
        }
    });

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

    const startDummyScan = () => {
        if (paymentStatus === 'success') return;
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
                        setStep(4);
                        submitRegistration();
                    }, 2000);
                }, 1500);
            } else {
                setPaymentStatus('failed');
            }
        }, 2000);
    };

    const submitRegistration = async () => {
        setLoading(true);
        setAuthError('');
        const data = getValues();
        
        const result = await registerUser(
            data.name, 
            data.email, 
            data.password, 
            data.phoneNumber,
            'RestaurantAdmin', // Hardcoded for SaaS signup
            'staff',
            data.restaurantName,
            data.plan,
            data.billingCycle
        );
        
        setLoading(false);

        if (result.success) {
            navigate('/admin');
        } else {
            setAuthError(result.message);
            setStep(1); // Go back to fix errors
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setStep(1);
        reset();
        setShowPassword(false);
        setShowConfirm(false);
        setAuthError('');
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
                className="w-full mt-4 relative overflow-hidden bg-gray-900 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] group"
            >
                <div className="absolute inset-0 w-0 bg-green-500 transition-all duration-300 ease-out group-hover:w-full opacity-100"></div>
                <span className="relative flex items-center justify-center gap-2 text-base">
                    {loading ? 'Please wait...' : 'Sign In'}
                    {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </span>
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
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                    })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                />
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                    <Phone size={18} />
                </div>
                <input
                    type="tel"
                    placeholder="Phone Number"
                    {...register('phoneNumber', { required: 'Phone is required' })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all"
                />
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500">
                    <Lock size={18} />
                </div>
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create Password"
                    {...register('password', { required: 'Password is required', minLength: 6 })}
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

            <div className="relative group">
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
            </div>

            <button
                type="button"
                onClick={handleNextStep}
                className="w-full mt-6 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
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
                <button type="button" onClick={() => trigger().then(() => register('billingCycle').onChange({ target: { name: 'billingCycle', value: 'yearly' } }))} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isYearly ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Yearly (Save 20%)</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {['Basic', 'Pro', 'Enterprise'].map((plan) => (
                    <label key={plan} className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPlan === plan ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                        <input type="radio" value={plan} {...register('plan')} className="hidden" />
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-900">{plan}</span>
                            <span className="font-bold text-green-600">
                                {plan === 'Basic' && (isYearly ? '$39/mo' : '$49/mo')}
                                {plan === 'Pro' && (isYearly ? '$79/mo' : '$99/mo')}
                                {plan === 'Enterprise' && 'Custom'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Includes 7-day free trial. Cancel anytime.</p>
                        {selectedPlan === plan && <CheckCircle2 size={18} className="absolute top-4 right-4 text-green-500" />}
                    </label>
                ))}
            </div>

            <button
                type="button"
                onClick={handleNextStep}
                className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
            >
                Continue to Payment <ArrowRight size={18} />
            </button>
        </div>
    );

    const renderRegisterStep3 = () => (
        <div className="text-center animate-in fade-in zoom-in-95 duration-500 py-4">
            <button onClick={() => setStep(2)} disabled={scanActive} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1 self-start mr-auto block">
                &larr; Back
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Choose Payment Method</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Scan the QR code with your preferred UPI app to activate subscription.</p>

            <div className="flex justify-center gap-3 mb-8">
                <button type="button" onClick={() => setSelectedPayment('gpay')} className={`flex items-center justify-center w-16 h-12 rounded-xl border-2 transition-all ${selectedPayment === 'gpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-4 object-contain" />
                </button>
                <button type="button" onClick={() => setSelectedPayment('phonepe')} className={`flex items-center justify-center w-16 h-12 rounded-xl border-2 transition-all ${selectedPayment === 'phonepe' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-5 object-contain" />
                </button>
                <button type="button" onClick={() => setSelectedPayment('paytm')} className={`flex items-center justify-center w-16 h-12 rounded-xl border-2 transition-all ${selectedPayment === 'paytm' ? 'border-blue-400 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3 object-contain" />
                </button>
            </div>

            <div 
                className="relative w-56 h-56 mx-auto mb-8 bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex items-center justify-center overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow"
                onClick={!scanActive ? startDummyScan : undefined}
                title="Click to simulate scanning the QR Code"
            >
                {/* QR Code Graphic */}
                <div className={`transition-all duration-1000 flex flex-col items-center justify-center ${scanActive ? 'scale-110 opacity-30 blur-sm' : ''}`}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=DummySubscriptionPayment&bgcolor=ffffff&color=${selectedPayment === 'gpay' ? '1a73e8' : selectedPayment === 'phonepe' ? '5f259f' : '00baf2'}`} alt="QR Code" className="w-40 h-40" />
                    <div className="mt-4 flex items-center gap-1.5">
                        <ShieldCheck size={14} className={selectedPayment === 'gpay' ? 'text-blue-600' : selectedPayment === 'phonepe' ? 'text-purple-600' : 'text-blue-500'} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Secure UPI Payment</span>
                    </div>
                </div>
                
                {/* Scanner line animation */}
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
                    <p className="text-sm font-bold text-green-800">Subscription Activated Successfully!</p>
                    <p className="text-xs text-green-600">Redirecting to setup...</p>
                </div>
            )}

            {paymentStatus === 'failed' && !showUpiModal && (
                <div className="mt-6 flex flex-col items-center gap-3 animate-in fade-in">
                    <p className="text-sm font-bold text-red-500">Payment Failed. Subscription Inactive.</p>
                    <button onClick={startDummyScan} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg">
                        Retry Payment
                    </button>
                </div>
            )}

            {/* UPI Simulator Modal */}
            {showUpiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                        <div className="bg-gray-50 p-6 text-center border-b border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-1">
                                {selectedPayment === 'gpay' ? 'Google Pay' : selectedPayment === 'phonepe' ? 'PhonePe' : 'Paytm'} Simulator
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">Paying {getValues('restaurantName')} Subscription</p>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
                            {paymentStatus === 'idle' && (
                                <>
                                    <div className="text-3xl font-black text-gray-900 mb-6">
                                        {watch('plan') === 'Basic' ? (watch('billingCycle') === 'yearly' ? '$39.00' : '$49.00') : watch('plan') === 'Pro' ? (watch('billingCycle') === 'yearly' ? '$79.00' : '$99.00') : '$199.00'}
                                    </div>
                                    <div className="flex w-full gap-3">
                                        <button onClick={() => handleUpiPayment(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                            Fail
                                        </button>
                                        <button onClick={() => handleUpiPayment(true)} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
                                            Pay Now
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
                    </div>
                </div>
            )}

            {/* Removed the manual completion button to automate activation on QR click */}
        </div>
    );

    const renderRegisterStep4 = () => (
        <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="animate-spin text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your restaurant...</h2>
            <p className="text-gray-500 font-medium">Activating subscription for {getValues('restaurantName')}</p>
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
                    {mode === 'register' && step === 3 && renderRegisterStep3()}
                    {mode === 'register' && step === 4 && renderRegisterStep4()}
                </div>
            </div>
            
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
