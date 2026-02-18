import api from './api';
import { CampaignDTO, AffiliateDTO } from '@/types/api';

export const CampaignService = {
    // ─── Sources ───
    async createSource(name: string) {
        const response = await api.post<CampaignDTO>('/api/campaign/source/create', { name });
        return response.data;
    },
    async getSourceById(id: number) {
        const response = await api.get<CampaignDTO>(`/api/campaign/source/id/${id}`);
        return response.data;
    },
    async getAllSources() {
        const response = await api.get<CampaignDTO[]>('/api/campaign/source');
        return response.data;
    },
    async getSourceByName(name: string) {
        const response = await api.get<CampaignDTO>(`/api/campaign/source/name/${name}`);
        return response.data;
    },

    // ─── Affiliates ───
    async registerAffiliate(data: Partial<AffiliateDTO>) {
        const response = await api.post<AffiliateDTO>('/api/campaign/affiliate/create', data);
        return response.data;
    },
    async getAffiliateById(id: number) {
        const response = await api.get<AffiliateDTO>(`/api/campaign/affiliate/id/${id}`);
        return response.data;
    },
    async getAllAffiliates() {
        const response = await api.get<AffiliateDTO[]>('/api/campaign/affiliate');
        return response.data;
    },
    async getAffiliateByEmail(email: string) {
        const response = await api.get<AffiliateDTO>(`/api/campaign/affiliate/email/${email}`);
        return response.data;
    },
    async getAffiliateByCompanyName(companyName: string) {
        const response = await api.get<AffiliateDTO>(`/api/campaign/affiliate/companyName/${companyName}`);
        return response.data;
    }
};
