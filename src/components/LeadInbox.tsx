'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LeadResponseDTO, CounselorDTO, NoteDTO } from '@/types/api';
import { CounselorService } from '@/services/counselorService';
import { LeadService } from '@/services/leadService';
import api from '@/services/api';
import LeadSearchFilters from './LeadSearchFilters';
import LeadEditDrawer from './admin/LeadEditDrawer';
import CounselorQueueSidebar from './CounselorQueueSidebar';
import toast from 'react-hot-toast';

interface LeadFilters {
    email: string;
    status: string;
    course: string;
    campaign: string;
    score: string;
    id?: string;
    phone?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
}

const PAGE_SIZE = 15;

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-amber-100 text-amber-700 border-amber-200',
    QUEUED: 'bg-orange-100 text-orange-700 border-orange-200',
    TELECALLER_ASSIGNED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    QUALIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    COUNSELOR_ASSIGNED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    EXTERNAL_ASSIGNED: 'bg-violet-100 text-violet-700 border-violet-200',
    ADMISSION_IN_PROCESS: 'bg-amber-100 text-amber-700 border-amber-200',
    ADMISSION_DONE: 'bg-green-100 text-green-800 border-green-200',
    LOST: 'bg-slate-100 text-slate-700 border-slate-200',
    UNASSIGNED: 'bg-gray-100 text-gray-600 border-gray-200',
    CONTACTED: 'bg-blue-100 text-blue-700 border-blue-200',
    TIMED_OUT: 'bg-rose-100 text-rose-700 border-rose-200',
    REASSIGNED: 'bg-pink-100 text-pink-700 border-pink-200',
    IN_A_SESSION: 'bg-violet-100 text-violet-700 border-violet-200',
};

const SCORE_COLORS: Record<string, string> = {
    HOT: 'bg-red-100 text-red-700',
    WARM: 'bg-orange-100 text-orange-700',
    COLD: 'bg-sky-100 text-sky-700',
};

