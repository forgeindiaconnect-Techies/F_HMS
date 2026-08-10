import { useState } from 'react';
import { Settings, Globe, Mail, Percent, Shield, AlertTriangle, Moon, Sun, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        platformName: 'RestaurantHub SaaS',
        contactEmail: 'support@restauranthub.com',
        defaultCommissionRate: 5,
        defaultTaxRate: 18,
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: true,
        autoApproveRestaurants: false,
        maxBranchesBasic: 1,
        maxBranchesPro: 3,
        maxBranchesEnterprise: 10,
        supportEmail: 'support@restauranthub.com',
        billingCurrency: 'INR',
        sessionTimeout: 60,
        maxLoginAttempts: 5,
    });

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate save — in production this would call an API endpoint
        await new Promise(r => setTimeout(r, 1000));
        setSaving(false);
        toast.success('System settings saved successfully!');
    };

    const handleReset = () => {
        toast.success('Settings reset to defaults.');
    };

    const Toggle = ({ value, onChange, id }) => (
        <button
            id={id}
            onClick={() => onChange(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const Field = ({ label, description, children }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-50 last:border-0">
            <div>
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight">System Settings</h2>
                    <p className="text-gray-500 mt-1">Configure global platform-level settings and defaults.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                    >
                        <RefreshCw size={15} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-60"
                    >
                        {saving ? <><RefreshCw size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Maintenance Mode Alert */}
            {settings.maintenanceMode && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3 text-orange-700">
                    <AlertTriangle size={20} className="shrink-0" />
                    <p className="font-bold text-sm">Platform is currently in Maintenance Mode. All user-facing pages will show a maintenance notice.</p>
                </div>
            )}

            {/* General */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Globe size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">General Settings</h3>
                </div>

                <Field label="Platform Name" description="Displayed across the app and emails.">
                    <input
                        type="text"
                        value={settings.platformName}
                        onChange={e => handleChange('platformName', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </Field>
                <Field label="Billing Currency" description="Primary currency for all transactions.">
                    <select
                        value={settings.billingCurrency}
                        onChange={e => handleChange('billingCurrency', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Maintenance Mode" description="Temporarily take the platform offline for updates.">
                    <Toggle value={settings.maintenanceMode} onChange={v => handleChange('maintenanceMode', v)} />
                </Field>
                <Field label="Allow New Registrations" description="Enable or disable new restaurant sign-ups.">
                    <Toggle value={settings.allowNewRegistrations} onChange={v => handleChange('allowNewRegistrations', v)} />
                </Field>
                <Field label="Auto-Approve Restaurants" description="Skip manual approval for new restaurants.">
                    <Toggle value={settings.autoApproveRestaurants} onChange={v => handleChange('autoApproveRestaurants', v)} />
                </Field>
            </div>

            {/* Email */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Mail size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">Email & Communication</h3>
                </div>
                <Field label="Platform Contact Email" description="Public-facing email address.">
                    <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={e => handleChange('contactEmail', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </Field>
                <Field label="Support Email" description="Routed to the support team.">
                    <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={e => handleChange('supportEmail', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </Field>
                <Field label="Require Email Verification" description="New users must verify their email before accessing the dashboard.">
                    <Toggle value={settings.requireEmailVerification} onChange={v => handleChange('requireEmailVerification', v)} />
                </Field>
            </div>

            {/* Finance */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <Percent size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">Finance & Billing Defaults</h3>
                </div>
                <Field label="Default Commission Rate (%)" description="Applied globally unless overridden per restaurant.">
                    <input
                        type="number"
                        value={settings.defaultCommissionRate}
                        onChange={e => handleChange('defaultCommissionRate', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                    />
                </Field>
                <Field label="Default Tax Rate (%)" description="Applied to subscriptions unless a region-specific rate is set.">
                    <input
                        type="number"
                        value={settings.defaultTaxRate}
                        onChange={e => handleChange('defaultTaxRate', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                    />
                </Field>
            </div>

            {/* Security */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                        <Shield size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900">Security Settings</h3>
                </div>
                <Field label="Session Timeout (minutes)" description="Auto-logout after inactivity period.">
                    <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={e => handleChange('sessionTimeout', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="5"
                    />
                </Field>
                <Field label="Max Login Attempts" description="Account lock after this many failed login attempts.">
                    <input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={e => handleChange('maxLoginAttempts', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="20"
                    />
                </Field>
            </div>
        </div>
    );
};

export default SystemSettings;
