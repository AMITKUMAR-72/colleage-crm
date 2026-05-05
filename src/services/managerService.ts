import api from './api';
import { AssignedLeadDTO, PageResponse, LeadStatus } from '@/types/api';

export const ManagerService = {
    // ─── Assigned Leads (Section 4) ───

    // #40 - Master list of all current assignments
    getAllAssignedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<AssignedLeadDTO>>(`/api/assignedLeads/all/page/${page}/size/${size}`);
        return response.data;
    },

    // #41 - Assignment history for a specific counselor
    getAssignmentsByCounselor: async (counselorId: string | number, page: number = 0, size: number = 20) => {
        const response = await api.get<any>(`/api/assignedLeads/counselor/${counselorId}/page/${page}/size/${size}`);
        return response.data;
    },

    // #42 - Filter by assignment status
    getAssignmentsByStatus: async (status: string, page: number = 0, size: number = 20) => {
        const response = await api.get<any>(`/api/assignedLeads/status/${status}/page/${page}/size/${size}`);
        return response.data;
    },



    // #44 - Get assignment record for a specific lead
    getAssignmentsByLead: async (leadId: string | number) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/lead/${leadId}`);
        return response.data;
    },

    // #45 - Filter global assignments by date range
    getAssignmentsByDateRange: async (start: string, end: string) => {
        const startISO = start.includes('T') ? start : `${start}T00:00:00`;
        const endISO = end.includes('T') ? end : `${end}T23:59:59`;
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/date-range`, {
            params: { start: startISO, end: endISO }
        });
        return response.data;
    },

    // #46 - Search assignments by student name
    getAssignmentsByLeadName: async (name: string) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/lead/name/${encodeURIComponent(name)}`);
        return response.data;
    },

    // #47 - Non-paginated list of all assignments
    getAllAssignmentsList: async () => {
        const response = await api.get<AssignedLeadDTO[]>('/api/assignedLeads/all-list');
        return response.data;
    },

    // #48 - Transfer lead ownership between staff
    bulkReassignLeads: async (toId: string | number, leadIds: (string | number)[]) => {
        const response = await api.post(`/api/assignedLeads/bulk-reassign/${toId}`, { leadIds });
        return response.data;
    },



    getLeadNotes: async (leadId: string | number) => {
        const response = await api.get<any[]>(`/api/note/${leadId}/notes`);
        return response.data;
    },

    // ─── Counselor Performance ───
    // #14 - Recent leads for specific counselor
    getCounselorRecentLeads: async (counselorId: string | number, page: number, size: number) => {
        const response = await api.get<any>(`/api/leads/counselor/${counselorId}/recent/page/${page}/size/${size}`);
        return response.data;
    },

    // #29 - Lead counts for specific counselor
    getCounselorLeadCount: async (counselorId: string | number) => {
        const response = await api.get(`/api/leads/counselor/${counselorId}/count`);
        return response.data;
    },
};
