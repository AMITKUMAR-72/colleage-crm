import api from './api';
import { DepartmentDTO } from '@/types/api';

export const DepartmentService = {
    async createDepartment(department: string) {
        const response = await api.post<DepartmentDTO>('/api/department/create', { department });
        return response.data;
    },
    async getDepartmentById(id: number) {
        const response = await api.get<DepartmentDTO>(`/api/department/${id}`);
        return response.data;
    },
    async getAllDepartments() {
        const response = await api.get<DepartmentDTO[]>('/api/department/name');
        return response.data;
    },
    async getDepartmentByName(name: string) {
        const response = await api.get<DepartmentDTO>(`/api/department/name/${name}`);
        return response.data;
    },
    async updateDepartmentName(id: number, department: string) {
        const response = await api.post<DepartmentDTO>(`/api/department/updateName/id/${id}/name/${department}`);
        return response.data;
    }
};
