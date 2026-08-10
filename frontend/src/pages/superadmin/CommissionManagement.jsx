import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Percent, PercentCircle, Search, Edit2, Check, X, ShieldAlert, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const CommissionManagement = () => {
    const { api } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingRate, setEditingRate] = useState(0);

    const fetchRestaurants = async () => {
        try {
            const res = await api.get('/super-admin/restaurants');
            setRestaurants(res.data);
        } catch (error) {
            console.error("Failed to fetch restaurants for commission management", error);
            toast.error('Failed to load restaurants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, [api]);

    const handleStartEditing = (restaurant) => {
        setEditingId(restaurant._id);
        setEditingRate(restaurant.commissionRate || 0);
    };

    const handleSaveRate = async (id) => {
        try {
            if (editingRate < 0 || editingRate > 100) {
                toast.error('Commission rate must be between 0 and 100%');
                return;
            }
            await api.put(`/super-admin/restaurants/${id}/approval`, { commissionRate: editingRate });
            setRestaurants(restaurants.map(r => 
                r._id === id ? { ...r, commissionRate: editingRate } : r
            ));
            setEditingId(null);
            toast.success('Commission rate updated successfully!');
        } catch (error) {
            console.error("Failed to update commission rate", error);
            toast.error('Failed to update commission rate');
        }
    };

    const filteredRestaurants = restaurants.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Commission calculations based on current restaurant configurations
    const totalCommissionEarned = restaurants.reduce((sum, r) => sum + ((r.totalRevenue || 0) * (r.commissionRate || 0) / 100), 0);
    const averageRate = restaurants.length > 0 
        ? (restaurants.reduce((sum, r) => sum + (r.commissionRate || 0), 0) / restaurants.length).toFixed(1)
        : 0;

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight">Commission Management</h2>
                <p className="text-gray-500">Configure global order commission percentages for platform restaurants.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                        <PercentCircle size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Average Commission Rate</p>
                        <h3 className="text-2xl font-black text-gray-900">{averageRate}%</h3>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-50 text-green-600 shrink-0">
                        <Award size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Commission Revenue</p>
                        <h3 className="text-2xl font-black text-gray-900">₹{totalCommissionEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
                        <Percent size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Active Restaurants</p>
                        <h3 className="text-2xl font-black text-gray-900">{restaurants.length}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-lg">Restaurant Commission Rates</h3>
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="p-5 font-bold">Restaurant</th>
                                <th className="p-5 font-bold">Owner Email</th>
                                <th className="p-5 font-bold">Subscription Plan</th>
                                <th className="p-5 font-bold">Commission Rate</th>
                                <th className="p-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRestaurants.map(restaurant => (
                                <tr key={restaurant._id} className="hover:bg-gray-50/80 transition-colors text-sm">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                {restaurant.logo ? (
                                                    <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-base">
                                                        {restaurant.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900">{restaurant.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-gray-500 font-medium">
                                        {restaurant.ownerId?.email || 'N/A'}
                                    </td>
                                    <td className="p-5">
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                                            {restaurant.subscription?.plan || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {editingId === restaurant._id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={editingRate}
                                                    onChange={(e) => setEditingRate(Number(e.target.value))}
                                                    className="w-20 px-2.5 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="text-gray-500 font-bold">%</span>
                                            </div>
                                        ) : (
                                            <span className="font-black text-gray-900 text-base">
                                                {restaurant.commissionRate || 0}%
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right whitespace-nowrap">
                                        {editingId === restaurant._id ? (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleSaveRate(restaurant._id)}
                                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                    title="Save"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleStartEditing(restaurant)}
                                                className="px-3.5 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all flex items-center gap-1.5 ml-auto active:scale-[0.97]"
                                            >
                                                <Edit2 size={12} /> Edit Rate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredRestaurants.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center">
                                        <ShieldAlert className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-500 font-medium text-lg">No restaurants matching the search query.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommissionManagement;
