'use client';

import { useState, useEffect } from 'react';
import { AdminService, Department, Course } from '@/services/adminService';
import { Library, School, Plus, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CatalogManager() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showCourseModal, setShowCourseModal] = useState(false);
    
    // Form State
    const [newDept, setNewDept] = useState('');
    const [newCourse, setNewCourse] = useState({ course: '', department: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deps, crs] = await Promise.all([
                AdminService.getDepartments(),
                AdminService.getCourses()
            ]);
            setDepartments(Array.isArray(deps) ? deps : []);
            setCourses(Array.isArray(crs) ? crs : []);
        } catch (err) {
            console.error("Failed to fetch catalog", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDept.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            await AdminService.createDepartment(newDept);
            setSuccess(`Department "${newDept}" added successfully!`);
            setNewDept('');
            setShowDeptModal(false);
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add department");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourse.course.trim() || !newCourse.department) return;

        try {
            setSubmitting(true);
            setError(null);
            await AdminService.createCourse(newCourse);
            setSuccess(`Course "${newCourse.course}" added successfully!`);
            setNewCourse({ course: '', department: '' });
            setShowCourseModal(false);
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add course");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDept = async (id: number) => {
        if (!window.confirm("Delete this department? This may affect courses.")) return;
        try {
            await AdminService.deleteDepartment(id);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteCourse = async (id: number) => {
        if (!window.confirm("Delete this course?")) return;
        try {
            await AdminService.deleteCourse(id);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center py-10">Loading catalog...</div>;

    return (
        <div className="space-y-6">
            {/* Feedback Notifications */}
            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium">{success}</span>
                </div>
            )}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Departments Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <School className="w-5 h-5 text-indigo-600" />
                            Departments
                        </h2>
                        <button 
                            onClick={() => setShowDeptModal(true)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {departments.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                                <p className="text-xs italic">No departments yet</p>
                            </div>
                        ) : (
                            departments.map((dep) => (
                                <div key={dep.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                    <span className="text-sm font-medium text-gray-700">{dep.department}</span>
                                    <button 
                                        onClick={() => dep.id && handleDeleteDept(dep.id)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Courses Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Library className="w-5 h-5 text-blue-600" />
                            Course Catalog
                        </h2>
                        <button 
                            onClick={() => setShowCourseModal(true)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {courses.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                                <p className="text-xs italic">No courses yet</p>
                            </div>
                        ) : (
                            courses.map((course) => (
                                <div key={course.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">{course.course}</span>
                                        <p className="text-[10px] text-gray-400">Dept: {course.department}</p>
                                    </div>
                                    <button 
                                        onClick={() => course.id && handleDeleteCourse(course.id)}
                                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Department Modal */}
            {showDeptModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Add New Department</h3>
                            <button onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newDept}
                                    onChange={(e) => setNewDept(e.target.value)}
                                    placeholder="e.g. ARTS"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] transition-all outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDeptModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-[#4d0101] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#4d0101] shadow-lg shadow-indigo-100 disabled:opacity-50 transition"
                                >
                                    {submitting ? 'Adding...' : 'Add Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Course Modal */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Add New Course</h3>
                            <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCourse} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Course Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newCourse.course}
                                    onChange={(e) => setNewCourse({...newCourse, course: e.target.value})}
                                    placeholder="e.g. BCA, BTECH, LAW..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Department
                                </label>
                                <select
                                    required
                                    value={newCourse.department}
                                    onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] transition-all outline-none bg-white font-medium"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dep) => (
                                        <option key={dep.id} value={dep.department}>
                                            {dep.department}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCourseModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-[#4d0101] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#4d0101] shadow-lg shadow-blue-100 disabled:opacity-50 transition"
                                >
                                    {submitting ? 'Adding...' : 'Add Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
