import api from './api';
import { AuditLogDTO, PageResponse } from '@/types/api';

export const MonitorService = {
    getAuditLogs: async (page: number, size: number) => {
        const response = await api.get<PageResponse<AuditLogDTO>>(`/api/audit/logs/${page}/${size}`);
        return response.data;
    }
};
