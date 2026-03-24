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
        const normalize = (data: any): DepartmentDTO[] => {
            // Handle raw string (truncated JSON)
            if (typeof data === 'string') {
                const matches = [...data.matchAll(/"id":(\d+),"(?:department|departmentName|name|dept)":"([^"]+)"/g)];
                return matches.map(m => ({ id: parseInt(m[1]), department: m[2] }));
            }

            // Handle paginated response
            if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.content)) {
                data = data.content;
            }

            if (Array.isArray(data)) {
                return data.map((item, index) => {
                    if (typeof item === 'string') return { id: index, department: item };
                    if (item && typeof item === 'object') {
                        const rawName = item.department ?? item.departmentName ?? item.name ?? item.dept ?? item.department_name ?? item.dept_name ?? 'Unknown';
                        const name = typeof rawName === 'object' ? (rawName.department ?? rawName.departmentName ?? rawName.name ?? rawName.dept ?? 'Unknown') : rawName;
                        return {
                            id: item.id ?? index,
                            department: String(name || 'Unknown')
                        };
                    }
                    return item;
                });
            }
            return [];
        };

        // Primary: Use /api/department/name (lightweight, avoids nested entity serialization)
        try {
            const response = await api.get<any>('/api/department/name');
            const result = normalize(response.data);
            if (result.length > 0) return result;
        } catch (err) {
            console.warn('[DepartmentService] /api/department/name failed, trying fallback...', err);
        }

        // Fallback: Try /api/department (full entities)
        try {
            const response = await api.get<any>('/api/department');
            return normalize(response.data);
        } catch (err) {
            console.error('[DepartmentService] All department endpoints failed.', err);
            return [];
        }
    },
    async getDepartmentByName(name: string) {
        const response = await api.get<DepartmentDTO>(`/api/department/name/${name}`);
        return response.data;
    },
    async updateDepartmentName(id: number, department: string) {
        const response = await api.post<DepartmentDTO>(`/api/department/updateName/id/${id}/name/${department}`);
        return response.data;
    },

    // 58. List all department names
    async getAllDepartmentNames() {
        const response = await api.get('/api/department/name');
        return response.data;
    },

    // 62. Update department details
    async updateDepartment(id: number, data: Partial<DepartmentDTO>) {
        const response = await api.put<DepartmentDTO>(`/api/department/update/${id}`, data);
        return response.data;
    },

    // 63. Delete department
    async deleteDepartment(id: number) {
        const response = await api.delete(`/api/department/delete/${id}`);
        return response.data;
    }
};
