import { useState, useEffect } from 'react';
import { UserCheck, Clock, ShieldCheck, MapPin, Coffee, Calendar, Play, Pause } from 'lucide-react';
import StaffShiftClockWidget from '../../components/StaffShiftClockWidget';
import toast from 'react-hot-toast';

const WaiterShiftStatus = () => {
    const [status, setStatus] = useState('On Duty');
    const [zone, setZone] = useState('Floor Zone A');
    const [elapsedSeconds, setElapsedSeconds] = useState(20000); // 5h 33m

    useEffect(() => {
        let timer;
        if (status === 'On Duty') {
            timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [status]);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        toast.success(`Shift status updated to: ${newStatus}`);
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                        <UserCheck size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Shift Status & Clock-In Desk
                        </h1>
                        <p className="text-sm font-medium text-emerald-100 mt-0.5">
                            Manage active shift timers, floor zone assignments & duty status
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-white text-emerald-800 font-extrabold rounded-xl text-xs shadow-md">
                        {status}
                    </span>
                </div>
            </div>

            {/* Shift Duty Control Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Timer Box */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Active Duty Timer</span>
                        <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{formatTime(elapsedSeconds)}</div>
                        <p className="text-xs text-emerald-600 font-bold mt-1">Clocked in at 09:00 AM Today</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStatusChange('On Duty')}
                            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 ${
                                status === 'On Duty' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                            <Play size={14} /> Resume
                        </button>
                        <button
                            onClick={() => handleStatusChange('On Break')}
                            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 ${
                                status === 'On Break' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                            <Coffee size={14} /> Break
                        </button>
                    </div>
                </div>

                {/* Floor Zone Selection */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Active Zone Assignment</span>
                    <div className="space-y-2">
                        {['Floor Zone A (Main Hall)', 'Floor Zone B (Patio)', 'Terrace Dining'].map((z) => (
                            <button
                                key={z}
                                onClick={() => { setZone(z); toast.success(`Assigned to ${z}`); }}
                                className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                    zone === z
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span>{z}</span>
                                <MapPin size={14} className={zone === z ? 'text-emerald-600' : 'text-slate-400'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Full Shift Clock Widget */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-center">
                    <StaffShiftClockWidget />
                </div>

            </div>

        </div>
    );
};

export default WaiterShiftStatus;
