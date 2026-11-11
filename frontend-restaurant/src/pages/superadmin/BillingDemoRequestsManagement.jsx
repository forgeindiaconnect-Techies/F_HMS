import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    CalendarCheck, Search, Filter, Phone, Mail, MessageSquare, 
    Trash2, Clock, CheckCircle2, AlertCircle, RefreshCw, Sparkles, 
    Building2, ExternalLink, Sliders, Eye, EyeOff, Check, X, ShieldCheck, 
    Store, Receipt, Utensils, QrCode, Package, Users, BarChart3, 
    Percent, DollarSign, CreditCard, Tag, ArrowRight, FileText, 
    ChevronRight, ChevronDown, CheckSquare, Square, Flame, Zap, Award,
    KeyRound, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const MODULE_DEFINITIONS = [
    { key: 'posBilling', label: 'POS Billing', icon: Receipt, desc: 'High-speed counter punch, invoice generation & print slips', group: 'Core Billing' },
    { key: 'dineInTakeawayOrders', label: 'Dine-in & Takeaway Orders', icon: Store, desc: 'Order status lifecycle, takeaway counters & dispatch', group: 'Core Billing' },
    { key: 'gstInvoice', label: 'GST Invoice & Tax Breakdown', icon: FileText, desc: 'CGST/SGST automated calculation & GSTIN printing', group: 'Core Billing' },
    { key: 'discounts', label: 'Discounts & Promo Vouchers', icon: Tag, desc: 'Item-level & bill-level discounts, promo coupons', group: 'Core Billing' },
    { key: 'tableManagement', label: 'Table & Floor Management', icon: QrCode, desc: 'Visual floor plan, table occupancy & tabletop QR menu', group: 'Operations' },
    { key: 'kitchenOrderManagement', label: 'Kitchen Order Management (KDS)', icon: Flame, desc: 'Chef KDS screens, station routing & cooking timers', group: 'Operations' },
    { key: 'menuManagement', label: 'Menu & Category Management', icon: Utensils, desc: 'Dish items, pricing, variants, add-ons & availability', group: 'Catalog' },
    { key: 'inventoryManagement', label: 'Inventory & Recipe BOM', icon: Package, desc: 'Raw material stock, auto recipe deduction & purchase indents', group: 'Catalog' },
    { key: 'customerManagement', label: 'Customer Management & CRM', icon: Users, desc: 'Guest directory, visit history & loyalty points ledger', group: 'Growth' },
    { key: 'staffManagement', label: 'Staff & Shift Management', icon: Award, desc: 'Waiters, cashiers, chefs, roles & permissions', group: 'Administration' },
    { key: 'salesReports', label: 'Sales Reports & Analytics', icon: BarChart3, desc: 'Daily registers, P&L audit reports & payment analytics', group: 'Administration' },
];

const OUTLET_FORMAT_PRESETS = [
    {
        name: 'Fine Dine & Resto-Bar',
        modules: {
            posBilling: true, menuManagement: true, tableManagement: true,
            dineInTakeawayOrders: true, kitchenOrderManagement: true, gstInvoice: true,
            discounts: true, customerManagement: true, inventoryManagement: true,
            salesReports: true, staffManagement: true
        },
        paymentMethods: { cash: true, upi: true, card: true, split: true },
        serviceChargePercent: 5
    },
    {
        name: 'Quick Service (QSR)',
        modules: {
            posBilling: true, menuManagement: true, tableManagement: false,
            dineInTakeawayOrders: true, kitchenOrderManagement: true, gstInvoice: true,
            discounts: true, customerManagement: true, inventoryManagement: true,
            salesReports: true, staffManagement: true
        },
        paymentMethods: { cash: true, upi: true, card: true, split: false },
        serviceChargePercent: 0
    },
    {
        name: 'Cafe & Bakery',
        modules: {
            posBilling: true, menuManagement: true, tableManagement: true,
            dineInTakeawayOrders: true, kitchenOrderManagement: true, gstInvoice: true,
            discounts: true, customerManagement: true, inventoryManagement: true,
            salesReports: true, staffManagement: true
        },
        paymentMethods: { cash: true, upi: true, card: true, split: true },
        serviceChargePercent: 0
    },
    {
        name: 'Cloud Kitchen',
        modules: {
            posBilling: true, menuManagement: true, tableManagement: false,
            dineInTakeawayOrders: true, kitchenOrderManagement: true, gstInvoice: true,
            discounts: true, customerManagement: true, inventoryManagement: true,
            salesReports: true, staffManagement: false
        },
        paymentMethods: { cash: true, upi: true, card: false, split: false },
        serviceChargePercent: 0
    }
];

