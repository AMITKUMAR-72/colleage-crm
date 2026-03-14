import api from './api';
import { CourseDTO } from '@/types/api';

export const CourseService = {
    async createCourse(course: string, department: string) {
        const response = await api.post<CourseDTO>('/api/course/create', {
            course,
            department
        });
        return response.data;
    },
    async getCourseById(id: number) {
        const response = await api.get<CourseDTO>(`/api/course/${id}`);
        return response.data;
    },
    async getAllCourses() {
        const response = await api.get<any>('/api/course/name');
        let data = response.data;

        // Handle raw string (truncated JSON) with more flexible regex
        if (typeof data === 'string') {
            const matches = [...data.matchAll(/"id":(\d+),"(?:course|courseName|name)":"([^"]+)"/g)];
            data = matches.map(m => ({ id: parseInt(m[1]), course: m[2] }));
        }

        // Handle paginated response
        if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.content)) {
            data = data.content;
        }

        if (Array.isArray(data)) {
            return data.map((item, index) => {
                if (typeof item === 'string') return { id: index, course: item };
                if (item && typeof item === 'object') {
                    const rawCourse = item.course ?? item.courseName ?? item.name ?? 'Unknown';
                    const rawDept = item.department ?? item.departmentName ?? item.dept ?? item.department_name ?? item.dept_name ?? '';
                    
                    const courseName = typeof rawCourse === 'object' ? (rawCourse.course ?? rawCourse.courseName ?? rawCourse.name ?? 'Unknown') : rawCourse;
                    const deptName = typeof rawDept === 'object' ? (rawDept.department ?? rawDept.departmentName ?? rawDept.name ?? rawDept.dept ?? '') : rawDept;

                    return {
                        id: item.id ?? index,
                        course: String(courseName || 'Unknown'),
                        department: String(deptName || '')
                    };
                }
                return item;
            });
        }
        return Array.isArray(data) ? data : [];
    },
    async getCourseByName(name: string) {
        const response = await api.get<CourseDTO>(`/api/course/byCourse/${name}`);
        return response.data;
    },
    async updateCourseName(id: number, course: string) {
        const response = await api.post<CourseDTO>(`/api/course/updateName/id/${id}/name/${course}`);
        return response.data;
    }
};
