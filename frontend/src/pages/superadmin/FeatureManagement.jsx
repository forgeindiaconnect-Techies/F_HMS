import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, AlertCircle, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

const SaaS_FEATURES = [
    // Operations
    { key: 'Restaurant Management', category: 'Operations', desc: 'Define layouts, menu configurations, order flows.' },
    { key: 'Menu Management', category: 'Operations', desc: 'Set up menu items, pricing, custom categories.' },
    { key: 'QR Digital Menu', category: 'Operations', desc: 'Enable guests to order or view menus by scan.' },
    { key: 'Order Management', category: 'Operations', desc: 'Processes counter orders, takeaways, deliveries.' },
    { key: 'Multi-Branch Management', category: 'Operations', desc: 'Create, monitor and track multiple branches.' },
    { key: 'Advanced Staff Management', category: 'Operations', desc: 'Detailed permissions, roles, and shift check-ins.' },
    { key: 'Delivery Partner Management', category: 'Operations', desc: 'Assign and track real-time delivery orders.' },
    { key: 'Advanced Order Analytics', category: 'Operations', desc: 'Track sales performance, hourly volumes, and payment status.' },
    { key: 'Advanced Table Management', category: 'Operations', desc: 'Manage reservations, table occupancy, and layout grids.' },

    // Inventory
    { key: 'Raw Materials', category: 'Inventory', desc: 'Track stock of raw ingredients and recipe items.' },
    { key: 'Stock Levels', category: 'Inventory', desc: 'Real-time monitoring of quantity on hand.' },
    { key: 'Low Stock Alerts', category: 'Inventory', desc: 'Automatic email and system notifications when stock is low.' },
    { key: 'Expiry Tracking', category: 'Inventory', desc: 'Trace perishables and track shelf life expiration.' },
    { key: 'Purchase Orders', category: 'Inventory', desc: 'Create procurement workflows and orders for vendors.' },
    { key: 'Vendor Management', category: 'Inventory', desc: 'Manage suppliers, contacts, and historical prices.' },
    { key: 'Stock Transfer', category: 'Inventory', desc: 'Transfer stock items safely between branch outlets.' },
    { key: 'Waste Management', category: 'Inventory', desc: 'Log daily food wastage logs, values and sources.' },

    // Reports & Analytics
    { key: 'Sales Reports', category: 'Reports & Analytics', desc: 'Basic sales reports and daily sales tracking.' },
    { key: 'Profit & Loss', category: 'Reports & Analytics', desc: 'Compute operational profitability metrics.' },
    { key: 'Inventory Reports', category: 'Reports & Analytics', desc: 'Historical consumption and valuation reports.' },
    { key: 'Staff Performance', category: 'Reports & Analytics', desc: 'Track staff order count, speed, and accuracy.' },
    { key: 'Customer Analytics', category: 'Reports & Analytics', desc: 'Analyze purchase frequency and preferences.' },
    { key: 'Order Analytics', category: 'Reports & Analytics', desc: 'Detailed hourly, category, and payment report metrics.' },
    { key: 'Tax Reports', category: 'Reports & Analytics', desc: 'Generate reports for SGST/CGST and service tax audits.' },
    { key: 'PDF Export', category: 'Reports & Analytics', desc: 'Export reports to PDF format.' },
    { key: 'Excel Export', category: 'Reports & Analytics', desc: 'Export reports to CSV/Excel format.' },

    // Customer Management
    { key: 'Advanced Customer Analytics', category: 'Customer Management', desc: 'Deconstruct lifetime values and loyalty.' },
    { key: 'Customer Segmentation', category: 'Customer Management', desc: 'Categorize customers by frequency, spending, and tags.' },
    { key: 'Customer Complaints', category: 'Customer Management', desc: 'Manage guest complaints and resolution tracking.' },
    { key: 'Refund Requests', category: 'Customer Management', desc: 'Initiate and manage order refund workflows.' },
    { key: 'Ticket History', category: 'Customer Management', desc: 'Review completed support interactions.' },

    // Subscription
    { key: 'Upgrade/Downgrade', category: 'Subscription', desc: 'Change plans dynamically with pro-rata refunds.' },
    { key: 'Billing History', category: 'Subscription', desc: 'Audit invoices and platform payments.' },
    { key: 'Payment History', category: 'Subscription', desc: 'Review complete list of transactions.' },
    { key: 'Renewal', category: 'Subscription', desc: 'Renew your subscription before plan expiry.' },
    { key: 'Feature Access', category: 'Subscription', desc: 'Control permission locks on specific features.' },

    // Advanced Enterprise Features
    { key: 'Advanced AI Insights', category: 'AI Tools (Enterprise)', desc: 'AI-generated platform improvement insights.' },
    { key: 'Sales Prediction', category: 'AI Tools (Enterprise)', desc: 'Forecast sales using machine learning.' },
    { key: 'Inventory Forecast', category: 'AI Tools (Enterprise)', desc: 'AI forecasts for ingredient depletion.' },
    { key: 'Demand Forecast', category: 'AI Tools (Enterprise)', desc: 'Predict high-demand menu items.' },
    { key: 'Menu Recommendations', category: 'AI Tools (Enterprise)', desc: 'AI pricing and menu engineering tips.' },
    { key: 'Business Health Score', category: 'AI Tools (Enterprise)', desc: 'Calculate operational health index.' },
    { key: 'Live Chat / Priority Support', category: 'Support (Enterprise)', desc: 'Real-time chat with support agents.' },
];

