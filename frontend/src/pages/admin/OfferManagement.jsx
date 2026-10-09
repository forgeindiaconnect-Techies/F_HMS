import { useState, useEffect } from 'react';
import { Search, Plus, Tag, Copy, Trash2, X, Calendar, Percent, DollarSign, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const OfferManagement = () => {
    const { api } = useAuth();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'Percentage',
        discountValue: '',
        minSpend: 0,
        expiresAt: '',
        usageLimit: 0,
        isActive: true
    });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    const fetchData = async () => {
        try {
            const res = await api.get('/offers');
            setOffers(res.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Offer',
            message: 'Are you sure you want to delete this offer?',
            onConfirm: async () => {
                try {
                    await api.delete(`/offers/${id}`);
                    fetchData();
                    toast.success('Offer deleted successfully');
                } catch (error) {
                    console.error('Failed to delete offer', error);
                    toast.error('Failed to delete offer');
                }
            },
            isDestructive: true
        });
    };

    const handleAddClick = () => {
        setFormData({
            code: '',
            type: 'Percentage',
            discountValue: '',
            minSpend: 0,
            expiresAt: '',
            usageLimit: 0,
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.expiresAt === '') delete payload.expiresAt;
            payload.discountValue = Number(payload.discountValue);
            payload.minSpend = Number(payload.minSpend);
            payload.usageLimit = Number(payload.usageLimit);

            await api.post('/offers', payload);
            fetchData();
            setIsModalOpen(false);
            toast.success('Offer created successfully');
        } catch (error) {
            console.error('Failed to create offer', error);
            toast.error(error.response?.data?.message || 'Failed to create offer');
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Code copied to clipboard');
    };

    // Calculate status of an offer
    const getOfferStatus = (offer) => {
        if (!offer.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
        if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
        if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) return { label: 'Depleted', color: 'bg-orange-100 text-orange-700' };
        return { label: 'Active', color: 'bg-green-100 text-green-700' };
    };

    const filteredOffers = offers.filter(offer => 
        offer.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans relative">
            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Offers & Coupons</h2>
                    <p className="text-gray-500 text-sm mt-1">Create and manage discounts, promotions, and coupons.</p>
                </div>
                <button 
                    onClick={handleAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md shadow-green-900/10"
                >
                    <Plus size={18} /> Create Offer
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search promo codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                </div>
                <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-green-500 ml-auto md:ml-0">
                    <option>All Types</option>
                    <option>Percentage</option>
                    <option>Fixed Amount</option>
                    <option>Free Shipping</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : filteredOffers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    No active offers found. Click "+ Create Offer" to start a promotion.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredOffers.map(offer => {
                        const status = getOfferStatus(offer);
                        return (
                            <div key={offer._id} className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group overflow-hidden ${status.label === 'Expired' || status.label === 'Depleted' || status.label === 'Inactive' ? 'opacity-75' : ''}`}>
                                
                                {/* Status Banner */}
                                <div className={`absolute top-0 right-0 px-8 py-1 transform translate-x-6 translate-y-3 rotate-45 text-[10px] font-bold tracking-wider uppercase text-white shadow-sm ${status.label === 'Active' ? 'bg-green-500' : status.label === 'Depleted' ? 'bg-orange-500' : 'bg-gray-400'}`}>
                                    {status.label}
                                </div>

                                <div className="flex items-start gap-4 mb-6 pt-2">
                                    <div className={`p-3 rounded-xl shrink-0 ${status.label === 'Active' ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}`}>
                                        <Tag size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-gray-900 text-xl tracking-tight">{offer.code}</h3>
                                            <button onClick={() => copyToClipboard(offer.code)} className="text-gray-400 hover:text-gray-600 transition-colors" title="Copy code">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <p className="text-green-600 font-bold text-sm mt-0.5">
                                            {offer.type === 'Percentage' ? `${offer.discountValue}% OFF` : 
                                             offer.type === 'Fixed Amount' ? `₹${offer.discountValue.toFixed(2)} OFF` : 
                                             'FREE SHIPPING'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">Type</span>
                                        <span className="font-bold text-gray-700 flex items-center gap-1.5">
                                            {offer.type === 'Percentage' && <Percent size={12} className="text-gray-400"/>}
                                            {offer.type === 'Fixed Amount' && <DollarSign size={12} className="text-gray-400"/>}
                                            {offer.type === 'Free Shipping' && <Truck size={12} className="text-gray-400"/>}
                                            {offer.type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">Min. Spend</span>
                                        <span className="font-bold text-gray-700">₹{offer.minSpend.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">Expires</span>
                                        <span className="font-bold text-gray-700 flex items-center gap-1.5">
                                            {offer.expiresAt ? (
                                                <>
                                                    <Calendar size={12} className="text-gray-400"/>
                                                    {new Date(offer.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </>
                                            ) : 'Never'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-gray-500 uppercase tracking-wide">Usage</span>
                                        <span className="text-gray-900">{offer.usedCount} / {offer.usageLimit || 'Unlimited'}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${offer.usageLimit && offer.usedCount >= offer.usageLimit ? 'bg-orange-500' : 'bg-green-500'}`} 
                                            style={{ width: offer.usageLimit ? `${Math.min((offer.usedCount / offer.usageLimit) * 100, 100)}%` : '100%' }}
                                        ></div>
                                    </div>
                                </div>
                                
                                {/* Hover Actions */}
                                <div className="absolute top-4 left-4 transition-opacity">
                                    <button 
                                        onClick={() => handleDelete(offer._id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm"
                                        title="Delete Offer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">Create New Offer</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="offer-form" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Promo Code *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-black tracking-widest uppercase"
                                        placeholder="e.g. SUMMER2026"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Customers will enter this code at checkout.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Discount Type</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        >
                                            <option value="Percentage">Percentage (%)</option>
                                            <option value="Fixed Amount">Fixed Amount ($)</option>
                                            <option value="Free Shipping">Free Shipping</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Discount Value *</label>
                                        <div className="relative">
                                            {formData.type === 'Fixed Amount' && <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                                            <input 
                                                type="number" 
                                                min="0"
                                                step="any"
                                                required
                                                value={formData.discountValue}
                                                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                                                disabled={formData.type === 'Free Shipping'}
                                                className={`w-full ${formData.type === 'Fixed Amount' ? 'pl-9' : 'pl-4'} ${formData.type === 'Percentage' ? 'pr-8' : 'pr-4'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-bold`}
                                                placeholder={formData.type === 'Free Shipping' ? 'N/A' : '0.00'}
                                            />
                                            {formData.type === 'Percentage' && <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Minimum Spend ($)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="any"
                                            value={formData.minSpend}
                                            onChange={(e) => setFormData({...formData, minSpend: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Usage Limit</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={formData.usageLimit}
                                            onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                            placeholder="Leave 0 for unlimited"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Number of times this code can be used.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Expiration Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium"
                                    />
                                </div>
                                
                                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 shrink-0 mt-8 -mx-6 -mb-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                    >
                                        Create Offer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferManagement;
