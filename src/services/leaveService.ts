import api from './api';
import { CounselorDTO } from '@/types/api';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequestDTO {
    id?: number;
    counselorId: number;
    counselorName?: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: LeaveStatus;
    appliedAt?: string;
}

export interface UpdateLeaveDatesDTO {
    startDate: string;
    endDate: string;
}

export const LeaveService = {
    // 164. Counselor applies for leave
    applyForLeave: async (data: { startDate: string; endDate: string; reason: string }) => {
        const response = await api.post<LeaveRequestDTO>('/api/leaves/apply', data);
        return response.data;
    },

    // 165. Authenticated Counselor views their own leaves
    getMyLeaves: async () => {
        const response = await api.get<LeaveRequestDTO[]>('/api/leaves/my');
        return response.data;
    },

    // 166. Manager views a specific counselor's leaves
    getCounselorLeaves: async (counselorId: number) => {
        const response = await api.get<LeaveRequestDTO[]>(`/api/leaves/counselor/${counselorId}`);
        return response.data;
    },

    // 167. Manager lists all leaves in the system
    getAllLeaves: async () => {
        const response = await api.get<LeaveRequestDTO[]>('/api/leaves/all');
        return response.data;
    },

    // 168. Get details of a specific leave request
    getLeaveById: async (leaveId: number) => {
        const response = await api.get<LeaveRequestDTO>(`/api/leaves/${leaveId}`);
        return response.data;
    },

    // 169. Update status (APPROVED/REJECTED)
    updateLeaveStatus: async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {
        const response = await api.put<LeaveRequestDTO>(`/api/leaves/${leaveId}/status/${status}`);
        return response.data;
    },

    // 170. Adjust allowed range of an APPROVED leave
    updateLeaveDates: async (leaveId: number, data: UpdateLeaveDatesDTO) => {
        const response = await api.put<LeaveRequestDTO>(`/api/leaves/${leaveId}/dates`, data);
        return response.data;
    },
};
