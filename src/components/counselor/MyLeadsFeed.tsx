'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadService } from '@/services/leadService';
import { NoteService } from '@/services/noteService';
import { LeadResponseDTO, NoteDTO, LeadStatus, LeadScore } from '@/types/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
// Simplified - Icons removed

interface Props {
    counselorId: number;
    counselorType?: string;
    onLeadsUpdate?: (leads: LeadResponseDTO[]) => void;
    onActionComplete?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    TELECALLER_ASSIGNED: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    QUALIFIED: 'bg-emerald-100 text-emerald-700 font-bold',
    COUNSELOR_ASSIGNED: 'bg-purple-100 text-purple-700',
    CONTACTED: 'bg-sky-50 text-sky-600 border border-sky-100',
    ADMISSION_IN_PROCESS: 'bg-amber-100 text-amber-700',
    ADMISSION_DONE: 'bg-green-100 text-green-800',
    LOST: 'bg-red-50 text-red-600',
    UNASSIGNED: 'bg-gray-100 text-gray-600',
};

const SCORE_COLORS: Record<string, string> = {
    HOT: 'bg-red-500 text-white shadow-sm ring-2 ring-red-100',
    WARM: 'bg-amber-400 text-white shadow-sm ring-2 ring-amber-100',
    COLD: 'bg-slate-400 text-white shadow-sm ring-2 ring-slate-100',
};

const ALL_STATUSES: LeadStatus[] = [
    'NEW', 'TELECALLER_ASSIGNED', 'QUALIFIED', 'COUNSELOR_ASSIGNED',
    'EXTERNAL_ASSIGNED', 'ADMISSION_IN_PROCESS', 'ADMISSION_DONE',
    'LOST', 'UNASSIGNED', 'CONTACTED', 'TIMED_OUT', 'REASSIGNED'
];

