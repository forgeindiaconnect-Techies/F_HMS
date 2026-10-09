import { useState } from 'react';
import { AlertTriangle, Trash2, Send, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChefInventory = () => {
    const { api } = useAuth();
    
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
        } catch (error) {
            console.error('Failed to request restock', error);
            toast.error('Failed to send restock request. Please try again.');
        } finally {
            setIsSubmittingRestock(false);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Wastage & Restock</h2>
                    <p className="text-gray-400 text-sm mt-1">Log dropped food or request immediate restocks from management.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Log Wastage Form */}
                <form onSubmit={handleWastageSubmit} className="bg-[#1e2330] rounded-2xl border border-[#2a3040] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[#2a3040] bg-[#1a1e2a] flex items-center gap-2">
                        <Trash2 size={20} className="text-red-400" />
                        <h3 className="font-bold text-gray-200 text-lg">Log Wastage (Spoilage/Dropped)</h3>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-1.5">Ingredient Name *</label>
                            <input 
                                required
                                value={wastageForm.ingredientName}
                                onChange={(e) => setWastageForm({...wastageForm, ingredientName: e.target.value})}
                                type="text" 
                                placeholder="e.g. Tomato, Ground Beef" 
                                className="w-full bg-[#151923] border border-[#2a3040] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-400 block mb-1.5">Quantity *</label>
                                <div className="flex items-center bg-[#151923] border border-[#2a3040] rounded-xl overflow-hidden focus-within:border-red-500 transition-colors">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const step = wastageForm.unit === 'units' ? 1 : 0.1;
                                            const val = Math.max(0, parseFloat(wastageForm.quantity || 0) - step);
                                            setWastageForm({...wastageForm, quantity: String(parseFloat(val.toFixed(2)))});
                                        }}
                                        className="px-4 py-3 bg-[#1e2330] hover:bg-[#252b3b] text-gray-400 hover:text-white font-bold transition-colors text-lg border-r border-[#2a3040]"
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
                                        className="w-full bg-transparent text-center py-3 text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const step = wastageForm.unit === 'units' ? 1 : 0.1;
                                            const val = parseFloat(wastageForm.quantity || 0) + step;
                                            setWastageForm({...wastageForm, quantity: String(parseFloat(val.toFixed(2)))});
                                        }}
                                        className="px-4 py-3 bg-[#1e2330] hover:bg-[#252b3b] text-gray-400 hover:text-white font-bold transition-colors text-lg border-l border-[#2a3040]"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400 block mb-1.5">Unit *</label>
                                <select 
                                    value={wastageForm.unit}
                                    onChange={(e) => setWastageForm({...wastageForm, unit: e.target.value})}
                                    className="w-full bg-[#151923] border border-[#2a3040] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                >
                                    <option value="lbs">lbs</option>
                                    <option value="kg">kg</option>
                                    <option value="units">units</option>
                                    <option value="liters">liters</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold text-gray-400 block mb-1.5">Reason *</label>
                            <input 
                                required
                                value={wastageForm.reason}
                                onChange={(e) => setWastageForm({...wastageForm, reason: e.target.value})}
                                type="text" 
                                placeholder="Dropped on floor, Expired, etc." 
                                className="w-full bg-[#151923] border border-[#2a3040] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" 
                            />
                        </div>
                        <button 
                            disabled={isSubmittingWastage}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send size={18} /> {isSubmittingWastage ? 'Submitting...' : 'Submit Wastage Log'}
                        </button>
                    </div>
                </form>

                {/* Request Restock Form */}
                <form onSubmit={handleRestockSubmit} className="bg-[#1e2330] rounded-2xl border border-[#2a3040] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[#2a3040] bg-[#1a1e2a] flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-400" />
                        <h3 className="font-bold text-gray-200 text-lg">Request Restock (Running Low)</h3>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-1.5">Ingredient Needed *</label>
                            <input 
                                required
                                value={restockForm.ingredientNeeded}
                                onChange={(e) => setRestockForm({...restockForm, ingredientNeeded: e.target.value})}
                                type="text" 
                                placeholder="e.g. Avocado" 
                                className="w-full bg-[#151923] border border-[#2a3040] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" 
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-1.5">Urgency</label>
                            <div className="flex gap-4">
                                <label className="flex-1 flex items-center gap-2 p-3 border border-[#2a3040] rounded-xl cursor-pointer hover:bg-[#252b3b]">
                                    <input 
                                        type="radio" 
                                        name="urgency" 
                                        value="Standard"
                                        checked={restockForm.urgency === 'Standard'}
                                        onChange={(e) => setRestockForm({...restockForm, urgency: e.target.value})}
                                        className="accent-orange-500" 
                                    /> 
                                    <span className="text-gray-300 font-medium">Standard</span>
                                </label>
                                <label className="flex-1 flex items-center gap-2 p-3 border border-orange-500/30 bg-orange-500/5 rounded-xl cursor-pointer hover:bg-orange-500/10">
                                    <input 
                                        type="radio" 
                                        name="urgency" 
                                        value="Urgent"
                                        checked={restockForm.urgency === 'Urgent'}
                                        onChange={(e) => setRestockForm({...restockForm, urgency: e.target.value})}
                                        className="accent-orange-500" 
                                    /> 
                                    <span className="text-orange-400 font-bold">Urgent (86 Risk)</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold text-gray-400 block mb-1.5">Notes to Manager</label>
                            <input 
                                value={restockForm.notes}
                                onChange={(e) => setRestockForm({...restockForm, notes: e.target.value})}
                                type="text" 
                                placeholder="We have enough for 5 more orders." 
                                className="w-full bg-[#151923] border border-[#2a3040] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors" 
                            />
                        </div>
                        <button 
                            disabled={isSubmittingRestock}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={18} /> {isSubmittingRestock ? 'Sending...' : 'Send Request to Manager'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default ChefInventory;
