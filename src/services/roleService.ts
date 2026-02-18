import api from './api';
import { RoleDTO } from '@/types/api';

export const RoleService = {
    async createRole(role: string) {
        const response = await api.post<RoleDTO>('/api/role/create', { role });
        return response.data;
    },
    async getRoleById(id: number) {
        const response = await api.get<RoleDTO>(`/api/role/${id}`);
        return response.data;
    },
    async getAllRoles() {
        const response = await api.get<RoleDTO[]>('/api/role');
        return response.data;
    },
    async getRoleByName(name: string) {
        const response = await api.get<RoleDTO>(`/api/role/byRole/${name}`);
        return response.data;
    }
};
