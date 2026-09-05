import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Coffee, CheckCircle, AlertCircle, ShieldCheck, UserCheck, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffShiftClockWidget = ({ userRole = 'Staff', userName = 'Staff Member', compact = false }) => {
    // Unique key per user to store shift state
    const userStorageKey = `staff_shift_clock_${userName.replace(/\s+/g, '_')}`;

    // State initialization from localStorage
    const [shiftState, setShiftState] = useState(() => {
        try {
            const saved = localStorage.getItem(userStorageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load shift state", e);
        }
        return {
            status: 'ClockedOut', // 'ClockedIn' | 'OnBreak' | 'ClockedOut'
            clockInTime: null,
            breakStartTime: null,
            totalBreakSeconds: 0,
            totalShiftSecondsToday: 0,
            lastClockOutTime: null
        };
    });

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Save shift state to localStorage whenever it updates
    useEffect(() => {
        try {
            localStorage.setItem(userStorageKey, JSON.stringify(shiftState));
        } catch (e) {
            console.error("Failed to save shift state", e);
        }
    }, [shiftState, userStorageKey]);

    // Live second ticker timer
    useEffect(() => {
        let interval = null;
        if (shiftState.status === 'ClockedIn' && shiftState.clockInTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const start = new Date(shiftState.clockInTime).getTime();
                const totalSeconds = Math.max(0, Math.floor((now - start) / 1000) - (shiftState.totalBreakSeconds || 0));
                setElapsedSeconds(totalSeconds);
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [shiftState]);

    // Format seconds into HH:MM:SS
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        }
        return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    };

    // Format Time 12-hour AM/PM
    const formatTime12h = (isoString) => {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Clock In Handler
    const handleClockIn = () => {
        const nowIso = new Date().toISOString();
        const newState = {
            ...shiftState,
            status: 'ClockedIn',
            clockInTime: nowIso,
            breakStartTime: null,
            totalBreakSeconds: 0
        };
        setShiftState(newState);
        toast.success(`Welcome ${userName}! Shift Started & Clocked In at ${formatTime12h(nowIso)} 🟢`, {
            duration: 5000,
            icon: '⏱️'
        });
    };

    // Start Break Handler
    const handleToggleBreak = () => {
        const nowIso = new Date().toISOString();
        if (shiftState.status === 'ClockedIn') {
            setShiftState(prev => ({
                ...prev,
                status: 'OnBreak',
                breakStartTime: nowIso
            }));
            toast(`Shift Break Started ☕`, { icon: '⏸️' });
        } else if (shiftState.status === 'OnBreak') {
            const breakDurationSec = shiftState.breakStartTime 
                ? Math.floor((new Date().getTime() - new Date(shiftState.breakStartTime).getTime()) / 1000)
                : 0;
            setShiftState(prev => ({
                ...prev,
                status: 'ClockedIn',
                breakStartTime: null,
                totalBreakSeconds: (prev.totalBreakSeconds || 0) + breakDurationSec
            }));
            toast.success(`Resumed Shift! Break ended 🟢`);
        }
    };

    // Clock Out Handler
    const handleClockOut = () => {
        const nowIso = new Date().toISOString();
        const finalShiftSec = elapsedSeconds;
        const newState = {
            ...shiftState,
            status: 'ClockedOut',
            lastClockOutTime: nowIso,
            totalShiftSecondsToday: (shiftState.totalShiftSecondsToday || 0) + finalShiftSec,
            clockInTime: null,
            breakStartTime: null
        };
        setShiftState(newState);
        toast.error(`Shift Completed! Clocked Out at ${formatTime12h(nowIso)}. Total Shift Worked: ${formatDuration(finalShiftSec)} 🔴`, {
            duration: 6000,
            icon: '🛑'
        });
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-800 shadow-md">
                <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        shiftState.status === 'ClockedIn' ? 'bg-emerald-400' : shiftState.status === 'OnBreak' ? 'bg-amber-400' : 'bg-rose-500'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        shiftState.status === 'ClockedIn' ? 'bg-emerald-400' : shiftState.status === 'OnBreak' ? 'bg-amber-400' : 'bg-rose-500'
                    }`}></span>
                </span>

                <div className="text-xs font-bold">
                    {shiftState.status === 'ClockedIn' ? (
                        <span className="text-emerald-400 font-mono">Present: {formatDuration(elapsedSeconds)}</span>
                    ) : shiftState.status === 'OnBreak' ? (
                        <span className="text-amber-400">On Break ☕</span>
                    ) : (
                        <span className="text-slate-400">Clocked Out</span>
                    )}
                </div>

                {shiftState.status === 'ClockedOut' ? (
                    <button
                        onClick={handleClockIn}
                        className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm"
                    >
                        Clock In
                    </button>
                ) : (
                    <button
                        onClick={handleClockOut}
                        className="ml-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                    >
                        Clock Out
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl shadow-xl text-white my-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left: Status Icon + Staff Info + Pill */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        shiftState.status === 'ClockedIn'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : shiftState.status === 'OnBreak'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    }`}>
                        {shiftState.status === 'ClockedIn' ? (
                            <UserCheck size={22} className="animate-pulse" />
                        ) : shiftState.status === 'OnBreak' ? (
                            <Coffee size={22} />
                        ) : (
                            <Clock size={22} />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                {userRole} Shift Status
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                                shiftState.status === 'ClockedIn'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : shiftState.status === 'OnBreak'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                                {shiftState.status === 'ClockedIn' ? '🟢 Present' : shiftState.status === 'OnBreak' ? '🟡 Break' : '🔴 Clocked Out'}
                            </span>
                        </div>

                        <h4 className="text-sm font-black text-white flex flex-wrap items-center gap-2 mt-1">
                            <span>{userName}</span>
                            {shiftState.status === 'ClockedIn' && (
                                <span className="font-mono text-emerald-400 font-extrabold text-xs">
                                    • {formatDuration(elapsedSeconds)}
                                </span>
                            )}
                        </h4>

                        <div className="text-[11px] text-slate-400 font-medium flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            {shiftState.clockInTime && (
                                <span>Clock In: <strong className="text-slate-200">{formatTime12h(shiftState.clockInTime)}</strong></span>
                            )}
                            {shiftState.lastClockOutTime && shiftState.status === 'ClockedOut' && (
                                <span>Clock Out: <strong className="text-slate-300">{formatTime12h(shiftState.lastClockOutTime)}</strong></span>
                            )}
                            {shiftState.totalShiftSecondsToday > 0 && (
                                <span>Total Today: <strong className="text-emerald-400">{formatDuration(shiftState.totalShiftSecondsToday)}</strong></span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right / Bottom: Action Buttons */}
                <div className="shrink-0 w-full md:w-auto">
                    {shiftState.status === 'ClockedOut' ? (
                        <button
                            onClick={handleClockIn}
                            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Play size={14} className="fill-slate-950 shrink-0" />
                            <span>Clock In Shift Now</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                                onClick={handleToggleBreak}
                                className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    shiftState.status === 'OnBreak'
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                <Coffee size={14} className="shrink-0" />
                                <span>{shiftState.status === 'OnBreak' ? 'Resume' : 'Take Break'}</span>
                            </button>

                            <button
                                onClick={handleClockOut}
                                className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Square size={14} className="fill-white shrink-0" />
                                <span>Clock Out</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StaffShiftClockWidget;
