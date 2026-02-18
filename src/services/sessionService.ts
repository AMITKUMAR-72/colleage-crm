import api from './api';
import { SessionDTO } from '@/types/api';

export const SessionService = {
    getAvailableSessions: async () => {
        try {
            const response = await api.get<SessionDTO[]>('/api/offlineSession/available');
            return response.data;
        } catch {
            return [
                { id: 1, startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 90000000).toISOString(), availableSlots: 5 },
                { id: 2, startTime: new Date(Date.now() + 172800000).toISOString(), endTime: new Date(Date.now() + 176400000).toISOString(), availableSlots: 3 }
            ] as SessionDTO[];
        }
    },

    createSession: async (session: Omit<SessionDTO, 'id'>) => {
        const response = await api.post<SessionDTO>('/api/offlineSession', session);
        return response.data;
    },

    assignLeadToSession: async (leadId: number, sessionId: number) => {
        const response = await api.post(`/api/offlineSession/assignLead/${leadId}/${sessionId}`);
        return response.data;
    }
};
