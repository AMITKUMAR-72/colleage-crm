import api from './api';
import { CounselorDTO, CounselorStatus, Priority, LeadResponseDTO, LeadScore, PageResponse } from '@/types/api';

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
        const response = await api.put<CounselorDTO>(`/api/counselors/update/email/${email}`, data);
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

    // ─── Counselor Lead Management ───
    getAssignedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/counselor/leads/all/${page}/${size}`);
        // Handle potential backend wrapper
        const data = (response as any).data?.content ? (response as any).data : response.data;
        return data;
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
        // The interceptor might have already unwrapped 'data', so we check for nested 'content'
        return data?.content || data?.data || (Array.isArray(data) ? data : []);
    },

    searchLeadsByCourse: async (course: string) => {
        const response = await api.get(`/api/counselor/leads/search/course/${encodeURIComponent(course)}`);
        const data = response.data as any;
        return data?.content || data?.data || (Array.isArray(data) ? data : []);
    },

    searchLeadsByDate: async (date: string) => {
        const response = await api.get(`/api/counselor/leads/search/date/${date}`);
        const data = response.data as any;
        return data?.content || data?.data || (Array.isArray(data) ? data : []);
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
    }
};
