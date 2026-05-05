import api from './api';
import { SessionDTO, SessionAssignmentDTO } from '@/types/api';

export const SessionService = {
    // #68 - Create single student session slot
    createSession: async (session: Omit<SessionDTO, 'id'>) => {
        const response = await api.post<SessionDTO>('/api/offlineSession/create', session);
        return response.data;
    },

    // #69 - Create multiple recurring session slots
    createBulkSessions: async (sessions: Omit<SessionDTO, 'id'>[]) => {
        const response = await api.post<SessionDTO[]>('/api/offlineSession/create-bulk', sessions);
        return response.data;
    },

    // #70 - Link a lead to a session
    assignLeadToSession: async (payload: { leadId: string | number; notes: string; preferredDate: string }) => {
        const response = await api.post<any>(`/api/offlineSession/assign`, payload);
        const data = response.data.data ? response.data.data : response.data;
        return data as SessionAssignmentDTO;
    },

    // #71 - Find open slots for a department ID
    getAvailableSessionsByDepartmentId: async (departmentId: string | number) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/available/${departmentId}`);
        return response.data;
    },

    // #72 - Find open slots by department name
    getAvailableSessionsByDepartmentName: async (departmentName: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/available/department/${encodeURIComponent(departmentName)}`);
        return response.data;
    },

    // #73 - List all sessions for a department
    getAllSessionsByDepartmentName: async (departmentName: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/department/${encodeURIComponent(departmentName)}`);
        return response.data;
    },

    // #74 - List sessions on a specific calendar day
    getSessionsByDate: async (date: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/date/${date}`);
        return response.data;
    },

    // #75 - Link a mentor to a session slot
    assignMentorToSession: async (sessionId: string | number, mentorId: string | number) => {
        const response = await api.post(`/api/offlineSession/${sessionId}/assign-mentor/${mentorId}`);
        return response.data;
    },

    // #76 - Mark session as cancelled
    cancelSession: async (sessionId: string | number) => {
        const response = await api.post(`/api/offlineSession/${sessionId}/cancel`);
        return response.data;
    },

    // #77 - View every session slot (Global)
    getAllSessions: async () => {
        const response = await api.get<SessionDTO[]>('/api/offlineSession/all');
        return response.data;
    },

    // #78 - Filter by session state
    getSessionsByStatus: async (status: string) => {
        const response = await api.get<SessionDTO[]>(`/api/offlineSession/status/${status}`);
        return response.data;
    },

    // Enum: session statuses
    getSessionStatus: async () => {
        const response = await api.get('/api/enum/session-status');
        return response.data;
    },

    // #79 - Filter by mentor assignment status
    getSessionsByMentorAssigned: async (assigned: boolean) => {
        const response = await api.get(`/api/offlineSession/mentorAssigned/${assigned}`);
        return response.data.data ? response.data.data : response.data;
    },

    // #80 - Detailed session view with mentor data
    getSessionById: async (sessionId: string | number) => {
        const response = await api.get<SessionDTO>(`/api/offlineSession/${sessionId}`);
        return response.data;
    },

    // #81 - Master attendance list for a session
    getSessionLeads: async (sessionId: string | number) => {
        const response = await api.get(`/api/offlineSession/${sessionId}/leads`);
        return response.data;
    },

    // #82 - Leads assigned to my session (Mentors only)
    getMentorSessionLeads: async (sessionId: string | number) => {
        const response = await api.get(`/api/offlineSession/mentor/session-leads/${sessionId}`);
        return response.data;
    },

    // #83 - Find mentors free during this time slot
    getAvailableMentorsForSession: async (sessionId: string | number) => {
        const response = await api.get(`/api/offlineSession/${sessionId}/available-mentors`);
        return response.data;
    },

    // #84 - List all students assigned to any session
    getAllAssignedSessionLeads: async () => {
        const response = await api.get('/api/offlineSession/assigned-leads/all');
        return response.data;
    },

    // #85 - Find session history for a specific student
    getSessionAssignmentsForLead: async (leadId: string | number) => {
        const response = await api.get(`/api/offlineSession/assignment/lead/${leadId}`);
        return response.data;
    },

    // Session leads with notes (Mentor context)
    getLeadsWithNotesForSession: async (sessionId: string | number) => {
        const response = await api.get(`/api/offlineSession/${sessionId}/leads-with-notes`);
        return response.data;
    },
};
