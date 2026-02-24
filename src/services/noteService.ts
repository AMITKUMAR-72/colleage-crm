import api from './api';
import { NoteDTO, CreateNoteRequestDTO } from '@/types/api';

export const NoteService = {
    // Backend extracts counselor from JWT Principal — only send { note }
    createNote: async (leadId: number, noteContent: string) => {
        const payload: CreateNoteRequestDTO = { note: noteContent };
        const response = await api.post<NoteDTO>(`/api/note/${leadId}/notes`, payload);
        return response.data;
    },

    getLeadNotes: async (leadId: number) => {
        const response = await api.get<NoteDTO[]>(`/api/note/${leadId}/notes`);
        return response.data;
    },

    getNoteById: async (noteId: number) => {
        const response = await api.get<NoteDTO>(`/api/note/id/${noteId}`);
        return response.data;
    },

    deleteNote: async (noteId: number) => {
        const response = await api.delete(`/api/note/${noteId}`);
        return response.data;
    }
};
