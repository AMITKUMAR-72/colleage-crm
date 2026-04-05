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
        startTime: '', endTime: '', maxCapacity: 50, location: '', notes: '', department: 'ENGINEERING'
    });
    const [bulkFormData, setBulkFormData] = useState<Partial<SessionDTO>[]>([
        { startTime: '', endTime: '', maxCapacity: 50, location: '', notes: '' }
    ]);

    // Assign Mentor 
    const [assignSessionId, setAssignSessionId] = useState<string | number | ''>('');
    const [assignMentorId, setAssignMentorId] = useState<string | number | ''>('');

    // Filters
    const [filterType, setFilterType] = useState('all'); // all, date, status, mentorAssigned, department
    const [filterValue, setFilterValue] = useState('');
    const [leadsWithNotes, setLeadsWithNotes] = useState<any[]>([]);
    const [viewingSessionLeads, setViewingSessionLeads] = useState<number | null>(null);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [searchDeptValue, setSearchDeptValue] = useState('');

    // Counselor Assign Lead
    const [assigningLeadToSession, setAssigningLeadToSession] = useState<SessionDTO | null>(null);
    const [assignLeadModalData, setAssignLeadModalData] = useState({ leadId: '', notes: '' });

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
            // Sanitize time format to append seconds if missing (needed for backend)
            const payload = { ...singleFormData };
            if (payload.startTime && payload.startTime.length === 16) {
                payload.startTime += ':00';
            }
            if (payload.endTime && payload.endTime.length === 16) {
                payload.endTime += ':00';
            }

            await SessionService.createSession(payload as SessionDTO);
            toast.success('Session created successfully');
            loadSessions();

            // Reset form except department
            setSingleFormData(prev => ({
                ...prev,
                startTime: '',
                endTime: '',
                location: '',
                notes: ''
            }));
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to create session";
            toast.error(msg);
        }
    };

    const handleCreateBulk = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (bulkFormData.length === 0) throw new Error("Add at least one session");

            const sanitizedArray = bulkFormData.map((session: any) => {
                const s = { ...session };
                if (s.startTime && s.startTime.length === 16) s.startTime += ':00';
                if (s.endTime && s.endTime.length === 16) s.endTime += ':00';
                return s;
            });

            await SessionService.createBulkSessions(sanitizedArray);
            toast.success('Bulk sessions created');
            setBulkFormData([{ startTime: '', endTime: '', maxCapacity: 50, location: '', notes: '' }]);
            loadSessions();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to create bulk sessions";
            toast.error(msg);
        }
    };

    const handleAssignMentor = async () => {
        if (!assignSessionId || !assignMentorId) return toast.error("Select both session and mentor");
        try {
            await SessionService.assignMentorToSession(assignSessionId, assignMentorId);
            toast.success("Mentor assigned successfully");
            setAssignSessionId('');
            setAssignMentorId('');
            loadSessions();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to assign mentor";
            toast.error(msg);
        }
    };

    const handleCancelSession = async (id: string | number) => {
        console.log("Initiating cancellation for Session ID:", id);
        if (id === undefined || id === null) {
            toast.error("Cannot cancel: Session ID is missing");
            return;
        }

        const confirmMsg = `Are you sure you want to cancel Session #${id}? This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            console.log(`Calling SessionService.cancelSession(${id})...`);
            await SessionService.cancelSession(id);
            toast.success(`Session #${id} cancelled successfully`);
            loadSessions();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to cancel session";
            toast.error(msg);
        }
    };

    const handleViewLeads = async (id: string | number) => {
        try {
            const data = await SessionService.getLeadsWithNotesForSession(id);
            setLeadsWithNotes(Array.isArray(data) ? data : []);
            setViewingSessionLeads(id);
        } catch (error) {
            toast.error("Failed to fetch leads for session");
        }
    };

    const handleAssignLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningLeadToSession) return;
        try {
            await SessionService.assignLeadToSession({
                leadId: assignLeadModalData.leadId,
                notes: assignLeadModalData.notes,
                preferredDate: assigningLeadToSession.startTime
            });
            toast.success("Lead assigned successfully");
            setAssigningLeadToSession(null);
            setAssignLeadModalData({ leadId: '', notes: '' });
            loadSessions();
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to assign lead";
            toast.error(msg);
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
                            {role === 'ADMIN' && (
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setIsBulk(false)}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${!isBulk ? 'bg-white shadow text-[#4d0101]' : 'text-gray-500'}`}
                                    >
                                        Single
                                    </button>
                                    <button
                                        onClick={() => setIsBulk(true)}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${isBulk ? 'bg-white shadow text-[#4d0101]' : 'text-gray-500'}`}
                                    >
                                        Bulk
                                    </button>
                                </div>
                            )}
                        </div>

                        {isBulk && role === 'ADMIN' ? (
                            <form onSubmit={handleCreateBulk} className="space-y-4">
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 border-l-2 border-[#4d0101]/10 pl-3">
                                    {bulkFormData.map((item, index) => (
                                        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group transition-all">
                                            {bulkFormData.length > 1 && (
                                                <button type="button" onClick={() => setBulkFormData(prev => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10 hover:bg-rose-200">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Start Time</label>
                                                <input required type="datetime-local" value={item.startTime || ''} onChange={(e) => { const newArr = [...bulkFormData]; newArr[index].startTime = e.target.value; setBulkFormData(newArr); }} className="w-full p-2 border border-gray-200 bg-white shadow-sm rounded-lg text-xs outline-none focus:border-[#dbb212]" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">End Time</label>
                                                <input required type="datetime-local" value={item.endTime || ''} onChange={(e) => { const newArr = [...bulkFormData]; newArr[index].endTime = e.target.value; setBulkFormData(newArr); }} className="w-full p-2 border border-gray-200 bg-white shadow-sm rounded-lg text-xs outline-none focus:border-[#dbb212]" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Capacity</label>
                                                <input required type="number" value={item.maxCapacity || 50} onChange={(e) => { const newArr = [...bulkFormData]; newArr[index].maxCapacity = Number(e.target.value); setBulkFormData(newArr); }} className="w-full p-2 border border-gray-200 bg-white shadow-sm rounded-lg text-xs outline-none focus:border-[#dbb212]" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Location</label>
                                                <input required type="text" value={item.location || ''} onChange={(e) => { const newArr = [...bulkFormData]; newArr[index].location = e.target.value; setBulkFormData(newArr); }} className="w-full p-2 border border-gray-200 bg-white shadow-sm rounded-lg text-xs outline-none focus:border-[#dbb212]" placeholder="e.g. Hall A" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setBulkFormData(prev => [...prev, { startTime: '', endTime: '', maxCapacity: 50, location: '', notes: '' }])} className="w-1/3 bg-gray-100 border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition">
                                        + Add Row
                                    </button>
                                    <button type="submit" className="w-2/3 bg-[#4d0101] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#600202] transition shadow-md">
                                        Push {bulkFormData.length} Sessions
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateSingle} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Start Time</label>
                                        <input required type="datetime-local" value={singleFormData.startTime || ''} onChange={(e) => setSingleFormData({ ...singleFormData, startTime: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">End Time</label>
                                        <input required type="datetime-local" value={singleFormData.endTime || ''} onChange={(e) => setSingleFormData({ ...singleFormData, endTime: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm font-medium" />
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
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Location</label>
                                        <input required type="text" value={singleFormData.location || ''} onChange={(e) => setSingleFormData({ ...singleFormData, location: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm font-medium" placeholder="Raffles University, Chancellery Building" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Notes</label>
                                        <input type="text" value={singleFormData.notes || ''} onChange={(e) => setSingleFormData({ ...singleFormData, notes: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm font-medium" placeholder="e.g. Visitors, Candidates" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#4d0101] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#600202] transition">Create Single Session</button>
                            </form>
                        )}
                    </div>

                    {/* Assign Mentor Card */}
                    <div id="assign-mentor-card" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <div className="mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-emerald-600" />
                                Assign Mentor
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Choose Session</label>
                                <select value={assignSessionId} onChange={(e) => setAssignSessionId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium">
                                    <option value="">-- Click to Select Session --</option>
                                    {sessions.map(s => {
                                        const sid = s.id || s.sessionId;
                                        return (
                                            <option key={sid} value={sid}>
                                                {s.department} | {new Date(s.startTime).toLocaleDateString()} | {s.location}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {assignSessionId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 pt-2 border-t border-gray-50">
                                    <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 mb-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Selected Session Details</p>
                                            <p className="text-xs font-bold text-slate-700 mt-1">
                                                {sessions.find(s => (s.id || s.sessionId) === assignSessionId)?.department} at {sessions.find(s => (s.id || s.sessionId) === assignSessionId)?.location}
                                            </p>
                                        </div>

                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Select Mentor to Assign</label>
                                        <select value={assignMentorId} onChange={(e) => setAssignMentorId(e.target.value ? Number(e.target.value) : '')} className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm">
                                            <option value="">-- Choose Mentor --</option>
                                            {mentors.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.departmentName || 'No Dept'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={handleAssignMentor} className="w-full bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-md active:scale-95">Complete Assignment</button>
                                </div>
                            )}
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
                    <div className="py-20 flex justify-center items-center w-full">
                        <img src="/raffles-logo.png" alt="Loading" className="h-20 w-auto object-contain animate-spin-y-ease-in" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm font-medium">
                        No sessions found matching this filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Department</th>
                                    <th className="px-4 sm:px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Session Details</th>
                                    <th className="hidden lg:table-cell px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status & Capacity</th>
                                    <th className="px-4 sm:px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessions.map((session) => {
                                    const isAssigned = (session.assignedMentors && session.assignedMentors.length > 0) || (session.mentorIds && session.mentorIds.length > 0) || !!session.mentorId;
                                    return (
                                        <tr
                                            key={session.id || session.sessionId}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        >
                                            <td
                                                className="px-4 sm:px-6 py-4"
                                                onClick={() => {
                                                    setAssignSessionId(session.id || session.sessionId as number);
                                                    document.getElementById('assign-mentor-card')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="text-xs font-black text-indigo-600 tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">{session.department || 'General'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">{session.location || 'Main Campus'}</div>
                                            </td>
                                            <td
                                                className="px-4 sm:px-6 py-4"
                                                onClick={() => {
                                                    setAssignSessionId(session.id || session.sessionId as number);
                                                    document.getElementById('assign-mentor-card')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="font-bold text-[11px] sm:text-xs text-slate-700">
                                                            {new Date(session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} | {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                            <td
                                                className="hidden lg:table-cell px-6 py-4 cursor-pointer"
                                                onClick={() => {
                                                    setAssignSessionId(session.id || session.sessionId as number);
                                                    document.getElementById('assign-mentor-card')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                            >
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${session.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                                            {session.status || 'ACTIVE'}
                                                        </span>
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded border border-blue-100 text-blue-600 uppercase tracking-widest">
                                                            {session.availableSlots ?? 0} / {session.maxCapacity ?? 50} SLOTS
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5 items-center">
                                                    {isAdminOrManager && !isAssigned && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAssignSessionId(session.id || session.sessionId as number);
                                                                document.getElementById('assign-mentor-card')?.scrollIntoView({ behavior: 'smooth' });
                                                            }}
                                                            className="p-2 sm:px-3 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition shadow-sm font-black text-[10px] uppercase tracking-widest"
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                    {isAdminOrManager && session.status !== 'CANCELLED' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Use session.id primarily, fallback to sessionId if backend uses that
                                                                const sid = session.id || session.sessionId;
                                                                console.log("Cancel button clicked. Session data:", session);
                                                                if (sid) {
                                                                    handleCancelSession(sid);
                                                                } else {
                                                                    toast.error("Session ID not found in data");
                                                                }
                                                            }}
                                                            className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100 transition shadow-sm font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
                                                        >
                                                            Cancel Session
                                                        </button>
                                                    )}
                                                    {role === 'COUNSELOR' && session.status !== 'CANCELLED' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAssigningLeadToSession(session);
                                                            }}
                                                            className="p-2 sm:px-3 sm:py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition shadow-sm font-black text-[10px] uppercase tracking-widest"
                                                        >
                                                            Assign Lead
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

            {/* Assign Lead Modal (Counselor Only) */}
            {assigningLeadToSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                            <h3 className="font-black tracking-tight text-gray-900 text-lg">Assign Lead to Session</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                Session: {new Date(assigningLeadToSession.startTime).toLocaleDateString()} at {assigningLeadToSession.location}
                            </p>
                        </div>
                        <form onSubmit={handleAssignLeadSubmit} className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Important Note</p>
                                <p className="text-xs font-medium text-amber-950">Offline sessions can only be created for <span className="font-bold underline decoration-amber-500 underline-offset-2 italic">HOT</span> leads.</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lead ID</label>
                                <input
                                    required
                                    type="text"
                                    value={assignLeadModalData.leadId}
                                    onChange={(e) => setAssignLeadModalData({ ...assignLeadModalData, leadId: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                                    placeholder="Enter Lead ID (e.g. 4)"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assignment Notes</label>
                                <textarea
                                    required
                                    value={assignLeadModalData.notes}
                                    onChange={(e) => setAssignLeadModalData({ ...assignLeadModalData, notes: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm h-24 resize-none"
                                    placeholder="e.g. Student requested this specific date"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssigningLeadToSession(null)}
                                    className="flex-1 bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition shadow-md shadow-blue-200"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
