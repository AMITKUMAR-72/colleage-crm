import api from './api';
import { AffiliateDTO, CampaignDTO } from '@/types/api';

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
    }
};
