'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MentorService, MentorDTO } from '@/services/mentorService';
import MentorManager from '@/components/admin/MentorManager';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function MentorDashboard() {
    const [profile, setProfile] = useState<MentorDTO | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const [profData, sessData, upcomingData] = await Promise.all([
                MentorService.getMyProfile().catch(() => null),
                MentorService.getMySessions().catch(() => []),
                MentorService.getMyUpcomingSessions().catch(() => [])
            ]);

            if (profData) {
                setProfile(profData);
            }
            setSessions(Array.isArray(sessData) ? sessData : []);
            setUpcomingSessions(Array.isArray(upcomingData) ? upcomingData : []);
        } catch (error) {
            toast.error('Failed to load mentor dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mentor Hub</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage your profile and upcoming sessions.</p>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center items-center w-full">
                    <img src="/raffles-logo.png" alt="Loading" className="h-12 w-auto object-contain animate-spin-y-ease-in" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Profile Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
                        </div>

                        {profile ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Name</p>
                                        <p className="font-bold text-gray-800">{profile.name}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Email</p>
                                        <p className="font-bold text-gray-800">{profile.email || '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Phone</p>
                                        <p className="font-bold text-gray-800">{profile.phone || '—'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Department</p>
                                        <p className="font-bold text-gray-800">{profile.departmentName || '—'}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-800 font-semibold flex-1">Status Overview</p>
                                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded shadow-sm text-xs border border-blue-200">MENTOR ACTIVE</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-6">Profile data not found.</p>
                        )}
                    </div>

                    {/* Sessions Section */}
                    <div className="space-y-6">
                        {/* Upcoming Sessions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-50 pb-4">My Upcoming Sessions</h2>
                            {upcomingSessions.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">No upcoming sessions scheduled.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingSessions.map((session, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-indigo-900">{session.department || 'Session'} • {session.location || 'No Location'}</p>
                                                <p className="text-sm text-indigo-700">
                                                    {session.startTime ? new Date(session.startTime).toLocaleString() : 'Date TBD'} 
                                                    <span className="opacity-50 mx-1.5">•</span> 
                                                    {session.currentCount}/{session.maxCapacity} Seats
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">{session.status || 'UPCOMING'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past / All Sessions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-50 pb-4">All My Sessions</h2>
                            {sessions.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">No session history found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{session.department || 'Session'} • {session.location || 'No Location'}</p>
                                                <p className="text-sm text-gray-500">
                                                    {session.startTime ? new Date(session.startTime).toLocaleString() : 'Date TBD'}
                                                    <span className="opacity-50 mx-1.5">•</span> 
                                                    {session.currentCount}/{session.maxCapacity} Seats
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${session.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>{session.status || 'OPEN'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default function MentorPage() {
    const { role } = useAuth();

    // For Admin / Manager, show the full CRUD management for Mentors
    if (role === 'ADMIN' || role === 'MANAGER') {
        return (
            <DashboardLayout>
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mentor Management</h1>
                    <p className="text-gray-500 mt-2 font-medium">Create, update, and check availability of all mentors.</p>
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <MentorManager />
                </div>
            </DashboardLayout>
        );
    }

    // For MENTOR, show the Dashboard
    return <MentorDashboard />;
}
