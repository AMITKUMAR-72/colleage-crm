'use client';

import { useState, useEffect } from 'react';
import { CourseService } from '@/services/courseService';
import { DepartmentService } from '@/services/departmentService';
import { CourseDTO, DepartmentDTO } from '@/types/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { BookOpen, Search, ShieldAlert, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CourseManager() {
    const { role: currentUserRole } = useAuth();
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCourseDetails, setSelectedCourseDetails] = useState<CourseDTO | null>(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);

    // Edit state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    // Search states
    const [searchType, setSearchType] = useState<'ALL' | 'NAME'>('ALL');
    const [searchValue, setSearchValue] = useState('');

    const [formData, setFormData] = useState({
        course: '',
        department: ''
    });

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        if (searchType === 'ALL') {
            loadCourses();
        }
    }, [searchType]);

    const loadDepartments = async () => {
        try {
            const deptsData = await DepartmentService.getAllDepartments();
            setDepartments(Array.isArray(deptsData) ? deptsData : []);
            if (Array.isArray(deptsData) && deptsData.length > 0 && !formData.department) {
                setFormData(prev => ({ ...prev, department: deptsData[0].department }));
            }
        } catch {
            console.error('Failed to load departments');
        }
    };

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await CourseService.getAllCourses();
            setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load courses', error);
            toast.error('Failed to load courses');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            if (searchType === 'ALL') {
                await loadCourses();
                return;
            } else if (searchType === 'NAME' && searchValue) {
                const data = await CourseService.getCourseByName(searchValue);
                setCourses(data ? [data] : []);
            }
        } catch (error) {
            toast.error('Failed to search courses');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const details = await CourseService.getCourseById(id);
            setSelectedCourseDetails(details);
            setIsEditingName(false);
            setEditNameValue(details.course);
            setShowDetailsPopup(true);
        } catch (error) {
            toast.error('Failed to load course details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.department) {
                toast.error("Please select a valid department");
                return;
            }

            // Ensure course is trimmed and standardized typically
            const formattedCourseName = formData.course.trim();

            await CourseService.createCourse(formattedCourseName, formData.department);
            toast.success('Course created successfully');

            setShowModal(false);
            setFormData({ course: '', department: departments.length > 0 ? departments[0].department : '' });

            if (searchType === 'ALL') {
                loadCourses();
            } else {
                handleSearch();
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Failed to process request');
        }
    };

    const handleUpdateCourseName = async () => {
        if (!selectedCourseDetails) return;
        try {
            const formattedName = editNameValue.trim().toUpperCase();
            if (!formattedName) {
                toast.error('Course name cannot be empty');
                return;
            }
            const updated = await CourseService.updateCourseName(selectedCourseDetails.id, formattedName);
            toast.success('Course name updated successfully');
            setSelectedCourseDetails(updated);
            setIsEditingName(false);

            // update in list
            setCourses(courses.map(c => c.id === updated.id ? updated : c));
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Failed to update course name');
        }
    };

    const getDeptName = (course: CourseDTO) => {
        return course.department || '—';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-poppins text-black">
            {/* Main List View */}
            <div style={{ display: showModal ? 'none' : 'block' }} className="space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-[60%] lg:w-[40%] xl:w-1/3">
                        <select
                            className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer whitespace-nowrap"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as any)}
                        >
                            <option value="ALL">All Courses</option>
                            <option value="NAME">By Name</option>
                        </select>

                        {searchType === 'NAME' && (
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Enter course name... (Press Enter to search)"
                                    className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        )}
                    </div>

                    {(currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER') && (
                        <button
                            onClick={() => {
                                setFormData({ course: '', department: departments.length > 0 ? departments[0].department : '' });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-[#4d0101] text-white px-6 py-3 rounded-2xl hover:bg-[#4d0101] hover:scale-[1.02] active:scale-[0.98] transition-all font-bold shadow-lg shadow-indigo-600/20"
                        >
                            Add Course
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-indigo-500">
                        <img src="/raffles-logo.png" alt="Loading" className="h-12 w-20 object-contain animate-spin-y-ease-in" />
                    </div>
                ) : (
                    <div className="p-0 overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-bold">Course Name</th>
                                    <th className="px-4 sm:px-6 py-4 font-bold">Department</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courses.length > 0 ? (
                                    courses.map((courseObj) => (
                                        <tr
                                            key={courseObj.id}
                                            onClick={() => handleViewDetails(courseObj.id)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        >
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold shadow-sm border border-amber-100 shrink-0">
                                                        <BookOpen className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-800 uppercase tracking-tight">{courseObj.course}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 font-medium font-bold">
                                                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                                                    {getDeptName(courseObj)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <ShieldAlert className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-bold text-slate-700">No courses found</h3>
                                            <p className="text-slate-400 text-sm mt-1">Use the add course button to register missing educational courses or adjust your search parameters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form View */}
            <div
                className="flex items-start justify-center transition-all font-poppins"
                style={{ display: showModal ? 'flex' : 'none', backgroundColor: 'transparent' }}
            >
                <div className="bg-white rounded-[1.2rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/20 text-black">
                    <div className="from-indigo-600 to-purple-600 p-8 text-white relative text-center">
                        <img src="/raffles-logo.png" alt="Raffles" className="h-24 w-auto object-contain mx-auto mb-4" />
                        <h3 className="text-2xl text-black font-semibold tracking-tight font-poppins">
                            Create Academic Course
                        </h3>
                        <p className="opacity-80 text-black font-medium text-sm mt-1 max-w-md mx-auto">
                            Add a new subject
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-8 right-8 w-10 h-10 bg-black/10 hover:bg-black/20 rounded-2xl flex items-center justify-center transition-colors font-bold text-black"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="flex flex-col gap-6">

                            <div className="w-full">
                                <label htmlFor="courseDept" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Department</label>
                                <div className="relative">
                                    <select
                                        id="courseDept"
                                        required
                                        className="w-full pl-6 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 uppercase cursor-pointer appearance-none"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="">SELECT DEPARTMENT</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.department}>
                                                {dept.department}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="w-full">
                                <label htmlFor="courseName" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Course Name</label>
                                <div className="relative">
                                    <input
                                        id="courseName"
                                        required
                                        className="w-full pl-6 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 uppercase"
                                        value={formData.course}
                                        onChange={e => setFormData({ ...formData, course: e.target.value })}
                                        placeholder="CREATE COURSE"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 rounded-2xl border border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all"
                            >
                                Dismiss
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 rounded-2xl bg-[#4d0101] from-indigo-600 to-purple-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Confirm Registration
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Details Popup */}
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all font-poppins"
                style={{ display: showDetailsPopup ? 'flex' : 'none', backgroundColor: 'rgba(17, 24, 39, 0.6)' }}
            >
                {selectedCourseDetails && (
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowDetailsPopup(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-6 mt-2">
                            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center text-2xl font-bold shadow-sm border border-amber-100">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            value={editNameValue}
                                            onChange={e => setEditNameValue(e.target.value)}
                                            className="px-3 py-1.5 text-lg font-bold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dbb212] outline-none uppercase w-full"
                                            autoFocus
                                            placeholder="COURSE NAME"
                                        />
                                        <button onClick={handleUpdateCourseName} className="text-xs bg-[#4d0101] text-white px-3 py-2 rounded-lg font-bold shadow-md hover:bg-[#600202] transition-colors whitespace-nowrap">Save</button>
                                        <button onClick={() => { setIsEditingName(false); setEditNameValue(selectedCourseDetails.course); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold border border-gray-200 hover:bg-gray-200 transition-colors whitespace-nowrap">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">{selectedCourseDetails.course}</h2>
                                        {(currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER') && (
                                            <button onClick={() => setIsEditingName(true)} className="text-amber-500 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 transition-colors" title="Edit Course Name">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium mt-1">
                                    <Building2 className="w-4 h-4 opacity-50 shrink-0" />
                                    <span>{getDeptName(selectedCourseDetails)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
