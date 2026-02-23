'use client';

import { useState, useEffect } from 'react';
import { SessionDTO } from '@/types/api';
import { SessionService } from '@/services/sessionService';
import { CalendarDays, Plus, Users, Clock } from 'lucide-react';

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

    if (loading) return <div className="text-center py-10">Syncing calendar...</div>;
    if (!mounted) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    Offline Sessions
                </h2>
                <button className="text-xs bg-[#4d0101] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#4d0101] transition shadow-sm">
                    <Plus className="w-3 h-3" /> New Slot
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {sessions.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                        No active sessions scheduled.
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div key={session.id} className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition group">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <p className="text-xs text-gray-500">{new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        <Users className="w-3 h-3" /> {session.availableSlots} Slots Left
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
