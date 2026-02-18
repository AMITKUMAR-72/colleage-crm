import api from './api';
import { LeadRequestDTO, LeadResponseDTO, NoteDTO, LeadStatus, LeadScore, PageResponse, CreateNoteRequestDTO } from '@/types/api';

export const LeadService = {
    async createLead(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/create', data);
        return response.data;
    },

    getAllLeads: async () => {
        const response = await api.get<LeadResponseDTO[]>('/api/leads');
        return response.data;
    },

    getLeadById: async (id: number) => {
        const response = await api.get<LeadResponseDTO>(`/api/leads/id/${id}`);
        return response.data;
    },

    getLeadByEmail: async (email: string) => {
        const response = await api.get<LeadResponseDTO>(`/api/leads/email/${email}`);
        return response.data;
    },

    // Returns Spring Data Page (paginated)
    getRecentLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/recent/page/${page}/size/${size}`);
        return response.data;
    },

    getUnassignedRecentLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/unassigned/recent/page/${page}/size/${size}`);
        return response.data;
    },

    getCounselorRecentLeads: async (counselorId: number, page: number = 0, size: number = 10) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/counselor/${counselorId}/recent/page/${page}/size/${size}`);
        return response.data;
    },

    getTimedOutLeads: async () => {
        const response = await api.get('/api/timeOutLeads');
        return response.data;
    },

    assignTimedOutLead: async (leadEmail: string, counselorId: number) => {
        const response = await api.post<LeadResponseDTO>(`/api/timeOutLeads/${leadEmail}/assign/counselor/${counselorId}`);
        return response.data;
    },

    // Search & Filter — each filter uses its own endpoint
    searchLeads: async (params: {
        name?: string,
        course?: string,
        status?: string,
        campaign?: string,
        score?: string
    }) => {
        if (params.name) return (await api.get<LeadResponseDTO[]>(`/api/leads/searchBy/name/${params.name}`)).data;
        if (params.course) return (await api.get<LeadResponseDTO[]>(`/api/leads/searchBy/course/${params.course}`)).data;
        if (params.status) return (await api.get<LeadResponseDTO[]>(`/api/leads/searchBy/status/${params.status}`)).data;
        if (params.campaign) return (await api.get<LeadResponseDTO[]>(`/api/leads/searchBy/campaign/${params.campaign}`)).data;
        if (params.score) return (await api.get<LeadResponseDTO[]>(`/api/leads/searchBy/score/${params.score}`)).data;
        
        // Counselor fallback: use paginated recent leads which is public, 
        // instead of /api/leads which is restricted to Admin/Manager.
        const pageResponse = await api.get<PageResponse<LeadResponseDTO>>('/api/leads/recent/page/0/size/50');
        return pageResponse.data.content;
    },

    getSourceByCount: async (campaign: string) => {
        const response = await api.get(`/api/leads/searchBy/sourceByCount/${campaign}`);
        return response.data;
    },

    updateLeadStatus: async (id: number, status: LeadStatus) => {
        const response = await api.post<LeadResponseDTO>(`/api/leads/id/${id}/updateStatus/${status}`);
        return response.data;
    },

    updateLeadScore: async (id: number, score: LeadScore) => {
        const response = await api.post<LeadResponseDTO>(`/api/leads/id/${id}/updateScore/${score}`);
        return response.data;
    },

    bulkUploadLeads: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/api/leads/bulk-upload', formData, {
            headers: {
                'Content-Type': undefined
            } as any
        });
        return response.data;
    },

    async updateLead(email: string, data: Partial<LeadRequestDTO>) {
        const response = await api.put<LeadResponseDTO>(`/api/leads/update/email/${email}`, data);
        return response.data;
    },

    // ─── Notes (uses /api/note endpoints) ───
    // Backend extracts counselor from JWT Principal. Only send { note }.
    async addNote(leadId: number, noteContent: string) {
        const payload: CreateNoteRequestDTO = { note: noteContent };
        const response = await api.post<NoteDTO>(`/api/note/${leadId}/notes`, payload);
        return response.data;
    },

    async getNotes(leadId: number) {
        const response = await api.get<NoteDTO[]>(`/api/note/${leadId}/notes`);
        return response.data;
    },

    async getNoteById(noteId: number) {
        const response = await api.get<NoteDTO>(`/api/note/id/${noteId}`);
        return response.data;
    },

    async deleteNote(noteId: number) {
        const response = await api.delete(`/api/note/${noteId}`);
        return response.data;
    },

    // ─── Integration Webhooks ───
    async integrateFacebook(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/Facebook', data);
        return response.data;
    },

    async integrateInstagram(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/Instagram', data);
        return response.data;
    },

    // Note: Backend has typo "GoogelForm" — must match exactly
    async integrateGoogleForm(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/GoogelForm', data);
        return response.data;
    }
};
