import React from 'react';
import { ChefHat, Truck, FileText, ArrowRight, Boxes, ShieldAlert } from 'lucide-react';

const CentralKitchen = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Central Kitchen Ops</h2>
                <p className="text-gray-500 text-sm mt-1">Manage centralized preparation facilities, recipes, and warehouse-to-outlet stock transfers.</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Recipes</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">142 Recipes</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ChefHat size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Orders</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">18 Transfers</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><Truck size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Warehouses</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">2 Units</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><Boxes size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Raw Mat Stock Alerts</p>
                        <h3 className="text-3xl font-black text-orange-600 mt-1">3 Alerts</h3>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><ShieldAlert size={24} /></div>
                </div>
            </div>

            {/* Inventory Transfer & Recipes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Outlets Transfer Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Stock Requests & Transfers</h3>
                    <div className="space-y-3">
                        {[
                            { from: "Central Base", to: "Mumbai Outlet", item: "Marinated Chicken (50 Kg)", status: "In Transit" },
                            { from: "Central Base", to: "Airport Outlet", item: "Premium Pizza Sauce (120 L)", status: "Completed" },
                            { from: "Central Base", to: "CyberHub Outlet", item: "Burger Patties (500 Pcs)", status: "Pending" }
                        ].map((t, i) => (
                            <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                    <p className="font-bold text-gray-900">{t.item}</p>
                                    <p className="text-gray-400 mt-0.5">{t.from} → {t.to}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                    t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    t.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                    'bg-orange-100 text-orange-700'
                                }`}>{t.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Central Recipes */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Centralized Recipe Database</h3>
                    <div className="space-y-3">
                        {[
                            { name: "Classic Italian Tomato Base", time: "45 mins Prep", difficulty: "Medium" },
                            { name: "Signature Peri Peri Rub", time: "15 mins Prep", difficulty: "Easy" },
                            { name: "Artisanal Burger Buns", time: "120 mins Prep", difficulty: "Hard" }
                        ].map((r, i) => (
                            <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-colors cursor-pointer">
                                <div>
                                    <p className="font-bold text-gray-900">{r.name}</p>
                                    <p className="text-gray-400 mt-0.5">{r.time} · Level: {r.difficulty}</p>
                                </div>
                                <ArrowRight size={14} className="text-gray-450" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CentralKitchen;
