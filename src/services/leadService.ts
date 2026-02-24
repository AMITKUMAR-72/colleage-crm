import api from './api';
import { LeadRequestDTO, LeadResponseDTO, NoteDTO, LeadStatus, LeadScore, PageResponse, CreateNoteRequestDTO } from '@/types/api';

const PAGE_KEYS = ['content', 'items', 'records', 'leads', 'list', 'rows'] as const;
const WRAPPER_KEYS = ['data', 'result', 'response', 'responseObject', 'payload'] as const;

const parseIfString = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const toPageResponse = (raw: unknown): PageResponse<LeadResponseDTO> => {
    const parsed = parseIfString(raw);

    if (Array.isArray(parsed)) {
        return {
            content: parsed as LeadResponseDTO[],
            totalPages: 1,
            totalElements: parsed.length,
            number: 0,
            size: parsed.length,
            first: true,
            last: true,
        };
    }

    const queue: unknown[] = [parsed];
    const seen = new Set<unknown>();

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || typeof current !== 'object' || seen.has(current)) continue;
        seen.add(current);

        const objectCurrent = current as Record<string, unknown>;

        for (const key of PAGE_KEYS) {
            const maybeArray = objectCurrent[key];
            if (Array.isArray(maybeArray)) {
                const totalPages = Number(objectCurrent.totalPages ?? objectCurrent.totalPage ?? objectCurrent.pages ?? objectCurrent.pageCount ?? 1) || 1;
                const totalElements = Number(objectCurrent.totalElements ?? objectCurrent.totalCount ?? objectCurrent.count ?? maybeArray.length) || maybeArray.length;
                const number = Number(objectCurrent.number ?? objectCurrent.page ?? objectCurrent.pageNumber ?? 0) || 0;
                const size = Number(objectCurrent.size ?? objectCurrent.pageSize ?? maybeArray.length) || maybeArray.length;

                return {
                    content: maybeArray as LeadResponseDTO[],
                    totalPages,
                    totalElements,
                    number,
                    size,
                    first: number <= 0,
                    last: number >= totalPages - 1,
                };
            }
        }

        for (const key of WRAPPER_KEYS) {
            if (key in objectCurrent) {
                queue.push(parseIfString(objectCurrent[key]));
            }
        }
    }

    return {
        content: [],
        totalPages: 1,
        totalElements: 0,
        number: 0,
        size: 0,
        first: true,
        last: true,
    };
};

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
    getRecentLeads: async (page: number, size: number) => {
        const response = await api.get(`/api/leads/recent/page/${page}/size/${size}`);
        return response.data;
    },

    getUnassignedRecentLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/unassigned/recent/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    getCounselorRecentLeads: async (counselorId: number, page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/counselor/${counselorId}/recent/page/${page}/size/${size}`);
        return toPageResponse(response.data);
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
        email?: string,
        name?: string,
        course?: string,
        status?: string,
        campaign?: string,
        score?: string,
        startDate?: string,
        endDate?: string
    }) => {
        // If searching by email, use the working email endpoint
        if (params.email) {
            try {
                const lead = await LeadService.getLeadByEmail(params.email);
                return lead ? [lead] : [];
            } catch (error) {
                return [];
            }
        }

        const extractArray = (res: any) => res?.lead || res?.content || (Array.isArray(res) ? res : []);

        if (params.name) return extractArray((await api.get(`/api/leads/searchBy/name/${params.name}`)).data);
        if (params.course) return extractArray((await api.get(`/api/leads/searchBy/course/${params.course}`)).data);
        if (params.status) return extractArray((await api.get(`/api/leads/searchBy/status/${params.status}`)).data);
        if (params.campaign) return extractArray((await api.get(`/api/leads/searchBy/campaign/${params.campaign}`)).data);
        if (params.score) return extractArray((await api.get(`/api/leads/searchBy/score/${params.score}`)).data);
        if (params.startDate && params.endDate) {
            let start = params.startDate;
            let end = params.endDate;
            if (start.length === 16) start += ':00';
            if (end.length === 16) end += ':00';
            return extractArray((await api.get(`/api/leads/date-range/start/${start}/end/${end}`)).data);
        }

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
    },

    async integrateAffiliatePartner(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/AffiliatePartner', data);
        return response.data;
    },

    async getAffiliateLeads() {
        const response = await api.get<LeadResponseDTO[]>('/api/campaign/affiliate/my-leads');
        return response.data;
    }
};
