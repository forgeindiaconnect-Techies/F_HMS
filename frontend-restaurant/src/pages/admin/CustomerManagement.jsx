import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Star, Mail, Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getTierStyle = (tier) => {
    switch(tier) {
        case 'Platinum': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'Silver': return 'bg-gray-200 text-gray-700 border-gray-300';
        default: return 'bg-orange-50 text-orange-700 border-orange-200'; // Bronze
    }
};

const CustomerManagement = () => {
    const { api } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState('All Tiers');

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customers');
            setCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', formData);
            fetchCustomers();
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '' });
            toast.success('Customer added successfully');
        } catch (error) {
            console.error('Failed to create customer', error);
            toast.error(error.response?.data?.message || 'Error creating customer');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (c.phone && c.phone.includes(searchQuery));
        const matchesTier = tierFilter === 'All Tiers' || c.tier === tierFilter;
        return matchesSearch && matchesTier;
    });

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Customer CRM</h2>
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Manage customer profiles, loyalty points, and history.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-initial justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 sm:px-4 py-2.5 rounded-xl font-medium transition-colors text-xs sm:text-sm shadow-sm flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-initial justify-center bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-xs sm:text-sm shadow-md shadow-green-900/10 whitespace-nowrap" 
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                        <Plus size={18} /> Add Customer
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by name, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-600 text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-green-500">
                        <option>All Tiers</option>
                        <option>Platinum</option>
                        <option>Gold</option>
                        <option>Silver</option>
                        <option>Bronze</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center p-12 sm:p-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center p-12 sm:p-20">
                        <p className="text-gray-500 text-sm">No customers found. Add a customer or wait for orders to arrive.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[640px]">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Visits</th>
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Spend</th>
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Loyalty Tier</th>
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Visit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-green-600 transition-colors truncate">{customer.name}</p>
                                                    <p className="text-[11px] sm:text-xs text-gray-500">CUS-{customer.id.substring(customer.id.length - 4).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-1 truncate max-w-[200px]">
                                                <Mail size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{customer.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                                <Phone size={14} className="text-gray-400 shrink-0" /> {customer.phone}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-center font-bold text-xs sm:text-sm text-gray-700">
                                            {customer.visits}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right font-bold text-xs sm:text-sm text-green-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                            ₹{customer.totalSpend.toFixed(2)}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide border ${getTierStyle(customer.tier)}`}>
                                                <Star size={12} className={customer.tier === 'Platinum' || customer.tier === 'Gold' ? 'fill-current' : ''} />
                                                {customer.tier}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm text-gray-500">
                                            {formatDate(customer.lastVisit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg">Add New Customer</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3.5 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-3.5 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full px-3.5 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-xs sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-xs sm:text-sm"
                                >
                                    Create Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManagement;
