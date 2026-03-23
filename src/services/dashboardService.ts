import api from './api';
import { AdminDashboardStatsDTO } from '@/types/dashboard';

export const DashboardService = {
    /**
     * GET /api/admin/dashboard/stats
     * Returns a single snapshot of all 20 admin dashboard statistics.
     */
    getAdminStats: async (): Promise<AdminDashboardStatsDTO> => {
        const response = await api.get<AdminDashboardStatsDTO>('/api/admin/dashboard/stats');
        // Defensively unwrap if interceptor left a wrapper
        const raw = response.data as any;
        return (raw?.data ?? raw) as AdminDashboardStatsDTO;
    },
};
