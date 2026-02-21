'use client';

import { useState, useEffect, useCallback } from 'react';
import { RoleService } from '@/services/roleService';
import { RoleDTO } from '@/types/api';
import toast from 'react-hot-toast';

export default function RoleManager() {
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [roleName, setRoleName] = useState('');
    const [loading, setLoading] = useState(false);

    const loadRoles = useCallback(async () => {
        try {
            const data = await RoleService.getAllRoles();
            setRoles(Array.isArray(data) ? data : []);
        } catch {
            setRoles([]);
            toast.error('Failed to load roles');
        }
    }, []);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await RoleService.createRole(roleName);
            toast.success('Role created!');
            setRoleName('');
            loadRoles();
        } catch {
            toast.error('Failed to create role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Role Management</h3>
            
            <form onSubmit={handleCreate} className="mb-6 space-y-4">
                <input 
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Role Name (e.g., TEAM_LEAD)"
                    className="w-full p-2 border rounded-lg"
                    required
                />
                <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-[#4d0101] text-white rounded-lg">
                    {loading ? 'Adding...' : 'Add Role'}
                </button>
            </form>

            <div className="space-y-2">
                {Array.isArray(roles) && roles.map(r => (
                    <div key={r.id} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                        <div className="font-bold">{r.role}</div>
                        <span className="text-xs text-gray-500">ID: {r.id}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
