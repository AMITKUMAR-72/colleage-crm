'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadService } from '@/services/leadService';
import { NoteService } from '@/services/noteService';
import { LeadResponseDTO, NoteDTO, LeadStatus, LeadScore } from '@/types/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Props {
    counselorId: number;
}

const STATUS_COLORS: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    TELECALLER_ASSIGNED: 'bg-cyan-100 text-cyan-700',
    QUALIFIED: 'bg-emerald-100 text-emerald-700',
    COUNSELOR_ASSIGNED: 'bg-indigo-100 text-indigo-700',
    EXTERNAL_ASSIGNED: 'bg-violet-100 text-violet-700',
    ADMISSION_IN_PROCESS: 'bg-amber-100 text-amber-700',
    ADMISSION_DONE: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-700',
    UNASSIGNED: 'bg-gray-100 text-gray-600',
    CONTACTED: 'bg-sky-100 text-sky-700',
    TIMED_OUT: 'bg-orange-100 text-orange-700',
    REASSIGNED: 'bg-pink-100 text-pink-700',
};

const SCORE_COLORS: Record<string, string> = {
    HOT: 'bg-red-500 text-white',
    WARM: 'bg-amber-400 text-white',
    COLD: 'bg-blue-400 text-white',
};

const ALL_STATUSES: LeadStatus[] = [
    'NEW', 'TELECALLER_ASSIGNED', 'QUALIFIED', 'COUNSELOR_ASSIGNED',
    'EXTERNAL_ASSIGNED', 'ADMISSION_IN_PROCESS', 'ADMISSION_DONE',
    'LOST', 'UNASSIGNED', 'CONTACTED', 'TIMED_OUT', 'REASSIGNED'
];

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

export default function MyLeadsFeed({ counselorId }: Props) {
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
    const [notes, setNotes] = useState<Record<number, NoteDTO[]>>({});
    const [noteInput, setNoteInput] = useState('');
    const [notesLoading, setNotesLoading] = useState<number | null>(null);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const response = await LeadService.getCounselorRecentLeads(counselorId, page, 10);
            setLeads(response.content || []);
            setTotalPages(response.totalPages || 1);
        } catch {
            toast.error('Failed to load leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [counselorId, page]);

    useEffect(() => {
        if (counselorId) loadLeads();
    }, [counselorId, loadLeads]);

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

    const handleDeleteNote = async (leadId: number, noteId: number) => {
        try {
            await NoteService.deleteNote(noteId);
            setNotes(prev => ({
                ...prev,
                [leadId]: (prev[leadId] || []).filter(n => n.noteId !== noteId)
            }));
            toast.success('Note deleted');
        } catch {
            toast.error('Failed to delete note');
        }
    };

    const handleStatusChange = async (leadId: number, newStatus: LeadStatus) => {
        try {
            const updated = await LeadService.updateLeadStatus(leadId, newStatus);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: updated.status } : l));
            toast.success('Status updated');
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleScoreChange = async (leadId: number, newScore: LeadScore) => {
        try {
            await LeadService.updateLeadScore(leadId, newScore);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, score: newScore } : l));
            toast.success('Score updated');
        } catch {
            toast.error('Failed to update score');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">My Leads</h3>
                    <p className="text-sm text-gray-500">Leads assigned to you</p>
                </div>
                <button
                    onClick={loadLeads}
                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    title="Refresh"
                >
                    🔄
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading leads...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-500 font-medium">No leads assigned yet</p>
                    <p className="text-sm text-gray-400 mt-1">Leads will appear once assigned by admin</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {leads.map(lead => (
                        <div key={lead.id} className="hover:bg-gray-50/50 transition">
                            {/* Lead row */}
                            <div
                                className="px-6 py-4 flex items-center gap-4 cursor-pointer"
                                onClick={() => toggleExpand(lead.id)}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SCORE_COLORS[lead.score] || 'bg-gray-200'}`}>
                                        {lead.score}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>
                                        {lead.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <span className={`text-gray-400 transition-transform ${expandedLeadId === lead.id ? 'rotate-180' : ''}`}>
                                    ▾
                                </span>
                            </div>

                            {/* Expanded panel */}
                            {expandedLeadId === lead.id && (
                                <div className="px-6 pb-5 space-y-4 bg-gray-50/70 border-t border-gray-100">
                                    {/* Lead details */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Phone</span>
                                            <p className="text-sm font-medium text-gray-700">{lead.phone}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Address</span>
                                            <p className="text-sm font-medium text-gray-700">{lead.address || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Course</span>
                                            <p className="text-sm font-medium text-gray-700">
                                                {typeof lead.course === 'object' ? lead.course?.course : lead.course || '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Intake</span>
                                            <p className="text-sm font-medium text-gray-700">{lead.intake || '—'}</p>
                                        </div>
                                    </div>

                                    {/* Status & Score selectors */}
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500">Status:</span>
                                            <select
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white focus:border-[#dbb212] outline-none"
                                            >
                                                {ALL_STATUSES.map(s => (
                                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500">Score:</span>
                                            <div className="flex gap-1">
                                                {ALL_SCORES.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleScoreChange(lead.id, s)}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                                            lead.score === s
                                                                ? SCORE_COLORS[s]
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes section */}
                                    <div className="border-t border-gray-200 pt-3">
                                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Notes</h4>
                                        
                                        {notesLoading === lead.id ? (
                                            <p className="text-xs text-gray-400 animate-pulse">Loading notes...</p>
                                        ) : (notes[lead.id] || []).length === 0 ? (
                                            <p className="text-xs text-gray-400 mb-3">No notes yet</p>
                                        ) : (
                                            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                                {(notes[lead.id] || []).map(n => (
                                                    <div key={n.noteId} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-100">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-700">{n.note}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                {n.createdAt ? format(new Date(n.createdAt), 'MMM d, yyyy HH:mm') : ''}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteNote(lead.id, n.noteId)}
                                                            className="text-gray-300 hover:text-red-400 transition text-xs"
                                                            title="Delete note"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add note */}
                                        <div className="flex gap-2">
                                            <input
                                                value={expandedLeadId === lead.id ? noteInput : ''}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote(lead.id)}
                                                placeholder="Add a note..."
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#dbb212] focus:ring-1 focus:ring-[#dbb212] outline-none"
                                            />
                                            <button
                                                onClick={() => handleAddNote(lead.id)}
                                                disabled={!noteInput.trim()}
                                                className="px-4 py-2 bg-[#4d0101] text-white text-sm font-medium rounded-lg hover:bg-[#4d0101] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Add
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
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
