import api from './api';
import { NoteDTO, CreateNoteRequestDTO } from '@/types/api';

export const NoteService = {
    // Backend extracts counselor from JWT Principal — only send { note }
    createNote: async (leadId: number, noteContent: string) => {
        const payload: CreateNoteRequestDTO = { note: noteContent };
        const response = await api.post<NoteDTO>(`/api/notes/${leadId}/notes`, payload);
        return response.data;
    },

    getLeadNotes: async (leadId: number) => {
        const response = await api.get<NoteDTO[]>(`/api/notes/${leadId}/notes`);
        return response.data;
    },

    getNoteById: async (noteId: number) => {
        const response = await api.get<NoteDTO>(`/api/notes/id/${noteId}`);
        return response.data;
    },

    deleteNote: async (noteId: number) => {
        const response = await api.delete(`/api/notes/${noteId}`);
        return response.data;
    }
};
