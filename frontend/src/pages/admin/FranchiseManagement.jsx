import React from 'react';
import { Network, Landmark, Settings, Link2, Download, Filter, Search } from 'lucide-react';

const FranchiseManagement = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Franchise Management</h2>
                <p className="text-gray-500 text-sm mt-1">Manage franchise locations, royalty agreements, and central menu synchronization.</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Franchises</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">12</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Royalty Collected (MTD)</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">₹4,50,000</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Sync Status</p>
                    <h3 className="text-3xl font-black text-green-600 mt-1">100% Synced</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Approvals</p>
                    <h3 className="text-3xl font-black text-orange-600 mt-1">2 Requests</h3>
                </div>
            </div>

            {/* Franchise Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Active Franchise Outlets</h3>
                    <button className="text-xs text-green-600 font-bold hover:underline">Add New Franchise</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="p-4">Franchise Name</th>
                                <th className="p-4">Owner / Contact</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Royalty Rate</th>
                                <th className="p-4">Monthly Revenue</th>
                                <th className="p-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                            {[
                                { name: "RestoHub Downtown", owner: "Sarah Connor", location: "Mumbai Central", rate: "8%", sales: "₹18,50,000", status: "Active" },
                                { name: "RestoHub Airport", owner: "John Connor", location: "IGI Airport T3", rate: "10%", sales: "₹34,20,000", status: "Active" },
                                { name: "RestoHub CyberHub", owner: "Vikram Malhotra", location: "Gurugram", rate: "8.5%", sales: "₹22,10,000", status: "Active" }
                            ].map((f, i) => (
                                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="p-4 font-bold text-gray-900">{f.name}</td>
                                    <td className="p-4">{f.owner}</td>
                                    <td className="p-4">{f.location}</td>
                                    <td className="p-4 font-bold text-green-600">{f.rate}</td>
                                    <td className="p-4 font-extrabold">{f.sales}</td>
                                    <td className="p-4 text-right">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-150">{f.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FranchiseManagement;
