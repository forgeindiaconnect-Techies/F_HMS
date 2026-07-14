import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UtensilsCrossed, ArrowRight, Mail, Lock, User as UserIcon, Tag, AlertCircle } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const CustomerAuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    
    // Determine initial mode from path or URL params
    const initialMode = location.pathname.includes('register') ? 'register' : 'login';
    const [mode, setMode] = useState(initialMode); // 'login' | 'register'
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    
    const { login, register: registerUser } = useCustomerAuth();

    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setAuthError('');
        
        let result;
        if (mode === 'login') {
            result = await login(data.email, data.password);
        } else {
            result = await registerUser(data.name, data.email, data.password, 'Customer');
        }
        
        setLoading(false);

        if (result.success) {
            navigate('/profile');
        } else {
            setAuthError(result.message);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        reset();
        setShowPassword(false);
        setShowConfirm(false);
        setAuthError('');
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans bg-gray-900">
            {/* Full screen background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
                    alt="Restaurant ambiance"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[8px]"></div>
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
                
                {/* Branding Header */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-900/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>
                    
                    <Link to="/" className="inline-flex items-center gap-2 mb-2 relative z-10">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <UtensilsCrossed size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>RestoSys</span>
                    </Link>
                    <p className="text-orange-50 text-sm font-medium relative z-10 opacity-90">
                        {mode === 'login' ? 'Sign in to order your favorite food' : 'Create an account to get started'}
                    </p>
                </div>

                {/* Main Content */}
                <div className="p-8">
                    {/* Tabs */}
                    <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mb-8 relative">
                        <div 
                            className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${mode === 'login' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
                        ></div>
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className={`flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors ${mode === 'login' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('register')}
                            className={`flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors ${mode === 'register' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Register
                        </button>
                    </div>

                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-red-800">{authError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name - Register only */}
                        {mode === 'register' && (
                            <div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                        <UserIcon size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        {...register('name', { required: 'Name is required' })}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.name ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100'}`}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.name.message}</p>}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Email Address"
                                    {...register('email', { required: 'Email is required' })}
                                    className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100'}`}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email.message}</p>}
                        </div>

                        {/* Role selector removed for customers */}

                        {/* Password */}
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    {...register('password', { required: 'Password is required' })}
                                    className={`w-full pl-11 pr-11 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password - Register only */}
                        {mode === 'register' && (
                            <div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Confirm Password"
                                        {...register('confirmPassword', { 
                                            required: 'Please confirm password',
                                            validate: val => val === watch('password') || 'Passwords do not match'
                                        })}
                                        className={`w-full pl-11 pr-11 py-3.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${errors.confirmPassword ? 'border-red-400 focus:ring-4 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-600 transition-colors"
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.confirmPassword.message}</p>}
                            </div>
                        )}

                        {/* Extras for Login */}
                        {mode === 'login' && (
                            <div className="flex items-center justify-between pt-1 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" className="peer w-4 h-4 border-2 border-gray-300 rounded appearance-none checked:bg-orange-500 checked:border-orange-500 transition-colors cursor-pointer" />
                                        <svg className="absolute w-3 h-3 text-white left-0.5 pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                                </label>
                                <Link to="#" className="text-sm font-bold text-orange-600 hover:text-orange-500 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 relative overflow-hidden bg-gray-900 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] group"
                            style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                            <div className="absolute inset-0 w-0 bg-orange-500 transition-all duration-300 ease-out group-hover:w-full opacity-100"></div>
                            <span className="relative flex items-center justify-center gap-2 text-base">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Please wait...
                                    </>
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerAuthPage;
