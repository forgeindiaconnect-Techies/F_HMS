import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Users, MapPin, X } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const ReservationHistory = () => {
    const { user } = useCustomerAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load reservations from localStorage
        const fetchReservations = () => {
            try {
                const localRes = JSON.parse(localStorage.getItem('customerReservations') || '[]');
                const defaultReservations = [
                    { date: 'Oct 10, 2026', time: '8:00 PM', guests: 4, type: 'Outdoor', status: 'Completed', statusColor: 'bg-gray-100 text-gray-600 border-gray-200' },
                    { date: 'Sep 24, 2026', time: '1:00 PM', guests: 2, type: 'Bar', status: 'Completed', statusColor: 'bg-gray-100 text-gray-600 border-gray-200' }
                ];
                setReservations([...localRes, ...defaultReservations]);
            } catch (error) {
                console.error('Failed to load reservations', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReservations();
    }, []);

    const [isModifyOpen, setIsModifyOpen] = useState(false);
    const [modifyIdx, setModifyIdx] = useState(null);
    const [modifyDate, setModifyDate] = useState('');
    const [modifyTime, setModifyTime] = useState('');
    const [modifyGuests, setModifyGuests] = useState('2');
    const [modifySeating, setModifySeating] = useState('indoor');

    const openModifyModal = (res, idx) => {
        setModifyIdx(idx);
        
        let rawDate = '';
        try {
            const d = new Date(res.date);
            rawDate = d.toISOString().split('T')[0];
        } catch (e) {}
        setModifyDate(rawDate);

        let rawTime = '';
        if (res.time === '5:00 PM') rawTime = '17:00';
        else if (res.time === '5:30 PM') rawTime = '17:30';
        else if (res.time === '6:00 PM') rawTime = '18:00';
        else if (res.time === '6:30 PM') rawTime = '18:30';
        else if (res.time === '7:00 PM') rawTime = '19:00';
        else if (res.time === '7:30 PM') rawTime = '19:30';
        else if (res.time === '8:00 PM') rawTime = '20:00';
        else if (res.time === '8:30 PM') rawTime = '20:30';
        else if (res.time === '9:00 PM') rawTime = '21:00';
        setModifyTime(rawTime);

        setModifyGuests(res.guests.toString());
        setModifySeating(res.type === 'Indoor' ? 'indoor' : res.type === 'Outdoor' ? 'outdoor' : 'bar');
        setIsModifyOpen(true);
    };

    const handleSaveModify = (e) => {
        e.preventDefault();
        
        let formattedTime = modifyTime;
        if (modifyTime === '17:00') formattedTime = '5:00 PM';
        else if (modifyTime === '17:30') formattedTime = '5:30 PM';
        else if (modifyTime === '18:00') formattedTime = '6:00 PM';
        else if (modifyTime === '18:30') formattedTime = '6:30 PM';
        else if (modifyTime === '19:00') formattedTime = '7:00 PM';
        else if (modifyTime === '19:30') formattedTime = '7:30 PM';
        else if (modifyTime === '20:00') formattedTime = '8:00 PM';
        else if (modifyTime === '20:30') formattedTime = '8:30 PM';
        else if (modifyTime === '21:00') formattedTime = '9:00 PM';

        let formattedDate = modifyDate;
        try {
            const d = new Date(modifyDate);
            formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (err) {}

        const updatedReservations = [...reservations];
        updatedReservations[modifyIdx] = {
            ...updatedReservations[modifyIdx],
            date: formattedDate,
            time: formattedTime,
            guests: parseInt(modifyGuests) || 2,
            type: modifySeating === 'indoor' ? 'Indoor' : modifySeating === 'outdoor' ? 'Outdoor' : 'Bar'
        };

        setReservations(updatedReservations);

        const localRes = JSON.parse(localStorage.getItem('customerReservations') || '[]');
        if (modifyIdx < localRes.length) {
            localRes[modifyIdx] = {
                ...localRes[modifyIdx],
                date: formattedDate,
                time: formattedTime,
                guests: parseInt(modifyGuests) || 2,
                type: modifySeating === 'indoor' ? 'Indoor' : modifySeating === 'outdoor' ? 'Outdoor' : 'Bar'
            };
            localStorage.setItem('customerReservations', JSON.stringify(localRes));
        }

        setIsModifyOpen(false);
    };

    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelIdx, setCancelIdx] = useState(null);

    const openCancelModal = (idx) => {
        setCancelIdx(idx);
        setIsCancelOpen(true);
    };

    const handleConfirmCancel = () => {
        const updatedReservations = [...reservations];
        updatedReservations[cancelIdx] = {
            ...updatedReservations[cancelIdx],
            status: 'Cancelled',
            statusColor: 'bg-red-50 text-red-700 border-red-100'
        };
        setReservations(updatedReservations);

        const localRes = JSON.parse(localStorage.getItem('customerReservations') || '[]');
        if (cancelIdx < localRes.length) {
            localRes[cancelIdx] = {
                ...localRes[cancelIdx],
                status: 'Cancelled',
                statusColor: 'bg-red-50 text-red-700 border-red-100'
            };
            localStorage.setItem('customerReservations', JSON.stringify(localRes));
        }

        setIsCancelOpen(false);
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
                        <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight">Table Booking History</h1>
                        <p className="text-gray-500">View your past and upcoming table reservations.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading reservations...</div>
                    ) : reservations.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl p-8 border border-gray-100 text-gray-500">
                            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-1">No Bookings Found</h3>
                            <p className="text-gray-500 mb-6">You haven't reserved any tables yet.</p>
                            <Link to="/reservations" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors">
                                Book a Table
                            </Link>
                        </div>
                    ) : (
                        reservations.map((res, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 transition-all hover:border-orange-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-start sm:items-center gap-5 w-full md:w-auto">
                                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                                        <Calendar size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 font-sans mb-1">{res.date}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 font-medium">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {res.time}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:inline"></span>
                                            <span className="flex items-center gap-1"><Users size={14} /> {res.guests} Guests</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:inline"></span>
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {res.type} Seating</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full md:w-auto gap-4 self-end md:self-center border-t border-gray-50 pt-4 md:border-t-0 md:pt-0">
                                    {res.status === 'Confirmed' ? (
                                        <button 
                                            onClick={() => openCancelModal(idx)}
                                            className="px-3 py-1 text-xs font-bold border rounded-lg bg-green-50 text-green-700 border-green-100 hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-colors cursor-pointer"
                                            title="Click to cancel reservation"
                                        >
                                            {res.status}
                                        </button>
                                    ) : (
                                        <span className={`px-3 py-1 text-xs font-bold border rounded-lg ${res.statusColor || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            {res.status}
                                        </span>
                                    )}
                                    {res.status === 'Confirmed' && (
                                        <button 
                                            onClick={() => openModifyModal(res, idx)}
                                            className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                                        >
                                            Modify
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modify Modal */}
            {isModifyOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in duration-200 relative">
                        <button 
                            onClick={() => setIsModifyOpen(false)}
                            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Modify Reservation</h2>
                        <form onSubmit={handleSaveModify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                                <input 
                                    type="date" 
                                    value={modifyDate}
                                    onChange={(e) => setModifyDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Time</label>
                                <select 
                                    value={modifyTime}
                                    onChange={(e) => setModifyTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-sm"
                                    required
                                >
                                    <option value="">Select time...</option>
                                    <option value="17:00">5:00 PM</option>
                                    <option value="17:30">5:30 PM</option>
                                    <option value="18:00">6:00 PM</option>
                                    <option value="18:30">6:30 PM</option>
                                    <option value="19:00">7:00 PM</option>
                                    <option value="19:30">7:30 PM</option>
                                    <option value="20:00">8:00 PM</option>
                                    <option value="20:30">8:30 PM</option>
                                    <option value="21:00">9:00 PM</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Guests</label>
                                <select 
                                    value={modifyGuests}
                                    onChange={(e) => setModifyGuests(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-sm"
                                >
                                    <option value="1">1 Guest</option>
                                    <option value="2">2 Guests</option>
                                    <option value="3">3 Guests</option>
                                    <option value="4">4 Guests</option>
                                    <option value="5">5 Guests</option>
                                    <option value="6">6 Guests</option>
                                    <option value="8">8 Guests</option>
                                    <option value="10">10 Guests</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seating Area</label>
                                <select 
                                    value={modifySeating}
                                    onChange={(e) => setModifySeating(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-sm"
                                >
                                    <option value="indoor">Indoor Dining</option>
                                    <option value="outdoor">Outdoor Terrace</option>
                                    <option value="bar">Bar Lounge</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsModifyOpen(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Cancel Modal */}
            {isCancelOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 animate-in zoom-in duration-200 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <X size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Reservation?</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to cancel this table reservation? This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setIsCancelOpen(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm"
                            >
                                Keep Booking
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirmCancel}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-md shadow-red-600/10"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationHistory;
