import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, Lock, ArrowRight, Truck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DeliveryPartnerLogin = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('phone'); // phone, otp
    const [loading, setLoading] = useState(false);

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

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!phoneNumber) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/delivery/auth/send-otp`, { phoneNumber });
            toast.success(res.data.message);
            setStep('otp');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP. Is your mobile registered?');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/delivery/auth/verify-otp`, { phoneNumber, otp });
            toast.success('Logged in successfully!');
            
            const userData = {
                _id: res.data._id,
                name: res.data.name,
                email: res.data.email,
                phoneNumber: res.data.phoneNumber,
                role: res.data.role,
                restaurantId: res.data.restaurantId,
                token: res.data.token
            };

            // Save in localStorage as standard staff user context!
            localStorage.setItem('restosys_staff_user', JSON.stringify(userData));
            
            // Update AuthContext state instantly
            setUser(userData);

            // Redirect to Delivery Partner Dashboard!
            navigate('/delivery/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-white font-sans">
            <div className="w-full max-w-sm space-y-8 bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700/60 shadow-2xl relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                        <Truck size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-wide">RestoSys Dispatch</h2>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Delivery Partner Login Portal</p>
                    </div>
                </div>

                {/* STEP 1: Phone input */}
                {step === 'phone' && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-extrabold">+91</span>
                                <input 
                                    type="text"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter registered mobile number"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Requesting OTP...' : 'Send OTP'} <ArrowRight size={16} />
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP input */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2 text-center">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Code</label>
                            <p className="text-xs text-slate-400">Enter the 4-digit code sent to +91 {phoneNumber}</p>
                            <input 
                                type="text"
                                required
                                maxLength="4"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="1234"
                                className="w-32 mx-auto text-center tracking-[1em] text-lg font-black py-3.5 bg-slate-700/50 border border-slate-600 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-emerald-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify & Log In'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('phone')}
                            className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            Change Phone Number
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DeliveryPartnerLogin;
