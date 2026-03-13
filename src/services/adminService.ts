import api from './api';
import { DepartmentDTO, CourseDTO, ConfigDTO, SlaUpdateResponseDTO, MaxCapacityUpdateResponseDTO } from '@/types/api';

// Re-export for backward compatibility if needed, but prefer using @/types/api directly
export type Department = DepartmentDTO;
export type Course = CourseDTO;

export const AdminService = {
    // Departments
    getDepartments: async () => {
        try {
            const response = await api.get<DepartmentDTO[]>('/api/department');
            return response.data;
        } catch {
            // Mock data matching DepartmentDTO
            return [
                { id: 1, department: 'Engineering' },
                { id: 2, department: 'Marketing' },
                { id: 3, department: 'Admissions' }
            ];
        }
    },
    createDepartment: async (department: string) => {
        const response = await api.post('/api/department/create', { department });
        return response.data;
    },
    deleteDepartment: async (id: number) => {
        await api.delete(`/api/department/${id}`);
    },

    // Courses
    getCourses: async () => {
        try {
            const response = await api.get<CourseDTO[]>('/api/course');
            return response.data;
        } catch {
            // Mock data matching CourseDTO
            return [
                { id: 1, course: 'B.Tech CS', department: 'Engineering' },
                { id: 2, course: 'MBA General', department: 'Marketing' },
                { id: 3, course: 'B.Arch', department: 'Admissions' }
            ];
        }
    },
    createCourse: async (course: Omit<CourseDTO, 'id'>) => {
        const response = await api.post('/api/course/create', course);
        return response.data;
    },
    deleteCourse: async (id: number) => {
        await api.delete(`/api/course/${id}`);
    }
};

// ─── System Config Service ────────────────────────────────────────────────────
export const ConfigService = {
    /** GET /api/config — fetch current global SLA hours and max capacity */
    getConfig: async (): Promise<ConfigDTO> => {
        const response = await api.get<any>('/api/config');
        const raw = response.data;
        // The interceptor may or may not have unwrapped the outer { data: {...} } layer.
        // Defensively dig until we find { maxCapacity, slaHours }.
        const payload: any =
            (typeof raw?.maxCapacity === 'number' ? raw : null) ??
            (typeof raw?.data?.maxCapacity === 'number' ? raw.data : null) ??
            raw;
        return {
            maxCapacity: Number(payload?.maxCapacity ?? 0),
            slaHours: Number(payload?.slaHours ?? 0),
        };
    },

    /** PATCH /api/config/slaHours/{hours} — update global SLA timer */
    updateSlaHours: async (hours: number): Promise<SlaUpdateResponseDTO> => {
        const response = await api.patch<SlaUpdateResponseDTO>(`/api/config/slaHours/${hours}`);
        return response.data;
    },

    /** PATCH /api/config/maxCapacity/{value} — update global counselor max capacity */
    updateMaxCapacity: async (value: number): Promise<MaxCapacityUpdateResponseDTO> => {
        const response = await api.patch<MaxCapacityUpdateResponseDTO>(`/api/config/maxCapacity/${value}`);
        return response.data;
    },
};