const FeatureManagement = () => {
    const { api } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingPlanId, setUpdatingPlanId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('/super-admin/plans');
            // Sort plans consistently (Basic -> Pro -> Enterprise)
            const sortedPlans = (res.data || []).sort((a, b) => {
                const order = { 'basic': 1, 'starter': 1, 'pro': 2, 'professional': 2, 'enterprise': 3 };
                const orderA = order[a.name.toLowerCase()] || 4;
                const orderB = order[b.name.toLowerCase()] || 4;
                return orderA - orderB;
            });
            setPlans(sortedPlans);
        } catch (error) {
            console.error("Failed to fetch plans", error);
            toast.error('Could not load plans from server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [api]);

    const handleFeatureToggle = async (plan, featureKey) => {
        setUpdatingPlanId(plan._id);
        const hasFeature = plan.features.includes(featureKey);
        const updatedFeatures = hasFeature
            ? plan.features.filter(f => f !== featureKey)
            : [...plan.features, featureKey];

        try {
            const res = await api.put(`/super-admin/plans/${plan._id}`, {
                features: updatedFeatures
            });

            // Update local state
            setPlans(prevPlans => prevPlans.map(p => p._id === plan._id ? res.data : p));
            toast.success(`Updated ${featureKey} for plan: ${plan.name}`);
        } catch (error) {
            console.error("Failed to update plan features", error);
            toast.error(error.response?.data?.message || 'Failed to update plan feature mapping');
        } finally {
            setUpdatingPlanId(null);
        }
    };

    const categories = ['All', ...new Set(SaaS_FEATURES.map(f => f.category))];
    const filteredFeatures = selectedCategory === 'All'
        ? SaaS_FEATURES
        : SaaS_FEATURES.filter(f => f.category === selectedCategory);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <RefreshCw className="animate-spin text-slate-500" size={32} />
                <p className="text-sm font-semibold text-slate-500">Loading SaaS plans and features...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                        <Shield className="text-indigo-600" size={20} />
                        <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">Feature Gating Matrix</h2>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Define exactly which features and modules are bundled inside each subscription plan tier.</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            selectedCategory === cat
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Feature Table Matrix */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 text-xs font-black uppercase text-slate-500 tracking-wider w-1/4">Feature Module</th>
                                <th className="p-5 text-xs font-black uppercase text-slate-500 tracking-wider w-2/5">Description</th>
                                {plans.map(plan => (
                                    <th key={plan._id} className="p-5 text-xs font-black uppercase text-slate-700 tracking-wider text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-extrabold text-sm text-slate-900">{plan.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                ₹{plan.monthlyPrice}/mo
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredFeatures.map(feat => (
                                <tr key={feat.key} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 text-sm">{feat.key}</span>
                                            <span className="inline-block self-start text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                                                {feat.category}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-xs font-semibold text-slate-500 leading-relaxed">
                                        {feat.desc}
                                    </td>
                                    {plans.map(plan => {
                                        const isChecked = plan.features.includes(feat.key);
                                        const isUpdating = updatingPlanId === plan._id;
                                        return (
                                            <td key={plan._id} className="p-5 text-center">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleFeatureToggle(plan, feat.key)}
                                                        disabled={isUpdating}
                                                        className={`relative flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all ${
                                                            isUpdating ? 'opacity-50 cursor-wait' : ''
                                                        } ${
                                                            isChecked 
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100 hover:bg-indigo-100' 
                                                            : 'border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {isUpdating ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                                                        ) : isChecked ? (
                                                            <CheckCircle2 className="w-5 h-5 fill-indigo-600 text-white" />
                                                        ) : (
                                                            <Circle className="w-4 h-4 text-slate-300" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Matrix Help Box */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-start gap-4">
                <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">Dynamic Subscription Gating</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        Checkboxes indicate which plans currently grant access to specified feature IDs. When updated, subscription logic automatically enables or disables modules for SaaS tenants in real-time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FeatureManagement;
