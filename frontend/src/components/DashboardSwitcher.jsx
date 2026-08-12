import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Sliders, RefreshCw, ChevronUp, ShieldAlert, Check } from 'lucide-react';

const DashboardSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loadingRole, setLoadingRole] = useState(null);

    const getApiUrl = () => {
        let baseURL = import.meta.env.VITE_API_URL;
        if (baseURL) {
            if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
            if (!baseURL.endsWith('/api')) baseURL += '/api';
            return baseURL;
        }
        return 'http://localhost:5000/api';
    };

    const API_URL = getApiUrl();

    const roles = [
        { name: 'Super Admin', path: '/super-admin', role: 'SuperAdmin', email: 'admin@restauranthub.com', type: 'staff' }
    ];

    const getActiveRole = () => {
        const staff = localStorage.getItem('restosys_staff_user');
        const customer = localStorage.getItem('restosys_customer_user');
        
        const path = window.location.pathname;
        if (path.startsWith('/delivery')) return 'DeliveryPartner';
        if (path.startsWith('/super-admin')) return 'SuperAdmin';
        if (path.startsWith('/admin')) return 'RestaurantAdmin';
        if (path.startsWith('/manager')) return 'BranchManager';
        if (path.startsWith('/chef')) return 'Chef';
        if (path.startsWith('/waiter')) return 'Waiter';
        if (path.startsWith('/cashier')) return 'Cashier';
        if (path.startsWith('/profile') || path.startsWith('/checkout') || path.startsWith('/menu') || path.startsWith('/reservations')) return 'Customer';

        if (staff) {
            try { return JSON.parse(staff).role; } catch (e) {}
        }
        if (customer) return 'Customer';
        return null;
    };

    const currentRole = getActiveRole();

    const switchRole = async (target) => {
        setLoadingRole(target.role);
        const toastId = toast.loading(`Switching to ${target.name}...`);

        try {
            if (target.type === 'delivery') {
                // Try logging in with the primary delivery phone number
                let response;
                try {
                    response = await axios.post(`${API_URL}/delivery/auth/verify-otp`, {
                        phoneNumber: target.phone,
                        otp: '1234'
                    });
                } catch (err) {
                    // Fallback to secondary phone number if Ramesh is registered with 9876543210
                    response = await axios.post(`${API_URL}/delivery/auth/verify-otp`, {
                        phoneNumber: '9876543210',
                        otp: '1234'
                    });
                }

                localStorage.setItem('restosys_staff_user', JSON.stringify(response.data));
                toast.success(`Logged in as Delivery Partner!`, { id: toastId });
                setIsOpen(false);
                setTimeout(() => { window.location.href = target.path; }, 500);
            } else if (target.type === 'customer') {
                const response = await axios.post(`${API_URL}/auth/login`, {
                    email: target.email,
                    password: 'password123',
                    loginType: 'customer'
                });

                localStorage.setItem('restosys_customer_user', JSON.stringify(response.data));
                toast.success(`Logged in as Customer!`, { id: toastId });
                setIsOpen(false);
                setTimeout(() => { window.location.href = target.path; }, 500);
            } else {
                // Staff roles
                const response = await axios.post(`${API_URL}/auth/login`, {
                    email: target.email,
                    password: 'password123',
                    loginType: 'staff'
                });

                localStorage.setItem('restosys_staff_user', JSON.stringify(response.data));
                toast.success(`Logged in as ${target.name}!`, { id: toastId });
                setIsOpen(false);
                setTimeout(() => { window.location.href = target.path; }, 500);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Failed to switch to ${target.name}. Please ensure seeds are loaded.`, { id: toastId });
        } finally {
            setLoadingRole(null);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">
            {/* Popover Switcher Menu */}
            {isOpen && (
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-4 w-64 shadow-[0_15px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-5 duration-200">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2 px-1">
                        <Sliders size={14} className="text-emerald-400" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Switcher</h4>
                    </div>
                    
                    <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                        {roles.map((r) => {
                            const isActive = currentRole === r.role;
                            const isCurrentlyLoading = loadingRole === r.role;
                            return (
                                <button
                                    key={r.role}
                                    disabled={loadingRole !== null}
                                    onClick={() => switchRole(r)}
                                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                        isActive 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' 
                                        : 'text-slate-350 hover:bg-slate-800/60 hover:text-white border border-transparent'
                                    }`}
                                >
                                    <span>{r.name}</span>
                                    {isCurrentlyLoading ? (
                                        <RefreshCw size={12} className="animate-spin text-emerald-400" />
                                    ) : isActive ? (
                                        <Check size={12} className="text-emerald-400 stroke-[3]" />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Toggle Switcher Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${
                    isOpen 
                    ? 'bg-slate-850 border border-slate-700 text-white rotate-180' 
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/10 hover:scale-105'
                }`}
                title="Toggle Dashboard Menu"
            >
                {isOpen ? <ChevronUp size={20} /> : <Sliders size={20} />}
            </button>
        </div>
    );
};

export default DashboardSwitcher;
