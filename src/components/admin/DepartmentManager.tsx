'use client';

import { useState, useEffect, useCallback } from 'react';
import { DepartmentService } from '@/services/departmentService';
import { DepartmentDTO } from '@/types/api';
import toast from 'react-hot-toast';

export default function DepartmentManager() {
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const loadDepartments = useCallback(async () => {
        try {
            const data = await DepartmentService.getAllDepartments();
            console.log("Departments loaded:", data);

            // Hack for backend StackOverflowError (recursive JSON truncation)
            let departmentsList: DepartmentDTO[] = [];
            if (typeof data === 'string') {
                console.warn("API returned raw string. Attempting to extract departments via Regex.");
                const matches = [...data.matchAll(/"id":(\d+),"department":"([^"]+)"/g)];
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

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Departments</h3>

            <form onSubmit={handleCreate} className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New Department Name"
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-[#dbb212] outline-none"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#4d0101] text-white rounded-lg hover:bg-[#4d0101] disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Department'}
                </button>
            </form>

            <div className="space-y-2">
                {Array.isArray(departments) && departments.map((dept) => (
                    <div key={dept.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{dept.department}</span>
                        <span className="text-xs text-gray-500">ID: {dept.id}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
