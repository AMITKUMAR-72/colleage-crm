import api from './api';
import { UserDTO } from '@/types/api';

export const UserService = {
    // 137. Create new user
    createUser: async (data: Partial<UserDTO> & { password?: string }) => {
        const response = await api.post<UserDTO>('/api/users/create', data);
        return response.data;
    },

    // 138. List all users
    getAllUsers: async () => {
        const response = await api.get<UserDTO[]>('/api/users');
        return response.data;
    },

    // 139. Get user by ID
    getUserById: async (id: number) => {
        const response = await api.get<UserDTO>(`/api/users/id/${id}`);
        return response.data;
    },

    // 140. Get by username
    getUserByName: async (name: string) => {
        const response = await api.get<UserDTO>(`/api/users/username/${encodeURIComponent(name)}`);
        return response.data;
    },

    // 141. Get by email
    getUserByEmail: async (email: string) => {
        const response = await api.get<UserDTO>(`/api/users/email/${encodeURIComponent(email)}`);
        return response.data;
    },

    // 142. Update password
    updatePassword: async (userId: number, newPassword: string) => {
        const response = await api.patch(`/api/users/id/${userId}/password`, { password: newPassword });
        return response.data;
    },

    // 143. Update user details
    updateUser: async (userId: number, data: Partial<UserDTO>) => {
        const response = await api.put<UserDTO>(`/api/users/id/${userId}`, data);
        return response.data;
    },

    // 144. Update user role
    updateUserRole: async (email: string, role: string) => {
        const response = await api.post<UserDTO>(`/api/users/update/${encodeURIComponent(email)}/role/${role}`);
        return response.data;
    },
};
