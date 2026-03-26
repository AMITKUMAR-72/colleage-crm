'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ManagerService } from '@/services/managerService';
import { CounselorService } from '@/services/counselorService';
import { ContactedLeadDTO, CounselorDTO, LeadStatus, NoteDTO } from '@/types/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import LoadingButton from '@/components/ui/LoadingButton';
import api from '@/services/api';

// ─── Notes Slide Over ──────────────────────────────────────────────────────
function NotesSlideOver({ leadId, leadName, isOpen, onClose }: { leadId: number | null, leadName: string, isOpen: boolean, onClose: () => void }) {
    const [notes, setNotes] = useState<NoteDTO[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && leadId) {
            const fetchNotes = async () => {
                setLoading(true);
                try {
                    const data = await ManagerService.getLeadNotes(leadId);
                    setNotes(Array.isArray(data) ? data : []);
                } catch (err) {
                    toast.error('Failed to load notes');
                } finally {
                    setLoading(false);
                }
            };
            fetchNotes();
        } else {
            setNotes([]);
        }
    }, [isOpen, leadId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md transform transition-all animate-in slide-in-from-right duration-300">
                    <div className="h-full flex flex-col bg-white shadow-2xl border-l border-slate-100">
                        <div className="px-6 py-8 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{leadName}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead ID: {leadId} • Note History</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                                    <div className="w-8 h-8 border-4 border-slate-100 border-t-[#4d0101] rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fetching notes…</p>
                                </div>
                            ) : notes.length === 0 ? (
                                <div className="py-20 text-center space-y-2">
                                    <div className="mx-auto w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 italic">No notes found for this lead</p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div key={note.noteId} className="group bg-slate-50/50 border border-slate-100 p-5 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                            <span className="text-[10px] font-black text-[#4d0101] tracking-widest uppercase">Note #{note.noteId}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{format(new Date(note.createdAt), 'MMM dd, HH:mm')}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{note.note}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Bulk Assign Dropdown ──────────────────────────────────────────────────
function BulkAssignButton({ leadIds, onAssigned }: { leadIds: number[]; onAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const nowOpen = !open;
        setOpen(nowOpen);
        if (nowOpen && counselors.length === 0) {
            setLoading(true);
            try {
                const raw: any = await CounselorService.getAllCounselors();
                const list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];
                setCounselors(list);
            } catch {
                toast.error('Could not load counselors');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkAssign = async (e: React.MouseEvent, counselorId: number, type: string) => {
        e.stopPropagation();
        if (leadIds.length === 0) {
            toast.error('No leads selected');
            return;
        }
        setAssigning(`${counselorId}-${type}`);
        try {
            const res = await ManagerService.bulkAssignContacted(counselorId, type, leadIds);
            if (res && res.successCount !== undefined) {
                toast.success(`Success: ${res.successCount}, Failed: ${res.failCount || 0}`);
            } else {
                toast.success(`Assigned ${leadIds.length} leads successfully`);
            }
            setOpen(false);
            onAssigned();
        } catch {
            /* global toast shown by interceptor */
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={handleOpen}
                disabled={leadIds.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${leadIds.length > 0
                    ? 'bg-[#4d0101] text-white hover:bg-[#600202]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Bulk Assign {leadIds.length > 0 && `(${leadIds.length})`}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Counselor Type</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse italic">fetching counselors…</div>
                        ) : counselors.length === 0 ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 italic">No counselors found</div>
                        ) : (
                            counselors.map((c, idx) => (
                                <div
                                    key={c.counselorId ?? idx}
                                    className="w-full px-5 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex flex-col gap-2"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">{c.name}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {c.counselorTypes && c.counselorTypes.length > 0 ? (
                                            c.counselorTypes.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={e => handleBulkAssign(e, c.counselorId, type)}
                                                    disabled={assigning === `${c.counselorId}-${type}`}
                                                    className={`px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        assigning === `${c.counselorId}-${type}` 
                                                            ? 'bg-[#4d0101] text-white border-[#4d0101] animate-pulse opacity-80'
                                                            : 'hover:bg-[#4d0101] hover:text-white hover:border-[#4d0101]'
                                                    } disabled:cursor-not-allowed`}
                                                >
                                                    {assigning === `${c.counselorId}-${type}` ? 'saving…' : type}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-slate-400 font-bold italic">No types mapped</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Individual Assign Dropdown ──────────────────────────────────────────────
function SingleAssignButton({ leadId, onAssigned }: { leadId: number; onAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const [isCourseNullState, setIsCourseNullState] = useState(true);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const nowOpen = !open;
        setOpen(nowOpen);
        if (nowOpen && counselors.length === 0) {
            setLoading(true);
            try {
                let targetCourseName = '';
                let nullCourse = true;
                try {
                    const leadRes = await api.get(`/api/leads/${leadId}`);
                    const fullLead = leadRes.data;
                    if (fullLead?.course) {
                        nullCourse = false;
                        targetCourseName = typeof fullLead.course === 'object' ? fullLead.course.course : String(fullLead.course);
                    }
                } catch (err) {
                    console.error("Failed to fetch full lead details for manual assignment filter", err);
                }
                setIsCourseNullState(nullCourse);

                const raw: any = await CounselorService.getAllCounselors();
                let list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];

                if (!nullCourse && targetCourseName) {
                    try {
                        const courseRes = await api.get(`/api/course/byCourse/${encodeURIComponent(targetCourseName)}`);
                        const mappedDept = courseRes.data?.departmentName 
                            || courseRes.data?.department?.name 
                            || courseRes.data?.department 
                            || String(courseRes.data);

                        if (mappedDept && mappedDept !== 'undefined' && mappedDept !== '[object Object]') {
                            list = list.filter(c => {
                                if (!c.departments || c.departments.length === 0) return false;
                                return c.departments.some(d => 
                                    d.toLowerCase() === mappedDept.toLowerCase() ||
                                    mappedDept.toLowerCase().includes(d.toLowerCase())
                                );
                            });
                        } else {
                            list = []; // Invalid mapping
                        }
                    } catch (err) {
                        console.error("Course mapping failed", err);
                        list = [];
                    }
                }

                setCounselors(list);
            } catch {
                toast.error('Could not load counselors');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAssign = async (e: React.MouseEvent, counselorId: number, type: string) => {
        e.stopPropagation();
        setAssigning(`${counselorId}-${type}`);
        try {
            await ManagerService.manualAssignContacted(leadId, counselorId, type);
            toast.success(`Lead assigned successfully`);
            setOpen(false);
            onAssigned();
        } catch {
            /* global toast shown by interceptor */
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div ref={ref} className="relative inline-block" onClick={e => e.stopPropagation()}>
            <button
                onClick={handleOpen}
                className="px-3 py-1.5 bg-[#4d0101] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#600202] transition-all shadow-sm flex items-center gap-1"
            >
                Assign
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">To Counselor Type</p>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {loading ? (
                            <div className="py-4 text-center text-xs font-bold text-slate-400 animate-pulse">loading…</div>
                        ) : counselors.length === 0 ? (
                            <div className="py-4 text-center text-xs font-bold text-slate-400">
                                {isCourseNullState ? "No counselors found" : "This department counselor not available"}
                            </div>
                        ) : (
                            counselors.map((c, idx) => (
                                <div
                                    key={c.counselorId ?? idx}
                                    className="w-full px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex flex-col gap-2"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">{c.name}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {c.counselorTypes && c.counselorTypes.length > 0 ? (
                                            c.counselorTypes.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={e => handleAssign(e, c.counselorId, type)}
                                                    disabled={assigning === `${c.counselorId}-${type}`}
                                                    className={`px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        assigning === `${c.counselorId}-${type}` 
                                                            ? 'bg-[#4d0101] text-white border-[#4d0101] animate-pulse opacity-80'
                                                            : 'hover:bg-[#4d0101] hover:text-white hover:border-[#4d0101]'
                                                    } disabled:cursor-not-allowed`}
                                                >
                                                    {assigning === `${c.counselorId}-${type}` ? 'saving…' : type}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-slate-400 font-bold italic">No types mapped</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ContactedLeadsMonitor() {
    const [contacts, setContacts] = useState<ContactedLeadDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

    // ─── Filter States ────────────────────────────────────────────────────────
    const [filterType, setFilterType] = useState<'ALL' | 'COUNSELOR' | 'STATUS' | 'LEAD_ID' | 'LEAD_NAME'>('ALL');
    const [filterValue, setFilterValue] = useState('');
    const [isPagingEnabled, setIsPagingEnabled] = useState(true);
    const [allCounselors, setAllCounselors] = useState<CounselorDTO[]>([]);

    // ─── Lead Notes State ────────────────────────────────────────────────────
    const [selectedLeadRecord, setSelectedLeadRecord] = useState<{ id: number, name: string } | null>(null);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    useEffect(() => {
        const fetchCounselors = async () => {
            try {
                const raw: any = await CounselorService.getAllCounselors();
                const list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];
                setAllCounselors(list);
            } catch (err) {
                console.error('Failed to load counselors for filter', err);
            }
        };
        fetchCounselors();
    }, []);

    const loadContacts = useCallback(async () => {
        setLoading(true);
        try {
            let data: any;

            if (filterType === 'ALL' || !filterValue) {
                data = await ManagerService.getAllContactedLeads(page, 10);
                setIsPagingEnabled(true);
            } else {
                setIsPagingEnabled(false);
                switch (filterType) {
                    case 'COUNSELOR':
                        data = await ManagerService.getContactedByAssignedTo(Number(filterValue));
                        break;
                    case 'STATUS':
                        data = await ManagerService.getContactedByStatus(filterValue as LeadStatus);
                        break;
                    case 'LEAD_ID':
                        data = await ManagerService.getContactedByLead(Number(filterValue));
                        break;
                    case 'LEAD_NAME':
                        data = await ManagerService.getContactedByLeadName(filterValue);
                        break;
                }
            }

            const content = data?.content || (Array.isArray(data) ? data : []);
            const totalPages = data?.totalPages || 0;

            setContacts(content);
            setTotalPages(totalPages);
        } catch (error) {
            console.error('[ContactedLeadsMonitor] Error:', error);
            toast.error('Search failed or data not found');
            setContacts([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [page, filterType, filterValue]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadContacts();
    };

    const toggleSelection = (leadId: number) => {
        setSelectedLeadIds(prev =>
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const toggleAll = () => {
        if (selectedLeadIds.length === contacts.length && contacts.length > 0) {
            setSelectedLeadIds([]);
        } else {
            setSelectedLeadIds(contacts.map(c => c.leadId));
        }
    };

    const handleViewNotes = (leadId: number, leadName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedLeadRecord({ id: leadId, name: leadName });
        setIsNotesOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        Engagement Tracking
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review all counselor-to-lead interactions</p>
                </div>
                <div className="flex items-center gap-3">
                    <LoadingButton
                        loading={loading}
                        loadingText="SYNCING..."
                        onClick={loadContacts}
                        className="px-4 py-2.5 bg-slate-50 text-slate-400 hover:text-[#4d0101] rounded-xl hover:bg-[#4d0101]/5 transition-all border border-slate-100 text-[10px] font-black uppercase tracking-widest"
                    >
                        REFRESH
                    </LoadingButton>
                </div>
            </div>

            {/* ─── Filters Bar ──────────────────────────────────────────────── */}
            <form onSubmit={handleFilterSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter By</label>
                    <select
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value as any);
                            setFilterValue('');
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10"
                    >
                        <option value="ALL">Show All (Default)</option>
                        <option value="LEAD_NAME">Lead Name</option>
                        <option value="STATUS">Lead Status</option>
                        <option value="COUNSELOR">Counselor</option>
                        <option value="LEAD_ID">Lead ID</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Value</label>
                    {filterType === 'STATUS' ? (
                        <select
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10"
                        >
                            <option value="">Select Status</option>
                            <option value="COUNSELOR_ASSIGNED">Counselor Assigned</option>
                            <option value="EXTERNAL_ASSIGNED">External Assigned</option>
                            <option value="REASSIGNED">Reassigned</option>
                        </select>
                    ) : filterType === 'COUNSELOR' ? (
                        <select
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10"
                        >
                            <option value="">Select Counselor</option>
                            {allCounselors.map(c => (
                                <option key={c.counselorId} value={c.counselorId}>
                                    {c.name} ({c.counselorTypes?.join(', ')})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={filterType.includes('ID') ? 'number' : 'text'}
                            placeholder={filterType === 'ALL' ? "Search in results below..." : `Enter ${filterType.replace('_', ' ').toLowerCase()}...`}
                            value={searchTerm || filterValue}
                            onChange={(e) => {
                                if (filterType === 'ALL') setSearchTerm(e.target.value);
                                else setFilterValue(e.target.value);
                            }}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#4d0101]/10 font-mono"
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="flex-1 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95"
                    >
                        Apply Filter
                    </button>
                    {(filterValue || filterType !== 'ALL') && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilterType('ALL');
                                setFilterValue('');
                                setSearchTerm('');
                                setPage(0);
                            }}
                            className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            <div className="flex justify-end">
                <BulkAssignButton
                    leadIds={selectedLeadIds}
                    onAssigned={() => {
                        setSelectedLeadIds([]);
                        loadContacts();
                    }}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={contacts.length > 0 && selectedLeadIds.length === contacts.length}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-slate-300 text-[#4d0101] focus:ring-[#4d0101]/20 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Name</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcome</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20">
                                        <div className="flex justify-center items-center w-full">
                                            <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-[#4d0101] rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest lowercase italic">no contact history found</p>
                                    </td>
                                </tr>
                            ) : (
                                contacts.filter(c => {
                                    if (filterType !== 'ALL') return true; 
                                    const leadName = c.leadName?.toLowerCase() || '';
                                    const counselorEmail = c.assignedToEmail?.toLowerCase() || '';
                                    const term = searchTerm.toLowerCase();
                                    return leadName.includes(term) || counselorEmail.includes(term);
                                }).map((c) => (
                                    <tr key={c.id}
                                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedLeadIds.includes(c.leadId) ? 'bg-[#4d0101]/5' : ''}`}
                                        onClick={(e) => handleViewNotes(c.leadId, c.leadName, e)}
                                    >
                                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeadIds.includes(c.leadId)}
                                                onChange={(e) => { e.stopPropagation(); toggleSelection(c.leadId); }}
                                                className="w-4 h-4 rounded border-slate-300 text-[#4d0101] focus:ring-[#4d0101]/20 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-[#4d0101]/5 text-[#4d0101] flex items-center justify-center text-xs font-black border border-[#4d0101]/10">
                                                    {c.leadName ? c.leadName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{c.leadName || 'N/A'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-tight">ID: {c.leadId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{c.assignedToEmail || 'Unassigned'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Assigned By: {c.assignedByEmail || ' admin or manager'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {c.assignedAt ? (
                                                        (() => {
                                                            try {
                                                                return format(new Date(c.assignedAt), 'MMM dd, yyyy');
                                                            } catch (e) {
                                                                return 'Invalid Date';
                                                            }
                                                        })()
                                                    ) : 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {c.assignedAt ? (
                                                        (() => {
                                                            try {
                                                                return format(new Date(c.assignedAt), 'HH:mm');
                                                            } catch (e) {
                                                                return '';
                                                            }
                                                        })()
                                                    ) : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${c.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                c.status === 'LOST' || c.status === 'TIMED_OUT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {c.status?.replace(/_/g, ' ') || 'CONTACTED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <SingleAssignButton leadId={c.leadId} onAssigned={loadContacts} />
                                            <button 
                                                onClick={(e) => handleViewNotes(c.leadId, c.leadName, e)}
                                                className="p-2 text-slate-300 hover:text-[#4d0101] transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {isPagingEnabled && totalPages > 0 && (
                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                PREV
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all font-mono"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <NotesSlideOver 
                leadId={selectedLeadRecord?.id || null} 
                leadName={selectedLeadRecord?.name || ''} 
                isOpen={isNotesOpen} 
                onClose={() => setIsNotesOpen(false)} 
            />
        </div>
    );
}
