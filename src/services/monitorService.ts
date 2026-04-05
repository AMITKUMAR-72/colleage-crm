import api from './api';
import { AuditLogDTO, PageResponse } from '@/types/api';

export const MonitorService = {
    getAuditLogs: async (page: number = 0, size: number = 10) => {
        // Using the exact endpoint specified by the user
        const response = await api.get<AuditLogDTO[] | PageResponse<AuditLogDTO>>(`/api/audit/logs`);

        // Handle both direct array and paginated response formats
        if (Array.isArray(response.data)) {
            return {
                content: response.data,
                totalPages: 1,
                totalElements: response.data.length,
                number: 0,
                size: response.data.length,
                first: true,
                last: true
            };
        }
        return response.data;
    },

    // 136. Fetch entity history
    getEntityHistory: async (entityType: string, entityId: string | number) => {
        const response = await api.get(`/api/audit/entity/${entityType}/${entityId}`);
        return response.data;
    }
};
