import api from './api';
import { CounselorDTO, CounselorStatus, CounselorType, Priority, LeadResponseDTO, LeadScore, PageResponse } from '@/types/api';

export const CounselorService = {
    createCounselor: async (data: Partial<CounselorDTO>) => {
        const response = await api.post<CounselorDTO>('/api/counselors/create', data);
        return response.data;
    },

    getCounselorByEmail: async (email: string) => {
        const response = await api.get<CounselorDTO>(`/api/counselors/email/${email}`);
        return response.data;
    },

    getAllCounselors: async () => {
        const response = await api.get<CounselorDTO[]>('/api/counselors');
        return response.data;
    },

    getCounselorById: async (id: number) => {
        const response = await api.get<CounselorDTO>(`/api/counselors/id/${id}`);
        return response.data;
    },

    updateStatus: async (email: string, status: CounselorStatus) => {
        const response = await api.post<CounselorDTO>(`/api/counselors/updateStatus/email/${email}/status/${status}`);
        return response.data;
    },

    updatePriority: async (email: string, priority: Priority) => {
        const response = await api.post<CounselorDTO>(`/api/counselors/updatePriority/email/${email}/priority/${priority}`);
        return response.data;
    },

    updateProfile: async (email: string, data: Partial<CounselorDTO>) => {
        const response = await api.patch<CounselorDTO>(`/api/counselors/update/email/${email}`, data);
        return response.data;
    },

    updateTypes: async (email: string, types: CounselorType[]) => {
        const response = await api.patch<CounselorDTO>(`/api/counselors/updateTypes/email/${email}`, {
            counselorTypes: types
        });
        return response.data;
    },

    searchByStatus: async (status: CounselorStatus) => {
        const response = await api.get<CounselorDTO[]>(`/api/counselors/searchBy/status/${status}`);
        return response.data;
    },

    searchByName: async (name: string) => {
        const response = await api.get<CounselorDTO[]>(`/api/counselors/searchBy/name/${name}`);
        return response.data;
    },

    searchByType: async (type: string) => {
        const response = await api.get<CounselorDTO[]>(`/api/counselors/searchBy/type/${type}`);
        return response.data;
    },

    getCounselorByPhone: async (phone: string) => {
        const response = await api.get<CounselorDTO>(`/api/counselors/phone/${phone}`);
        return response.data;
    },

    getCounselorTypes: async () => {
        const response = await api.get<string[]>('/api/enum/counselor-type');
        const data = response.data as any;
        return data?.data || data || [];
    },

    getCounselorStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/counselor-status');
        const data = response.data as any;
        return data?.data || data || [];
    },

    // ─── Counselor Lead Management ───
    getAssignedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/counselor/leads/all/${page}/${size}`);
        return response.data;
    },

    searchLeadById: async (id: number) => {
        const response = await api.get(`/api/counselor/leads/search/id/${id}`);
        const data = response.data as any;
        return data?.data || data?.content || data;
    },

    searchLeadByEmail: async (email: string) => {
        const response = await api.get(`/api/counselor/leads/search/email/${encodeURIComponent(email)}`);
        const data = response.data as any;
        return data?.data || data?.content || data;
    },

    searchLeadsBySource: async (source: string) => {
        const response = await api.get(`/api/counselor/leads/search/source/${encodeURIComponent(source)}`);
        const data = response.data as any;
        return data?.data?.content || data?.data || data?.content || (Array.isArray(data) ? data : []);
    },

    searchLeadsByScore: async (score: string) => {
        const response = await api.get(`/api/counselor/leads/search/score/${encodeURIComponent(score.toUpperCase())}`);
        const data = response.data as any;
        return data?.lead || data?.content || data?.data?.lead || data?.data?.content || data?.data || (Array.isArray(data) ? data : []);
    },

    searchLeadsByCourse: async (course: string) => {
        const response = await api.get(`/api/counselor/leads/search/course/${encodeURIComponent(course)}`);
        const data = response.data as any;
        return data?.lead || data?.content || data?.data?.lead || data?.data?.content || data?.data || (Array.isArray(data) ? data : []);
    },

    searchLeadsByDate: async (date: string) => {
        const response = await api.get(`/api/counselor/leads/search/date/${date}`);
        const data = response.data as any;
        return data?.lead || data?.content || data?.data?.lead || data?.data?.content || data?.data || (Array.isArray(data) ? data : []);
    },

    updateLeadScore: async (leadId: number, score: LeadScore) => {
        const response = await api.post<LeadResponseDTO>(`/api/counselor/lead/${leadId}/score/${score}`);
        return response.data;
    },

    updateLeadStatus: async (leadId: number, status: string) => {
        const response = await api.post<LeadResponseDTO>(`/api/counselor/lead/${leadId}/status/${status}`);
        return response.data;
    },

    updateLeadCourse: async (leadId: number, courseName: string) => {
        const response = await api.put<LeadResponseDTO>(`/api/counselor/lead/${leadId}/course/${courseName}`);
        return response.data;
    },

    /** POST /api/counselors/manual-assign/lead/{leadId}/counselor/{counselorId} */
    manualAssignLead: async (leadId: number, counselorId: number) => {
        const response = await api.post(`/api/counselors/manual-assign/lead/${leadId}/counselor/${counselorId}`);
        return response.data;
    },

    // 26. Get counselor by phone
    getCounselorByPhone: async (phone: string) => {
        const response = await api.get<CounselorDTO>(`/api/counselors/phone/${encodeURIComponent(phone)}`);
        return response.data;
    },

    // 30. Update counselor types (Internal/Telecaller/External) and department
    updateTypes: async (email: string, data: { counselorType: string; department: string }) => {
        const response = await api.put<CounselorDTO>(`/api/counselors/updateTypes/email/${encodeURIComponent(email)}`, data);
        return response.data;
    },

    // 34. Search counselors by type
    searchByType: async (type: string) => {
        const response = await api.get<CounselorDTO[]>(`/api/counselors/searchBy/type/${type}`);
        return response.data;
    },

    // 38. Search lead by phone (Counselor)
    searchLeadByPhone: async (phone: string) => {
        const response = await api.get(`/api/counselor/leads/search/phone/${encodeURIComponent(phone)}`);
        const data = response.data as any;
        return data?.data || data?.content || data;
    },

    // 43. Search leads by name (Counselor — Restricted Access)
    searchLeadsByName: async (name: string) => {
        const response = await api.get(`/api/counselor/leads/search/name/${encodeURIComponent(name)}`);
        const data = response.data as any;
        return data?.lead || data?.content || data?.data?.lead || data?.data?.content || data?.data || (Array.isArray(data) ? data : []);
    },
};



