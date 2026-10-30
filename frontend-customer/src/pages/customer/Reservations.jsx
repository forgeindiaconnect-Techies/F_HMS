import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Reservations = () => {
    const [step, setStep] = useState(1); // 1: details, 2: success
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [guests, setGuests] = useState('2');
    const [seating, setSeating] = useState('indoor');

    const handleReserve = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Mock API delay
        setTimeout(() => {
            setIsSubmitting(false);
            
            // Format time nicely
            let formattedTime = time;
            if (time === '17:00') formattedTime = '5:00 PM';
            else if (time === '17:30') formattedTime = '5:30 PM';
            else if (time === '18:00') formattedTime = '6:00 PM';
            else if (time === '18:30') formattedTime = '6:30 PM';
            else if (time === '19:00') formattedTime = '7:00 PM';
            else if (time === '19:30') formattedTime = '7:30 PM';
            else if (time === '20:00') formattedTime = '8:00 PM';
            else if (time === '20:30') formattedTime = '8:30 PM';
            else if (time === '21:00') formattedTime = '9:00 PM';

            // Format date nicely (e.g. YYYY-MM-DD to Month DD, YYYY)
            let formattedDate = date;
            try {
                const d = new Date(date);
                formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } catch (err) {}

            const newRes = {
                date: formattedDate,
                time: formattedTime,
                guests: parseInt(guests) || 2,
                type: seating === 'indoor' ? 'Indoor' : seating === 'outdoor' ? 'Outdoor' : 'Bar',
                status: 'Confirmed',
                statusColor: 'bg-green-50 text-green-700 border-green-100'
            };

            const existing = JSON.parse(localStorage.getItem('customerReservations') || '[]');
            localStorage.setItem('customerReservations', JSON.stringify([newRes, ...existing]));

            setStep(2);
        }, 1500);
    };

    if (step === 2) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 max-w-lg w-full text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight mb-2">Table Reserved!</h1>
                    <p className="text-gray-500 mb-8 text-lg">We look forward to hosting you.</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shrink-0 shadow-sm"><Calendar size={18} /></div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase">Date</p>
                                <p className="font-bold text-gray-900">{date || 'Today'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shrink-0 shadow-sm"><Clock size={18} /></div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase">Time</p>
                                <p className="font-bold text-gray-900">{time || '7:00 PM'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shrink-0 shadow-sm"><Users size={18} /></div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase">Party Size</p>
                                <p className="font-bold text-gray-900">{guests} Guests ({seating === 'indoor' ? 'Indoor' : seating === 'outdoor' ? 'Outdoor' : 'Bar'} Seating)</p>
                            </div>
                        </div>
                    </div>
                    
                    <Link 
                        to="/profile"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 inline-block"
                    >
                        View in Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-[85vh] pb-24">
            {/* Header Banner */}
            <div className="bg-gray-900 text-white py-16 px-4 relative overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2000&auto=format&fit=crop" 
                    alt="Restaurant Interior" 
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-4">Book a Table</h1>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg">Experience our award-winning dining environment. Reserve your perfect spot today.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                <form onSubmit={handleReserve} className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {/* Party Size */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest flex items-center gap-2">
                                <Users size={16} className="text-orange-500" /> Party Size
                            </label>
                            <select 
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900 font-bold appearance-none cursor-pointer"
                                required
                            >
                                {[1,2,3,4,5,6,7,8,'9+'].map(num => (
                                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={16} className="text-orange-500" /> Date
                            </label>
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900 font-bold cursor-pointer"
                                required
                            />
                        </div>

                        {/* Time */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-orange-500" /> Time
                            </label>
                            <select 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900 font-bold appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled hidden>Select Time</option>
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

                        {/* Seating */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={16} className="text-orange-500" /> Seating
                            </label>
                            <select 
                                value={seating}
                                onChange={(e) => setSeating(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900 font-bold appearance-none cursor-pointer"
                                required
                            >
                                <option value="indoor">Indoor Dining Room</option>
                                <option value="outdoor">Outdoor Patio</option>
                                <option value="bar">Bar Seating</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 mb-8">
                        <h3 className="font-bold text-gray-900 mb-6 font-sans">Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <input type="text" placeholder="First Name" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900" required />
                            </div>
                            <div>
                                <input type="text" placeholder="Last Name" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900" required />
                            </div>
                            <div>
                                <input type="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900" required />
                            </div>
                            <div>
                                <input type="tel" placeholder="Phone Number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900" required />
                            </div>
                            <div className="md:col-span-2">
                                <textarea rows="3" placeholder="Special Requests (Allergies, Occasions, etc.)" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-colors text-gray-900 resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Securing Table...
                            </>
                        ) : (
                            <>Confirm Reservation <ChevronRight size={20} /></>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-gray-400 mt-6">
                        By confirming, you agree to our booking terms and conditions.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Reservations;
