import React from 'react';
import { ShieldCheck, User, Lock, AlertTriangle } from 'lucide-react';

const AuditLogs = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>System Audit Logs</h2>
                <p className="text-gray-500 text-sm mt-1">Detailed security ledger and operation audits for compliance tracking.</p>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Operation History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Staff Member</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Action Taken</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                            {[
                                { time: "2026-08-06 17:42:01", staff: "Manager David", role: "Branch Manager", action: "Updated Tax Settings (Rate changed from 5% to 6%)", ip: "192.168.1.45", status: "Success" },
                                { time: "2026-08-06 16:15:30", staff: "Chef Marcus", role: "Head Chef", action: "Deleted Recipe: Garlic Butter Prawns", ip: "192.168.1.12", status: "Success" },
                                { time: "2026-08-06 15:02:12", staff: "Developer API", role: "Integrations API", action: "Generated Live Access Key", ip: "202.45.190.2", status: "Success" },
                                { time: "2026-08-06 14:10:05", staff: "Unknown User", role: "Unassigned", action: "Failed SSH Login Attempt", ip: "45.89.20.180", status: "Failed" }
                            ].map((l, i) => (
                                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="p-4 text-xs font-medium text-gray-400">{l.time}</td>
                                    <td className="p-4 font-bold text-gray-900">{l.staff}</td>
                                    <td className="p-4 text-xs font-bold text-gray-500 uppercase">{l.role}</td>
                                    <td className="p-4">{l.action}</td>
                                    <td className="p-4 text-xs font-mono">{l.ip}</td>
                                    <td className="p-4 text-right">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                            l.status === 'Success' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                                        }`}>{l.status}</span>
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

export default AuditLogs;
