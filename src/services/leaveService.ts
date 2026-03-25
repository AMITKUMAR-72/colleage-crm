import api from './api';

export interface LeaveDTO {
    id: number;
    counselorId: number;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const LeaveService = {
    applyLeave: async (data: { startDate: string; endDate: string; reason: string }) => {
        const response = await api.post('/api/leaves/apply', data);
        return response.data;
    },

    getMyLeaves: async () => {
        const response = await api.get('/api/leaves/my');
        return response.data;
    },

    getCounselorLeaves: async (counselorId: number) => {
        const response = await api.get<LeaveDTO[]>(`/api/leaves/counselor/${counselorId}`);
        return response.data;
    },

    getLeaveById: async (leaveId: number) => {
        const response = await api.get<LeaveDTO>(`/api/leaves/${leaveId}`);
        return response.data;
    },

    updateLeaveStatus: async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {
        const response = await api.put(`/api/leaves/${leaveId}/status/${status}`);
        return response.data;
    },

    updateLeaveDates: async (leaveId: number, data: { startDate: string; endDate: string }) => {
        const response = await api.put(`/api/leaves/${leaveId}/dates`, data);
        return response.data;
    },

    getAllLeaves: async () => {
        const response = await api.get('/api/leaves/all');
        return response.data;
    },

};
