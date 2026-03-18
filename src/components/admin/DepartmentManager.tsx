'use client';

import { useState, useEffect, useCallback } from 'react';
import { DepartmentService } from '@/services/departmentService';
import { DepartmentDTO } from '@/types/api';
import toast from 'react-hot-toast';

export default function DepartmentManager() {
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDTO | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);
    const [editDepartmentName, setEditDepartmentName] = useState('');
    const [updatingParams, setUpdatingParams] = useState(false);

    const loadDepartments = useCallback(async () => {
        try {
            const data = await DepartmentService.getAllDepartments();
            console.log("Departments loaded:", data);

            // Hack for backend StackOverflowError (recursive JSON truncation)
            let departmentsList: DepartmentDTO[] = [];
            if (typeof data === 'string') {
                console.warn("API returned raw string. Attempting to extract departments via Regex.");
                const matches = [...(data as unknown as string).matchAll(/"id":(\d+),"department":"([^"]+)"/g)];
                const uniqueData = Array.from(new Map(matches.map(m => [m[1], { id: parseInt(m[1], 10), department: m[2] }])).values());
                departmentsList = uniqueData;
            } else if (Array.isArray(data)) {
                departmentsList = data;
            }

            setDepartments(departmentsList);
        } catch (err) {
            console.error("Failed to load departments:", err);
            setDepartments([]);
            toast.error('Failed to load departments');
        }
    }, []);

    const handleViewDepartment = async (deptName: string) => {
        if (!deptName) return;
        setLoadingDetails(true);
        try {
            const rawData = await DepartmentService.getDepartmentByName(deptName);
            const data = rawData as any;
            console.log("Fetched department details:", data);

            let parsedDept: DepartmentDTO | null = null;

            if (typeof data === 'string') {
                // If backend returns a raw truncated string, parse fields using Regex
                const deptMatch = data.match(/"id":(\d+),"department":"([^"]+)"/);

                const courses: any[] = [];
                const coursesSectionMatch = data.match(/"courses":\s*\[(.*?)\](,"counselors"|})/);
                if (coursesSectionMatch && coursesSectionMatch[1]) {
                    const courseItems = [...coursesSectionMatch[1].matchAll(/{"id":(\d+),"course":"([^"]+)"/g)];
                    courseItems.forEach(m => courses.push({ id: parseInt(m[1]), course: m[2] }));
                }

                const counselors: any[] = [];
                const counselorsStart = data.indexOf('"counselors":[');
                if (counselorsStart !== -1) {
                    const counselorsStr = data.substring(counselorsStart + 14);
                    // Split by counselorId to find objects
                    const chunks = counselorsStr.split(/"counselorId":\s*/);
                    for (let i = 1; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        const idMatch = chunk.match(/^(\d+)/);
                        if (!idMatch) continue;
                        const counselorId = parseInt(idMatch[1]);

                        // avoid duplicate counselors from recursive nested loops
                        if (counselors.find(c => c.counselorId === counselorId)) continue;

                        const extractString = (key: string) => {
                            const m = chunk.match(new RegExp(`"${key}":\\s*"([^"]*)"`));
                            return m ? m[1] : undefined;
                        };
                        const extractNum = (key: string) => {
                            const m = chunk.match(new RegExp(`"${key}":\\s*(\\d+)`));
                            return m ? parseInt(m[1]) : undefined;
                        };

                        counselors.push({
                            counselorId,
                            name: extractString("name"),
                            email: extractString("email"),
                            phone: extractString("phone"),
                            status: extractString("status"),
                            counselorType: extractString("counselorType"),
                            priority: extractString("priority"),
                            totalLeads: extractNum("totalLeads") || 0,
                            interestedLeads: extractNum("interestedLeads") || 0,
                        });
                    }
                }

                parsedDept = {
                    id: deptMatch ? parseInt(deptMatch[1]) : 0,
                    department: deptMatch ? deptMatch[2] : deptName,
                    courses: courses,
                    counselors: counselors
                };

            } else {
                // Safe typical JSON parsing
                let unwrapped = data as any;
                if (data && typeof data === 'object' && 'data' in data) {
                    unwrapped = (data as any).data;
                }

                if (Array.isArray(unwrapped)) {
                    parsedDept = unwrapped[0] || null;
                } else {
                    parsedDept = unwrapped;
                }
            }

            setSelectedDepartment(parsedDept);
        } catch (error) {
            console.error("Failed to load department details:", error);
            toast.error('Failed to load department details');
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await DepartmentService.createDepartment(name);
            toast.success('Department created!');
            setName('');
            loadDepartments();
        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 403) {

                toast.error('Forbidden: You do not have permission to create this.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create department');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (dept: DepartmentDTO) => {
        setEditDepartmentId(dept.id);
        setEditDepartmentName(dept.department || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editDepartmentId === null || !editDepartmentName) return;
        setUpdatingParams(true);
        try {
            await DepartmentService.updateDepartmentName(editDepartmentId, editDepartmentName);
            toast.success('Department updated successfully!');
            setIsEditModalOpen(false);
            loadDepartments();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update department');
        } finally {
            setUpdatingParams(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {!selectedDepartment && !loadingDetails && (
                <>
                    <h3 className="text-xl font-bold mb-4">Departments</h3>

                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 mb-6">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="New Department Name"
                            className="flex-1 p-2.5 sm:p-2 border rounded-xl sm:rounded-lg focus:ring-2 focus:ring-[#dbb212] outline-none font-medium"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 bg-[#4d0101] text-white rounded-xl sm:rounded-lg hover:bg-[#600202] disabled:opacity-50 font-bold transition-all"
                        >
                            {loading ? 'Adding...' : 'Add Department'}
                        </button>
                    </form>

                    <div className="p-0 overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-bold text-sm">Department</th>
                                     <th className="px-4 sm:px-6 py-4 font-bold text-right text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Array.isArray(departments) && departments.length > 0 ? (
                                    departments.map((dept) => (
                                        <tr
                                            key={dept.id}
                                            onClick={() => dept.department && handleViewDepartment(dept.department)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        >
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="font-bold text-slate-800 uppercase tracking-tight">{dept.department}</div>
                                                <div className="sm:hidden mt-1 flex gap-3">
                                                    <span className="text-[10px] text-slate-400 font-bold">{(dept.courses || []).length} CRSE</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{(dept.counselors || []).length} CNSL</span>
                                                </div>
                                            </td>

                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(dept);
                                                    }}
                                                    className="px-4 py-2 sm:px-3 sm:py-1.5 text-xs font-bold text-[#4d0101] bg-rose-50 border border-rose-100 rounded-lg sm:rounded-md hover:bg-rose-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center">
                                            <div className="flex justify-center text-center">
                                                <img src="/raffles-logo.png" alt="Loading" className="h-12 w-auto object-contain animate-spin-y-ease-in" />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {loadingDetails && <div className="mt-4 p-4  flex justify-center text-center text-gray-500"><img src="/raffles-logo.png" alt="Loading" className="h-12 w-auto object-contain animate-spin-y-ease-in" />
            </div>}

            {selectedDepartment && (
                <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-inner animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 font-family-poppins">
                        <h4 className="text-xl font-bold text-gray-800">
                            Details for {selectedDepartment.department}
                        </h4>
                        <button
                            onClick={() => setSelectedDepartment(null)}
                            className="px-4 py-2 text-sm font-medium font-family-poppins bg-[#4d0101] hover:bg-[#dbb212] text-white  border border-gray-300 rounded-lg  transition-colors shadow-sm"
                        >
                            Close
                        </button>
                    </div>

                    <div className="mb-8">
                        <h5 className="font-bold font-family-poppins text-black mb-4 border-b pb-2 flex items-center gap-2">

                            Courses ({selectedDepartment.courses?.length || 0})
                        </h5>
                        {selectedDepartment.courses && selectedDepartment.courses.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedDepartment.courses.map((course: any, idx: number) => (
                                    <span key={course.id || idx} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 shadow-sm">
                                        {course.course || 'Unknown Course'}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic px-4">No courses assigned to this department.</p>
                        )}
                    </div>

                    <div>
                        <h5 className="font-bold font-family-poppins text-black mb-4 border-b pb-2 flex items-center gap-2">

                            Counselors ({selectedDepartment.counselors?.length || 0})
                        </h5>
                        {selectedDepartment.counselors && selectedDepartment.counselors.length > 0 ? (
                            <div className="p-0 overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-4 font-bold">Counselor</th>
                                            <th className="hidden sm:table-cell px-6 py-4 font-bold">Details</th>
                                            <th className="px-4 sm:px-6 py-4 font-bold text-right">Perf</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedDepartment.counselors.map((counselor: any, idx: number) => (
                                            <tr key={counselor.counselorId || counselor.id || idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="font-bold text-slate-800">{counselor.name || 'N/A'}</div>
                                                    <div className="sm:hidden text-[10px] text-slate-500 mt-1">{counselor.email || 'N/A'}</div>
                                                    <div className={`sm:hidden mt-2 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider w-fit ${counselor.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {counselor.status || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${counselor.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {counselor.status || 'N/A'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{counselor.email || 'N/A'}</span>
                                                        <span className="text-xs text-slate-500">{counselor.counselorType || 'N/A'} • P{counselor.priority || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-bold text-slate-800 text-sm">{counselor.totalLeads ?? 0}</span>
                                                            <span className="text-[9px] text-slate-400">TOT</span>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-bold text-emerald-600 text-sm">{(counselor as any).interestedLeads ?? 0}</span>
                                                            <span className="text-[9px] text-slate-400">INT</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic px-4">No counselors assigned to this department.</p>
                        )}
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-4 font-family-poppins text-gray-800">Edit Department</h3>
                        <form onSubmit={handleUpdateDepartment}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                                <input
                                    type="text"
                                    value={editDepartmentName}
                                    onChange={(e) => setEditDepartmentName(e.target.value)}
                                    placeholder="Enter new department name"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dbb212] focus:border-[#dbb212] outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingParams}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#4d0101] rounded-lg hover:bg-[#dbb212] transition-colors disabled:opacity-50"
                                >
                                    {updatingParams ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
