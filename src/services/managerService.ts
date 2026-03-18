import api from './api';
import { AssignedLeadDTO, ContactedLeadDTO, PageResponse, LeadStatus } from '@/types/api';

export const ManagerService = {
    // ─── Assigned Leads ───
    getAllAssignedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<AssignedLeadDTO>>(`/api/assignedLeads/all/page/${page}/size/${size}`);
        // Handle cases where the backend might return the Page object nested or flat
        const data = response.data;
        console.log('[ManagerService] getAllAssignedLeads response:', data);
        return data;
    },

    getAssignmentsByCounselor: async (counselorId: number) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/counselor/${counselorId}`);
        return response.data;
    },

    getAssignmentsByStatus: async (status: string) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/status/${status}`);
        return response.data;
    },

    getAssignmentsByLead: async (leadId: number) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/lead/${leadId}`);
        return response.data;
    },

    getAssignmentsByDateRange: async (start: string, end: string) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/date-range/start/${start}/end/${end}`);
        return response.data;
    },

    getAssignmentsByLeadName: async (name: string) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/lead/name/${encodeURIComponent(name)}`);
        return response.data;
    },

    // ─── Contacted Leads ───
    getAllContactedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<ContactedLeadDTO>>(`/api/contactedLeads/all/page/${page}/size/${size}`);
        console.log('[ManagerService] getAllContactedLeads response:', response.data);
        return response.data;
    },

    getContactedByAssignedTo: async (counselorId: number) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/assigned-to/${counselorId}`);
        return response.data;
    },

    getContactedByAssignedBy: async (userId: number) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/assigned-by/${userId}`);
        return response.data;
    },

    getContactedByStatus: async (status: LeadStatus) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/status/${status}`);
        return response.data;
    },

    getContactedByLead: async (leadId: number) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/lead/${leadId}`);
        return response.data;
    },

    getContactedByDateRange: async (start: string, end: string) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/date-range/start/${start}/end/${end}`);
        return response.data;
    },

    getContactedByLeadName: async (name: string) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/lead/name/${encodeURIComponent(name)}`);
        return response.data;
    },

    manualAssignContacted: async (leadId: number, counselorId: number) => {
        const response = await api.post(`/api/contactedLeads/manual-assign/lead/${leadId}/counselor/${counselorId}`);
        return response.data;
    },

    bulkAssignContacted: async (counselorId: number, leadIds: number[]) => {
        const response = await api.post(`/api/contactedLeads/bulk-assign/${counselorId}`, { leadIds });
        return response.data;
    },

    getLeadNotes: async (leadId: number) => {
        const response = await api.get<any[]>(`/api/note/${leadId}/notes`);
        return response.data;
    },

    // ─── Counselor Performance ───
    getCounselorRecentLeads: async (counselorId: number, page: number, size: number) => {
        const response = await api.get<any>(`/api/leads/counselor/${counselorId}/recent/page/${page}/size/${size}`);
        console.log(`[ManagerService] getCounselorRecentLeads for ${counselorId}:`, response.data);
        return response.data; // Expected { count: number, lead: Lead[] }
    }
};
