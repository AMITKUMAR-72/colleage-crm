'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoteService } from '@/services/noteService';
import { NoteDTO } from '@/types/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAsyncMap } from '@/hooks/useAsync';
import LoadingButton from '@/components/ui/LoadingButton';

interface LeadNotesProps {
    leadId: string | number;
}

export default function LeadNotes({ leadId }: LeadNotesProps) {
    const [notes, setNotes] = useState<NoteDTO[]>([]);
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(false);
    const { runWithKey: runDelete, isLoadingKey: isDeletingNote } = useAsyncMap(NoteService.deleteNote);

    const loadNotes = useCallback(async () => {
        try {
            const data = await NoteService.getLeadNotes(leadId);
            setNotes(data);
        } catch {
            // Silently fail — user may not have permission or lead may not exist
            setNotes([]);
        }
    }, [leadId]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteText.trim() || !leadId) return;

        setLoading(true);
        try {
            // Backend extracts counselor from JWT Principal
            await NoteService.createNote(leadId, noteText.trim());
            setNoteText('');
            loadNotes();
            toast.success('Note added');
        } catch (err: any) {
            const serverMessage = err.response?.data?.message || err.response?.data?.error;
            const errorMessage = serverMessage || (err instanceof Error ? err.message : 'Failed to add note');

            if (err.response?.status === 403) {
                toast.error('Access Denied: Only assigned counselors or Admins can add notes');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noteId: number) => {
        if (!confirm('Delete this note?')) return;
        try {
            await runDelete(noteId, noteId);
            setNotes(prev => prev.filter(n => n.noteId !== noteId));
            toast.success('Note deleted');
        } catch {
            toast.error('Failed to delete note');
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-700 mb-3">Notes & Activity</h4>

            <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1">
                {notes.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No notes yet.</p>
                ) : (
                    notes.map((n) => (
                        <div key={n.noteId} className="bg-white p-3 rounded-lg shadow-sm text-sm relative group">
                            <p className="text-gray-800 mb-2">{n.note}</p>
                            <div className="flex justify-end items-center gap-1.5 text-[10px] text-gray-400">
                                {n.authorName && (
                                    <span className="font-semibold text-gray-500">
                                        {n.authorName} {n.authorRole ? `(${n.authorRole})` : ''}
                                    </span>
                                )}
                                {n.authorName && <span>•</span>}
                                <span>{n.createdAt && !isNaN(new Date(n.createdAt).getTime()) ? format(new Date(n.createdAt), 'MMM d, h:mm a') : '—'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleAddNote} className="flex w-full items-stretch gap-2">
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-[80%] p-3 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-[#dbb212] outline-none"
                    rows={2}
                />
                <LoadingButton
                    type="submit"
                    loading={loading}
                    disabled={!noteText.trim()}
                    className="w-[20%] flex items-center justify-center bg-blue-50 border border-blue-100 rounded-lg text-blue-600 hover:bg-blue-100 hover:text-blue-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </LoadingButton>
            </form>
        </div>
    );
}
