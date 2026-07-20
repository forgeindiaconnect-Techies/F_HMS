import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Star, ShoppingBag, MessageSquare, ExternalLink } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const OrderHistory = () => {
    const { api } = useCustomerAuth();
    const [pastOrders, setPastOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [rating, setRating] = useState(0);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders/myorders');
                setPastOrders(data);
            } catch (error) {
                console.error('Failed to fetch past orders', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [api]);

    const handleSubmitReview = (e, id) => {
        e.preventDefault();
        alert(`Review submitted for order ${id}! Thank you for your feedback.`);
        setReviewingId(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/profile" className="p-2 bg-white rounded-xl shadow-sm hover:text-orange-600 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight">Order History</h1>
                        <p className="text-gray-500">View your past orders and leave reviews.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading orders...</div>
                    ) : pastOrders.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">You haven't placed any orders yet.</div>
                    ) : pastOrders.map((order) => (
                        <div key={order._id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all hover:border-orange-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                                        <ShoppingBag size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 font-sans mb-1 flex items-center flex-wrap gap-2">
                                            #{order._id.substring(order._id.length - 6).toUpperCase()}
                                            {order.subscriptionPlan && order.subscriptionPlan !== 'One-time Order' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                                    {order.subscriptionPlan}
                                                </span>
                                            )}
                                            {order.restaurantId?.name && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                                                    📍 {order.restaurantId.name}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()} • {order.status} • Paid via {order.paymentMethod || 'Card'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                                    <span className="text-2xl font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</span>
                                    <Link to={`/track/${order._id}`} className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                        View Receipt <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Items</p>
                                    <p className="font-medium text-gray-900">{order.orderItems.map(i => `${i.name} (${i.qty})`).join(', ')}</p>
                                </div>
                                
                                {order.hasReview ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-gray-500 text-sm font-bold border border-gray-100">
                                        <Star size={16} className="fill-yellow-400 text-yellow-400" /> Reviewed
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setReviewingId(reviewingId === order._id ? null : order._id)}
                                        className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <MessageSquare size={16} /> Leave Review
                                    </button>
                                )}
                            </div>

                            {/* Review Dropdown Form */}
                            {reviewingId === order._id && (
                                <div className="mt-8 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4">
                                    <form onSubmit={(e) => handleSubmitReview(e, order._id)}>
                                        <h4 className="font-bold text-gray-900 mb-4">How was your meal?</h4>
                                        <div className="flex gap-2 mb-6">
                                            {[1,2,3,4,5].map(star => (
                                                <button 
                                                    key={star} 
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="p-2 transition-transform hover:scale-110 active:scale-95"
                                                >
                                                    <Star size={32} className={rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            rows="3" 
                                            placeholder="Tell us what you loved (or what we can improve)..." 
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900 resize-none mb-4"
                                            required
                                        ></textarea>
                                        <div className="flex justify-end gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setReviewingId(null)}
                                                className="px-6 py-2.5 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-600/20"
                                            >
                                                Submit Review
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderHistory;
