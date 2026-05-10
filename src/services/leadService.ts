import api from './api';
import { LeadRequestDTO, LeadResponseDTO, NoteDTO, LeadStatus, PageResponse, CreateNoteRequestDTO } from '@/types/api';

const PAGE_KEYS = ['content', 'items', 'records', 'leads', 'lead', 'list', 'rows', 'fakeLeads'] as const;
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
    // #6 - Manual lead creation (Walk-in)
    async createLead(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/create', data);
        return response.data;
    },

    // #7 - Get full lead details
    getLeadById: async (id: string | number) => {
        const response = await api.get<LeadResponseDTO>(`/api/leads/id/${id}`);
        return response.data;
    },

    // #8 - Find lead by email
    getLeadByEmail: async (email: string) => {
        const response = await api.get<LeadResponseDTO>(`/api/leads/email/${email}`);
        return response.data;
    },

    // #9 - Find lead by phone
    getLeadByPhone: async (phone: string) => {
        const response = await api.get<any>(`/api/leads/phone/${phone}`);
        const data = response.data;
        // Backend returns Lead_Response which has a 'lead' list (singular)
        return data?.lead || (Array.isArray(data) ? data : (data ? [data] : []));
    },

    getLeadsByScore: async (score: string, page = 0, size = 15) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/score/${score}/page/${page}/size/${size}`);
        return response.data;
    },

    getLeadsByStatus: async (status: string, page = 0, size = 15) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/status/${status}/page/${page}/size/${size}`);
        return response.data;
    },

    // #10 - Update lead (Admin/Manager)
    async updateLead(email: string, data: Partial<LeadRequestDTO>) {
        const response = await api.patch<LeadResponseDTO>(`/api/leads/update/email/${email}`, data);
        return response.data;
    },

    // #11 - Import leads via Excel (AUTO/MANUAL)
    bulkUploadLeads: async (file: File, mode: string = 'AUTO', counselorIds: (string | number)[] = [], onProgress?: (percent: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        if (counselorIds && counselorIds.length > 0) {
            counselorIds.forEach(id => formData.append('counselorIds', id.toString()));
        }
        const response = await api.post(`/api/leads/bulk-upload?mode=${mode}`, formData, {
            headers: {
                'Content-Type': undefined
            } as any,
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    },

    // #12 - Global recent lead feed
    getRecentLeads: async (page: number, size: number) => {
        const response = await api.get(`/api/leads/recent/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #13 - List leads awaiting assignment
    getUnassignedRecentLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/unassigned/recent/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #14 - Recent leads for specific counselor
    getCounselorRecentLeads: async (counselorId: number | string, page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/counselor/${counselorId}/recent/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #15 - My assigned active leads
    getMyLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/my/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #16 - My leads moved to discarded state
    getMyDiscardedLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/my/discarded/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #17 - Move lead to Discarded state with reason
    discardLead: async (id: number | string, reason?: string) => {
        const response = await api.post<LeadResponseDTO>(`/api/leads/discard/${id}`, reason ? { reason } : {});
        return response.data;
    },

    // #18 - Update lead's course by Name
    updateLeadCourse: async (id: number | string, name: string) => {
        const response = await api.put<LeadResponseDTO>(`/api/leads/${id}/course/name/${encodeURIComponent(name)}`);
        return response.data;
    },

    // #19 - Update lead status (CONTACTED, FAKE, etc)
    updateLeadStatus: async (id: string | number, status: LeadStatus) => {
        const response = await api.patch<LeadResponseDTO>(`/api/leads/${id}/status`, null, { params: { status } });
        return response.data;
    },

    // Mark as fake via dedicated endpoint
    markAsFake: async (id: string | number, reason?: string) => {
        const response = await api.patch(`/api/leads/${id}/status/FAKE`, { reason });
        return response.data;
    },



    // #21 - Manual assign lead to counselor
    assignLeadToCounselor: async (leadId: number | string, counselorId: number | string) => {
        const response = await api.post<LeadResponseDTO>(`/api/leads/assign/${leadId}?counselorId=${counselorId}`);
        return response.data;
    },

    // #22 - Batch assign leads to a counselor
    bulkAssignLeads: async (counselorId: number | string, leadIds?: string[]) => {
        const response = await api.post(`/api/leads/bulk-assign/${counselorId}`, leadIds ? { leadIds } : {});
        return response.data;
    },

    // #22.1 - Random assign leads to a counselor
    assignRandomLeads: async (counselorId: number | string, count: number) => {
        const response = await api.post(`/api/leads/assign-random/${counselorId}?count=${count}`);
        return response.data;
    },

    // #23 - Filter leads by creation date range
    getLeadsByDateRange: async (startDate: string, endDate: string, page = 0, size = 15) => {
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00`;
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59`;
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/date-range`, { params: { start, end, page, size } });
        return response.data;
    },

    // #24 - Filter leads by campaign source
    getLeadsBySource: async (name: string, page = 0, size = 15) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/source/${encodeURIComponent(name)}`, { params: { page, size } });
        return response.data;
    },

    // #25 - Filter leads by course interest
    getLeadsByCourse: async (course: string, page = 0, size = 15) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/course/${encodeURIComponent(course)}`, { params: { page, size } });
        return response.data;
    },

    // #27 - Search leads by name
    getLeadsByName: async (name: string, page = 0, size = 15) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/search`, { params: { name, page, size } });
        return response.data;
    },

    // #28 - My dashboard statistics map
    getMyCounts: async () => {
        const response = await api.get('/api/leads/my/count');
        return response.data;
    },

    // #29 - Lead counts for specific counselor
    getCounselorLeadCount: async (counselorId: string | number) => {
        const response = await api.get(`/api/leads/counselor/${counselorId}/count`);
        return response.data;
    },

    // #30 - View active leads for a counselor
    getCounselorLeads: async (counselorId: string | number) => {
        const response = await api.get(`/api/leads/counselor/${counselorId}`);
        return toPageResponse(response.data).content;
    },

    // #31 - Leads filtered by department
    getLeadsByDepartment: async (dept: string, page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/department/${encodeURIComponent(dept)}/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #32 - Leads for counselor in department
    getCounselorLeadsByDepartment: async (counselorId: string | number, dept: string, page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/counselor/${counselorId}/department/${encodeURIComponent(dept)}/page/${page}/size/${size}`);
        return toPageResponse(response.data);
    },

    // #33 - List leads marked as fake
    getFakeLeads: async (page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/fake/${page}/${size}`);
        return toPageResponse(response.data);
    },

    getFakeLeadsByCounselor: async (counselorId: string | number, page: number = 0, size: number = 10) => {
        const response = await api.get(`/api/leads/fake/counselor/${counselorId}/${page}/${size}`);
        return toPageResponse(response.data);
    },

    // #34 - List leads with no activity (Timeout)
    getTimedOutLeads: async () => {
        const response = await api.get('/api/leads/timeout');
        return response.data;
    },

    // ─── Lead Priority Stages (Section 14) ───
    // #146 - HOT leads
    getHotLeads: async () => {
        const response = await api.get('/api/leads/stages/hot');
        return toPageResponse(response.data).content;
    },

    // #147 - WARM leads
    getWarmLeads: async () => {
        const response = await api.get('/api/leads/stages/warm');
        return toPageResponse(response.data).content;
    },

    // #148 - COLD leads
    getColdLeads: async () => {
        const response = await api.get('/api/leads/stages/cold');
        return toPageResponse(response.data).content;
    },

    // #149 - INTERESTED leads
    getInterestedLeads: async () => {
        const response = await api.get('/api/leads/stages/interested');
        return toPageResponse(response.data).content;
    },

    // #150 - DISCARDED leads
    getDiscardedLeads: async () => {
        const response = await api.get('/api/leads/stages/discard');
        return response.data?.data ?? response.data;
    },

    // ─── Unified Search ───
    searchLeads: async (params: {
        email?: string,
        name?: string,
        course?: string,
        status?: string,
        campaign?: string,
        score?: string,
        startDate?: string,
        endDate?: string,
        id?: string,
        phone?: string
    }) => {
        try {
            if (params.email) {
                const lead = await LeadService.getLeadByEmail(params.email);
                return lead ? [lead] : [];
            }
            if (params.name) {
                const res = await LeadService.getLeadsByName(params.name);
                return res.content;
            }
            if (params.course) {
                const res = await LeadService.getLeadsByCourse(params.course);
                return res.content;
            }
            if (params.campaign) {
                const res = await LeadService.getLeadsBySource(params.campaign);
                return res.content;
            }
            if (params.status) {
                if (params.status === 'FAKE') {
                    const res = await LeadService.getFakeLeads(0, 100);
                    return res.content;
                }
                const res = await LeadService.getLeadsByStatus(params.status, 0, 100);
                return res.content;
            }

            if (params.startDate && params.endDate) {
                const res = await LeadService.getLeadsByDateRange(params.startDate, params.endDate);
                return res.content;
            }
            if (params.id) {
                const lead = await LeadService.getLeadById(params.id);
                return lead ? [lead] : [];
            }
            if (params.phone) {
                const leads = await LeadService.getLeadByPhone(params.phone);
                return leads;
            }
            return [];
        } catch (error: any) {
            console.error("Search API Error:", error.message || error);
            return [];
        }
    },

    // ─── Assigned Lead Tracking (Section 4) ───
    // #48 - Transfer lead ownership between staff
    bulkReassignLeads: async (toId: string | number, leadIds: (string | number)[]) => {
        const response = await api.post(`/api/assignedLeads/bulk-reassign/${toId}`, { leadIds });
        return response.data;
    },

    // ─── Notes ───
    async addNote(leadId: string | number, noteContent: string) {
        const payload: CreateNoteRequestDTO = { note: noteContent };
        const response = await api.post<NoteDTO>(`/api/note/${leadId}/notes`, payload);
        return response.data;
    },

    async getNotes(leadId: string | number) {
        const response = await api.get<NoteDTO[]>(`/api/note/${leadId}/notes`);
        return response.data;
    },

    async getNoteById(noteId: string | number) {
        const response = await api.get<NoteDTO>(`/api/note/id/${noteId}`);
        return response.data;
    },

    async deleteNote(noteId: string | number) {
        const response = await api.delete(`/api/note/${noteId}`);
        return response.data;
    },

    // ─── Webhook Integrations (Section 3) ───
    // #35 - Facebook
    async integrateFacebook(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/Facebook', data);
        return response.data;
    },

    // #36 - Instagram
    async integrateInstagram(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/Instagram', data);
        return response.data;
    },

    // #37 - Google Forms (typo in backend: GoogelForm — must match exactly)
    async integrateGoogleForm(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/GoogelForm', data);
        return response.data;
    },

    // #38 - Official Website
    async integrateWebsite(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/Website', data);
        return response.data;
    },

    // #39 - Affiliate Partner
    async integrateAffiliatePartner(data: LeadRequestDTO) {
        const response = await api.post<LeadResponseDTO>('/api/leads/integration/AffiliatePartner', data);
        return response.data;
    },

    // ─── Affiliate Portal ───
    // #111 - Leads referred by currently logged-in affiliate
    async getAffiliateLeads() {
        const response = await api.get<{ lead: LeadResponseDTO[] } | LeadResponseDTO[]>('/api/campaign/affiliate/my-leads');
        const data = response.data as any;
        if (Array.isArray(data)) return data;
        return data?.lead || data?.content || [];
    },

    // #112 - Register student (Staff)
    registerStudent: async (formData: FormData) => {
        const response = await api.post('/api/staff/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data?.data ?? response.data;
    },

    submitInitialApplication: async (data: any) => {
        const response = await api.post('/api/staff/apply', data);
        return response.data?.data ?? response.data;
    },

    finalizeStudentRegistration: async (data: any, staffId?: string) => {
        const response = await api.post('/api/staff/register', data, {
            headers: staffId ? { 'X-Staff-Id': staffId } : {}
        });
        return response.data?.data ?? response.data;
    },
    
    getStudentCount: async () => {
        const response = await api.get('/api/staff/students/count');
        return response.data?.data ?? response.data;
    },

    getApplicationCount: async () => {
        const response = await api.get('/api/staff/student-applications/count');
        return response.data?.data ?? response.data;
    },

    getAllStudentApplications: async (page = 0, size = 10) => {
        const response = await api.get(`/api/staff/student-applications?page=${page}&size=${size}`);
        return response.data?.data ?? response.data;
    },

    getAllStudents: async (page = 0, size = 10) => {
        const response = await api.get(`/api/staff/students?page=${page}&size=${size}`);
        return response.data?.data ?? response.data;
    },

    getStudentById: async (id: string) => {
        const response = await api.get(`/api/staff/students/${id}`);
        return response.data?.data ?? response.data;
    },

    getCounselorByEmail: async (email: string) => {
        const response = await api.get(`/api/staff/student-applications/counselor`, { params: { email } });
        return response.data?.data ?? response.data;
    },

    getDepartments: async () => {
        const response = await api.get('/api/department/name');
        return response.data;
    },

    getCourses: async () => {
        const response = await api.get('/api/course/name');
        return response.data;
    }
};
