import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    ChevronLeft, Send, Paperclip, LifeBuoy, AlertCircle, 
    Star, Clock, Check, CheckCheck, Lock, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, api } = useAuth();
    
    const [ticket, setTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [message, setMessage] = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [files, setFiles] = useState([]);
    
    // Rating states
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef(null);

    const isAgentOrAdmin = user?.role === 'SuperAdmin' || user?.role === 'SupportAgent';

    const fetchTicketDetails = useCallback(async () => {
        try {
            const ticketRes = await api.get(`/support/tickets/${id}`);
            setTicket(ticketRes.data);
            
            if (ticketRes.data.csatRating) {
                setRatingSubmitted(true);
            }

            const repliesRes = await api.get(`/support/tickets/${id}/replies`);
            setReplies(repliesRes.data);

            // Mark replies as read
            await api.post(`/support/tickets/${id}/read`);
        } catch (error) {
            console.error('Failed to load ticket details:', error);
            toast.error('Failed to load ticket.');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [id, api, navigate]);

    useEffect(() => {
        fetchTicketDetails();
    }, [fetchTicketDetails]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (replies.length > 0) {
            scrollToBottom();
        }
    }, [replies]);

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles([...files, ...selected]);
    };

    const handleRemoveFile = (index) => {
        setFiles(files.filter((_, idx) => idx !== index));
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!message.trim() && files.length === 0) return;

        setSending(true);
        const formData = new FormData();
        formData.append('message', message);
        if (isAgentOrAdmin) {
            formData.append('isInternalNote', isInternalNote);
        }
        files.forEach(file => {
            formData.append('attachments', file);
        });

        try {
            const res = await api.post(`/support/tickets/${id}/replies`, formData);
            
            // Append new reply and reset form
            setReplies([...replies, {
                ...res.data,
                senderId: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }]);
            setMessage('');
            setFiles([]);
            setIsInternalNote(false);
            
            // Re-fetch ticket to get potential status change (e.g. In Progress / Waiting for Customer)
            const updatedTkt = await api.get(`/support/tickets/${id}`);
            setTicket(updatedTkt.data);

            toast.success('Reply sent successfully!');
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const handleRatingSubmit = async () => {
        if (rating === 0) return toast.error('Please select a star rating');
        try {
            await api.post(`/support/tickets/${id}/rate`, {
                csatRating: rating,
                csatFeedback: feedback
            });
            setRatingSubmitted(true);
            toast.success('Thank you for your rating!');
            
            // Refresh ticket data
            const updatedTkt = await api.get(`/support/tickets/${id}`);
            setTicket(updatedTkt.data);
        } catch (error) {
            toast.error('Failed to submit feedback rating');
        }
    };

    const handleCloseTicket = async () => {
        try {
            await api.put(`/support/tickets/${id}`, { status: 'Closed' });
            toast.success('Ticket marked as Closed');
            fetchTicketDetails();
        } catch (error) {
            toast.error('Failed to close ticket');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                <p className="text-sm font-semibold text-gray-500">Loading conversation thread...</p>
            </div>
        );
    }

    const priorityColors = {
        'Critical': 'bg-red-100 text-red-800 border-red-200 font-extrabold animate-pulse',
        'High': 'bg-red-50 text-red-700 border-red-100',
        'Medium': 'bg-yellow-50 text-yellow-700 border-yellow-100',
        'Low': 'bg-gray-50 text-gray-600 border-gray-100'
    };

    const statusColors = {
        'Open': 'bg-blue-50 text-blue-700 border-blue-100',
        'Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-100',
        'In Progress': 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse',
        'Waiting for Customer': 'bg-purple-50 text-purple-700 border-purple-100',
        'Resolved': 'bg-green-50 text-green-700 border-green-100',
        'Closed': 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-140px)]">
            {/* Header / Meta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-mono">{ticket.ticketId}</span>
                            <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-full border ${priorityColors[ticket.priority]}`}>
                                {ticket.priority}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-full border ${statusColors[ticket.status]}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <h2 className="text-base font-extrabold text-gray-900 dark:text-slate-100 mt-1.5">{ticket.subject}</h2>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                    {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && !isAgentOrAdmin && (
                        <button 
                            onClick={handleCloseTicket}
                            className="px-4 py-2 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition-all"
                        >
                            Close Ticket
                        </button>
                    )}
                    {isAgentOrAdmin && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase">Assignee:</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-gray-100 dark:border-slate-700">
                                {ticket.assignedAgentId?.name || 'Unassigned'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main view container: Chat + Sidebar */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
                
                {/* Chat Column */}
                <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/20 dark:bg-slate-950/30">
                        
                        {/* Original ticket description */}
                        <div className="flex gap-4 items-start max-w-[85%]">
                            <div className="w-9 h-9 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shrink-0 text-xs uppercase">
                                {ticket.restaurantId?.name?.slice(0, 2) || 'R'}
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-3">
                                <div className="flex items-center justify-between gap-10">
                                    <span className="text-xs font-black text-gray-900 dark:text-slate-100">{ticket.restaurantId?.name} <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Creator</span></span>
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">{new Date(ticket.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">{ticket.description}</p>
                                
                                {ticket.attachments?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {ticket.attachments.map((url, i) => (
                                            <a 
                                                key={i} 
                                                href={`${new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin}${url}`}
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-700 transition-colors"
                                            >
                                                <Paperclip size={10} />
                                                <span>Attachment #{i + 1}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ticket conversation replies */}
                        {replies.map((reply) => {
                            const isMyMessage = reply.senderId._id === user._id;
                            const isInternal = reply.isInternalNote;

                            return (
                                <div 
                                    key={reply._id} 
                                    className={`flex gap-4 items-start max-w-[85%] ${
                                        isMyMessage ? 'ml-auto flex-row-reverse' : ''
                                    }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 border ${
                                        isMyMessage ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                                    }`}>
                                        {reply.senderId.name?.slice(0, 2)}
                                    </div>
                                    <div className={`p-4 rounded-2xl shadow-sm space-y-3 border ${
                                        isInternal ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-900 dark:text-amber-200' :
                                        isMyMessage ? 'bg-green-50/30 dark:bg-green-950/30 border-green-100 dark:border-green-900/40 rounded-tr-none' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-tl-none'
                                    }`}>
                                        <div className="flex items-center justify-between gap-10">
                                            <span className="text-xs font-black text-gray-900 dark:text-slate-100">
                                                {reply.senderId.name} 
                                                <span className={`text-[9px] font-bold uppercase ml-1.5 px-1.5 py-0.5 rounded-full ${
                                                    reply.senderId.role === 'SuperAdmin' || reply.senderId.role === 'SupportAgent'
                                                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                                    : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                                                }`}>
                                                    {reply.senderId.role === 'SupportAgent' ? 'Support Agent' : reply.senderId.role}
                                                </span>
                                                {isInternal && (
                                                    <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full ml-1.5 inline-flex items-center gap-0.5">
                                                        <Lock size={8} /> Internal Note
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">{new Date(reply.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">{reply.message}</p>
                                        
                                        {reply.attachments?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {reply.attachments.map((url, idx) => (
                                                    <a 
                                                        key={idx} 
                                                        href={`${new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin}${url}`}
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-700 transition-colors"
                                                    >
                                                        <Paperclip size={10} />
                                                        <span>Attachment #{idx + 1}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {/* Read Receipts */}
                                        {isMyMessage && (
                                            <div className="text-right flex items-center justify-end gap-1 pt-1">
                                                {reply.readBy?.length > 1 ? (
                                                    <span className="text-green-500" title="Read by support agent"><CheckCheck size={14} /></span>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-slate-600" title="Sent"><Check size={14} /></span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* CSAT Form if resolved */}
                    {ticket.status === 'Resolved' && !isAgentOrAdmin && (
                        <div className="bg-gradient-to-r from-yellow-50 via-amber-50/20 to-yellow-50 dark:from-slate-900 dark:to-slate-800 p-6 border-t border-yellow-100 dark:border-slate-800 shrink-0 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-yellow-100 dark:bg-amber-950/60 text-yellow-700 dark:text-amber-400 rounded-2xl">
                                    <Star size={20} className="fill-current" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">How was your support experience?</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Your feedback helps us maintain standard support operations SLA.</p>
                                </div>
                            </div>

                            {ratingSubmitted ? (
                                <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-2xl border border-green-100/50 dark:border-green-900/50 flex items-center gap-2.5 text-xs font-bold text-green-700 dark:text-green-400">
                                    <CheckCircle size={18} />
                                    <span>You rated this ticket {ticket.csatRating} out of 5 stars. Thank you!</span>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-2">
                                    {/* Star selectors */}
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 text-yellow-400 transition-transform hover:scale-110"
                                            >
                                                <Star 
                                                    size={26} 
                                                    className={star <= (hoverRating || rating) ? 'fill-current' : 'opacity-35'} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Write an optional feedback comment..."
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-xs font-semibold transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleRatingSubmit}
                                        className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-yellow-500/10"
                                    >
                                        Submit Rating
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chat Input form */}
                    {ticket.status !== 'Closed' && (
                        <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3 shrink-0">
                            {/* Selected files preview */}
                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2 pb-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-slate-300">
                                            <span className="truncate max-w-[120px]">{file.name}</span>
                                            <button type="button" onClick={() => handleRemoveFile(index)} className="text-gray-400 dark:text-slate-500 hover:text-red-600">
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                {/* File attachment button */}
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        multiple 
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button 
                                        type="button" 
                                        className="p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 rounded-xl transition-colors flex items-center justify-center shrink-0"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                </div>

                                {/* Text Area */}
                                <input 
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={isInternalNote ? "Write internal note (visible only to support agents)..." : "Type your message here..."}
                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 text-sm font-semibold transition-all ${
                                        isInternalNote 
                                        ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 focus:ring-amber-500/20 focus:border-amber-500 text-amber-900 dark:text-amber-100' 
                                        : 'bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 focus:ring-green-500/20 focus:border-green-500'
                                    }`}
                                />

                                {/* Send Button */}
                                <button 
                                    type="submit" 
                                    disabled={sending || (!message.trim() && files.length === 0)}
                                    className="p-3 bg-gray-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-all shrink-0 shadow-md flex items-center justify-center"
                                >
                                    <Send size={18} />
                                </button>
                            </div>

                            {/* Internal Note option for support agents */}
                            {isAgentOrAdmin && (
                                <div className="flex items-center gap-2 pl-1.5">
                                    <input 
                                        type="checkbox" 
                                        id="internalNote"
                                        checked={isInternalNote}
                                        onChange={(e) => setIsInternalNote(e.target.checked)}
                                        className="rounded text-amber-500 border-gray-300 focus:ring-amber-400"
                                    />
                                    <label htmlFor="internalNote" className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase flex items-center gap-0.5 select-none cursor-pointer">
                                        <Lock size={10} /> Send as Internal Note
                                    </label>
                                </div>
                            )}
                        </form>
                    )}

                    {ticket.status === 'Closed' && (
                        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
                            <Lock size={14} />
                            <span>This ticket thread has been closed. No further replies are allowed.</span>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="w-full md:w-80 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-6 shrink-0 h-fit overflow-y-auto">
                    <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">Ticket Details</h3>
                        <p className="text-[10px] text-gray-400 dark:text-slate-400 font-semibold">Metadata audit logs</p>
                    </div>

                    <div className="space-y-4 border-b border-gray-50 dark:border-slate-800 pb-5 text-xs font-semibold">
                        <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-slate-500">Category:</span>
                            <span className="text-gray-800 dark:text-slate-200 font-bold">{ticket.category}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-slate-500">Created:</span>
                            <span className="text-gray-800 dark:text-slate-200">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-slate-500">Last Updated:</span>
                            <span className="text-gray-800 dark:text-slate-200">{new Date(ticket.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        {ticket.resolutionTime && (
                            <div className="flex justify-between">
                                <span className="text-gray-400 dark:text-slate-500">Resolution Time:</span>
                                <span className="text-gray-800 dark:text-slate-200 font-bold">{ticket.resolutionTime} mins</span>
                            </div>
                        )}
                    </div>

                    {/* Restaurant details */}
                    <div>
                        <h4 className="text-xs font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Restaurant Info</h4>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden flex items-center justify-center font-bold text-gray-700 dark:text-slate-200 shrink-0 uppercase">
                                {ticket.restaurantId?.logo ? (
                                    <img 
                                        src={ticket.restaurantId.logo.startsWith('http') ? ticket.restaurantId.logo : `${new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin}${ticket.restaurantId.logo}`}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    ticket.restaurantId?.name?.slice(0, 2)
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">{ticket.restaurantId?.name}</h4>
                                <span className="text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                                    {ticket.restaurantId?.subscription?.plan || 'Enterprise'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TicketDetails;
