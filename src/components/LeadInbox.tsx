'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LeadResponseDTO, CounselorDTO, NoteDTO, CampaignDTO, LeadFilters } from '@/types/api';
import { CounselorService } from '@/services/counselorService';
import { LeadService } from '@/services/leadService';
import { CampaignService } from '@/services/campaignService';
import api from '@/services/api';
import LeadSearchFilters from './LeadSearchFilters';
import LeadEditDrawer from './admin/LeadEditDrawer';
import toast from 'react-hot-toast';
import { Search, UserPlus, Fingerprint, Settings2, Loader2, Database } from 'lucide-react';

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
    HOT: 'bg-rose-50 text-rose-700 border-rose-100',
    WARM: 'bg-orange-50 text-orange-700 border-orange-100',
    COLD: 'bg-sky-50 text-sky-700 border-sky-100',
};

// ─── Assign Dropdown ─────────────────────────────────────────────────────────
function AssignButton({ leadId, onAssigned }: { leadId: number; onAssigned: () => void }) {
    const [open, setOpen] = useState(false);
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<number | null>(null);
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

    const handleAssign = async (e: React.MouseEvent, counselorId: number) => {
        e.stopPropagation();
        setAssigning(counselorId);
        try {
            await LeadService.bulkAssignLeads(counselorId, [leadId]);
            toast.success('Strategy node deployed');
            setOpen(false);
            onAssigned();
        } catch {
            /* Handled by interceptor */
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={handleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-900 transition-all duration-200 shadow-sm active:scale-95"
            >
                <UserPlus className="w-3.5 h-3.5" />
                Assign
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Counselor</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="p-8 text-center text-slate-300"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                        ) : counselors.length === 0 ? (
                            <p className="p-4 text-center text-xs text-slate-400">No counselors available</p>
                        ) : (
                            counselors.map(c => (
                                <button
                                    key={c.counselorId}
                                    onClick={(e) => handleAssign(e, c.counselorId)}
                                    disabled={assigning === c.counselorId}
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-slate-700">{c.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{c.department}</div>
                                    </div>
                                    {assigning === c.counselorId ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                    ) : (
                                        <div className="opacity-0 group-hover:opacity-100 transition text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select</div>
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
    const [filters, setFilters] = useState<LeadFilters>({ email: '', status: '', course: '', campaign: '', score: '', origin: '' });

    // Notes state
    const [notes, setNotes] = useState<NoteDTO[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [notesPosting, setNotesPosting] = useState(false);

    // Identity Modification State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [leadToEdit, setLeadToEdit] = useState<LeadResponseDTO | null>(null);

    // ── Derived pagination (client-side) ─────────────────────────────────────
    // ── Derived pagination ───────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // If filters are active, we slice locally (since search returns array).
    // If no filters, the server handled the pagination, so we take the whole array.
    const hasFilters = Object.values(filters).some(v => v !== '');
    const pagedLeads = hasFilters
        ? allLeads.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
        : allLeads;

    const showPagination = totalCount > PAGE_SIZE;

    // Added campaign fetching to resolve IDs to Names
    const [allCampaigns, setAllCampaigns] = useState<CampaignDTO[]>([]);

    useEffect(() => {
        CampaignService.getAllSources().then(res => {
            const list = Array.isArray(res) ? res : (res as any)?.data || [];
            setAllCampaigns(list);
        }).catch(() => {});
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getCampaignDisplay = (lead: LeadResponseDTO): string => {
        const c = lead.campaign as any;
        if (!c) return 'DIRECT INTEL';
        if (typeof c === 'object') return c.name || String(c.id || c);
        
        // If it's just an ID/number/string, try to find it in our campaigns list
        const resolved = allCampaigns.find(cp => String(cp.id) === String(c) || cp.name === String(c));
        return resolved ? resolved.name : String(c).toUpperCase();
    };

    const getCourseDisplay = (lead: LeadResponseDTO): string => {
        if (!lead.course) return 'GENERAL CURRICULUM';
        if (typeof lead.course === 'object' && lead.course) {
            const c = lead.course as any;
            const dept = c.department ? `${c.department} - ` : '';
            return `${dept}${c.course || c.name || 'GENERAL'}`.toUpperCase();
        }
        return String(lead.course).toUpperCase();
    };

    // ── Fetch leads ───────────────────────────────────────────────────────────
    // ── Fetch leads — Hybrid Server/Client Multi-Filtering ───────────────────
    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const activeFilters = Object.entries(filters).filter(([_, v]) => v && v !== '');
            
            if (activeFilters.length > 0) {
                let results: LeadResponseDTO[] = [];
                
                // 1. Pick the "Heavier" filter for the server-side request
                if (filters.id) {
                    const lead = await LeadService.getLeadById(Number(filters.id));
                    results = lead ? [lead] : [];
                } else if (filters.email) {
                    const lead = await LeadService.getLeadByEmail(filters.email);
                    results = lead ? [lead] : [];
                } else if (filters.phone) {
                    results = await LeadService.searchLeads({ phone: filters.phone });
                } else if (filters.name) {
                    results = await LeadService.getLeadsByName(filters.name);
                } else if (filters.status) {
                    results = await LeadService.getLeadsByStatus(filters.status as any);
                } else if (filters.course) {
                    results = await LeadService.getLeadsByCourse(filters.course);
                } else if (filters.campaign) {
                    results = await LeadService.getLeadsByCampaign(filters.campaign);
                } else if (filters.score) {
                    results = await LeadService.getLeadsByScore(filters.score as any);
                } else if (filters.origin) {
                    results = await LeadService.searchLeads({ origin: filters.origin });
                } else if (filters.startDate && filters.endDate) {
                    results = await LeadService.searchLeads({ startDate: filters.startDate, endDate: filters.endDate });
                }

                // 2. Multi-Refinement (Local filtering for all active fields)
                let refined = Array.isArray(results) ? results : [];
                
                refined = refined.filter(l => {
                    let match = true;
                    if (filters.name && !l.name?.toLowerCase().includes(filters.name.toLowerCase())) match = false;
                    if (filters.email && !l.email?.toLowerCase().includes(filters.email.toLowerCase())) match = false;
                    if (filters.status && l.status !== filters.status) match = false;
                    if (filters.score && l.score !== filters.score) match = false;
                    if (filters.course) {
                         const cDisp = getCourseDisplay(l).toLowerCase();
                         if (!cDisp.includes(filters.course.toLowerCase())) match = false;
                    }
                    if (filters.phone && !l.phone?.includes(filters.phone)) match = false;
                    return match;
                });
                
                setAllLeads(refined);
                setTotalCount(refined.length);
            } else {
                // Default Live Feed
                const res = await LeadService.getRecentLeads(page, PAGE_SIZE);
                setAllLeads(res.content);
                setTotalCount(res.totalElements);
            }
        } catch (err) {
            console.error('[LeadInbox] Advanced Multi-Filter Failure', err);
            toast.error('Search synchronization error');
            setAllLeads([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [filters, page, allCampaigns]);


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


    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* ── Search / Filter Bar ──────────────────────────────────────── */}
            <LeadSearchFilters onFilterChange={useCallback((f: LeadFilters) => setFilters(f), [])} />

            {/* ── Feed Card ────────────────────────────────────────────────── */}
            <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Database</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Global Lead Feed</h2>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                            {totalCount} leads synchronized
                            {showPagination && ` • Page ${page + 1} of ${totalPages}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchLeads}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                        >
                            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            Refresh
                        </button>

                        {showPagination && (
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all active:scale-90"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 5l6 6-6 6"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Body — max-height calibrated for standard display units */}
                <div style={{ maxHeight: '55vh' }} className="overflow-y-auto overflow-x-auto relative">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-6">
                             <img src="/raffles-logo.png" alt="Loading" className="h-16 w-32 object-contain animate-spin-y-ease-in opacity-80" />
                             <span className="text-[10px] font-black text-slate-400 capitalize tracking-[0.4em] italic animate-pulse">Synchronizing Data Nodes...</span>
                        </div>
                    ) : pagedLeads.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <Database className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Zero Response from Registry</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[11px] text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200 font-bold sticky top-0 z-20">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Lead Details</th>
                                    <th className="px-6 py-4 font-bold">Contact Info</th>
                                    <th className="px-6 py-4 font-bold">Program</th>
                                    <th className="px-6 py-4 font-bold text-center">Source</th>
                                    <th className="px-6 py-4 font-bold text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pagedLeads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => handleViewLead(lead.id)}
                                        className="hover:bg-slate-50/80 border-b border-slate-100 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-sm tracking-tight">{lead.name || 'No Name'}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">ID #{lead.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 text-[11px] font-medium">{lead.email || '—'}</div>
                                            <div className="text-slate-500 text-[10px] font-medium mt-0.5">{lead.phone || '—'}</div>
                                            {lead.city && <div className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">{lead.city}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 text-[10px] font-bold uppercase tracking-tight line-clamp-1">{getCourseDisplay(lead)}</div>
                                            {lead.intake && (
                                                <div className="text-[9px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">Intake {lead.intake}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-slate-200">
                                                {getCampaignDisplay(lead)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase border shadow-sm ${STATUS_COLORS[lead.status] || 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                    {lead.status?.replace(/_/g, ' ') || 'NEUTRAL'}
                                                </span>
                                                <span className={`text-[9px] font-semibold uppercase tracking-wider ${SCORE_COLORS[lead.score] || 'text-slate-400'}`}>
                                                    {lead.score || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2 text-right">
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleViewLead(lead.id); }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-800 hover:border-slate-400 transition-all active:scale-95"
                                                    title="View Details"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                </button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setLeadToEdit(lead);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                    title="Edit Lead"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                </button>
                                                <AssignButton leadId={lead.id} onAssigned={fetchLeads} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer pagination strip — refined for elite control */}
                {showPagination && !loading && (
                    <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between">
                        <p className="text-[11px] font-medium text-slate-400">
                            Showing {page * PAGE_SIZE + 1} – {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} leads
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-bold text-slate-700">
                                Page {page + 1} of {totalPages}
                            </span>
                        </div>
                    </div>
                )}
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
                            <div className="text-left sm:text-right flex flex-col items-start sm:items-end flex-1 sm:flex-none">
                                <p className="text-[10px] font-black text-slate-800 italic">{selectedLead.phone}</p>
                                {selectedLead.altPhone && <p className="text-[9px] font-bold text-slate-500 italic leading-none mb-1">{selectedLead.altPhone}</p>}
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedLead.campaign?.name || 'MANUAL'}</p>
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
                                    <div className={`mt-1.5 inline-block px-2 py-1 rounded text-xs font-black ${STATUS_COLORS[selectedLead.status] || 'bg-gray-100'}`}>
                                        {selectedLead.status?.replace(/_/g, ' ')}
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
                                    leadId={selectedLead.id}
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
                                            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${noteText.trim() && !notesPosting
                                                ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-md shadow-slate-200'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                }`}
                                        >
                                            {notesPosting ? 'Posting...' : 'Post Note'}
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
        <div className="flex justify-between items-start gap-2 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
            <span className="text-xs font-semibold text-slate-700 text-right">{value}</span>
        </div>
    );
}
