import api from './api';
import { SessionDTO } from '@/types/api';

export const SessionService = {
    // Create session slot
    createSession: async (session: Omit<SessionDTO, 'id'>) => {
        const response = await api.post<SessionDTO>('/api/offlineSession/create', session);
        return response.data;
    },

    // Create bulk session slots
    createBulkSessions: async (sessions: Omit<SessionDTO, 'id'>[]) => {
        const response = await api.post<SessionDTO[]>('/api/offlineSession/create-bulk', sessions);
        return response.data;
    },

    // Assign lead to session
    assignLeadToSession: async (leadId: number, sessionId: number) => {
        const response = await api.post(`/api/offlineSession/assign`, { leadId, sessionId });
        return response.data;
    },

    // List available sessions by department ID
    getAvailableSessionsByDepartmentId: async (departmentId: number) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/available/${departmentId}`);
        return response.data;
    },

    // List available sessions by department name
    getAvailableSessionsByDepartmentName: async (departmentName: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/available/department/${departmentName}`);
        return response.data;
    },

    // List all sessions by department name
    getAllSessionsByDepartmentName: async (departmentName: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/department/${departmentName}`);
        return response.data;
    },

    // List sessions by date
    getSessionsByDate: async (date: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/date/${date}`);
        return response.data;
    },

    // Get leads assigned to session with notes
    getLeadsWithNotesForSession: async (sessionId: number) => {
        const response = await api.get(`/api/offlineSession/${sessionId}/leads-with-notes`);
        return response.data;
    },

    // Assign mentor to session
    assignMentorToSession: async (sessionId: number, mentorId: number) => {
        const response = await api.post(`/api/offlineSession/${sessionId}/assign-mentor/${mentorId}`);
        return response.data;
    },

    // Cancel session
    cancelSession: async (sessionId: number) => {
        const response = await api.post(`/api/offlineSession/${sessionId}/cancel`);
        return response.data;
    },

    // Get all sessions
    getAllSessions: async () => {
        const response = await api.get<SessionDTO[]>('/api/offlineSession/all');
        return response.data;
    },

    // Filter sessions by status
    getSessionsByStatus: async (status: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/status/${status}`);
        return response.data;
    },

    // Filter sessions by mentor assignment
    getSessionsByMentorAssigned: async (assigned: boolean) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/mentorAssigned/${assigned}`);
        return response.data;
    },

    // Get available mentors for session
    getAvailableMentorsForSession: async (sessionId: number) => {
        const response = await api.get(`/api/offlineSession/${sessionId}/available-mentors`);
        return response.data;
    }
};
