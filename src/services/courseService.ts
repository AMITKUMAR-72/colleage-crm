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

    normalizeCourses(data: any): CourseDTO[] {
        let normalized = data;

        // Handle raw string (truncated JSON) with more robust order-agnostic regex
        if (typeof data === 'string') {
            const regex = /{.*?}/g; // Extract each course object
            const objects = data.match(regex) || [];
            normalized = objects.map(obj => {
                const id = obj.match(/"id":(\d+)/)?.[1];
                const course = obj.match(/"(?:course|courseName|name)":"([^"]+)"/)?.[1];
                const department = obj.match(/"department":"([^"]+)"/)?.[1];
                return { 
                    id: id ? parseInt(id) : 0, 
                    course: course || '', 
                    department: department || '' 
                };
            });
        }

        // Handle paginated response
        if (normalized && typeof normalized === 'object' && !Array.isArray(normalized) && Array.isArray(normalized.content)) {
            normalized = normalized.content;
        }

        if (Array.isArray(normalized)) {
            return normalized.map((item, index) => {
                if (typeof item === 'string') return { id: index, course: item, department: '' };
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
        return Array.isArray(normalized) ? normalized : [];
    },

    async getAllCourses() {
        const response = await api.get<any>('/api/course/name');
        return this.normalizeCourses(response.data);
    },

    async getCourseByName(name: string) {
        const response = await api.get<CourseDTO>(`/api/course/byCourse/${name}`);
        return response.data;
    },

    async updateCourseName(id: number, course: string) {
        const response = await api.post<CourseDTO>(`/api/course/updateName/id/${id}/name/${course}`);
        return response.data;
    },

    // 49. List all courses (raw — not just names)
    async getAllCoursesRaw() {
        const response = await api.get<any>('/api/course');
        return this.normalizeCourses(response.data);
    },

    // 53. Update course details
    async updateCourse(id: number, data: Partial<CourseDTO>) {
        const response = await api.put<CourseDTO>(`/api/course/update/${id}`, data);
        return response.data;
    },

    // 54. Delete course
    async deleteCourse(id: number) {
        const response = await api.delete(`/api/course/delete/${id}`);
        return response.data;
    },

    // 55. Create bulk courses
    async bulkCreate(courses: Array<{ course: string; department: string }>) {
        const response = await api.post('/api/course/bulk-create', courses);
        return response.data;
    }
};