export default function MyLeadsFeed({ counselorId, counselorType, onLeadsUpdate, onActionComplete }: Props) {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
    const [notes, setNotes] = useState<Record<number, NoteDTO[]>>({});
    const [noteInput, setNoteInput] = useState('');
    const [notesLoading, setNotesLoading] = useState<number | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [scoreFilter, setScoreFilter] = useState<string>('');
    // Feed Mode states
    const [feedMode, setFeedMode] = useState<'MY_LEADS' | 'UNASSIGNED'>('MY_LEADS');
    const [isSearching, setIsSearching] = useState(false);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            let data;
            if (searchQuery || statusFilter || scoreFilter) {
                setIsSearching(true);
                data = await LeadService.searchLeads({
                    name: searchQuery,
                    status: statusFilter,
                    score: scoreFilter
                });
                const content = Array.isArray(data) ? data : (data as any)?.content || [];
                setLeads(content);
                setTotalPages(1);
                if (onLeadsUpdate) onLeadsUpdate(content);
            } else if (feedMode === 'UNASSIGNED') {
                setIsSearching(false);
                const response = await LeadService.getUnassignedRecentLeads(page, 10);
                const content = response?.content || [];
                setLeads(content);
                setTotalPages(response?.totalPages || 1);
                if (onLeadsUpdate) onLeadsUpdate(content);
            } else {
                setIsSearching(false);
                const response = await LeadService.getCounselorRecentLeads(counselorId, page, 10);
                const content = response?.content || [];
                setLeads(content);
                setTotalPages(response?.totalPages || 1);
                if (onLeadsUpdate) onLeadsUpdate(content);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [counselorId, page, searchQuery, statusFilter, scoreFilter, onLeadsUpdate, feedMode]);

    useEffect(() => {
        if (counselorId) loadLeads();
    }, [counselorId, loadLeads]);

    const handleClaimLead = async (lead: LeadResponseDTO) => {
        try {
            // Priority 1: Direct assignment API (Admin/Manager level)
            await LeadService.assignLeadToCounselor(lead.email, counselorId);
            toast.success('Lead claimed successfully!');
            loadLeads();
            onActionComplete?.();
        } catch (error: any) {
            // Priority 2: Fallback to Counselor-level status update if 403 Forbidden
            if (error.response?.status === 403) {
                console.warn('Direct assignment forbidden. Attempting status-based claim fallback...');
                try {
                    await LeadService.updateLeadStatus(lead.id, 'TELECALLER_ASSIGNED');
                    toast.success('Lead claimed via status update!');
                    loadLeads();
                    onActionComplete?.();
                    return;
                } catch (fallbackError) {
                    console.error('Claim fallback failed:', fallbackError);
                }
            }
            console.error('Claim failed:', error);
            toast.error('Failed to claim lead. Permission denied.');
        }
    };

    const toggleExpand = async (leadId: number) => {
        if (expandedLeadId === leadId) {
            setExpandedLeadId(null);
            return;
        }
        setExpandedLeadId(leadId);
        if (!notes[leadId]) {
            setNotesLoading(leadId);
            try {
                const data = await NoteService.getLeadNotes(leadId);
                setNotes(prev => ({ ...prev, [leadId]: data }));
            } catch {
                toast.error('Failed to load notes');
            } finally {
                setNotesLoading(null);
            }
        }
    };

    const handleQuickAction = async (leadId: number, status: LeadStatus) => {
        try {
            await LeadService.updateLeadStatus(leadId, status);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
            toast.success(`Marked as ${status.replace(/_/g, ' ')}`);
            onActionComplete?.();
        } catch {
            toast.error('Action failed');
        }
    };

    const handleCallAction = async (leadId: number) => {
        try {
            await LeadService.updateLeadStatus(leadId, 'CONTACTED');
            await NoteService.createNote(leadId, 'Call initiated via Telecaller Dashboard.');
            
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'CONTACTED' as LeadStatus } : l));
            
            // Refresh notes if this lead is expanded
            if (expandedLeadId === leadId) {
                const data = await NoteService.getLeadNotes(leadId);
                setNotes(prev => ({ ...prev, [leadId]: data }));
            }
            
            toast.success('Call interaction logged');
        } catch {
            toast.error('Failed to log call');
        }
    };

    const handleScoreAction = async (leadId: number, score: LeadScore) => {
        try {
            await LeadService.updateLeadScore(leadId, score);
            
            // Automated Routing Logic based on USER requirements:
            // HOT -> INTERNAL COUNSELOR
            // WARM -> EXTERNAL COUNSELOR
            let status: LeadStatus | undefined;
            if (score === 'HOT') status = 'COUNSELOR_ASSIGNED';
            else if (score === 'WARM') status = 'EXTERNAL_ASSIGNED';

            if (status) {
                await LeadService.updateLeadStatus(leadId, status);
                toast.success(`Priority set to ${score}. Routing to ${score === 'HOT' ? 'Internal' : 'External'} Counselor.`);
                // If it's routed away, we might want to remove it from the telecaller's active list
                setLeads(prev => prev.filter(l => l.id !== leadId));
                onActionComplete?.();
            } else {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, score } : l));
                toast.success(`Priority set to ${score}`);
            }
        } catch {
            toast.error('Failed to update priority');
        }
    };

    const handleAddNote = async (leadId: number) => {
        if (!noteInput.trim()) return;
        try {
            const newNote = await NoteService.createNote(leadId, noteInput.trim());
            setNotes(prev => ({
                ...prev,
                [leadId]: [...(prev[leadId] || []), newNote]
            }));
            setNoteInput('');
            toast.success('Note added');
        } catch {
            toast.error('Failed to add note');
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header with Search & Filters */}
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            {feedMode === 'MY_LEADS' ? 'Assignments' : 'Unassigned Pool'} 
                            <span className="bg-slate-900 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-tighter font-bold">{leads.length} Active</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {feedMode === 'MY_LEADS' ? 'Focus on high-priority follow-ups today' : 'Claim leads to add them to your assignments'}
                        </p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                        <button 
                            onClick={() => { setFeedMode('MY_LEADS'); setPage(0); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedMode === 'MY_LEADS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            My Leads
                        </button>
                        <button 
                            onClick={() => { setFeedMode('UNASSIGNED'); setPage(0); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedMode === 'UNASSIGNED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Unassigned
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative group flex-1">
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-slate-50 transition-all font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer appearance-none"
                        >
                            <option value="">All Statuses</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        <select 
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer appearance-none"
                        >
                            <option value="">All Priority</option>
                            <option value="HOT">HOT</option>
                            <option value="WARM">WARM</option>
                            <option value="COLD">COLD</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Leads List */}
            {loading ? (
                <div className="p-20 text-center">
                    <p className="text-sm text-slate-500 font-bold animate-pulse">Synchronizing assignments...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="p-20 text-center bg-slate-50/20">
                    <p className="text-slate-900 font-black text-lg uppercase tracking-tight">No Leads Found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or checking back later.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {leads.map(lead => (
                        <div key={lead.id} className={`group transition-all duration-300 ${expandedLeadId === lead.id ? 'bg-slate-50/50' : 'hover:bg-slate-50/20'}`}>
                            {/* Standard Row */}
                            <div className="px-8 py-5 flex items-center gap-5 cursor-pointer" onClick={() => toggleExpand(lead.id)}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg relative overflow-hidden ${
                                    lead.score === 'HOT' ? 'bg-rose-600' : 
                                    lead.score === 'WARM' ? 'bg-amber-500' : 
                                    'bg-slate-400'
                                }`}>
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-slate-900 truncate leading-tight uppercase tracking-tight">{lead.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${STATUS_COLORS[lead.status] || 'bg-slate-100'}`}>
                                            {lead.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[11px] text-slate-500 font-bold truncate">
                                            {lead.phone}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium truncate hidden md:block">{lead.email}</p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCallAction(lead.id); }}
                                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Call
                                    </button>
                                    
                                    {/* Action context based on counselor type */}
                                    {counselorType === 'INTERNAL' && lead.status === 'QUALIFIED' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleQuickAction(lead.id, 'ADMISSION_IN_PROCESS'); }}
                                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                                        >
                                            Start Admission
                                        </button>
                                    )}

                                    {counselorType === 'EXTERNAL' && (
                                        <div className="px-3 py-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-black uppercase tracking-widest">
                                            Partner Handled
                                        </div>
                                    )}

                                    {(lead.status === 'UNASSIGNED' || lead.status === 'NEW') ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleClaimLead(lead); }}
                                            className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-[#600202] transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                                        >
                                            Claim
                                        </button>
                                    ) : (
                                        lead.status !== 'QUALIFIED' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleQuickAction(lead.id, 'QUALIFIED'); }}
                                                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Qualify
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Detail Panel */}
                            {expandedLeadId === lead.id && (
                                <div className="px-8 pb-8 pt-2">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-white rounded-2xl border border-slate-200 mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Interested Course</span>
                                            <p className="text-xs font-black text-slate-900 uppercase">{typeof lead.course === 'object' ? lead.course?.course : lead.course || '—'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Lead Source</span>
                                            <p className="text-xs font-black text-slate-900 uppercase">Direct Application</p>
                                        </div>
                                        
                                        {lead.status !== 'UNASSIGNED' && lead.status !== 'NEW' && (
                                            <div className="space-y-1 col-span-2">
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Set Priority & Route</span>
                                                <div className="flex gap-2">
                                                    {(['HOT', 'WARM', 'COLD'] as LeadScore[]).map((score) => (
                                                        <button
                                                            key={score}
                                                            onClick={() => handleScoreAction(lead.id, score)}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                                lead.score === score 
                                                                    ? 'bg-slate-900 text-white border-slate-900' 
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                            }`}
                                                        >
                                                            {score}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Hub */}
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            Interaction Log
                                        </h5>
                                        
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {notesLoading === lead.id ? (
                                                <div className="p-4 bg-slate-50 rounded-xl animate-pulse">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                                                </div>
                                            ) : (notes[lead.id] || []).length === 0 ? (
                                                <div className="p-8 text-center border border-slate-200 rounded-2xl">
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No Interaction Logs</p>
                                                </div>
                                            ) : (
                                                (notes[lead.id] || []).map(note => (
                                                    <div key={note.noteId} className="p-4 bg-white border border-slate-100 rounded-xl relative group/note">
                                                        <p className="text-xs text-slate-700 font-bold leading-relaxed mb-2 uppercase tracking-tight">{note.note}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em]">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    NoteService.deleteNote(note.noteId).then(() => {
                                                                        setNotes(p => ({ ...p, [lead.id]: p[lead.id].filter(n => n.noteId !== note.noteId) }));
                                                                        toast.success("Log removed");
                                                                    });
                                                                }}
                                                                className="text-rose-500 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover/note:opacity-100 transition-opacity"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text"
                                                    value={noteInput}
                                                    onChange={(e) => setNoteInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote(lead.id)}
                                                    placeholder="Enter interaction outcome or notes..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-slate-400 transition-all font-bold placeholder:uppercase placeholder:tracking-widest"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleAddNote(lead.id)}
                                                disabled={!noteInput.trim()}
                                                className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-[#600202] transition-all disabled:opacity-30 uppercase tracking-widest"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!isSearching && totalPages > 1 && (
                <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/10 flex items-center justify-between">
                    <button 
                         onClick={() => setPage(p => Math.max(0, p - 1))}
                         disabled={page === 0}
                         className="px-4 py-2 text-[10px] font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all uppercase tracking-widest"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button 
                                key={i}
                                onClick={() => setPage(i)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === i ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 text-[10px] font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all uppercase tracking-widest"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
