import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Users, MapPin } from 'lucide-react';
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
                                    <span className={`px-3 py-1 text-xs font-bold border rounded-lg ${res.statusColor || 'bg-green-50 text-green-700 border-green-100'}`}>
                                        {res.status}
                                    </span>
                                    {res.status === 'Confirmed' && (
                                        <button className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                                            Modify
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationHistory;
