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
        const response = await api.get<CourseDTO[]>('/api/department/name');
        return response.data;
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
