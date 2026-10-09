import { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, Users, Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const getStatusStyle = (status) => {
    switch (status) {
        case 'Confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Seated': return 'bg-green-50 text-green-700 border-green-200';
        case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
        case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-300';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

const ReservationManagement = () => {
    const { api } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        guestName: '',
        guestPhone: '',
        date: date,
        timeSlot: '18:00',
        guestCount: 2,
        branch: '',
        table: ''
    });

    const fetchData = async () => {
        try {
            const [resRes, branchesRes, tablesRes] = await Promise.all([
                api.get('/reservations'),
                api.get('/branches'),
                api.get('/tables')
            ]);
            setReservations(resRes.data);
            setBranches(branchesRes.data);
            setTables(tablesRes.data);
            
            if (branchesRes.data.length > 0 && !formData.branch) {
                setFormData(prev => ({ ...prev, branch: branchesRes.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reservations', formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({
                guestName: '',
                guestPhone: '',
                date: date,
                timeSlot: '18:00',
                guestCount: 2,
                branch: branches[0]?._id || '',
                table: ''
            });
            toast.success('Booking created successfully');
        } catch (error) {
            console.error('Failed to create booking', error);
            toast.error(error.response?.data?.message || 'Error creating booking');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/reservations/${id}/status`, { status });
            fetchData();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    // Filter reservations by selected date and search query
    const filteredReservations = reservations.filter(r => {
        const matchesDate = r.date.startsWith(date);
        const matchesSearch = r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              r.guestPhone.includes(searchQuery);
        return matchesDate && matchesSearch;
    });

    // Calculate dynamic stats for the selected date
    const totalGuests = filteredReservations.reduce((sum, r) => sum + r.guestCount, 0);
    const activeBookings = filteredReservations.filter(r => r.status === 'Confirmed' || r.status === 'Seated').length;

    // Filter available tables based on selected branch
    const availableTables = tables.filter(t => t.branch === formData.branch);

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Reservations</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage table bookings and capacity planning.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm shadow-md shadow-green-900/10" 
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                    <Plus size={18} /> New Booking
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex gap-2 items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-1.5 bg-transparent rounded-md text-sm text-gray-800 font-bold focus:outline-none"
                    />
                </div>
                
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" />
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Reservation List */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Booking Schedule</h3>
                            <div className="flex gap-2 text-sm">
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Confirmed</span>
                                <span className="flex items-center gap-1.5 ml-3"><div className="w-2 h-2 rounded-full bg-green-500"></div> Seated</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                            {filteredReservations.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No reservations for this date.</div>
                            ) : (
                                filteredReservations.map((res) => (
                                    <div key={res._id} className="p-4 hover:bg-green-50/30 transition-colors flex items-center gap-4 group">
                                        <div className="text-center w-16 shrink-0 border-r border-gray-100 pr-4">
                                            <p className="font-bold text-gray-900 text-lg">{res.timeSlot}</p>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-base">{res.guestName}</h4>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1"><Users size={14} className="text-gray-400" /> {res.guestCount} guests</span>
                                                    <span className="flex items-center gap-1">{res.guestPhone}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getStatusStyle(res.status)}`}>
                                                        {res.status}
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-700 mt-1">
                                                        {res.table ? `Table ${res.table.number}` : 'Unassigned'}
                                                    </p>
                                                </div>
                                                
                                                {/* Actions */}
                                                {(res.status === 'Confirmed' || res.status === 'Pending') && (
                                                    <div className="flex gap-2 transition-opacity">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(res._id, 'Seated')}
                                                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Seat Guest"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(res._id, 'Cancelled')}
                                                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Cancel Booking"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        {/* Capacity Overview */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-md">
                            <h3 className="font-bold text-green-50 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Capacity Overview</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Expected Guests</p>
                                    <p className="text-3xl font-extrabold mt-1">{totalGuests}</p>
                                </div>
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Active Bookings</p>
                                    <p className="text-3xl font-extrabold mt-1">{activeBookings}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">New Reservation</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.guestName}
                                    onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.guestPhone}
                                    onChange={(e) => setFormData({...formData, guestPhone: e.target.value})}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        required
                                        value={formData.guestCount}
                                        onChange={(e) => setFormData({...formData, guestCount: Number(e.target.value)})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                                    <select 
                                        value={formData.timeSlot}
                                        onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    >
                                        <option value="17:00">17:00</option>
                                        <option value="17:30">17:30</option>
                                        <option value="18:00">18:00</option>
                                        <option value="18:30">18:30</option>
                                        <option value="19:00">19:00</option>
                                        <option value="19:30">19:30</option>
                                        <option value="20:00">20:00</option>
                                        <option value="20:30">20:30</option>
                                        <option value="21:00">21:00</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                    <select 
                                        value={formData.branch}
                                        onChange={(e) => setFormData({...formData, branch: e.target.value, table: ''})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        required
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Table (Optional)</label>
                                    <select 
                                        value={formData.table}
                                        onChange={(e) => setFormData({...formData, table: e.target.value})}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        disabled={!formData.branch}
                                    >
                                        <option value="">Unassigned</option>
                                        {availableTables.map(t => (
                                            <option key={t._id} value={t._id}>Table {t.number} ({t.capacity} seats)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm shadow-green-600/20 transition-colors text-sm"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationManagement;
