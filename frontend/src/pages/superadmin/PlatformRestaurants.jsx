import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Ban, RefreshCw, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const PlatformRestaurants = () => {
    const { api } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRestaurant, setViewingRestaurant] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        isDestructive: true
    });

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get('/super-admin/restaurants');
                setRestaurants(res.data);
            } catch (error) {
                console.error("Failed to fetch restaurants", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, [api]);

    const handleApproval = async (id, status) => {
        try {
            await api.put(`/super-admin/restaurants/${id}/approval`, { approvalStatus: status });
            setRestaurants(restaurants.map(r => 
                r._id === id ? { ...r, approvalStatus: status } : r
            ));
            toast.success(`Restaurant ${status.toLowerCase()} successfully!`);
        } catch (error) {
            toast.error('Failed to update approval status');
        }
    };

    const handleFreezeAccount = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Frozen' : 'Active';
        try {
            await api.put(`/super-admin/restaurants/${id}/subscription`, { status: newStatus });
            setRestaurants(restaurants.map(r => 
                r._id === id ? { ...r, subscription: { ...r.subscription, status: newStatus } } : r
            ));
            toast.success(`Account status updated to ${newStatus}!`);
        } catch (error) {
            toast.error('Failed to update subscription');
        }
    };

    const handleDeleteRestaurant = async (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Restaurant',
            message: 'Are you sure you want to permanently delete this restaurant? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/super-admin/restaurants/${id}`);
                } catch (error) {
                    if (error.response?.status !== 404) {
                        console.error("Failed to delete restaurant", error);
                    }
                } finally {
                    setRestaurants(prev => prev.filter(r => r._id !== id));
                    toast.success('Restaurant deleted successfully!');
                }
            },
            isDestructive: true
        });
    };

    const calculateRemainingDays = (expiryDate) => {
        if (!expiryDate) return 'No expiry date set';
        const diffTime = new Date(expiryDate) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `Expired ${Math.abs(diffDays)} days ago`;
        }
        return `${diffDays} days remaining`;
    };

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 font-sans">Platform Restaurants</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                                <th className="p-4 font-bold">Restaurant</th>
                                <th className="p-4 font-bold">Owner</th>
                                <th className="p-4 font-bold">Plan</th>
                                <th className="p-4 font-bold">Approval</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {restaurants.map(restaurant => (
                                <tr key={restaurant._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                {restaurant.logo ? (
                                                    <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                                        {restaurant.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900">{restaurant.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-semibold text-gray-900">{restaurant.ownerId?.name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{restaurant.ownerId?.email || 'N/A'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                            {restaurant.subscription?.plan || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {restaurant.approvalStatus === 'Pending' && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Pending</span>}
                                        {restaurant.approvalStatus === 'Approved' && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Approved</span>}
                                        {restaurant.approvalStatus === 'Rejected' && <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Rejected</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                            restaurant.subscription?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {restaurant.subscription?.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => setViewingRestaurant(restaurant)} 
                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" 
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        {restaurant.approvalStatus === 'Pending' && (
                                            <>
                                                <button onClick={() => handleApproval(restaurant._id, 'Approved')} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg" title="Approve">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={() => handleApproval(restaurant._id, 'Rejected')} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title="Reject">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                        {restaurant.approvalStatus === 'Approved' && (
                                            <button 
                                                onClick={() => handleFreezeAccount(restaurant._id, restaurant.subscription?.status)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    restaurant.subscription?.status === 'Active' 
                                                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                    : 'text-green-600 bg-green-50 hover:bg-green-100'
                                                }`}
                                                title={restaurant.subscription?.status === 'Active' ? 'Freeze Account' : 'Unfreeze Account'}
                                            >
                                                {restaurant.subscription?.status === 'Active' ? <Ban size={18} /> : <RefreshCw size={18} />}
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => handleDeleteRestaurant(restaurant._id)} 
                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" 
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {restaurants.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No restaurants registered yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Modal */}
            {viewingRestaurant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setViewingRestaurant(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Restaurant Subscription Details</h3>
                            <button onClick={() => setViewingRestaurant(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                    {viewingRestaurant.logo ? (
                                        <img src={viewingRestaurant.logo} alt={viewingRestaurant.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-2xl">
                                            {viewingRestaurant.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">{viewingRestaurant.name}</h4>
                                    <p className="text-sm text-gray-700 font-medium">Owner: {viewingRestaurant.ownerId?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{viewingRestaurant.ownerId?.email || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Subscription Plan:</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                        {viewingRestaurant.subscription?.plan || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Subscription Status:</span>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                        viewingRestaurant.subscription?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {viewingRestaurant.subscription?.status || 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Start Date:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.createdAt ? new Date(viewingRestaurant.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Expiry / End Date:</span>
                                    <span className="text-gray-900 font-semibold">
                                        {viewingRestaurant.subscription?.expiryDate ? new Date(viewingRestaurant.subscription?.expiryDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
                                    <span className="text-gray-500 font-medium">Subscription Period:</span>
                                    <span className={`font-bold ${
                                        viewingRestaurant.subscription?.expiryDate && (new Date(viewingRestaurant.subscription?.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) <= 7
                                        ? 'text-red-600'
                                        : 'text-gray-900'
                                    }`}>
                                        {calculateRemainingDays(viewingRestaurant.subscription?.expiryDate)}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setViewingRestaurant(null)}
                                className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors text-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                {...confirmModal} 
                onClose={() => setConfirmModal({...confirmModal, isOpen: false})} 
            />
        </div>
    );
};

export default PlatformRestaurants;
