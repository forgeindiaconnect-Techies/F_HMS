import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Clock, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SupportTickets = () => {
    const { api } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await api.get('/super-admin/tickets');
                setTickets(res.data);
            } catch (error) {
                console.error("Failed to fetch tickets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [api]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/super-admin/tickets/${id}`, { status });
            setTickets(tickets.map(t => t._id === id ? { ...t, status } : t));
            toast.success('Ticket marked as resolved successfully!');
        } catch (error) {
            toast.error('Failed to update ticket');
        }
    };

    const handleDeleteTicket = async (id, subject) => {
        if (!window.confirm(`Are you sure you want to permanently delete the ticket "${subject}"? This action cannot be undone.`)) {
            return;
        }
        setDeletingId(id);
        try {
            await api.delete(`/super-admin/tickets/${id}`);
            setTickets(tickets.filter(t => t._id !== id));
            toast.success('Ticket deleted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete ticket');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 font-sans">Support Tickets</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                                <th className="p-4 font-bold">Restaurant</th>
                                <th className="p-4 font-bold">Subject</th>
                                <th className="p-4 font-bold">Priority</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tickets.map(ticket => (
                                <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{ticket.restaurantId?.name || 'Unknown'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-900 font-medium">{ticket.subject}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{ticket.description}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                            ticket.priority === 'High' || ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                            ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-green-100 text-green-700' :
                                            ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(ticket._id, 'Resolved')}
                                                    className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Mark Resolved
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteTicket(ticket._id, ticket.subject)}
                                                disabled={deletingId === ticket._id}
                                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
                                                title="Delete Ticket"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tickets.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No active support tickets.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupportTickets;
