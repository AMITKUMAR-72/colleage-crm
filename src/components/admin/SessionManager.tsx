'use client';

import { useState, useEffect } from 'react';
import { SessionDTO, DepartmentDTO } from '@/types/api';
import { SessionService } from '@/services/sessionService';
import { DepartmentService } from '@/services/departmentService';
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
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [searchDeptValue, setSearchDeptValue] = useState('');

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
            } else if (filterType === 'dept_select' || filterType === 'dept_search' || filterType === 'department') {
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

    const loadDepartments = async () => {
        if (isAdminOrManager) {
            try {
                const data = await DepartmentService.getAllDepartments();
                setDepartments(Array.isArray(data) ? data : []);
            } catch {
                console.error("Failed to load departments");
            }
        }
    };

    useEffect(() => {
        loadSessions();
    }, [filterType, filterValue]);

    useEffect(() => {
        if (isAdminOrManager) {
            loadMentorsForAssignment();
            loadDepartments();
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Create Session Card */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-50 pb-4 gap-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                Create Session
                            </h2>
                            <button onClick={() => setIsBulk(!isBulk)} className="w-full sm:w-auto text-xs bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-700 hover:bg-gray-200">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Start Time (ISO)</label>
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
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Location</label>
                                        <input required type="text" value={singleFormData.location || ''} onChange={(e) => setSingleFormData({ ...singleFormData, location: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Notes</label>
                                        <input type="text" value={singleFormData.notes || ''} onChange={(e) => setSingleFormData({ ...singleFormData, notes: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#4d0101] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#600202] transition">Create Single Session</button>
                            </form>
                        )}
                    </div>

                    {/* Assign Mentor Card */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <div className="mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-emerald-600" />
                                Assign Mentor
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Select Session</label>
                                <select value={assignSessionId} onChange={(e) => setAssignSessionId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium">
                                    <option value="">-- Choose Session --</option>
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>ID: {s.id} | {s.department} | {new Date(s.startTime).toLocaleDateString()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Select Mentor</label>
                                <select value={assignMentorId} onChange={(e) => setAssignMentorId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium">
                                    <option value="">-- Choose Mentor --</option>
                                    {mentors.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.departmentName || 'No Dept'})</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleAssignMentor} className="w-full bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm mt-4">Assign Target Mentor</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and Session List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-600" />
                        Sessions Feed
                    </h2>

                    <div className="grid grid-cols-1 sm:flex gap-3 items-center w-full sm:w-auto">
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setFilterValue('');
                                setSearchDeptValue('');
                            }}
                            className="p-2.5 border border-gray-200 bg-gray-50 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        >
                            <option value="all">All Sessions</option>
                            <option value="date">Session By Date</option>
                            <option value="dept_select">By Department (List)</option>
                            <option value="dept_search">By Department (Search)</option>
                            <option value="status">By Status</option>
                            <option value="mentorAssigned">By Mentor Assigned</option>
                        </select>

                        {filterType === 'date' && (
                            <input
                                type="text"
                                placeholder="YYYY-MM-DD"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="p-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm w-full sm:w-40 outline-none font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            />
                        )}

                        {filterType === 'dept_select' && (
                            <select
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="p-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm w-full sm:w-48 outline-none font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            >
                                <option value="">-- Choose Dept --</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.department}>{d.department}</option>
                                ))}
                            </select>
                        )}

                        {filterType === 'dept_search' && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Enter Dept Name..."
                                    value={searchDeptValue}
                                    onChange={(e) => setSearchDeptValue(e.target.value)}
                                    className="flex-1 p-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm sm:w-44 outline-none font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                                />
                                <button
                                    onClick={() => setFilterValue(searchDeptValue)}
                                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2 active:scale-95"
                                >
                                    <Filter className="w-4 h-4" />
                                    Find
                                </button>
                            </div>
                        )}

                        {(filterType === 'status' || filterType === 'mentorAssigned') && (
                            <input
                                type="text"
                                placeholder={filterType === 'mentorAssigned' ? 'true / false' : 'Enter value...'}
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="p-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm w-full sm:w-40 outline-none font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            />
                        )}
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
                                    <th className="px-4 sm:px-6 py-4 font-bold text-xs sm:text-sm">ID & Dept</th>
                                    <th className="px-4 sm:px-6 py-4 font-bold text-xs sm:text-sm">Details</th>
                                    <th className="hidden sm:table-cell px-6 py-4 font-bold text-sm">Status</th>
                                    <th className="px-4 sm:px-6 py-4 font-bold text-center text-xs sm:text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessions.map((session) => {
                                    const isAssigned = (session.assignedMentors && session.assignedMentors.length > 0) || (session.mentorIds && session.mentorIds.length > 0) || !!session.mentorId;
                                    return (
                                        <tr key={session.id || session.sessionId} className="hover:bg-slate-50 cursor-pointer transition-colors group relative">
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="font-bold text-slate-800 text-xs sm:text-sm">#{session.id || session.sessionId}</div>
                                                <div className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mt-1 truncate max-w-[80px] sm:max-w-none">{session.department || 'General'}</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="font-bold text-[11px] sm:text-xs">
                                                            {new Date(session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500 sm:hidden">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] truncate max-w-[100px]">{session.location || 'Offline'}</span>
                                                    </div>
                                                    <div className="sm:hidden flex items-baseline gap-1 mt-1">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${session.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                            {session.status || 'ACTIVE'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-medium truncate max-w-[150px]">{session.location || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${session.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                                            {session.status || 'ACTIVE'}
                                                        </span>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 text-blue-600 uppercase">
                                                            {session.availableSlots ?? 0} / {session.maxCapacity ?? 50}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex justify-center gap-1.5 items-center">
                                                    {canViewLeads && (
                                                        <button onClick={() => handleViewLeads(session.id || session.sessionId as number)} className="p-2 sm:px-3 sm:py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition shadow-sm" title="View Leads">
                                                            <Users className="w-4 h-4 sm:hidden" />
                                                            <span className="hidden sm:inline text-[10px] uppercase font-bold">Leads</span>
                                                        </button>
                                                    )}
                                                    {isAdminOrManager && !isAssigned && (
                                                        <button onClick={async () => {
                                                            try {
                                                                await SessionService.getAvailableMentorsForSession(session.id || session.sessionId as number);
                                                                toast.success('Triggered mentor search');
                                                                loadSessions();
                                                            } catch (err) {
                                                                toast.error('Search failed');
                                                            }
                                                        }} className="p-2 sm:px-3 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition shadow-sm" title="Get Mentors">
                                                            <Users className="w-4 h-4 sm:hidden" />
                                                            <span className="hidden sm:inline text-[10px] uppercase font-bold">Get Mentors</span>
                                                        </button>
                                                    )}
                                                    {isAdminOrManager && session.status !== 'CANCELLED' && (
                                                        <button onClick={() => handleCancelSession(session.id || session.sessionId as number)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100 transition shadow-sm" title="Cancel Session">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Leads Modal */}
            {
                viewingSessionLeads && (
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
                )
            }
        </div>
    );
}
