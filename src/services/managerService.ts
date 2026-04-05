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

    getAssignmentsByCounselor: async (counselorId: string | number) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/counselor/${counselorId}`);
        return response.data;
    },

    getAssignmentsByStatus: async (status: string) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/status/${status}`);
        return response.data;
    },

    getAssignmentsByLead: async (leadId: string | number) => {
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/lead/${leadId}`);
        return response.data;
    },

    getAssignmentsByDateRange: async (start: string, end: string) => {
        const startISO = start.includes('T') ? start : `${start}T00:00:00`;
        const endISO = end.includes('T') ? end : `${end}T23:59:59`;
        const response = await api.get<AssignedLeadDTO[]>(`/api/assignedLeads/date-range/start/${startISO}/end/${endISO}`);
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

    getContactedByAssignedTo: async (counselorId: string | number) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/assigned-to/${counselorId}`);
        return response.data;
    },

    getContactedByAssignedBy: async (userId: string | number) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/assigned-by/${userId}`);
        return response.data;
    },

    getContactedByStatus: async (status: LeadStatus) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/status/${status}`);
        return response.data;
    },

    getContactedByLead: async (leadId: string | number) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/lead/${leadId}`);
        return response.data;
    },

    getContactedByDateRange: async (start: string, end: string) => {
        const startISO = start.includes('T') ? start : `${start}T00:00:00`;
        const endISO = end.includes('T') ? end : `${end}T23:59:59`;
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/date-range/start/${startISO}/end/${endISO}`);
        return response.data;
    },

    getContactedByLeadName: async (name: string) => {
        const response = await api.get<ContactedLeadDTO[]>(`/api/contactedLeads/lead/name/${encodeURIComponent(name)}`);
        return response.data;
    },

    manualAssignContacted: async (leadId: string | number, counselorId: string | number, type: string) => {
        const response = await api.post(`/api/contactedLeads/manual-assign/lead/${leadId}/counselor/${counselorId}/type/${type}`);
        return response.data;
    },

    bulkAssignContacted: async (counselorId: string | number, type: string, leadIds: (string | number)[]) => {
        const response = await api.post(`/api/contactedLeads/bulk-assign/${counselorId}/type/${type}`, { leadIds });
        return response.data;
    },

    getLeadNotes: async (leadId: string | number) => {
        const response = await api.get<any[]>(`/api/note/${leadId}/notes`);
        return response.data;
    },

    // ─── Counselor Performance ───
    getCounselorRecentLeads: async (counselorId: string | number, page: number, size: number) => {
        const response = await api.get<any>(`/api/leads/counselor/${counselorId}/recent/page/${page}/size/${size}`);
        console.log(`[ManagerService] getCounselorRecentLeads for ${counselorId}:`, response.data);
        return response.data;
    }
};
