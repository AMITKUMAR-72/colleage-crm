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
        const response = await api.get<any>('/api/department');
        let data = response.data;

        // Handle raw string (truncated JSON) with more flexible regex
        if (typeof data === 'string') {
            const matches = [...data.matchAll(/"id":(\d+),"(?:department|departmentName|name|dept)":"([^"]+)"/g)];
            data = matches.map(m => ({ id: parseInt(m[1]), department: m[2] }));
        }

        // Handle paginated response
        if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.content)) {
            data = data.content;
        }

        if (Array.isArray(data)) {
            return data.map((item, index) => {
                if (typeof item === 'string') return { id: index, department: item };
                if (item && typeof item === 'object') {
                    // Check many possible fields
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
        return Array.isArray(data) ? data : [];
    },
    async getAllDepartmentNames() {
        // As requested: call /api/department/name
        const response = await api.get<any>('/api/department/name');
        const data = response.data?.data || response.data || [];
        return Array.isArray(data) ? data : [];
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
