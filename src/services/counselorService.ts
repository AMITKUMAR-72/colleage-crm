import api from './api';
import { CounselorDTO, CounselorStatus, Priority } from '@/types/api';

export const CounselorService = {
    createCounselor: async (data: Partial<CounselorDTO>) => {
        const response = await api.post<CounselorDTO>('/api/counselors/create', data);
        return response.data;
    },

    getCounselorByEmail: async (email: string) => {
        const response = await api.get<CounselorDTO>(`/api/counselors/email/${email}`);
        return response.data;
    },

    getAllCounselors: async () => {
        const response = await api.get<CounselorDTO[]>('/api/counselors');
        return response.data;
    },

    getCounselorById: async (id: number) => {
        const response = await api.get<CounselorDTO>(`/api/counselors/id/${id}`);
        return response.data;
    },

    updateStatus: async (email: string, status: CounselorStatus) => {
        const response = await api.post<CounselorDTO>(`/api/counselors/updateStatus/email/${email}/status/${status}`);
        return response.data;
    },

    updatePriority: async (email: string, priority: Priority) => {
        const response = await api.post<CounselorDTO>(`/api/counselors/updatePriority/email/${email}/priority/${priority}`);
        return response.data;
    },

    updateProfile: async (email: string, data: Partial<CounselorDTO>) => {
        const response = await api.put<CounselorDTO>(`/api/counselors/update/email/${email}`, data);
        return response.data;
    },

    searchByStatus: async (status: CounselorStatus) => {
        const response = await api.get<CounselorDTO[]>(`/api/counselors/searchBy/status/${status}`);
        return response.data;
    },

    searchByName: async (name: string) => {
        const response = await api.get<CounselorDTO[]>(`/api/counselors/searchBy/name/${name}`);
        return response.data;
    }
};
