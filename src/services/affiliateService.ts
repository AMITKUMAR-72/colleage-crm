import api from './api';
import { AffiliateDTO, CampaignDTO, LeadResponseDTO, AffiliateActive } from '@/types/api';

// Re-export the types for convenience — no more duplicate inline DTOs
export type { AffiliateDTO, CampaignDTO as SourceDTO } from '@/types/api';

export const AffiliateService = {
    // ─── Source management (Campaign Sources) ───
    createSource: async (data: Partial<CampaignDTO>) => {
        const response = await api.post<CampaignDTO>('/api/campaign/source/create', data);
        return response.data;
    },
    getAllSources: async () => {
        const response = await api.get<CampaignDTO[]>('/api/campaign/source');
        return response.data;
    },
    getSourceById: async (id: number) => {
        const response = await api.get<CampaignDTO>(`/api/campaign/source/id/${id}`);
        return response.data;
    },
    getSourceByName: async (name: string) => {
        const response = await api.get<CampaignDTO>(`/api/campaign/source/name/${name}`);
        return response.data;
    },

    // ─── Affiliate management ───
    registerAffiliate: async (data: Partial<AffiliateDTO>) => {
        const response = await api.post<AffiliateDTO>('/api/campaign/affiliate/create', data);
        return response.data;
    },
    getAllAffiliates: async () => {
        const response = await api.get<AffiliateDTO[]>('/api/campaign/affiliate');
        return response.data;
    },
    getAffiliateById: async (id: number) => {
        const response = await api.get<AffiliateDTO>(`/api/campaign/affiliate/id/${id}`);
        return response.data;
    },
    getAffiliateByEmail: async (email: string) => {
        const response = await api.get<AffiliateDTO>(`/api/campaign/affiliate/email/${email}`);
        return response.data;
    },
    getAffiliateByCompanyName: async (companyName: string) => {
        const response = await api.get<AffiliateDTO>(`/api/campaign/affiliate/companyName/${companyName}`);
        return response.data;
    },
    getAffiliatesByActiveStatus: async (status: AffiliateActive) => {
        const response = await api.get<AffiliateDTO[]>(`/api/campaign/affiliate/active/${status}`);
        return response.data;
    },
    updateAffiliate: async (id: number, data: Partial<AffiliateDTO>) => {
        const response = await api.patch<AffiliateDTO>(`/api/campaign/affiliate/update/${id}`, data);
        return response.data;
    },
    updateAffiliateActiveStatus: async (id: number, status: AffiliateActive) => {
        const response = await api.patch<string>(`/api/campaign/affiliate/update-active/${id}/${status}`);
        return response.data;
    },
    getMyLeads: async () => {
        const response = await api.get<LeadResponseDTO[]>('/api/campaign/affiliate/my-leads');
        return response.data;
    }
};
