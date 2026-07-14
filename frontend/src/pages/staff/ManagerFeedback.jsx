import { useState } from 'react';
import { Star, MessageSquareReply, ThumbsUp, AlertCircle, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const mockFeedback = [
    { id: '#FB-101', customer: 'Alex Johnson', orderId: '#ORD-092', rating: 5, comment: 'Food was amazing and arrived hot. The new spicy chicken is highly recommended!', time: '2 hours ago', status: 'New', type: 'Positive' },
    { id: '#FB-102', customer: 'Maria Garcia', orderId: '#ORD-045', rating: 2, comment: 'Wait time was over 45 minutes for a simple dine-in order. Unacceptable.', time: '5 hours ago', status: 'Requires Action', type: 'Negative' },
    { id: '#FB-103', customer: 'David Kim', orderId: '#ORD-088', rating: 4, comment: 'Great service from Elena. Slightly loud music though.', time: 'Yesterday', status: 'Replied', type: 'Neutral' },
];

const ManagerFeedback = () => {
    const [actionModal, setActionModal] = useState({ show: false, type: '', feedback: null });

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Customer Feedback</h2>
                    <p className="text-gray-500 text-sm mt-1">Monitor branch ratings and respond to customer concerns.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Avg Rating (30 Days)</p>
                        <p className="text-2xl font-bold text-gray-900 flex items-center justify-end gap-1">4.8 <Star size={20} className="text-yellow-400 fill-current" /></p>
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <button onClick={() => toast.success('Filtering by All...')} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-900 text-white flex items-center gap-2">
                    <Filter size={16} /> All Reviews (142)
                </button>
                {['Requires Action (1)', '5 Stars', 'Negative', 'Unread'].map((filter, i) => (
                    <button key={i} onClick={() => toast.success(`Filtering by ${filter}...`)} className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        {filter}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            <div className="grid grid-cols-1 gap-4">
                {mockFeedback.map((fb, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden ${fb.type === 'Negative' ? 'border-red-200' : 'border-gray-100'}`}>
                        {fb.type === 'Negative' && <div className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg"><AlertCircle size={14} /></div>}
                        
                        <div className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 pr-4">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{fb.customer}</h3>
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, idx) => (
                                    <Star key={idx} size={16} className={idx < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'} />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Order: <span className="font-bold text-gray-700">{fb.orderId}</span></p>
                            <p className="text-xs text-gray-400 mt-1">{fb.time}</p>
                        </div>

                        <div className="flex-1">
                            <p className="text-gray-700 leading-relaxed text-sm">{fb.comment}</p>
                            
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                {fb.status === 'Requires Action' ? (
                                    <button onClick={() => setActionModal({ show: true, type: 'resolve', feedback: fb })} className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-4 py-2 rounded-lg transition-colors border border-red-200 flex items-center gap-2">
                                        <MessageSquareReply size={16} /> Resolve Issue
                                    </button>
                                ) : fb.status === 'New' ? (
                                    <button onClick={() => setActionModal({ show: true, type: 'reply', feedback: fb })} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                                        <MessageSquareReply size={16} /> Reply
                                    </button>
                                ) : (
                                    <span className="text-sm font-bold text-gray-400 flex items-center gap-1"><ThumbsUp size={14} /> Replied</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Modals */}
            {actionModal.show && actionModal.feedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                {actionModal.type === 'reply' ? <><MessageSquareReply size={20} className="text-blue-600"/> Reply to Feedback</> : <><AlertCircle size={20} className="text-red-600"/> Resolve Issue</>}
                            </h3>
                            <button onClick={() => setActionModal({ show: false, type: '', feedback: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                                {actionModal.type === 'resolve' && <div className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg rounded-tr-xl"><AlertCircle size={14} /></div>}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900">{actionModal.feedback.customer}</p>
                                        <p className="text-xs text-gray-500">Order {actionModal.feedback.orderId}</p>
                                    </div>
                                    <div className="flex items-center gap-1 pr-6">
                                        {[...Array(5)].map((_, idx) => (
                                            <Star key={idx} size={14} className={idx < actionModal.feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{actionModal.feedback.comment}"</p>
                            </div>

                            {actionModal.type === 'reply' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Your Public Response</label>
                                    <textarea rows="4" placeholder="Thank you for your feedback..." className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                                </div>
                            )}

                            {actionModal.type === 'resolve' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Action Taken</label>
                                        <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4">
                                            <option>Contacted Customer Privately</option>
                                            <option>Issued Full Refund</option>
                                            <option>Provided Promo Code</option>
                                            <option>Escalated to Corporate</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Internal Resolution Notes</label>
                                        <textarea rows="3" placeholder="Explain how this was handled..." className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
                            <button onClick={() => setActionModal({ show: false, type: '', feedback: null })} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                            <button 
                                onClick={() => { 
                                    toast.success(actionModal.type === 'reply' ? 'Reply posted!' : 'Issue marked as resolved!');
                                    setActionModal({ show: false, type: '', feedback: null }); 
                                }} 
                                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors ${
                                    actionModal.type === 'reply' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {actionModal.type === 'reply' ? 'Post Reply' : 'Mark as Resolved'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerFeedback;
