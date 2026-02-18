'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourseService } from '@/services/courseService';
import { DepartmentService } from '@/services/departmentService';
import { CourseDTO, DepartmentDTO } from '@/types/api';
import toast from 'react-hot-toast';

export default function CourseManager() {
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [courseName, setCourseName] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [coursesData, deptsData] = await Promise.all([
                CourseService.getAllCourses(),
                DepartmentService.getAllDepartments()
            ]);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setDepartments(Array.isArray(deptsData) ? deptsData : []);
            if (Array.isArray(deptsData) && deptsData.length > 0 && !selectedDepartment) {
                setSelectedDepartment(deptsData[0].department);
            }
        } catch {
            setCourses([]);
            setDepartments([]);
            toast.error('Failed to load data');
        }
    }, [selectedDepartment]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment) {
            toast.error("Please select a department");
            return;
        }
        setLoading(true);
        try {
            await CourseService.createCourse(courseName, selectedDepartment);
            toast.success('Course created!');
            setCourseName('');
            loadData();
        } catch {
            toast.error('Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const getDeptName = (course: CourseDTO) => {
        return course.department || '—';
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Courses</h3>
            
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 mb-6">
                <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.department}>
                            {dept.department}
                        </option>
                    ))}
                </select>
                <input 
                    type="text" 
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="New Course Name"
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Course'}
                </button>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {Array.isArray(courses) && courses.map((course) => (
                    <div key={course.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <span className="font-medium text-gray-700 block">{course.course}</span>
                            <span className="text-xs text-gray-500">{getDeptName(course)}</span>
                        </div>
                        <span className="text-xs text-gray-400">ID: {course.id}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
