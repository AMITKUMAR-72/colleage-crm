import api from './api';

export const EnumService = {
    // 171. Get all available enums as a map
    getAllEnums: async () => {
        const response = await api.get<Record<string, string[]>>('/api/enum/all');
        return response.data;
    },

    // 172. Get all lead status values
    getLeadStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/lead-status');
        return response.data;
    },

    // 173. Get all user status values
    getUserStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/user-status');
        return response.data;
    },

    // 174. Get all SLA status values
    getSlaStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/sla-status');
        return response.data;
    },

    // 175. Get all session status values
    getSessionStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/session-status');
        return response.data;
    },

    // 176. Get all lead score values
    getScores: async () => {
        const response = await api.get<string[]>('/api/enum/scores');
        return response.data;
    },

    // 177. Get all priority values
    getPriorities: async () => {
        const response = await api.get<string[]>('/api/enum/priority');
        return response.data;
    },

    // 178. Get all counselor types
    getCounselorTypes: async () => {
        const response = await api.get<string[]>('/api/enum/counselor-type');
        return response.data;
    },

    // 179. Get all counselor status values
    getCounselorStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/counselor-status');
        return response.data;
    },

    // 180. Get all audit action types
    getAuditActions: async () => {
        const response = await api.get<string[]>('/api/enum/audit-action');
        return response.data;
    },

    // 181. Get all assignment status values
    getAssignStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/assign-status');
        return response.data;
    },

    // 182. Get all active status values
    getActiveStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/active-status');
        return response.data;
    },
};
