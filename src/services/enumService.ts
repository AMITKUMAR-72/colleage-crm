import api from './api';

export const EnumService = {
    // 171. Get all available enums as a map
    getAllEnums: async () => {
        const response = await api.get<Record<string, string[]>>('/api/enum/all');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 172. Get all lead status values
    getLeadStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/lead-status');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 173. Get all user status values
    getUserStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/user-status');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 174. Get all SLA status values
    getSlaStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/sla-status');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 175. Get all session status values
    getSessionStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/session-status');
        const data = response.data as any;
        return data?.data ?? data;
    },



    // 177. Get all priority values
    getPriorities: async () => {
        const response = await api.get<string[]>('/api/enum/priority');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 178. Get all counselor types
    getCounselorTypes: async () => {
        const response = await api.get<string[]>('/api/enum/counselor-type');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 179. Get all counselor status values
    getCounselorStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/counselor-status');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 180. Get all audit action types
    getAuditActions: async () => {
        const response = await api.get<string[]>('/api/enum/audit-action');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 181. Get all assignment status values
    getAssignStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/assign-status');
        const data = response.data as any;
        return data?.data ?? data;
    },

    // 182. Get all active status values
    getActiveStatuses: async () => {
        const response = await api.get<string[]>('/api/enum/active-status');
        const data = response.data as any;
        return data?.data ?? data;
    },
};
