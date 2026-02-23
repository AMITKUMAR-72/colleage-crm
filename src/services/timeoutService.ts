import api from './api';
import { LeadResponseDTO, PageResponse } from '@/types/api';

export const TimeOutService = {
    // Get current user's timed-out leads
    getMyTimedOutLeads: async () => {
        const response = await api.get<LeadResponseDTO[]>('/api/leads/timeout/mine');
        return response.data;
    },

    // Get all timed-out leads (Paginated)
    getAllTimedOutLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<LeadResponseDTO>>(`/api/leads/timeout/all/page/${page}/size/${size}`);
        return response.data;
    },

    // Get timed-out leads by counselor
    getTimedOutLeadsByCounselor: async (counselorId: number) => {
        const response = await api.get<LeadResponseDTO[]>(`/api/leads/timeout/counselor/${counselorId}`);
        return response.data;
    },

    // Get timed-out leads by email
    getTimedOutLeadsByEmail: async (email: string) => {
        const response = await api.get<LeadResponseDTO[]>(`/api/leads/timeout/email/${email}`);
        return response.data;
    },

    // Get timed-out leads by name
    getTimedOutLeadsByName: async (name: string) => {
        const response = await api.get<LeadResponseDTO[]>(`/api/leads/timeout/name/${name}`);
        return response.data;
    },

    // Get timed-out leads by date range
    getTimedOutLeadsByDateRange: async (start: string, end: string) => {
        const response = await api.get<LeadResponseDTO[]>(`/api/leads/timeout/date-range/start/${start}/end/${end}`);
        return response.data;
    }
};
