import React from 'react';
import { Terminal, Key, ShieldCheck, RefreshCw, Layers } from 'lucide-react';

const DeveloperConfig = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>API & White-Label Integration</h2>
                <p className="text-gray-500 text-sm mt-1">Configure custom domains, developer APIs, real-time webhooks, and brand customization.</p>
            </div>

            {/* Config Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* White Label Settings */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5"><Layers size={18} className="text-red-500" /> Branding & Domain Settings</h3>
                    <div className="space-y-4 text-xs font-semibold text-gray-700">
                        <div>
                            <label className="block text-gray-400 mb-1">Custom Portal URL (CNAME)</label>
                            <input type="text" readOnly value="order.myrestaurant.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">White-Label Accent Color</label>
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-red-600 border border-gray-200"></span>
                                <input type="text" readOnly value="#dc2626" className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* API & Webhooks */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5"><Key size={18} className="text-blue-500" /> Active API Keys</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                            <div>
                                <p className="font-bold text-gray-900">Prod Access Key</p>
                                <p className="text-gray-400 mt-0.5">key_live_8s72...a98e</p>
                            </div>
                            <button className="text-xs text-blue-600 font-bold hover:underline">Revoke</button>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                            <div>
                                <p className="font-bold text-gray-900">Webhooks Delivery Alert</p>
                                <p className="text-gray-400 mt-0.5">https://api.thirdparty.com/webhook</p>
                            </div>
                            <span className="text-green-600 font-bold">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperConfig;
