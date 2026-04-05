'use client';

import { useState, useEffect } from 'react';
import { RoleService } from '@/services/roleService';
import { RoleDTO } from '@/types/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { ShieldCheck, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RoleManager() {
    const { role: currentUserRole } = useAuth();
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoleDetails, setSelectedRoleDetails] = useState<RoleDTO | null>(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);

    // Search states
    const [searchType, setSearchType] = useState<'ALL' | 'NAME'>('ALL');
    const [searchValue, setSearchValue] = useState('');

    const [formData, setFormData] = useState({
        roleName: ''
    });

    useEffect(() => {
        if (searchType === 'ALL') {
            loadRoles();
        }
    }, [searchType]);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const data = await RoleService.getAllRoles();
            setRoles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load roles', error);
            toast.error('Failed to load roles');
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            if (searchType === 'ALL') {
                await loadRoles();
                return;
            } else if (searchType === 'NAME' && searchValue) {
                const data = await RoleService.getRoleByName(searchValue);
                setRoles(data ? [data] : []);
            }
        } catch (error) {
            toast.error('Failed to search roles');
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const details = await RoleService.getRoleById(id);
            setSelectedRoleDetails(details);
            setShowDetailsPopup(true);
        } catch (error) {
            toast.error('Failed to load role details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Ensure Role is uppercase format as typically expected by standard role structures
            const formattedRoleName = formData.roleName.toUpperCase();

            await RoleService.createRole(formattedRoleName);


            setShowModal(false);
            setFormData({ roleName: '' });

            if (searchType === 'ALL') {
                loadRoles();
            } else {
                handleSearch();
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Failed to process request');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans text-black">
            {/* Main List View */}
            <div style={{ display: showModal ? 'none' : 'block' }} className="space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full">
                        <select
                            className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer whitespace-nowrap"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as any)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="NAME">By Name</option>
                        </select>

                        {searchType === 'NAME' && (
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Enter role name... (Press Enter to search)"
                                    className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        )}
                    </div>


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
                                    <th className="px-6 py-4 font-bold">Role Name</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.length > 0 ? (
                                    roles.map((roleObj) => (
                                        <tr
                                            key={roleObj.id}
                                            onClick={() => handleViewDetails(roleObj.id)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold shadow-sm border border-purple-100 shrink-0">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-800 uppercase tracking-tight">{roleObj.role}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <ShieldAlert className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-bold text-slate-700">No roles found</h3>
                                            <p className="text-slate-400 text-sm mt-1">Use the add role button to register missing system authorization levels.</p>
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
                        <h3 className="text-2xl text-black font-semibold tracking-tight font-sans">
                            Create System Role
                        </h3>
                        <p className="opacity-80 text-black font-medium text-sm mt-1 max-w-md mx-auto">
                            Add a new role
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
                                <label htmlFor="roleName" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Role Name</label>
                                <div className="relative">
                                    <input
                                        id="roleName"
                                        required
                                        className="w-full pl-6 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 uppercase"
                                        value={formData.roleName}
                                        onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                                        placeholder="CREATE ROLE"
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
                {selectedRoleDetails && (
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowDetailsPopup(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-6 mt-2">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-[1.25rem] flex items-center justify-center text-2xl font-bold shadow-sm border border-purple-100">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">{selectedRoleDetails.role}</h2>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
