'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LeadResponseDTO, CounselorDTO, NoteDTO } from '@/types/api';
import { CounselorService } from '@/services/counselorService';
import { LeadService } from '@/services/leadService';
import api from '@/services/api';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

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
};

const SCORE_COLORS: Record<string, string> = {
    HOT: 'bg-red-100 text-red-700',
    WARM: 'bg-orange-100 text-orange-700',
    COLD: 'bg-sky-100 text-sky-700',
};

// ─── Bulk Assign Dropdown ──────────────────────────────────────────────────
function BulkAssignButton({ leadIds, allLeads, onAssigned }: { leadIds: number[]; allLeads: LeadResponseDTO[]; onAssigned: () => void }) {
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
                let list: CounselorDTO[] = Array.isArray(raw)
                    ? raw
                    : raw?.counselors ?? raw?.data ?? raw?.content ?? raw?.lead ?? [];
                
                // Check if any selected lead has null course
                const hasNullCourse = allLeads.some(l => 
                    leadIds.includes(l.id) && 
                    (!l.course || (typeof l.course === 'object' && !(l.course as any).course))
                );

                // ONLY SHOW TELECALLERS, and filter out INTERNAL if course is null
                list = list.filter(c => {
                    if (!c.counselorTypes?.includes('TELECALLER')) return false;
                    if (hasNullCourse && c.counselorTypes?.includes('INTERNAL')) return false;
                    return true;
                });
                
                setCounselors(list);
            } catch {
                toast.error('Could not load counselors');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkAssign = async (e: React.MouseEvent, counselorId: number) => {
        e.stopPropagation();
        if (leadIds.length === 0) {
            toast.error('No leads selected');
            return;
        }
        setAssigning(counselorId);
        try {
            await LeadService.bulkAssignLeads(counselorId, leadIds);
            toast.success(`Assigned ${leadIds.length} leads successfully`);
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
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Telecaller</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse italic">fetching telecallers…</div>
                        ) : counselors.length === 0 ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400 italic">No telecallers found</div>
                        ) : (
                            counselors.map((c, idx) => (
                                <button
                                    key={c.counselorId ?? idx}
                                    onClick={e => handleBulkAssign(e, c.counselorId)}
                                    disabled={assigning === c.counselorId}
                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex items-center justify-between group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#4d0101]">{c.name}</span>
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{c.counselorTypes?.join(', ')}</span>
                                    </div>
                                    {assigning === c.counselorId && (
                                        <span className="text-[10px] font-black text-[#4d0101] animate-pulse lowercase italic">saving…</span>
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
export default function ManagerLeadInbox() {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
    const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null);

    // Notes state (for slide-over if we keep it)
    const [notes, setNotes] = useState<NoteDTO[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [notesPosting, setNotesPosting] = useState(false);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const res = await LeadService.getUnassignedRecentLeads(page, PAGE_SIZE);
            setLeads(res.content);
            setTotalElements(res.totalElements);
        } catch (err) {
            console.error('[ManagerLeadInbox] Failed to fetch leads', err);
            toast.error('Could not load unassigned leads');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const totalPages = Math.ceil(totalElements / PAGE_SIZE);

    const toggleLeadSelection = (id: number) => {
        setSelectedLeadIds(prev =>
            prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedLeadIds.length === leads.length) {
            setSelectedLeadIds([]);
        } else {
            setSelectedLeadIds(leads.map(l => l.id));
        }
    };

    const handleViewLead = async (id: number) => {
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        setSelectedLead(lead);
        setNotes([]);
        setNoteText('');
        setNotesLoading(true);
        try {
            const raw: any = await LeadService.getNotes(id);
            setNotes(Array.isArray(raw) ? raw : raw?.data ?? []);
        } catch {
            /* silently ignore */
        } finally {
            setNotesLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !selectedLead || notesPosting) return;
        setNotesPosting(true);
        try {
            const created = await LeadService.addNote(selectedLead.id, noteText.trim());
            setNotes(prev => [...prev, created]);
            setNoteText('');
        } catch {
            /* Handled by interceptor */
        } finally {
            setNotesPosting(false);
        }
    };

    const getCourseDisplay = (lead: LeadResponseDTO | null) => {
        if (!lead || !lead.course) return 'Not Available';
        if (typeof lead.course === 'object') return lead.course.course || 'Not Available';
        return String(lead.course);
    };

    const getCampaignDisplay = (lead: LeadResponseDTO | null) => {
        if (!lead || !lead.campaign) return '—';
        const c = lead.campaign as any;
        return c?.name || String(c.campaign || '—');
    };

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Unassigned Leads</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        {totalElements} Total Pending • Page {page + 1} of {totalPages || 1}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <BulkAssignButton
                        leadIds={selectedLeadIds}
                        allLeads={leads}
                        onAssigned={() => {
                            setSelectedLeadIds([]);
                            fetchLeads();
                        }}
                    />

                    <button
                        onClick={() => fetchLeads()}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Table Feed */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 min-h-[400px]">
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 rounded border-slate-300 text-[#4d0101] focus:ring-[#4d0101]/20 cursor-pointer"
                                    />
                                </th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Name</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">intake</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">course</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Campaign</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                <th className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-[#4d0101] rounded-full animate-spin" />
                                        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Leads…</p>
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center italic text-slate-300 text-sm">No unassigned leads found</td>
                                </tr>
                            ) : (
                                leads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedLeadIds.includes(lead.id) ? 'bg-[#4d0101]/5' : ''}`}
                                        onClick={() => handleViewLead(lead.id)}
                                    >
                                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeadIds.includes(lead.id)}
                                                onChange={() => toggleLeadSelection(lead.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-[#4d0101] focus:ring-[#4d0101]/20 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-800">{lead.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{lead.id} • {lead.phone}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-800">{lead.phone}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-slate-800">{lead.intake}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-xs font-bold text-slate-700">{getCourseDisplay(lead)}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{getCampaignDisplay(lead)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[String(lead.status)] || 'bg-gray-50'}`}>
                                                {String(lead.status || '').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="text-[10px] font-black text-[#4d0101] uppercase tracking-widest hover:underline">Details</button>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {loading ? 'Updating…' : `Showing ${leads.length} leads`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition"
                        >
                            ← Prev
                        </button>
                        <span className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                            {page + 1} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </div>

            {/* Lead Details Slide-over */}
            {selectedLead && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end"
                    onClick={() => setSelectedLead(null)}
                >
                    <div
                        className="w-full sm:max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lead Info</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: #{selectedLead.id}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <h3 className="font-black text-lg text-slate-800">{selectedLead.name}</h3>
                                <p className="text-slate-500 font-medium text-sm mt-1">{selectedLead.email}</p>
                                <p className="text-slate-500 font-medium text-sm">{selectedLead.phone}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Status</label>
                                    <div className={`mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[String(selectedLead.status)]}`}>
                                        {String(selectedLead.status || '').replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Score</label>
                                    <div className={`mt-2 inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${SCORE_COLORS[selectedLead.score]}`}>
                                        {selectedLead.score}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-white border border-slate-100 rounded-2xl space-y-3">
                                <InfoRow label="Course" value={getCourseDisplay(selectedLead)} />
                                <InfoRow label="Intake" value={selectedLead.intake || 'Any'} />
                                <InfoRow label="Campaign" value={getCampaignDisplay(selectedLead)} />
                                {selectedLead.createdAt && (
                                    <InfoRow label="Created" value={new Date(selectedLead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
                                )}
                            </div>

                            {/* Notes Section */}
                            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Interaction Notes</h4>
                                    <span className="text-[10px] font-bold text-slate-400">{notes.length}</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-4 space-y-4">
                                    {notesLoading ? (
                                        <div className="space-y-3 animate-pulse">
                                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                                        </div>
                                    ) : notes.length === 0 ? (
                                        <p className="text-center py-4 text-xs font-medium text-slate-300 italic">No notes available</p>
                                    ) : (
                                        notes.map((n, i) => (
                                            <div key={i} className="space-y-1">
                                                <p className="text-xs text-slate-700 leading-relaxed font-medium">{n.note}</p>
                                                {n.createdAt && <p className="text-[9px] font-bold text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                                    <textarea
                                        rows={2}
                                        value={noteText}
                                        onChange={e => setNoteText(e.target.value)}
                                        placeholder="Add a new note…"
                                        className="w-full p-3 text-xs font-medium border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#4d0101]/10 outline-none"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleAddNote}
                                            disabled={!noteText.trim() || notesPosting}
                                            className="px-4 py-2 bg-[#4d0101] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#600202] disabled:opacity-50"
                                        >
                                            {notesPosting ? 'Saving…' : 'Post Note'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center gap-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-bold text-slate-700">{value}</span>
        </div>
    );
}
