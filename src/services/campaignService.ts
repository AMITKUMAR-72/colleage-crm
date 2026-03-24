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
    },

    // 10. Filter sources by status
    async getSourcesByStatus(status: string) {
        const response = await api.get<CampaignDTO[]>(`/api/campaign/source/status/${status}`);
        return response.data;
    },

    // 11. Update source details
    async updateSource(id: number, data: Partial<CampaignDTO>) {
        const response = await api.put<CampaignDTO>(`/api/campaign/source/update/${id}`, data);
        return response.data;
    },

    // 12. Update source status
    async updateSourceStatus(id: number, status: string) {
        const response = await api.patch(`/api/campaign/source/update-status/${id}/${status}`);
        return response.data;
    }
};