// ─── Assign Dropdown ─────────────────────────────────────────────────────────
function AssignButton({ lead, onAssigned }: { lead: LeadResponseDTO; onAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<number | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const leadId = lead.id;

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
                let list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];

                const isCourseNull = !lead.course || (typeof lead.course === 'object' && !(lead.course as any).course);
                if (isCourseNull) {
                    list = list.filter(c => !c.counselorTypes?.includes('INTERNAL'));
                }

                setCounselors(list);
            } catch {
                toast.error('Could not load counselors');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAssign = async (e: React.MouseEvent, counselorId: number) => {
        e.stopPropagation();
        setAssigning(counselorId);
        try {
            await api.post(`/api/counselors/manual-assign/lead/${leadId}/counselor/${counselorId}`);
            console.log('Lead assigned successfully');
            toast.success('Lead assigned successfully');
            setOpen(false);
            onAssigned();
        } catch {
            /* global error toast shown by interceptor */
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={handleOpen}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#4d0101] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#600202] transition-all duration-200 shadow-sm"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Assign
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Counselor</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="py-4 text-center text-xs font-bold text-slate-400 animate-pulse">Loading…</div>
                        ) : counselors.length === 0 ? (
                            <div className="py-4 text-center text-xs font-bold text-slate-400">No counselors found</div>
                        ) : (
                            counselors.map((c, idx) => (
                                <button
                                    key={c.counselorId ?? idx}
                                    onClick={e => handleAssign(e, c.counselorId)}
                                    disabled={assigning === c.counselorId}
                                    className="w-full text-left px-4 py-2.5 hover:bg-[#4d0101]/5 transition text-xs font-bold text-slate-800 border-b border-slate-50 last:border-0 flex items-center justify-between"
                                >
                                    <div className="flex flex-col">
                                        <span>{c.name || String(c)}</span>
                                        {c.counselorTypes && c.counselorTypes.length > 0 && (
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{c.counselorTypes?.join(', ')}</span>
                                        )}
                                    </div>
                                    {assigning === c.counselorId && (
                                        <span className="text-[10px] font-black text-[#4d0101] animate-pulse">Saving…</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadInbox() {
    const [allLeads, setAllLeads] = useState<LeadResponseDTO[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<LeadFilters>({ email: '', status: '', course: '', campaign: '', score: '' });

    // Notes state
    const [notes, setNotes] = useState<NoteDTO[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [notesPosting, setNotesPosting] = useState(false);

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [leadToEdit, setLeadToEdit] = useState<LeadResponseDTO | null>(null);

    // ── Derived pagination (client-side) ─────────────────────────────────────
    // ── Derived pagination ───────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // If filters are active, we slice locally (since search returns array).
    // If no filters, the server handled the pagination, so we take the whole array.
    const hasFilters = Object.entries(filters).some(([_, v]) => v && v !== '');
    const pagedLeads = hasFilters
        ? allLeads.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
        : allLeads;

    const showPagination = totalCount > PAGE_SIZE;

    // ── Fetch leads ───────────────────────────────────────────────────────────
    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const hasFilters = Object.entries(filters).some(([_, v]) => v && v !== '');
            if (hasFilters) {
                const results: any = await LeadService.searchLeads(filters);
                const arr: LeadResponseDTO[] = Array.isArray(results)
                    ? results
                    : results?.lead || results?.content || [];
                setAllLeads(arr);
                setTotalCount(arr.length);
            } else {
                // Server-side pagination for "Live Feed"
                const res = await LeadService.getRecentLeads(page, PAGE_SIZE);
                setAllLeads(res.content);
                setTotalCount(res.totalElements);
            }
        } catch (err) {
            console.error('[LeadInbox] Failed to fetch leads', err);
            toast.error('Could not load leads');
            setAllLeads([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        setPage(0);
    }, [filters]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // ── Open lead + fetch notes ───────────────────────────────────────────────
    const handleViewLead = async (id: number) => {
        const lead = allLeads.find(l => l.id === id);
        if (!lead) return;
        setSelectedLead(lead);
        setNotes([]);
        setNoteText('');
        setNotesLoading(true);
        try {
            const raw: any = await LeadService.getNotes(id);
            const list: NoteDTO[] = Array.isArray(raw) ? raw : raw?.data ?? [];
            setNotes(list);
        } catch {
            /* silently ignore */
        } finally {
            setNotesLoading(false);
        }
    };

    // ── Post a new note ───────────────────────────────────────────────────────
    const handleAddNote = async () => {
        if (!noteText.trim() || !selectedLead || notesPosting) return;
        setNotesPosting(true);
        try {
            const created: any = await LeadService.addNote(selectedLead.id, noteText.trim());
            setNotes(prev => [...prev, created]);
            setNoteText('');
        } catch {
            /* global toast shown by interceptor */
        } finally {
            setNotesPosting(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getCampaignDisplay = (lead: LeadResponseDTO): string => {
        const c = lead.campaign as any;
        if (!c) return '—';
        return c.name || String(c);
    };

    const getCourseDisplay = (lead: LeadResponseDTO): string => {
        if (!lead.course) return 'General';
        if (typeof lead.course === 'object') return (lead.course as any).course || 'General';
        return String(lead.course);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* ── Search / Filter Bar ──────────────────────────────────────── */}
            <LeadSearchFilters onFilterChange={(f: LeadFilters) => setFilters(f)} />

            {/* ── Layout Wrapper ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-8">

                {/* ── Feed Card ────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="font-black text-slate-800 tracking-tight">All Leads</h2>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                            {totalCount} Total Leads
                            {showPagination && ` • Page ${page + 1} of ${totalPages}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLeads}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest transition"
                        >
                            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            Refresh
                        </button>

                        {showPagination && (
                            <>
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-1.5 text-[10px] border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-black uppercase tracking-widest"
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="px-3 py-1.5 text-[10px] border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-black uppercase tracking-widest"
                                >
                                    Next →
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Body — max-height 40vh */}
                <div style={{ maxHeight: '40vh' }} className="overflow-y-auto overflow-x-auto">
                    {loading ? (
                        <div className="py-16 flex justify-center items-center">
                            <div className="w-8 h-8 border-4 border-[#4d0101]/20 border-t-[#4d0101] rounded-full animate-spin" />
                        </div>
                    ) : pagedLeads.length === 0 ? (
                        <div className="py-14 text-center">
                            <p className="text-slate-400 font-medium lowercase italic text-sm">no leads found</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/60 border-b border-slate-200 tracking-widest font-black sticky top-0 z-10">

                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pagedLeads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => handleViewLead(lead.id)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-slate-800 text-sm">{lead.name || 'Unknown'}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">#{lead.id}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-slate-700 text-xs font-medium">{lead.email || '—'}</div>
                                            <div className="text-slate-400 text-[10px] mt-0.5">{lead.phone || '—'}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-slate-600 text-xs font-medium max-w-[120px] truncate">{getCourseDisplay(lead)}</div>
                                            {lead.intake && (
                                                <div className="text-[10px] text-slate-400 font-bold">{lead.intake}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-bold text-slate-600">{getCampaignDisplay(lead)}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[String(lead.status)] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {String(lead.status || '').replace(/_/g, ' ') || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${SCORE_COLORS[lead.score] || 'bg-slate-100 text-slate-500'}`}>
                                                {lead.score || '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setLeadToEdit(lead);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                                                    title="Edit Lead"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <AssignButton lead={lead} onAssigned={fetchLeads} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer pagination strip */}
                {showPagination && !loading && (
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                            >
                                ← Prev
                            </button>
                            <span className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Counselor Queue ───────────────────────────────────────────── */}
            <CounselorQueueSidebar />

            </div>

            {/* ── Lead Details Slide-over ───────────────────────────────────── */}
            {selectedLead && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
                    onClick={() => setSelectedLead(null)}
                >
                    <div
                        className="w-full sm:max-w-md bg-white h-full shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Lead Details</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{selectedLead.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Identity */}
                            <div className="bg-gradient-to-br from-[#4d0101]/5 to-indigo-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="font-black text-lg text-slate-900">{selectedLead.name}</h3>
                                <p className="text-slate-500 text-sm mt-0.5">{selectedLead.email}</p>
                                <p className="text-slate-500 text-sm">{selectedLead.phone}</p>
                            </div>

                            {/* Status + Score */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 border rounded-xl">
                                    <label className="text-xs text-gray-400 uppercase font-black tracking-widest">Status</label>
                                    <div className={`mt-1.5 inline-block px-2 py-1 rounded text-xs font-black ${STATUS_COLORS[String(selectedLead.status)] || 'bg-gray-100'}`}>
                                        {String(selectedLead.status || '').replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="p-3 border rounded-xl">
                                    <label className="text-xs text-gray-400 uppercase font-black tracking-widest">Score</label>
                                    <div className={`mt-1.5 inline-block px-2 py-1 rounded text-xs font-black ${SCORE_COLORS[selectedLead.score] || 'bg-slate-100 text-slate-600'}`}>
                                        {selectedLead.score}
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-4 border rounded-xl space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-black tracking-widest block mb-2">Details</label>
                                <InfoRow label="Course" value={getCourseDisplay(selectedLead)} />
                                {selectedLead.intake && <InfoRow label="Intake" value={selectedLead.intake} />}
                                <InfoRow label="Address" value={selectedLead.address || 'N/A'} />
                                <InfoRow label="Campaign" value={getCampaignDisplay(selectedLead)} />
                                {selectedLead.createdAt && (
                                    <InfoRow
                                        label="Created"
                                        value={new Date(selectedLead.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    />
                                )}
                            </div>

                            {/* Assign Counselor */}
                            <div className="p-4 border border-[#4d0101]/20 bg-[#4d0101]/5 rounded-xl">
                                <label className="text-xs text-[#4d0101] uppercase font-black tracking-widest block mb-3">Assign Counselor</label>
                                <AssignButton
                                    lead={selectedLead}
                                    onAssigned={() => { setSelectedLead(null); fetchLeads(); }}
                                />
                            </div>

                            {/* ── Notes ── */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest">📝 Notes</label>
                                    {notesLoading
                                        ? <span className="text-[10px] font-bold text-slate-400 animate-pulse">Loading…</span>
                                        : <span className="text-[10px] font-bold text-slate-400">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                                    }
                                </div>

                                {/* Notes list */}
                                <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                                    {notesLoading ? (
                                        <div className="py-4 px-4 space-y-2 animate-pulse">
                                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                                        </div>
                                    ) : notes.length === 0 ? (
                                        <p className="py-6 text-center text-xs font-medium text-slate-300 italic">No notes yet</p>
                                    ) : (
                                        notes.map((n, i) => (
                                            <div key={n.noteId || i} className="px-4 py-3">
                                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{n.note}</p>
                                                {n.createdAt && (
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                                                        {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add note composer */}
                                <div className="border-t border-slate-100 p-3 bg-slate-50/50">
                                    <textarea
                                        rows={2}
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddNote();
                                            }
                                        }}
                                        placeholder="Write a note… (Enter to post)"
                                        className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101]/40 transition placeholder:text-slate-300"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleAddNote}
                                            disabled={!noteText.trim() || notesPosting}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${noteText.trim() && !notesPosting
                                                ? 'bg-[#4d0101] text-white hover:bg-[#600202]'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {notesPosting ? 'Posting…' : 'Post Note'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LeadEditDrawer
                isOpen={isEditOpen}
                lead={leadToEdit}
                onClose={() => {
                    setIsEditOpen(false);
                    setLeadToEdit(null);
                }}
                onSuccess={() => {
                    fetchLeads();
                }}
            />
        </div>
    );
}

// ── Tiny helper for the detail rows ──────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">{label}</span>
            <span className="text-xs font-bold text-slate-700 text-right">{value}</span>
        </div>
    );
}
