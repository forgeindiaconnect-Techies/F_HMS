import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Star, ShoppingBag, MessageSquare, ExternalLink, Receipt, X, Printer } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const OrderHistory = () => {
    const { api } = useCustomerAuth();
    const [pastOrders, setPastOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [rating, setRating] = useState(0);
    const [activeReceipt, setActiveReceipt] = useState(null);

    const handlePrintReceipt = (receipt) => {
        if (!receipt) return;
        const itemsHtml = receipt.orderItems.map(item => `
            <tr>
                <td style="padding: 6px 0; font-size: 14px;">${item.name} x ${item.qty}</td>
                <td style="padding: 6px 0; font-size: 14px; text-align: right;">₹${(item.price * item.qty).toFixed(2)}</td>
            </tr>
        `).join('');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Order Receipt #${receipt._id.substring(receipt._id.length - 6).toUpperCase()}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .border-top { border-top: 1px dashed #000; }
                        .border-bottom { border-bottom: 1px dashed #000; }
                        table { width: 100%; border-collapse: collapse; }
                        .info { margin: 10px 0; font-size: 12px; }
                        .total-row { font-weight: bold; font-size: 16px; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h2 style="margin: 0 0 5px 0;">${receipt.restaurantId?.name || 'RestoSys Restaurant'}</h2>
                        <p style="margin: 0; font-size: 12px;">Thank you for dining with us!</p>
                    </div>
                    <div class="info border-top border-bottom" style="padding: 8px 0;">
                        <p style="margin: 3px 0;">ORDER ID: #${receipt._id.substring(receipt._id.length - 6).toUpperCase()}</p>
                        <p style="margin: 3px 0;">DATE: ${new Date(receipt.createdAt).toLocaleString()}</p>
                        <p style="margin: 3px 0;">METHOD: ${receipt.orderType}</p>
                        <p style="margin: 3px 0;">STATUS: Paid (${receipt.paymentMethod || 'Online'})</p>
                    </div>
                    <table style="margin: 10px 0;">
                        ${itemsHtml}
                    </table>
                    <div class="border-top" style="padding-top: 8px; font-size: 13px;">
                        <table>
                            <tr>
                                <td>Subtotal</td>
                                <td style="text-align: right;">₹${(receipt.totalPrice - (receipt.taxPrice || 0)).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>GST & SGST</td>
                                <td style="text-align: right;">₹${(receipt.taxPrice || 0).toFixed(2)}</td>
                            </tr>
                            <tr class="total-row border-top" style="padding-top: 5px;">
                                <td>GRAND TOTAL</td>
                                <td style="text-align: right;">₹${receipt.totalPrice.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="center" style="margin-top: 25px; font-size: 12px;">
                        <p>--- Powering Restaurant SaaS ---</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

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
                                    <button 
                                        onClick={() => setActiveReceipt(order)} 
                                        className="text-sm font-bold text-orange-600 hover:text-orange-750 flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
                                    >
                                        View Receipt <ExternalLink size={14} />
                                    </button>
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

            {/* Receipt Modal */}
            {activeReceipt && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="text-orange-600" size={24} />
                                <h3 className="text-lg font-bold text-gray-900 font-sans">Order Receipt</h3>
                            </div>
                            <button onClick={() => setActiveReceipt(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 overflow-y-auto max-h-[70vh] space-y-6 text-left">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-950">{activeReceipt.restaurantId?.name || 'Restaurant Partner'}</h2>
                                <p className="text-xs text-gray-500 mt-1">Order #{activeReceipt._id.substring(activeReceipt._id.length - 6).toUpperCase()}</p>
                            </div>

                            <div className="border-t border-b border-gray-100 py-3 text-xs space-y-1.5 text-gray-600 font-medium">
                                <div className="flex justify-between"><span>Date / Time:</span><span className="text-gray-950 font-bold">{new Date(activeReceipt.createdAt).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Order Method:</span><span className="text-gray-950 font-bold">{activeReceipt.orderType}</span></div>
                                <div className="flex justify-between"><span>Payment Method:</span><span className="text-gray-950 font-bold">{activeReceipt.paymentMethod || 'Card'}</span></div>
                                <div className="flex justify-between"><span>Status:</span><span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-extrabold border border-green-150">Paid</span></div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</h4>
                                <div className="space-y-2">
                                    {activeReceipt.orderItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-900">
                                            <span>{item.qty}x {item.name}</span>
                                            <span>₹{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between font-medium">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900">₹{(activeReceipt.totalPrice - (activeReceipt.taxPrice || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span>Taxes (GST & SGST)</span>
                                    <span className="text-gray-900">₹{(activeReceipt.taxPrice || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-black text-gray-950 pt-2 border-t border-gray-100">
                                    <span>Total Paid</span>
                                    <span className="text-orange-600">₹{activeReceipt.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button 
                                onClick={() => handlePrintReceipt(activeReceipt)}
                                className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer text-sm"
                            >
                                <Printer size={16} /> Print Receipt
                            </button>
                            <button 
                                onClick={() => setActiveReceipt(null)}
                                className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-gray-700 border border-gray-250 font-bold rounded-xl transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95 cursor-pointer text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
