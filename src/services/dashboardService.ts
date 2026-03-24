import api from './api';
import { AdminDashboardStatsDTO } from '@/types/dashboard';

export interface DashboardSummary {
    totalLeads: number;
    newLeads: number;
    assignedLeads: number;
    contactedLeads: number;
    convertedLeads: number;
    timedOutLeads: number;
    activeCounselors: number;
    activeSessions: number;
}

export interface LeadVolume { date: string; count: number; }
export interface CampaignStat { campaignName: string; leadCount: number; conversionRate?: number; }
export interface CounselorStat { counselorId: number; counselorName: string; totalAssigned: number; contacted: number; converted: number; timedOut: number; }
export interface CityStat { city: string; leadCount: number; }

export const DashboardService = {
    /** GET /api/admin/dashboard/stats — Admin snapshot */
    getAdminStats: async (): Promise<AdminDashboardStatsDTO> => {
        const response = await api.get<AdminDashboardStatsDTO>('/api/admin/dashboard/stats');
        const raw = response.data as any;
        return (raw?.data ?? raw) as AdminDashboardStatsDTO;
    },

    // 183. Get dashboard summary stats
    getSummary: async () => {
        const response = await api.get<DashboardSummary>('/api/dashboard/summary');
        return response.data;
    },

    // 184. Get lead volume over time
    getLeadVolume: async () => {
        const response = await api.get<LeadVolume[]>('/api/dashboard/lead-volume');
        return response.data;
    },

    // 185. Get campaign performance stats
    getCampaignStats: async () => {
        const response = await api.get<CampaignStat[]>('/api/dashboard/campaign-stats');
        return response.data;
    },

    // 186. Get counselor performance stats
    getCounselorStats: async () => {
        const response = await api.get<CounselorStat[]>('/api/dashboard/counselor-stats');
        return response.data;
    },

    // 187. Get geographical stats by city
    getCityStats: async () => {
        const response = await api.get<CityStat[]>('/api/dashboard/city-stats');
        return response.data;
    },
};
