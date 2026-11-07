import { useState } from 'react';
import { AlertTriangle, Trash2, Send, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import { useEffect } from 'react';

const ChefInventory = () => {
    const { api } = useAuth();
    const [recentRequests, setRecentRequests] = useState([]);

    const fetchRecentRequests = async () => {
        try {
            const res = await api.get('/notifications');
            const kitchenNotes = (res.data || []).filter(n => n.type === 'Alert' || n.type === 'Info' || n.desc?.toLowerCase().includes('kitchen') || n.title?.toLowerCase().includes('restock'));
            setRecentRequests(kitchenNotes.slice(0, 8));
        } catch (e) {}
    };

    useEffect(() => {
        fetchRecentRequests();
    }, []);
    
    const [wastageForm, setWastageForm] = useState({
        ingredientName: '',
        quantity: '',
        unit: 'lbs',
        reason: ''
    });
    const [isSubmittingWastage, setIsSubmittingWastage] = useState(false);

    const [restockForm, setRestockForm] = useState({
        ingredientNeeded: '',
        urgency: 'Urgent',
        notes: ''
    });
    const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

    const handleWastageSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingWastage(true);
        try {
            await api.post('/inventory/wastage', wastageForm);
            toast.success('Wastage logged successfully!');
            setWastageForm({ ingredientName: '', quantity: '', unit: 'lbs', reason: '' });
        } catch (error) {
            console.error('Failed to log wastage', error);
            toast.error('Failed to log wastage. Please try again.');
        } finally {
            setIsSubmittingWastage(false);
        }
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingRestock(true);
        try {
            await api.post('/notifications/restock', restockForm);
            toast.success('Restock request sent to management!');
            setRestockForm({ ingredientNeeded: '', urgency: 'Urgent', notes: '' });
            fetchRecentRequests();
        } catch (error) {
            console.error('Failed to request restock', error);
            toast.error('Failed to send restock request. Please try again.');
        } finally {
            setIsSubmittingRestock(false);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Wastage & Restock</h2>
                    <p className="text-slate-600 dark:text-gray-400 text-sm mt-1">Log dropped food or request immediate restocks from management.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Log Wastage Form */}
                <form onSubmit={handleWastageSubmit} className="bg-white dark:bg-[#1e2330] rounded-2xl border border-slate-200 dark:border-[#2a3040] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-[#2a3040] bg-slate-50 dark:bg-[#1a1e2a] flex items-center gap-2">
                        <Trash2 size={20} className="text-red-500" />
                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-lg">Log Wastage (Spoilage/Dropped)</h3>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Ingredient Name *</label>
                            <input 
                                required
                                value={wastageForm.ingredientName}
                                onChange={(e) => setWastageForm({...wastageForm, ingredientName: e.target.value})}
                                type="text" 
                                placeholder="e.g. Tomato, Ground Beef" 
                                className="w-full bg-slate-50 dark:bg-[#151923] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Quantity *</label>
                                <div className="flex items-center bg-slate-50 dark:bg-[#151923] border border-slate-200 dark:border-[#2a3040] rounded-xl overflow-hidden focus-within:border-red-500 transition-colors">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const step = wastageForm.unit === 'units' ? 1 : 0.1;
                                            const val = Math.max(0, parseFloat(wastageForm.quantity || 0) - step);
                                            setWastageForm({...wastageForm, quantity: String(parseFloat(val.toFixed(2)))});
                                        }}
                                        className="px-4 py-3 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#252b3b] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors text-lg border-r border-slate-200 dark:border-[#2a3040]"
                                    >
                                        -
                                    </button>
                                    <input 
                                        required
                                        value={wastageForm.quantity}
                                        onChange={(e) => setWastageForm({...wastageForm, quantity: e.target.value})}
                                        type="number" 
                                        min="0"
                                        step="0.01"
                                        placeholder="0" 
                                        className="w-full bg-transparent text-center py-3 text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const step = wastageForm.unit === 'units' ? 1 : 0.1;
                                            const val = parseFloat(wastageForm.quantity || 0) + step;
                                            setWastageForm({...wastageForm, quantity: String(parseFloat(val.toFixed(2)))});
                                        }}
                                        className="px-4 py-3 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#252b3b] text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors text-lg border-l border-slate-200 dark:border-[#2a3040]"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Unit *</label>
                                <select 
                                    value={wastageForm.unit}
                                    onChange={(e) => setWastageForm({...wastageForm, unit: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-[#151923] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors"
                                >
                                    <option value="lbs">lbs</option>
                                    <option value="kg">kg</option>
                                    <option value="units">units</option>
                                    <option value="liters">liters</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Reason *</label>
                            <input 
                                required
                                value={wastageForm.reason}
                                onChange={(e) => setWastageForm({...wastageForm, reason: e.target.value})}
                                type="text" 
                                placeholder="Dropped on floor, Expired, etc." 
                                className="w-full bg-slate-50 dark:bg-[#151923] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" 
                            />
                        </div>
                        <button 
                            disabled={isSubmittingWastage}
                            className="w-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send size={18} /> {isSubmittingWastage ? 'Submitting...' : 'Submit Wastage Log'}
                        </button>
                    </div>
                </form>

                {/* Request Restock Form */}
                <form onSubmit={handleRestockSubmit} className="bg-white dark:bg-[#1e2330] rounded-2xl border border-slate-200 dark:border-[#2a3040] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-[#2a3040] bg-slate-50 dark:bg-[#1a1e2a] flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-500" />
                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-lg">Request Restock (Running Low)</h3>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Ingredient Needed *</label>
                            <input 
                                required
                                value={restockForm.ingredientNeeded}
                                onChange={(e) => setRestockForm({...restockForm, ingredientNeeded: e.target.value})}
                                type="text" 
                                placeholder="e.g. Avocado" 
                                className="w-full bg-slate-50 dark:bg-[#151923] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" 
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Urgency</label>
                            <div className="flex gap-4">
                                <label className="flex-1 flex items-center gap-2 p-3 border border-slate-200 dark:border-[#2a3040] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#252b3b] transition-colors">
                                    <input 
                                        type="radio" 
                                        name="urgency" 
                                        value="Standard"
                                        checked={restockForm.urgency === 'Standard'}
                                        onChange={(e) => setRestockForm({...restockForm, urgency: e.target.value})}
                                        className="accent-orange-500" 
                                    /> 
                                    <span className="text-slate-700 dark:text-gray-300 font-medium">Standard</span>
                                </label>
                                <label className="flex-1 flex items-center gap-2 p-3 border border-orange-500/30 bg-orange-500/5 rounded-xl cursor-pointer hover:bg-orange-500/10 transition-colors">
                                    <input 
                                        type="radio" 
                                        name="urgency" 
                                        value="Urgent"
                                        checked={restockForm.urgency === 'Urgent'}
                                        onChange={(e) => setRestockForm({...restockForm, urgency: e.target.value})}
                                        className="accent-orange-500" 
                                    /> 
                                    <span className="text-orange-600 dark:text-orange-400 font-bold">Urgent (86 Risk)</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-gray-300 block mb-1.5">Notes to Manager</label>
                            <input 
                                value={restockForm.notes}
                                onChange={(e) => setRestockForm({...restockForm, notes: e.target.value})}
                                type="text" 
                                placeholder="We have enough for 5 more orders." 
                                className="w-full bg-slate-50 dark:bg-[#151923] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" 
                            />
                        </div>
                        <button 
                            disabled={isSubmittingRestock}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-orange-500/20"
                        >
                            <Plus size={18} /> {isSubmittingRestock ? 'Sending...' : 'Send Request to Manager'}
                        </button>
                    </div>
                </form>

            </div>

            {/* Sent Restock & Wastage Requests Log for Kitchen Staff */}
            <div className="bg-white dark:bg-[#1e2330] rounded-2xl border border-slate-200 dark:border-[#2a3040] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-[#2a3040] bg-slate-50 dark:bg-[#1a1e2a] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-base flex items-center gap-2">
                            <Send size={18} className="text-indigo-600" /> Restock Requests Sent to Management
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Track real-time status and manager actions on kitchen requisitions.</p>
                    </div>
                    <button 
                        onClick={fetchRecentRequests} 
                        className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                        Refresh Log
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-3">Request Summary</th>
                                <th className="p-3">Urgency</th>
                                <th className="p-3">Details / Notes</th>
                                <th className="p-3">Sent Time</th>
                                <th className="p-3 text-right">Manager Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                            {recentRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400">
                                        No active restock requests sent. Submit requests above to track status.
                                    </td>
                                </tr>
                            ) : (
                                recentRequests.map(req => (
                                    <tr key={req._id}>
                                        <td className="p-3 font-bold text-slate-900 dark:text-white">{req.title}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${req.type === 'Alert' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'}`}>
                                                {req.type === 'Alert' ? 'Urgent' : 'Normal'}
                                            </span>
                                        </td>
                                        <td className="p-3 max-w-xs truncate text-slate-500 dark:text-slate-400">{req.desc || '-'}</td>
                                        <td className="p-3 text-slate-400">{req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</td>
                                        <td className="p-3 text-right font-bold">
                                            {req.read ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                                    ✓ Acknowledged by Manager
                                                </span>
                                            ) : (
                                                <span className="text-amber-500 flex items-center justify-end gap-1">
                                                    ⏳ Pending Review
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChefInventory;
