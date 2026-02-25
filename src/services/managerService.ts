import api from './api';
import { AssignedLeadDTO, ContactedLeadDTO, PageResponse, LeadStatus } from '@/types/api';

export const ManagerService = {
    // ─── Assigned Leads ───
    getAllAssignedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<AssignedLeadDTO>>(`/api/assignedLeads/all/page/${page}/size/${size}`);
        return response.data;
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

    // ─── Contacted Leads ───
    getAllContactedLeads: async (page: number, size: number) => {
        const response = await api.get<PageResponse<ContactedLeadDTO>>(`/api/contactedLeads/all/page/${page}/size/${size}`);
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
    }
};
