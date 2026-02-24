'use client';

import { useState, useEffect } from 'react';
import { SessionDTO } from '@/types/api';
import { SessionService } from '@/services/sessionService';
import { format, isValid } from 'date-fns';

export default function SessionBooking() {
    const [sessions, setSessions] = useState<SessionDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await SessionService.getAllSessions();
            setSessions(data);
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return 'No Time';
        try {
            // Check if it's already a full date string or just a time HH:mm:ss
            const dateStr = timeString.includes('T') ? timeString : `2000-01-01T${timeString}`;
            const date = new Date(dateStr);
            if (!isValid(date)) return timeString;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timeString;
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'No Date Set';
        try {
            const date = new Date(dateString);
            if (!isValid(date)) return 'Invalid Date';
            return format(date, 'EEEE, MMMM d, yyyy');
        } catch {
            return 'Invalid Date';
        }
    };

    if (loading) return <div className="text-center py-10 font-black text-[10px] uppercase tracking-widest text-slate-400">Syncing calendar...</div>;
    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Offline Sessions</h3>
                <button
                    onClick={() => alert('New Slot Management coming soon!')}
                    className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#600202] transition-colors"
                >
                    New Slot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">No Active Slots Scheduled</p>
                    </div>
                )}
                {sessions.map((session, index) => {
                    // Type-safe slot calculation
                    const slotsLeft = session.availableSlots ?? 
                        ((Number(session.maxSlots) || 0) - (Number(session.bookedSlots) || 0));

                    // Type-safe date handling
                    const sessionDate = session.date || 
                        (session.startTime?.includes('T') ? session.startTime : undefined);

                    return (
                        <div
                            key={session.id || `session-${index}`}
                            className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-[#dbb212] transition-all group"
                        >
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                    </p>
                                    <p className="text-[10px] font-black text-[#600202] uppercase tracking-[0.2em]">
                                        {formatDate(sessionDate)}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slots Left</span>
                                    <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-lg text-xs font-black">
                                        {slotsLeft}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
