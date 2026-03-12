import api from './api';
import { LeadResponseDTO, PageResponse } from '@/types/api';

export const TimeOutService = {
    // Helper to safely extract lead array
    extractArray: (res: any) => res?.lead || res?.content || (Array.isArray(res) ? res : []),

    // Get all timed-out leads (Paginated)
    getAllTimedOutLeads: async (page: number, size: number) => {
        const response = await api.get(`/api/leads/timeout/all/page/${page}/size/${size}`);
        return response.data;
    },

    searchTimeoutLeads: async (params: {
        email?: string,
        name?: string,
        counselorEmail?: string,
        startDate?: string,
        endDate?: string
    }) => {
        const { extractArray } = TimeOutService;

        if (params.email) {
            try {
                const response = await api.get(`/api/leads/timeout/email/${params.email}`);
                return extractArray(response.data);
            } catch (error) {
                return [];
            }
        }

        if (params.name) {
            try {
                const response = await api.get(`/api/leads/timeout/name/${params.name}`);
                return extractArray(response.data);
            } catch (error) {
                return [];
            }
        }

        if (params.counselorEmail) {
            try {
                // First get counselor ID by email
                const counselorRes = await api.get(`/api/counselors/email/${params.counselorEmail}`);
                const counselor = counselorRes.data;
                if (!counselor || !counselor.id) return [];

                // Then fetch timeouts by counselor ID
                const response = await api.get(`/api/leads/timeout/counselor/${counselor.id}`);
                return extractArray(response.data);
            } catch (error) {
                return [];
            }
        }

        if (params.startDate && params.endDate) {
            try {
                let start = params.startDate;
                let end = params.endDate;
                if (start.length === 16) start += ':00';
                if (end.length === 16) end += ':00';
                const response = await api.get(`/api/leads/timeout/date-range/start/${start}/end/${end}`);
                return extractArray(response.data);
            } catch (error) {
                return [];
            }
        }

        return []; // Should not reach here ordinarily
    },
    // Reassign a timed-out lead to a different counselor
    reassignLead: async (counselorId: number, leadId: number, leadEmail: string) => {
        const response = await api.post(`/api/leads/timeout/assign/${leadId}/${counselorId}`);
        return response.data;
    }
};
