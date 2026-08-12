import { useState, useMemo } from 'react';
import { 
    Terminal, Key, ShieldCheck, RefreshCw, Layers, CheckCircle2, 
    AlertTriangle, AlertCircle, Save, Undo, Play, Code, Cpu, 
    Globe, Sliders, Check, Lock, ShieldAlert, Sparkles, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_CONFIGS = [
    {
        id: 'cfg-1',
        key: 'CUSTOM_PORTAL_DOMAIN',
        name: 'Custom White-Label CNAME Domain',
        category: 'Branding & Domain',
        value: 'order.pizzapalace.com',
        type: 'string',
        description: 'Primary custom domain CNAME routing for customer digital portal.',
        rules: { required: true, pattern: /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, errorMsg: 'Must be a valid hostname domain (e.g. order.mybrand.com)' }
    },
    {
        id: 'cfg-2',
        key: 'WHITE_LABEL_ACCENT_COLOR',
        name: 'Portal Primary Accent Color',
        category: 'Branding & Domain',
        value: '#4f46e5',
        type: 'color',
        description: 'Hex color code for customer portal buttons, banners, and links.',
        rules: { required: true, pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, errorMsg: 'Must be a valid 6-digit hex color code (e.g. #4f46e5)' }
    },
    {
        id: 'cfg-3',
        key: 'API_TIMEOUT_MS',
        name: 'REST API Request Timeout (ms)',
        category: 'System Runtime',
        value: '5000',
        type: 'number',
        description: 'Maximum timeout threshold for upstream microservices in milliseconds.',
        rules: { min: 1000, max: 60000, errorMsg: 'Must be a number between 1,000 ms and 60,000 ms' }
    },
    {
        id: 'cfg-4',
        key: 'MAX_WEBSOCKET_CONNECTIONS',
        name: 'Max Concurrent Socket Clients',
        category: 'System Runtime',
        value: '500',
        type: 'number',
        description: 'Maximum allowed simultaneous WebSocket connections for POS live sync.',
        rules: { min: 50, max: 10000, errorMsg: 'Must be between 50 and 10,000 concurrent sockets' }
    },
    {
        id: 'cfg-5',
        key: 'RATE_LIMIT_RPM',
        name: 'Public API Rate Limit (Req/Min)',
        category: 'Security & CORS',
        value: '120',
        type: 'number',
        description: 'Maximum allowed API requests per minute per IP address.',
        rules: { min: 10, max: 2000, errorMsg: 'Must be between 10 and 2,000 requests per minute' }
    },
    {
        id: 'cfg-6',
        key: 'CORS_ALLOWED_ORIGINS',
        name: 'CORS Allowed Origins Whitelist',
        category: 'Security & CORS',
        value: 'https://pizzapalace.com, https://admin.pizzapalace.com',
        type: 'string',
        description: 'Comma-separated URLs permitted to access cross-origin resources.',
        rules: { required: true, pattern: /^(https?:\/\/[^\s,]+)(,\s*https?:\/\/[^\s,]+)*$/, errorMsg: 'Must be a valid comma-separated list of HTTP/HTTPS origins' }
    },
    {
        id: 'cfg-7',
        key: 'ENABLE_AI_SMART_RECOMMENDATIONS',
        name: 'AI Menu Engineering Engine',
        category: 'Feature Flags',
        value: 'true',
        type: 'boolean',
        description: 'Enable AI predictive cross-selling recommendations during customer checkout.',
        rules: {}
    },
    {
        id: 'cfg-8',
        key: 'WEBHOOK_RETRY_LIMIT',
        name: 'Webhook Failure Retries',
        category: 'System Runtime',
        value: '3',
        type: 'number',
        description: 'Number of automatic retries before placing failed webhooks in dead-letter queue.',
        rules: { min: 0, max: 10, errorMsg: 'Must be between 0 and 10 retries' }
    }
];

const DeveloperConfig = () => {
    const [configs, setConfigs] = useState(DEFAULT_CONFIGS);
    const [editedValues, setEditedValues] = useState(
        DEFAULT_CONFIGS.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {})
    );
    const [validationErrors, setValidationErrors] = useState({});
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [lastAppliedTime, setLastAppliedTime] = useState('2026-08-12 11:20 AM');
    const [apiKeys, setApiKeys] = useState([
        { id: 'key-1', name: 'Production Live Key', key: 'key_live_8s72b910a98e', status: 'Active', created: '2026-01-10' },
        { id: 'key-2', name: 'Sandbox Test Key', key: 'key_test_99ab21cc4401', status: 'Active', created: '2026-03-04' }
    ]);

    // Check if there are unapplied changes
    const hasUnappliedChanges = useMemo(() => {
        return configs.some(cfg => editedValues[cfg.id] !== cfg.value);
    }, [configs, editedValues]);

    // Live single value validator
    const validateSingleConfig = (config, value) => {
        if (!config.rules) return null;

        if (config.rules.required && (!value || value.trim() === '')) {
            return 'This configuration value is required and cannot be empty.';
        }

        if (config.type === 'number') {
            const num = Number(value);
            if (isNaN(num)) {
                return 'Invalid numeric value.';
            }
            if (config.rules.min !== undefined && num < config.rules.min) {
                return config.rules.errorMsg || `Value cannot be less than ${config.rules.min}.`;
            }
            if (config.rules.max !== undefined && num > config.rules.max) {
                return config.rules.errorMsg || `Value cannot exceed ${config.rules.max}.`;
            }
        }

        if (config.rules.pattern && !config.rules.pattern.test(value)) {
            return config.rules.errorMsg || 'Invalid format or characters detected.';
        }

        return null;
    };

    // Handle Input Change & Live Validation
    const handleValueChange = (config, newValue) => {
        setEditedValues(prev => ({ ...prev, [config.id]: newValue }));
        
        const err = validateSingleConfig(config, newValue);
        setValidationErrors(prev => {
            if (err) {
                return { ...prev, [config.id]: err };
            } else {
                const next = { ...prev };
                delete next[config.id];
                return next;
            }
        });
    };

    // Filtered configs
    const categories = ['All', 'Branding & Domain', 'System Runtime', 'Security & CORS', 'Feature Flags'];
    const filteredConfigs = useMemo(() => {
        return configs.filter(cfg => {
            const matchesCategory = activeCategory === 'All' || cfg.category === activeCategory;
            const matchesSearch = 
                cfg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cfg.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cfg.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [configs, activeCategory, searchQuery]);

    // Apply Changes Action
    const handleApplyChanges = () => {
        // Validate all configs
        const errorsObj = {};
        configs.forEach(cfg => {
            const val = editedValues[cfg.id];
            const err = validateSingleConfig(cfg, val);
            if (err) {
                errorsObj[cfg.id] = err;
            }
        });

        if (Object.keys(errorsObj).length > 0) {
            setValidationErrors(errorsObj);
            return toast.error(
                `Cannot apply changes! ${Object.keys(errorsObj).length} invalid configuration value(s) detected. Please fix highlighted errors.`,
                { duration: 4000 }
            );
        }

        setIsApplying(true);
        setTimeout(() => {
            const updatedConfigs = configs.map(cfg => ({
                ...cfg,
                value: editedValues[cfg.id]
            }));

            setConfigs(updatedConfigs);
            setIsApplying(false);
            setLastAppliedTime(new Date().toLocaleString());
            toast.success('Configuration changes applied and hot-reloaded successfully!');
        }, 1000);
    };

    // Revert / Reset Changes
    const handleRevertChanges = () => {
        const resetVals = configs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {});
        setEditedValues(resetVals);
        setValidationErrors({});
        toast.success('Unapplied configuration edits reverted to active values.');
    };

    // Revoke API Key
    const handleRevokeKey = (keyId) => {
        setApiKeys(apiKeys.map(k => k.id === keyId ? { ...k, status: 'Revoked' } : k));
        toast.success('API Key revoked.');
    };

    // Generate New API Key
    const handleGenerateKey = () => {
        const newKey = {
            id: `key-${Date.now()}`,
            name: `Developer Access Key ${apiKeys.length + 1}`,
            key: `key_live_${Math.random().toString(36).substring(2, 14)}`,
            status: 'Active',
            created: new Date().toISOString().slice(0, 10)
        };
        setApiKeys([...apiKeys, newKey]);
        toast.success('New API Key generated successfully!');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans text-gray-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        API & White-Label Integration (Developer Config)
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-slate-400 font-semibold mt-0.5">
                        Configure runtime variables, domain CNAMEs, CORS whitelists, rate limits, and apply hot-reloads instantly.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {hasUnappliedChanges && (
                        <button
                            onClick={handleRevertChanges}
                            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                        >
                            <Undo size={14} /> Revert Edits
                        </button>
                    )}
                    <button
                        onClick={handleApplyChanges}
                        disabled={isApplying}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                            hasUnappliedChanges
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 animate-bounce'
                            : 'bg-slate-900 dark:bg-slate-800 hover:bg-black text-white'
                        }`}
                    >
                        {isApplying ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>Changes Apply (Hot Reload)</span>
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Runtime Config System</span>
                            {hasUnappliedChanges ? (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black uppercase">
                                    Unsaved Edits Pending
                                </span>
                            ) : (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase">
                                    All Synced & Active
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Last Applied: <span className="text-slate-200 font-bold">{lastAppliedTime}</span></p>
                    </div>
                </div>

                {Object.keys(validationErrors).length > 0 && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-1.5 rounded-2xl text-xs font-bold">
                        <AlertTriangle size={16} />
                        <span>{Object.keys(validationErrors).length} Invalid Config Error(s)</span>
                    </div>
                )}
            </div>

            {/* Config Category Tabs & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                activeCategory === cat
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800 hover:text-gray-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search key or description..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Sliders size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" />
                </div>
            </div>

            {/* Config Values List & Editor */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-slate-800">
                <div className="p-4 bg-gray-50/50 dark:bg-slate-950/60 flex items-center justify-between text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>Developer Configuration Variables ({filteredConfigs.length})</span>
                    <span>Validation & Value Editor</span>
                </div>

                {filteredConfigs.map(cfg => {
                    const currentEditVal = editedValues[cfg.id];
                    const isChanged = currentEditVal !== cfg.value;
                    const errorMsg = validationErrors[cfg.id];

                    return (
                        <div key={cfg.id} className={`p-6 transition-colors ${errorMsg ? 'bg-red-50/30 dark:bg-red-950/20' : isChanged ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Left Info */}
                                <div className="lg:col-span-5 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                            {cfg.key}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                            {cfg.category}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">{cfg.name}</h4>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium leading-relaxed">{cfg.description}</p>
                                </div>

                                {/* Right Editor Input */}
                                <div className="lg:col-span-7 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                                            Value Editor {isChanged && <span className="text-indigo-600 dark:text-indigo-400 font-bold">(Modified)</span>}
                                        </label>
                                        {isChanged && (
                                            <button
                                                onClick={() => handleValueChange(cfg, cfg.value)}
                                                className="text-[10px] font-bold text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 underline"
                                            >
                                                Reset to Active ({cfg.value})
                                            </button>
                                        )}
                                    </div>

                                    {/* Input Types */}
                                    {cfg.type === 'boolean' ? (
                                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => handleValueChange(cfg, currentEditVal === 'true' ? 'false' : 'true')}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                                                    currentEditVal === 'true'
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {currentEditVal === 'true' ? 'ENABLED (True)' : 'DISABLED (False)'}
                                            </button>
                                            <span className="text-xs text-gray-400 font-semibold">Toggle runtime feature flag state</span>
                                        </div>
                                    ) : cfg.type === 'color' ? (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={currentEditVal}
                                                onChange={(e) => handleValueChange(cfg, e.target.value)}
                                                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer p-1 bg-white dark:bg-slate-950"
                                            />
                                            <input
                                                type="text"
                                                value={currentEditVal}
                                                onChange={(e) => handleValueChange(cfg, e.target.value)}
                                                className={`flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                                                    errorMsg
                                                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-600'
                                                    : 'border-gray-200 dark:border-slate-800 focus:border-indigo-500'
                                                }`}
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type={cfg.type === 'number' ? 'number' : 'text'}
                                            value={currentEditVal}
                                            onChange={(e) => handleValueChange(cfg, e.target.value)}
                                            className={`w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border rounded-xl text-xs font-mono font-bold focus:outline-none transition-all ${
                                                errorMsg
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-600 bg-red-50/50 dark:bg-red-950/50'
                                                : isChanged
                                                ? 'border-indigo-400 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/30'
                                                : 'border-gray-200 dark:border-slate-800 focus:border-indigo-500'
                                            }`}
                                        />
                                    )}

                                    {/* Error Message Box */}
                                    {errorMsg && (
                                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[11px] font-bold pt-1 animate-in fade-in">
                                            <AlertCircle size={14} className="shrink-0" />
                                            <span>Invalid Value Error: {errorMsg}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* API Keys Management Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Key size={18} className="text-indigo-500" /> Active Integration API Keys
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold mt-0.5">Manage secret credentials for third-party POS, delivery, or custom webhooks integration.</p>
                    </div>
                    <button
                        onClick={handleGenerateKey}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Generate New API Key
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apiKeys.map(key => (
                        <div key={key.id} className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-xs">{key.name}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                        key.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                    }`}>
                                        {key.status}
                                    </span>
                                </div>
                                <p className="font-mono text-xs text-gray-500 dark:text-slate-400">{key.key}</p>
                                <p className="text-[10px] text-gray-400">Created: {key.created}</p>
                            </div>
                            {key.status === 'Active' && (
                                <button
                                    onClick={() => handleRevokeKey(key.id)}
                                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline px-2 py-1 bg-red-50 dark:bg-red-950/50 rounded-lg"
                                >
                                    Revoke Key
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeveloperConfig;