const BillingDemoRequestsManagement = ({ defaultTab = 'demos' }) => {
    const { api } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'leads' || defaultTab === 'leads' ? 'leads' : 'demos';
    const [activeSection, setActiveSection] = useState(initialTab);

    const [requests, setRequests] = useState([]);
    const [counts, setCounts] = useState({ total: 0, pending: 0, scheduled: 0, activated: 0 });
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sync section tab with route/prop
    useEffect(() => {
        const paramTab = searchParams.get('tab');
        if (paramTab === 'leads' || defaultTab === 'leads') {
            setActiveSection('leads');
        } else if (paramTab === 'demos') {
            setActiveSection('demos');
        }
    }, [searchParams, defaultTab]);

    const switchSectionTab = (tab) => {
        setActiveSection(tab);
        setSearchParams(tab === 'leads' ? { tab: 'leads' } : {});
    };

    // Inquiry Filters & Delete Modal
    const [inquirySearch, setInquirySearch] = useState('');
    const [inquiryStatusFilter, setInquiryStatusFilter] = useState('ALL');
    const [inquirySubjectFilter, setInquirySubjectFilter] = useState('ALL');
    const [deleteConfirmInquiry, setDeleteConfirmInquiry] = useState(null);
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [outletFilter, setOutletFilter] = useState('ALL');

    // Modals
    const [viewingRequest, setViewingRequest] = useState(null);
    const [configModalRequest, setConfigModalRequest] = useState(null);
    const [previewModalRequest, setPreviewModalRequest] = useState(null);
    const [editingConfig, setEditingConfig] = useState(null);
    const [savingConfig, setSavingConfig] = useState(false);
    const [activatingId, setActivatingId] = useState(null);
    const [activateModalRequest, setActivateModalRequest] = useState(null);
    const [activateEmail, setActivateEmail] = useState('');
    const [activatePassword, setActivatePassword] = useState('');
    const [showActivatePassword, setShowActivatePassword] = useState(false);

    // Credentials modal states
    const [credentialsModalRequest, setCredentialsModalRequest] = useState(null);
    const [credEmail, setCredEmail] = useState('');
    const [credPassword, setCredPassword] = useState('');
    const [showCredPassword, setShowCredPassword] = useState(false);
    const [savingCredentials, setSavingCredentials] = useState(false);

    // Delete confirm modal state
    const [deleteConfirmRequest, setDeleteConfirmRequest] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const [demoRes, inqRes] = await Promise.allSettled([
                api.get('/billing-demos/admin'),
                api.get('/inquiries/admin')
            ]);
            if (demoRes.status === 'fulfilled' && demoRes.value.data) {
                setRequests(demoRes.value.data.data || []);
                setCounts(demoRes.value.data.counts || {});
            } else {
                toast.error('Failed to load demo requests');
            }
            if (inqRes.status === 'fulfilled') {
                setInquiries(Array.isArray(inqRes.value.data) ? inqRes.value.data : []);
            }
        } catch (err) {
            console.error('Failed to load leads & demo requests', err);
            toast.error('Failed to load leads & demo requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (api) {
            fetchRequests();
        }
    }, [api]);

    const handleUpdateInquiryStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'New' ? 'In Progress' : currentStatus === 'In Progress' ? 'Resolved' : 'New';
        try {
            await api.put(`/inquiries/admin/${id}`, { status: nextStatus });
            setInquiries(prev => prev.map(inq =>
                inq._id === id ? { ...inq, status: nextStatus } : inq
            ));
            toast.success(`Lead status updated to ${nextStatus}!`);
        } catch (error) {
            toast.error('Failed to update lead status');
        }
    };

    const handleConfirmDeleteInquiry = async () => {
        if (!deleteConfirmInquiry) return;
        const { id } = deleteConfirmInquiry;
        try {
            await api.delete(`/inquiries/admin/${id}`);
            setInquiries(prev => prev.filter(inq => inq._id !== id));
            toast.success('Walkthrough lead deleted successfully');
        } catch (error) {
            toast.error('Failed to delete walkthrough lead');
        }
    };

    const filteredInquiries = useMemo(() => {
        return inquiries.filter(inq => {
            const q = inquirySearch.toLowerCase();
            const matchesSearch = !q ||
                (inq.name || '').toLowerCase().includes(q) ||
                (inq.restaurantName || '').toLowerCase().includes(q) ||
                (inq.phone || '').toLowerCase().includes(q) ||
                (inq.message || '').toLowerCase().includes(q);
            const matchesStatus = inquiryStatusFilter === 'ALL' || inq.status === inquiryStatusFilter;
            const matchesSubject = inquirySubjectFilter === 'ALL' || inq.subject === inquirySubjectFilter;
            return matchesSearch && matchesStatus && matchesSubject;
        });
    }, [inquiries, inquirySearch, inquiryStatusFilter, inquirySubjectFilter]);

    const inquiryStats = useMemo(() => ({
        total: inquiries.length,
        demoWalkthroughs: inquiries.filter(i => i.subject === 'Demo').length,
        newLeads: inquiries.filter(i => i.status === 'New').length,
        resolved: inquiries.filter(i => i.status === 'Resolved').length
    }), [inquiries]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.put(`/billing-demos/admin/${id}/status`, { status: newStatus });
            setRequests(requests.map(r => r._id === id ? { ...r, status: newStatus } : r));
            toast.success(`Request status updated to "${newStatus}"!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleOpenConfigModal = (request) => {
        setConfigModalRequest(request);
        const currentConfig = request.customBillingConfig || {};
        setEditingConfig({
            modules: {
                posBilling: currentConfig.modules?.posBilling ?? true,
                menuManagement: currentConfig.modules?.menuManagement ?? true,
                tableManagement: currentConfig.modules?.tableManagement ?? true,
                dineInTakeawayOrders: currentConfig.modules?.dineInTakeawayOrders ?? true,
                kitchenOrderManagement: currentConfig.modules?.kitchenOrderManagement ?? true,
                gstInvoice: currentConfig.modules?.gstInvoice ?? true,
                discounts: currentConfig.modules?.discounts ?? true,
                customerManagement: currentConfig.modules?.customerManagement ?? true,
                inventoryManagement: currentConfig.modules?.inventoryManagement ?? true,
                salesReports: currentConfig.modules?.salesReports ?? true,
                staffManagement: currentConfig.modules?.staffManagement ?? true,
            },
            paymentMethods: {
                cash: currentConfig.paymentMethods?.cash ?? true,
                upi: currentConfig.paymentMethods?.upi ?? true,
                card: currentConfig.paymentMethods?.card ?? true,
                split: currentConfig.paymentMethods?.split ?? true,
            },
            serviceChargePercent: currentConfig.serviceChargePercent ?? 5,
            gstRatePercent: currentConfig.gstRatePercent ?? 5,
            notes: request.notes || ''
        });
    };

    const handleToggleModule = (key) => {
        setEditingConfig(prev => ({
            ...prev,
            modules: {
                ...prev.modules,
                [key]: !prev.modules[key]
            }
        }));
    };

    const handleTogglePayment = (key) => {
        setEditingConfig(prev => ({
            ...prev,
            paymentMethods: {
                ...prev.paymentMethods,
                [key]: !prev.paymentMethods[key]
            }
        }));
    };

    const handleApplyPreset = (preset) => {
        setEditingConfig(prev => ({
            ...prev,
            modules: { ...preset.modules },
            paymentMethods: { ...preset.paymentMethods },
            serviceChargePercent: preset.serviceChargePercent
        }));
        toast.success(`Applied ${preset.name} preset`);
    };

    const handleSaveConfig = async () => {
        if (!configModalRequest) return;
        setSavingConfig(true);
        try {
            const res = await api.put(`/billing-demos/admin/${configModalRequest._id}/config`, editingConfig);
            setRequests(requests.map(r => r._id === configModalRequest._id ? res.data.data : r));
            toast.success('Custom billing configuration saved successfully!');
            setConfigModalRequest(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSavingConfig(false);
        }
    };

    const buildDefaultOwnerEmail = (reqItem) => {
        if (reqItem?.ownerCredentials?.email) return reqItem.ownerCredentials.email;
        if (reqItem?.restaurantId?.contactEmail) return reqItem.restaurantId.contactEmail;
        const cleanDigits = (reqItem?.phoneNumber || '').replace(/\D/g, '') || '9876543210';
        const slug = (reqItem?.restaurantName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'store';
        return `${slug}_${cleanDigits.slice(-4)}@restosys.com`;
    };

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
        let out = '';
        for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    };

    const handleActivateConfiguration = (request) => {
        setActivateModalRequest(request);
        setActivateEmail(buildDefaultOwnerEmail(request));
        setActivatePassword('');
        setShowActivatePassword(false);
    };

    const handleConfirmActivation = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!activateModalRequest) return;
        const target = activateModalRequest;
        if (activatePassword && activatePassword.trim().length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }
        setActivatingId(target._id);
        try {
            const payload = {};
            if (activateEmail && activateEmail.trim()) payload.ownerEmail = activateEmail.trim();
            if (activatePassword && activatePassword.trim()) payload.ownerPassword = activatePassword.trim();
            const res = await api.post(`/billing-demos/admin/${target._id}/activate`, payload);
            const updatedReq = res.data?.data?.request;
            const ownerCreds = res.data?.data?.ownerCredentials || updatedReq?.ownerCredentials || null;
            setRequests(requests.map(r => r._id === target._id ? {
                ...r,
                status: 'Activated',
                activatedAt: new Date(),
                restaurantId: res.data?.data?.restaurant || r.restaurantId,
                ownerCredentials: ownerCreds
            } : r));
            toast.success(res.data.message || `Custom billing activated for ${target.restaurantName}!`);
            setActivateModalRequest(null);
            if (configModalRequest?._id === target._id) setConfigModalRequest(null);
            if (previewModalRequest?._id === target._id) setPreviewModalRequest(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to activate custom billing');
        } finally {
            setActivatingId(null);
        }
    };

    const handleOpenCredentialsModal = (request) => {
        setCredentialsModalRequest(request);
        setCredEmail(buildDefaultOwnerEmail(request));
        setCredPassword('');
        setShowCredPassword(false);
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();
        if (!credentialsModalRequest) return;
        if (!credEmail.trim()) {
            toast.error('Please enter the owner login email.');
            return;
        }
        if (credPassword && credPassword.trim().length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        setSavingCredentials(true);
        try {
            const res = await api.put(`/billing-demos/admin/${credentialsModalRequest._id}/credentials`, {
                email: credEmail.trim(),
                ...(credPassword.trim() ? { password: credPassword.trim() } : {})
            });
            setRequests(requests.map(r => r._id === credentialsModalRequest._id ? {
                ...r,
                restaurantId: res.data?.restaurantId || r.restaurantId,
                ownerCredentials: res.data?.ownerCredentials || { email: credEmail.trim() }
            } : r));
            toast.success(res.data?.message || 'Customer login credentials saved!');
            setCredentialsModalRequest(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save customer credentials.');
        } finally {
            setSavingCredentials(false);
        }
    };

    const handleDeleteRequest = (id, name) => {
        setDeleteConfirmRequest({ id, name });
    };

    const handleConfirmDeleteRequest = async () => {
        if (!deleteConfirmRequest) return;
        const { id } = deleteConfirmRequest;
        try {
            await api.delete(`/billing-demos/admin/${id}`);
            setRequests(requests.filter(r => r._id !== id));
            toast.success('Demo request deleted');
        } catch (error) {
            toast.error('Failed to delete request');
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = 
                !query ||
                (req.fullName || '').toLowerCase().includes(query) ||
                (req.phoneNumber || '').toLowerCase().includes(query) ||
                (req.restaurantName || '').toLowerCase().includes(query) ||
                (req.city || '').toLowerCase().includes(query) ||
                (req.notes || '').toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
            const matchesOutlet = outletFilter === 'ALL' || req.outletFormat === outletFilter;

            return matchesSearch && matchesStatus && matchesOutlet;
        });
    }, [requests, searchQuery, statusFilter, outletFilter]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Activated':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700';
            case 'Demo Completed':
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700';
            case 'Demo Scheduled':
                return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700';
            case 'Contacted':
                return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-700';
            case 'Rejected':
                return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700';
            default: // Pending
                return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 animate-pulse';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
            {/* Header with Title, Section Switcher, and Refresh */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800">
                            <Sparkles size={13} />
                            <span>Walkthrough &amp; Custom Onboarding Hub</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Leads, Walkthroughs &amp; Billing Demos
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Manage outlet format billing demo requests, customize POS modules &amp; credentials, and handle general walkthrough leads in one place.
                        </p>
                    </div>

                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="self-start md:self-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-rose-500' : ''} />
                        <span>Refresh All</span>
                    </button>
                </div>

                {/* Merged Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => switchSectionTab('demos')}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                            activeSection === 'demos'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Receipt size={15} />
                        <span>Outlet Format &amp; Billing Demos</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeSection === 'demos' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                        }`}>
                            {requests.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => switchSectionTab('leads')}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                            activeSection === 'leads'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <CalendarCheck size={15} />
                        <span>General Walkthrough Leads</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeSection === 'leads' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300'
                        }`}>
                            {inquiries.length}
                        </span>
                    </button>
                </div>
            </div>

            {activeSection === 'demos' && (
            <>
            {/* Quick Status KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Bookings</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">{counts.total || requests.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider block">Pending Review</span>
                    <span className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1 block">{counts.pending || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider block">Demo Scheduled</span>
                    <span className="text-2xl font-black text-purple-800 dark:text-purple-300 mt-1 block">{counts.scheduled || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider block">Demo Completed</span>
                    <span className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1 block">{counts.completed || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider block">Activated POS</span>
                    <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1 block">{counts.activated || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 tracking-wider block">Rejected / Inactive</span>
                    <span className="text-2xl font-black text-rose-800 dark:text-rose-300 mt-1 block">{counts.rejected || 0}</span>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search restaurant, name, phone, city..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <Filter size={14} />
                        <span>Status:</span>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none"
                    >
                        <option value="ALL">All Statuses ({requests.length})</option>
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Demo Scheduled">Demo Scheduled</option>
                        <option value="Demo Completed">Demo Completed</option>
                        <option value="Activated">Activated</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    <select
                        value={outletFilter}
                        onChange={(e) => setOutletFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200 focus:outline-none"
                    >
                        <option value="ALL">All Outlets</option>
                        <option value="Fine Dine & Resto-Bar">Fine Dine &amp; Resto-Bar</option>
                        <option value="Quick Service (QSR)">Quick Service (QSR)</option>
                        <option value="Cafe & Bakery">Cafe &amp; Bakery</option>
                        <option value="Cloud Kitchen">Cloud Kitchen</option>
                        <option value="Pub & Brewery">Pub &amp; Brewery</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                        <p className="text-xs text-gray-400 font-medium">Loading billing demo walkthrough requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mx-auto">
                            <Receipt size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">No demo requests found</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                            {searchQuery || statusFilter !== 'ALL' || outletFilter !== 'ALL'
                                ? 'No requests match your current search and filters. Try clearing them.'
                                : 'Walkthrough demo bookings submitted from the landing page form will appear here automatically.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-gray-400">
                                    <th className="py-4 px-5">Restaurant &amp; Region</th>
                                    <th className="py-4 px-5">Contact Details</th>
                                    <th className="py-4 px-4">Outlet Format</th>
                                    <th className="py-4 px-4">Request Status</th>
                                    <th className="py-4 px-4">Submission Date</th>
                                    <th className="py-4 px-5 text-right">Actions &amp; Billing Setup</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                                {filteredRequests.map((req) => {
                                    const isActivated = req.status === 'Activated';
                                    const activeModuleCount = Object.values(req.customBillingConfig?.modules || {}).filter(Boolean).length;
                                    
                                    return (
                                        <tr key={req._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Restaurant Name & City */}
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {req.restaurantName}
                                                </div>
                                                <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Building2 size={11} />
                                                    <span>{req.city || 'Location N/A'}</span>
                                                </div>
                                                {req.restaurantId && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md mt-1">
                                                        <ShieldCheck size={10} /> Linked Store
                                                    </span>
                                                )}
                                                {req.ownerCredentials?.email && (
                                                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 truncate max-w-[180px]" title={req.ownerCredentials.email}>
                                                        Login: {req.ownerCredentials.email}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Contact Details */}
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-gray-800 dark:text-slate-200">
                                                    {req.fullName}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <a 
                                                        href={`tel:${req.phoneNumber}`}
                                                        className="text-[11px] text-gray-500 hover:text-blue-600 font-mono flex items-center gap-1"
                                                    >
                                                        <Phone size={10} />
                                                        <span>{req.phoneNumber}</span>
                                                    </a>
                                                    <a 
                                                        href={`https://wa.me/${req.phoneNumber.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(req.fullName)},%20reaching%20out%20from%20FoodNest%20regarding%20your%20walkthrough%20for%20${encodeURIComponent(req.restaurantName)}.`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-emerald-600 hover:underline inline-flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded"
                                                        title="Message on WhatsApp"
                                                    >
                                                        WhatsApp
                                                    </a>
                                                </div>
                                            </td>

                                            {/* Outlet Format */}
                                            <td className="py-4 px-4">
                                                <span className="font-semibold text-gray-700 dark:text-slate-300 block">
                                                    {req.outletFormat || 'Dine-In Restaurant'}
                                                </span>
                                                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                                                    {activeModuleCount} modules configured
                                                </span>
                                            </td>

                                            {/* Status Badge & Quick Change */}
                                            <td className="py-4 px-4">
                                                <select
                                                    value={req.status}
                                                    onChange={(e) => handleUpdateStatus(req._id, e.target.value)}
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase border tracking-wider focus:outline-none cursor-pointer ${getStatusStyle(req.status)}`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Contacted">Contacted</option>
                                                    <option value="Demo Scheduled">Demo Scheduled</option>
                                                    <option value="Demo Completed">Demo Completed</option>
                                                    <option value="Activated">Activated</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </td>

                                            {/* Submission Date */}
                                            <td className="py-4 px-4 text-gray-400 text-[11px] font-mono">
                                                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                <span className="block text-[10px]">
                                                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Details */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRequest(req)}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                                                        title="View Complete Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Configure Modules */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenConfigModal(req)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                                        title="Configure Billing Features"
                                                    >
                                                        <Sliders size={13} className="text-rose-500" />
                                                        <span>Configure</span>
                                                    </button>

                                                    {/* Manage Login Credentials */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenCredentialsModal(req)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                                        title="Set or Update Customer Login Credentials"
                                                    >
                                                        <KeyRound size={12} />
                                                        <span>Credentials</span>
                                                    </button>

                                                    {/* Preview Dashboard */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewModalRequest(req)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                                        title="Preview Restaurant Custom Dashboard"
                                                    >
                                                        <span>Preview</span>
                                                    </button>

                                                    {/* Activate Button */}
                                                    {!isActivated ? (
                                                        <button
                                                            type="button"
                                                            disabled={activatingId === req._id}
                                                            onClick={() => handleActivateConfiguration(req)}
                                                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-70"
                                                            title="Activate Approved Configuration"
                                                        >
                                                            {activatingId === req._id ? (
                                                                <RefreshCw size={12} className="animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 size={13} />
                                                            )}
                                                            <span>Activate</span>
                                                        </button>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                                            <CheckCircle2 size={11} /> Live
                                                        </span>
                                                    )}

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRequest(req._id, req.restaurantName)}
                                                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                                                        title="Delete Lead"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </>
            )}

            {activeSection === 'leads' && (
                <div className="space-y-6">
                    {/* Quick KPI Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leads</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{inquiryStats.total}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm bg-purple-50/20">
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={13} /> Walkthrough Demos
                            </p>
                            <h3 className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">{inquiryStats.demoWalkthroughs}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm bg-blue-50/20">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={13} /> New / Pending Action
                            </p>
                            <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{inquiryStats.newLeads}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm bg-green-50/20">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 size={13} /> Resolved / Contacted
                            </p>
                            <h3 className="text-2xl font-black text-green-700 dark:text-green-400 mt-1">{inquiryStats.resolved}</h3>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="relative w-full md:w-96">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by restaurant, name, phone, or message..."
                                value={inquirySearch}
                                onChange={(e) => setInquirySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={inquiryStatusFilter}
                                onChange={(e) => setInquiryStatusFilter(e.target.value)}
                                className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="New">Status: New</option>
                                <option value="In Progress">Status: In Progress</option>
                                <option value="Resolved">Status: Resolved</option>
                            </select>

                            <select
                                value={inquirySubjectFilter}
                                onChange={(e) => setInquirySubjectFilter(e.target.value)}
                                className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">All Types</option>
                                <option value="Demo">Demo / Walkthrough</option>
                                <option value="Sales">Sales</option>
                                <option value="Support">Support</option>
                            </select>
                        </div>
                    </div>

                    {/* General Walkthrough Leads Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-[11px] text-gray-400 uppercase tracking-wider font-bold">
                                        <th className="p-5">Lead / Contact Info</th>
                                        <th className="p-5">Restaurant &amp; Outlet</th>
                                        <th className="p-5">Request Type</th>
                                        <th className="p-5">Walkthrough Details</th>
                                        <th className="p-5">Date Received</th>
                                        <th className="p-5">Status</th>
                                        <th className="p-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {filteredInquiries.map((inq) => {
                                        const cleanPhone = (inq.phone || '').replace(/\D/g, '');
                                        return (
                                            <tr key={inq._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors text-sm">
                                                <td className="p-5">
                                                    <div>
                                                        <span className="font-bold text-gray-900 dark:text-white block text-sm">
                                                            {inq.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <a
                                                                href={`tel:${inq.phone}`}
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md"
                                                            >
                                                                <Phone size={11} /> {inq.phone}
                                                            </a>
                                                            {cleanPhone && (
                                                                <a
                                                                    href={`https://wa.me/${cleanPhone}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md"
                                                                >
                                                                    WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={16} className="text-gray-400 shrink-0" />
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                                            {inq.restaurantName || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${
                                                        inq.subject === 'Demo'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                                                            : inq.subject === 'Sales'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300'
                                                    }`}>
                                                        {inq.subject === 'Demo' && <Sparkles size={12} />}
                                                        {inq.subject || 'Demo'}
                                                    </span>
                                                </td>
                                                <td className="p-5 max-w-sm">
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                                        {inq.message}
                                                    </p>
                                                </td>
                                                <td className="p-5 whitespace-nowrap text-xs text-gray-500 font-medium">
                                                    {inq.createdAt ? new Date(inq.createdAt).toLocaleString('en-IN', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'Recently'}
                                                </td>
                                                <td className="p-5 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                                                        inq.status === 'Resolved'
                                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300'
                                                            : inq.status === 'In Progress'
                                                            ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                        {inq.status || 'New'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateInquiryStatus(inq._id, inq.status)}
                                                            className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                        >
                                                            {inq.status === 'New' ? 'Mark In Progress' : inq.status === 'In Progress' ? 'Mark Resolved' : 'Reopen'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirmInquiry({ id: inq._id, name: inq.name })}
                                                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                            title="Delete Lead"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredInquiries.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center">
                                                <MessageSquare className="mx-auto text-gray-300 dark:text-slate-700 mb-3" size={40} />
                                                <p className="text-gray-500 font-bold text-base">No general leads or walkthrough requests found</p>
                                                <p className="text-xs text-gray-400 mt-1">Inbound inquiries submitted from marketing pages will appear here.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: VIEW DETAILS MODAL */}
            {/* ========================================================================= */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                    <Store size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-gray-900 dark:text-white">{viewingRequest.restaurantName}</h3>
                                    <p className="text-xs text-gray-400">Walkthrough Demo Lead Details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Contact Person</span>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{viewingRequest.fullName}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Mobile Phone</span>
                                <p className="font-bold text-gray-900 dark:text-white text-sm font-mono">{viewingRequest.phoneNumber}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400">City / Region</span>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{viewingRequest.city || 'N/A'}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Outlet Format</span>
                                <p className="font-bold text-rose-600 text-sm">{viewingRequest.outletFormat}</p>
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Internal Specialist Notes:</label>
                            <textarea
                                value={viewingRequest.notes || ''}
                                onChange={(e) => setViewingRequest({ ...viewingRequest, notes: e.target.value })}
                                placeholder="Add follow-up notes, requested hardware, special kitchen requirements..."
                                rows={3}
                                className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-rose-500"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    handleOpenConfigModal(viewingRequest);
                                    setViewingRequest(null);
                                }}
                                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                            >
                                <Sliders size={14} />
                                <span>Open Module Configurator</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(viewingRequest._id, viewingRequest.status)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold text-xs"
                                >
                                    Save Notes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingRequest(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: CUSTOM BILLING CONFIGURATION MODAL */}
            {/* ========================================================================= */}
            {configModalRequest && editingConfig && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-600 tracking-wider">
                                    <Sliders size={12} />
                                    <span>Super Admin Customizer</span>
                                </div>
                                <h3 className="font-black text-xl text-gray-900 dark:text-white mt-1">
                                    Configure Custom Billing for &quot;{configModalRequest.restaurantName}&quot;
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Format: <strong className="text-gray-700 dark:text-slate-300">{configModalRequest.outletFormat}</strong> • Select which modules and features this restaurant will see upon activation.
                                </p>
                            </div>
                            <button
                                onClick={() => setConfigModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Format Presets 1-Click Bar */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                                Quick Preset Fill (Matches Walkthrough Form):
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {OUTLET_FORMAT_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200 transition cursor-pointer"
                                    >
                                        + {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 11 Available Modules Grid */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-slate-300">
                                    Operational Modules (Enable / Disable):
                                </span>
                                <span className="text-xs text-rose-600 font-bold">
                                    {Object.values(editingConfig.modules).filter(Boolean).length} of {MODULE_DEFINITIONS.length} active
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                {MODULE_DEFINITIONS.map((mod) => {
                                    const isEnabled = editingConfig.modules[mod.key] === true;
                                    const IconComponent = mod.icon;
                                    return (
                                        <div
                                            key={mod.key}
                                            onClick={() => handleToggleModule(mod.key)}
                                            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                                                isEnabled
                                                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700 shadow-xs'
                                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                isEnabled ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                <IconComponent size={15} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-bold text-xs text-gray-900 dark:text-white truncate">{mod.label}</h5>
                                                    <input
                                                        type="checkbox"
                                                        checked={isEnabled}
                                                        onChange={() => {}} // Controlled via parent div click
                                                        className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 pointer-events-none"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{mod.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Supported Payment Methods */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-slate-300 block">
                                Permitted Payment Methods at Billing Terminal:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { key: 'cash', label: 'Cash Tender' },
                                    { key: 'upi', label: 'UPI QR Codes' },
                                    { key: 'card', label: 'Card (EDC/POS)' },
                                    { key: 'split', label: 'Split Payments' }
                                ].map((pm) => (
                                    <label
                                        key={pm.key}
                                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-slate-200 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={editingConfig.paymentMethods[pm.key]}
                                            onChange={() => handleTogglePayment(pm.key)}
                                            className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                                        />
                                        <span>{pm.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Service Charge & GST Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block mb-1">
                                    Default Service Charge (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={editingConfig.serviceChargePercent}
                                    onChange={(e) => setEditingConfig({ ...editingConfig, serviceChargePercent: Number(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block mb-1">
                                    GST Tax Rate (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="28"
                                    value={editingConfig.gstRatePercent}
                                    onChange={(e) => setEditingConfig({ ...editingConfig, gstRatePercent: Number(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold"
                                />
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewModalRequest({
                                        ...configModalRequest,
                                        customBillingConfig: editingConfig
                                    });
                                }}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-100"
                            >
                                <Eye size={14} />
                                <span>Preview Customized Dashboard</span>
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setConfigModalRequest(null)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={savingConfig}
                                    onClick={handleSaveConfig}
                                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-70 cursor-pointer"
                                >
                                    {savingConfig && <RefreshCw size={12} className="animate-spin" />}
                                    <span>Save Configuration</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={activatingId === configModalRequest._id}
                                    onClick={() => handleActivateConfiguration(configModalRequest)}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-70"
                                >
                                    {activatingId === configModalRequest._id ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={13} />
                                    )}
                                    <span>Activate Now</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: LIVE DASHBOARD PREVIEW MODAL */}
            {/* ========================================================================= */}
            {previewModalRequest && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
                        {/* Preview Top Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200">
                                    Simulated Restaurant Owner View
                                </span>
                                <h3 className="font-black text-xl text-gray-900 dark:text-white mt-1">
                                    Previewing Customized Billing Dashboard: &quot;{previewModalRequest.restaurantName}&quot;
                                </h3>
                                <p className="text-xs text-gray-400">
                                    This is how the restaurant owner and staff will see their dashboard based on your enabled modules.
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewModalRequest(null)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Mock Dashboard Layout Preview */}
                        <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 border border-slate-800 text-white space-y-5">
                            {/* Mock Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-sm">
                                        RS
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{previewModalRequest.restaurantName}</h4>
                                        <span className="text-[10px] text-emerald-400 font-mono">Custom Billing Active • {previewModalRequest.outletFormat}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                                        Role: RestaurantAdmin
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Left: Filtered Sidebar Navigation Preview */}
                                <div className="md:col-span-1 bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                                        Visible Navigation Menu:
                                    </span>

                                    <div className="space-y-1 text-xs">
                                        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-2">
                                            <Building2 size={13} />
                                            <span>Overview</span>
                                        </div>

                                        {MODULE_DEFINITIONS.map(m => {
                                            const isEnabled = previewModalRequest.customBillingConfig?.modules?.[m.key] !== false;
                                            const IconComp = m.icon;
                                            return isEnabled ? (
                                                <div key={m.key} className="px-2.5 py-1.5 rounded-lg text-slate-300 font-medium flex items-center justify-between hover:bg-slate-800">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <IconComp size={12} className="text-rose-400 shrink-0" />
                                                        <span className="truncate">{m.label}</span>
                                                    </div>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>

                                    {/* Disabled / Hidden Modules Pill */}
                                    <div className="pt-2 border-t border-slate-800">
                                        <span className="text-[9px] text-slate-500 font-bold block mb-1">
                                            Hidden by Super Admin:
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {MODULE_DEFINITIONS.filter(m => previewModalRequest.customBillingConfig?.modules?.[m.key] === false).map(m => (
                                                <span key={m.key} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 line-through">
                                                    {m.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Sample Active Screen Preview */}
                                <div className="md:col-span-3 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                        <div>
                                            <h5 className="font-bold text-sm text-white">Live Billing Console Preview</h5>
                                            <p className="text-[11px] text-slate-400">Punches orders with real-time tax &amp; payment splits</p>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg">
                                            GST: {previewModalRequest.customBillingConfig?.gstRatePercent ?? 5}% | SC: {previewModalRequest.customBillingConfig?.serviceChargePercent ?? 5}%
                                        </span>
                                    </div>

                                    {/* Sample Order Row */}
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-white block">Table #04 • 3 Guests (Dine-In)</span>
                                            <span className="text-[10px] text-slate-400">Order #RST-1049 • Server: Rajesh</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-sm text-rose-400 block">₹1,450.00</span>
                                            <span className="text-[10px] text-emerald-400 font-bold">KOT Dispatched to KDS</span>
                                        </div>
                                    </div>

                                    {/* Payment Options Preview */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 block">Enabled Tender Modes:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {previewModalRequest.customBillingConfig?.paymentMethods?.cash && (
                                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
                                                    ✓ Cash Drawer
                                                </span>
                                            )}
                                            {previewModalRequest.customBillingConfig?.paymentMethods?.upi && (
                                                <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-bold">
                                                    ✓ Dynamic UPI QR
                                                </span>
                                            )}
                                            {previewModalRequest.customBillingConfig?.paymentMethods?.card && (
                                                <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-300 text-xs font-bold">
                                                    ✓ Card EDC
                                                </span>
                                            )}
                                            {previewModalRequest.customBillingConfig?.paymentMethods?.split && (
                                                <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-bold">
                                                    ✓ Split Payment
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    handleOpenConfigModal(previewModalRequest);
                                    setPreviewModalRequest(null);
                                }}
                                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                            >
                                <Sliders size={13} />
                                <span>Adjust Modules in Configurator</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewModalRequest(null)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs"
                                >
                                    Close Preview
                                </button>
                                {previewModalRequest.status !== 'Activated' && (
                                    <button
                                        type="button"
                                        disabled={activatingId === previewModalRequest._id}
                                        onClick={() => handleActivateConfiguration(previewModalRequest)}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm"
                                    >
                                        <CheckCircle2 size={13} />
                                        <span>Looks Great! Activate Configuration</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: ACTIVATE CUSTOM BILLING & SET CREDENTIALS */}
            {/* ========================================================================= */}
            {activateModalRequest && (
                <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleConfirmActivation} className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                                    <CheckCircle2 size={12} />
                                    <span>Activate Custom Dashboard</span>
                                </div>
                                <h3 className="font-black text-lg text-gray-900 dark:text-white mt-0.5">
                                    Activate &quot;{activateModalRequest.restaurantName}&quot;
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Enable their customized modules and optionally assign owner login credentials now.
                                </p>
                            </div>
                            <button type="button" onClick={() => setActivateModalRequest(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block mb-1">
                                    Owner Login Email
                                </label>
                                <input
                                    type="email"
                                    value={activateEmail}
                                    onChange={(e) => setActivateEmail(e.target.value)}
                                    placeholder="owner@restaurant.com"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300">
                                        Set Initial Password <span className="text-gray-400 font-normal">(min 6 chars)</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActivatePassword(generateRandomPassword());
                                            setShowActivatePassword(true);
                                        }}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        Generate Password
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showActivatePassword ? 'text' : 'password'}
                                        value={activatePassword}
                                        onChange={(e) => setActivatePassword(e.target.value)}
                                        placeholder="Enter password (optional if keeping existing)"
                                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowActivatePassword(v => !v)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showActivatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setActivateModalRequest(null)}
                                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={activatingId === activateModalRequest._id}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                            >
                                {activatingId === activateModalRequest._id ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                <span>Activate Now</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 5: CUSTOMER LOGIN CREDENTIALS MODAL */}
            {/* ========================================================================= */}
            {credentialsModalRequest && (
                <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleSaveCredentials} className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 tracking-wider">
                                    <KeyRound size={12} />
                                    <span>Customer Portal Login</span>
                                </div>
                                <h3 className="font-black text-lg text-gray-900 dark:text-white mt-0.5">
                                    Credentials for &quot;{credentialsModalRequest.restaurantName}&quot;
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Set or update the email and password this customer uses to sign into the Restaurant Portal.
                                </p>
                            </div>
                            <button type="button" onClick={() => setCredentialsModalRequest(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 block mb-1">
                                    Owner Login Email
                                </label>
                                <input
                                    type="email"
                                    value={credEmail}
                                    onChange={(e) => setCredEmail(e.target.value)}
                                    placeholder="owner@restaurant.com"
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300">
                                        New Password <span className="text-gray-400 font-normal">(min 6 chars)</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCredPassword(generateRandomPassword());
                                            setShowCredPassword(true);
                                        }}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        Generate Password
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showCredPassword ? 'text' : 'password'}
                                        value={credPassword}
                                        onChange={(e) => setCredPassword(e.target.value)}
                                        placeholder={credentialsModalRequest.ownerCredentials ? 'Enter new password to reset (leave blank to keep current)' : 'Enter password (required, min 6 chars)'}
                                        required={!credentialsModalRequest.ownerCredentials}
                                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCredPassword(v => !v)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showCredPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            {(credEmail || credPassword) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const text = `Portal Login: https://f-hms-restaurant.vercel.app/staff/login\nEmail: ${credEmail}${credPassword ? `\nPassword: ${credPassword}` : ''}`;
                                        navigator.clipboard?.writeText(text);
                                        toast.success('Login details copied to clipboard!');
                                    }}
                                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Copy size={12} /> Copy Login Details for Customer
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setCredentialsModalRequest(null)}
                                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingCredentials}
                                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                            >
                                {savingCredentials ? <RefreshCw size={13} className="animate-spin" /> : <KeyRound size={13} />}
                                <span>Save Credentials</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(deleteConfirmRequest)}
                onClose={() => setDeleteConfirmRequest(null)}
                onConfirm={handleConfirmDeleteRequest}
                title="Delete Demo Request"
                message={`Are you sure you want to permanently delete the billing demo request for "${deleteConfirmRequest?.name}"?`}
                confirmText="Delete Request"
                isDestructive={true}
            />

            <ConfirmModal
                isOpen={Boolean(deleteConfirmInquiry)}
                onClose={() => setDeleteConfirmInquiry(null)}
                onConfirm={handleConfirmDeleteInquiry}
                title="Delete Walkthrough Lead"
                message={`Are you sure you want to delete lead from "${deleteConfirmInquiry?.name}"?`}
                confirmText="Delete Lead"
                isDestructive={true}
            />
        </div>
    );
};

export default BillingDemoRequestsManagement;
