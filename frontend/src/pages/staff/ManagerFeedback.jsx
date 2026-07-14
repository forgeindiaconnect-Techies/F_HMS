import { Star, MessageSquareReply, ThumbsUp, AlertCircle, Filter } from 'lucide-react';

const mockFeedback = [
    { id: '#FB-101', customer: 'Alex Johnson', orderId: '#ORD-092', rating: 5, comment: 'Food was amazing and arrived hot. The new spicy chicken is highly recommended!', time: '2 hours ago', status: 'New', type: 'Positive' },
    { id: '#FB-102', customer: 'Maria Garcia', orderId: '#ORD-045', rating: 2, comment: 'Wait time was over 45 minutes for a simple dine-in order. Unacceptable.', time: '5 hours ago', status: 'Requires Action', type: 'Negative' },
    { id: '#FB-103', customer: 'David Kim', orderId: '#ORD-088', rating: 4, comment: 'Great service from Elena. Slightly loud music though.', time: 'Yesterday', status: 'Replied', type: 'Neutral' },
];

const ManagerFeedback = () => {
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
                <button onClick={() => alert('Filtering by All...')} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-900 text-white flex items-center gap-2">
                    <Filter size={16} /> All Reviews (142)
                </button>
                {['Requires Action (1)', '5 Stars', 'Negative', 'Unread'].map((filter, i) => (
                    <button key={i} onClick={() => alert(`Filtering by ${filter}...`)} className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
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
                                    <button onClick={() => alert(`Resolving issue for ${fb.customer}...`)} className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-4 py-2 rounded-lg transition-colors border border-red-200 flex items-center gap-2">
                                        <MessageSquareReply size={16} /> Resolve Issue
                                    </button>
                                ) : fb.status === 'New' ? (
                                    <button onClick={() => alert(`Replying to ${fb.customer}...`)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2">
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
        </div>
    );
};

export default ManagerFeedback;
