'use client';

import { useState, useEffect } from 'react';
import { SessionDTO } from '@/types/api';
import { SessionService } from '@/services/sessionService';
import { MentorService, MentorDTO } from '@/services/mentorService';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Plus, Users, Clock, MapPin, XCircle, UserCheck, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionManager() {
    const { role } = useAuth();
    const [sessions, setSessions] = useState<SessionDTO[]>([]);
    const [mentors, setMentors] = useState<MentorDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [isBulk, setIsBulk] = useState(false);
    const [singleFormData, setSingleFormData] = useState<Partial<SessionDTO>>({
        startTime: '', endTime: '', maxCapacity: 50, location: '', notes: '', department: ''
    });
    const [bulkJson, setBulkJson] = useState('');

    // Assign Mentor 
    const [assignSessionId, setAssignSessionId] = useState<number | ''>('');
    const [assignMentorId, setAssignMentorId] = useState<number | ''>('');

    // Filters
    const [filterType, setFilterType] = useState('all'); // all, date, status, mentorAssigned, department
    const [filterValue, setFilterValue] = useState('');
    const [leadsWithNotes, setLeadsWithNotes] = useState<any[]>([]);
    const [viewingSessionLeads, setViewingSessionLeads] = useState<number | null>(null);

    const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER';
    const isMentor = role === 'MENTOR';
    const canViewLeads = role === 'MENTOR' || role === 'MANAGER' || role === 'ADMIN';

    const loadSessions = async () => {
        try {
            setLoading(true);
            let data: SessionDTO[] = [];

            if (filterType === 'all') {
                data = await SessionService.getAllSessions();
            } else if (!filterValue) {
                // Wait for the user to type a filter value, do not fetch yet
                setSessions([]);
                setLoading(false);
                return;
            } else if (filterType === 'date') {
                data = await SessionService.getSessionsByDate(filterValue);
            } else if (filterType === 'status') {
                data = await SessionService.getSessionsByStatus(filterValue);
            } else if (filterType === 'mentorAssigned') {
                data = await SessionService.getSessionsByMentorAssigned(filterValue === 'true');
            } else if (filterType === 'department') {
                data = await SessionService.getAllSessionsByDepartmentName(filterValue);
            } else {
                data = await SessionService.getAllSessions();
            }

            const unwrappedData = Array.isArray(data) ? data : ((data as any)?.data ? (data as any).data : []);
            setSessions(Array.isArray(unwrappedData) ? unwrappedData : []);
        } catch (error) {
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    const loadMentorsForAssignment = async () => {
        if (isAdminOrManager) {
            try {
                const data = await MentorService.getAllMentors();
                setMentors(Array.isArray(data) ? data : []);
            } catch {
                console.error("Failed to load mentors list for assignment dropdown");
            }
        }
    };

    useEffect(() => {
        loadSessions();
    }, [filterType, filterValue]);

    useEffect(() => {
        if (isAdminOrManager) {
            loadMentorsForAssignment();
        }
    }, [isAdminOrManager]);

    // Disable access for TELECALLER entirely - though they shouldn't even see the tab
    if (role === 'TELECALLER') {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied.</div>;
    }

    const handleCreateSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await SessionService.createSession(singleFormData as SessionDTO);
            toast.success('Session created successfully');
            loadSessions();
        } catch (error) {
            toast.error('Failed to create session');
        }
    };

    const handleCreateBulk = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedArray = JSON.parse(bulkJson);
            if (!Array.isArray(parsedArray)) throw new Error("Must be an array");
            await SessionService.createBulkSessions(parsedArray);
            toast.success('Bulk sessions created');
            setBulkJson('');
            loadSessions();
        } catch (error) {
            toast.error('Invalid JSON array or API error');
        }
    };

    const handleAssignMentor = async () => {
        if (!assignSessionId || !assignMentorId) return toast.error("Select both session and mentor");
        try {
            await SessionService.assignMentorToSession(Number(assignSessionId), Number(assignMentorId));
            toast.success("Mentor assigned successfully");
            setAssignSessionId('');
            setAssignMentorId('');
            loadSessions();
        } catch (error) {
            toast.error("Failed to assign mentor");
        }
    };

    const handleCancelSession = async (id: number) => {
        if (!window.confirm("Are you sure you want to cancel this session?")) return;
        try {
            await SessionService.cancelSession(id);
            toast.success("Session cancelled");
            loadSessions();
        } catch (error) {
            toast.error("Failed to cancel session");
        }
    };

    const handleViewLeads = async (id: number) => {
        try {
            const data = await SessionService.getLeadsWithNotesForSession(id);
            setLeadsWithNotes(Array.isArray(data) ? data : []);
            setViewingSessionLeads(id);
        } catch (error) {
            toast.error("Failed to fetch leads for session");
        }
    };

    return (
        <div className="space-y-6">
            {isAdminOrManager && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Create Session Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                Create Session
                            </h2>
                            <button onClick={() => setIsBulk(!isBulk)} className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-700 hover:bg-gray-200">
                                Toggle to {isBulk ? 'Single' : 'Bulk JSON array'}
                            </button>
                        </div>

                        {isBulk ? (
                            <form onSubmit={handleCreateBulk} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Bulk JSON Array</label>
                                    <textarea
                                        rows={6}
                                        value={bulkJson}
                                        onChange={(e) => setBulkJson(e.target.value)}
                                        placeholder={`[\n  {\n    "startTime": "2026-02-26T01:45:00",\n    ... \n  }\n]`}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#dbb212]"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-[#4d0101] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#600202] transition">Create Bulk</button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateSingle} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Start Time (YYYY-MM-DDTHH:mm:ss)</label>
                                        <input required type="text" value={singleFormData.startTime || ''} onChange={(e) => setSingleFormData({ ...singleFormData, startTime: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" placeholder="2026-02-27T01:45:00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">End Time</label>
                                        <input required type="text" value={singleFormData.endTime || ''} onChange={(e) => setSingleFormData({ ...singleFormData, endTime: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" placeholder="2026-02-27T02:45:00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Capacity</label>
                                        <input required type="number" value={singleFormData.maxCapacity || 50} onChange={(e) => setSingleFormData({ ...singleFormData, maxCapacity: Number(e.target.value) })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Department</label>
                                        <input required type="text" value={singleFormData.department || ''} onChange={(e) => setSingleFormData({ ...singleFormData, department: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" placeholder="ENGINEERING" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Location</label>
                                        <input required type="text" value={singleFormData.location || ''} onChange={(e) => setSingleFormData({ ...singleFormData, location: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Notes</label>
                                        <input type="text" value={singleFormData.notes || ''} onChange={(e) => setSingleFormData({ ...singleFormData, notes: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#4d0101] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#600202] transition">Create Single Session</button>
                            </form>
                        )}
                    </div>

                    {/* Assign Mentor Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">

                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Select Session</label>
                                <select value={assignSessionId} onChange={(e) => setAssignSessionId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="">-- Choose Session --</option>
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>ID: {s.id} | {s.department} | {new Date(s.startTime).toLocaleDateString()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Select Mentor</label>
                                <select value={assignMentorId} onChange={(e) => setAssignMentorId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="">-- Choose Mentor --</option>
                                    {mentors.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.departmentName || 'No Dept'}) - {m.email}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleAssignMentor} className="w-full bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm mt-4">Assign Target Mentor</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and Session List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-600" />
                        Sessions Feed
                    </h2>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => { setFilterType('mentorAssigned'); setFilterValue('true'); }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filterType === 'mentorAssigned' && filterValue === 'true' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Assigned
                            </button>
                            <button
                                onClick={() => { setFilterType('mentorAssigned'); setFilterValue('false'); }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filterType === 'mentorAssigned' && filterValue === 'false' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Unassigned
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }} className="p-2 border border-gray-200 bg-gray-50 rounded-lg text-sm font-bold text-gray-600 outline-none">
                                <option value="all">All Sessions</option>
                                <option value="date">By Date (YYYY-MM-DD)</option>
                                <option value="status">By Status</option>
                                <option value="mentorAssigned">By Mentor Assigned</option>
                                <option value="department">By Department Name</option>
                            </select>
                            {filterType !== 'all' && filterType !== 'mentorAssigned' && (
                                <input
                                    type="text"
                                    placeholder="Enter value..."
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className="p-2 border border-gray-200 bg-gray-50 rounded-lg text-sm w-40 outline-none placeholder:font-normal font-bold text-gray-800"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 text-center"><img src="/raffles-logo.png" alt="Loading" className="h-10 mx-auto animate-pulse" /></div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm font-medium">
                        No sessions found matching this filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Session ID & Dept</th>
                                    <th className="px-6 py-4 font-bold">Time & Date</th>
                                    <th className="px-6 py-4 font-bold">Location</th>
                                    <th className="px-6 py-4 font-bold">Status & Capacity</th>
                                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessions.map((session) => {
                                    const isAssigned = (session.assignedMentors && session.assignedMentors.length > 0) || (session.mentorIds && session.mentorIds.length > 0) || !!session.mentorId;
                                    return (
                                        <tr key={session.id || session.sessionId} className="hover:bg-slate-50 cursor-pointer transition-colors group relative">
                                            <td className="px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="font-bold text-slate-800">Session #{session.id || session.sessionId}</div>
                                                <div className="text-xs font-bold text-indigo-600 tracking-wider uppercase mt-1">{session.department || 'General'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{new Date(session.startTime).toLocaleDateString()}, {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-xs text-slate-500">To {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-700 max-w-[200px]">
                                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="font-medium truncate" title={session.location || 'No location specified'}>{session.location || 'No location specified'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-2">
                                                    <div className="flex gap-2">
                                                        {session.status && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${session.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                                                {session.status}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${isAssigned ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                            Mentor: {isAssigned ? 'Assigned' : 'Unassigned'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 text-slate-400" />
                                                        <span className="font-medium text-blue-700 text-xs">
                                                            {session.availableSlots !== undefined ? session.availableSlots : (session.maxCapacity || 50)} / {session.maxCapacity || 50} Slots
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2 items-center">
                                                    {canViewLeads && (
                                                        <button onClick={() => handleViewLeads(session.id || session.sessionId as number)} className="bg-indigo-50 text-indigo-700 text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition shadow-sm whitespace-nowrap">
                                                            View Leads
                                                        </button>
                                                    )}
                                                    {(isAdminOrManager || role === 'MANAGER') && (
                                                        <button onClick={async (e) => {
                                                            e.stopPropagation(); // Prevent row click
                                                            try {
                                                                const resp = await SessionService.getAvailableMentorsForSession(session.id || session.sessionId as number);
                                                                console.log('Available mentors response:', resp);
                                                                toast.success('Successfully called available-mentors endpoint');
                                                                loadSessions();
                                                            } catch (err) {
                                                                toast.error('Failed to call available-mentors endpoint');
                                                            }
                                                        }} className="bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition shadow-sm whitespace-nowrap">
                                                            Get Mentors
                                                        </button>
                                                    )}
                                                    {isAdminOrManager && session.status !== 'CANCELLED' && (
                                                        <button onClick={() => handleCancelSession(session.id || session.sessionId as number)} className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition shadow-sm" title="Cancel Session">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Leads Modal */}
            {viewingSessionLeads && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black tracking-tight text-gray-900 text-lg">Leads with Notes</h3>
                                <p className="text-xs text-gray-500 font-medium tracking-wide">Session ID: {viewingSessionLeads}</p>
                            </div>
                            <button onClick={() => setViewingSessionLeads(null)} className="text-gray-400 hover:text-gray-700 bg-white shadow-sm border rounded-lg p-1.5 transition-colors">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-slate-50">
                            {leadsWithNotes.length === 0 ? (
                                <p className="text-center text-gray-500 py-10 font-medium">No leads associated with this session yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {leadsWithNotes.map((lead, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <p className="font-bold text-gray-900">{lead.name}</p>
                                            <p className="text-sm text-gray-600 mb-2">{lead.email} | {lead.phone}</p>
                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                                <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">Session Notes:</p>
                                                <p className="text-sm text-gray-800">{lead.notes || 'No specific notes recorded.'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
