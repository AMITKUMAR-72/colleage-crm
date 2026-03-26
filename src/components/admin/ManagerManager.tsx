'use client';

import { useState, useEffect } from 'react';
import { UserService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import { UserDTO } from '@/types/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Search, Building2, User } from 'lucide-react';

export default function ManagerManager() {
    const [managers, setManagers] = useState<UserDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState('');
    const [selectedManager, setSelectedManager] = useState<UserDTO | null>(null);

    // Form inputs for create/update
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const checkIsManager = (u: any) => {
        if (!u || !u.role) return false;
        if (typeof u.role === 'string') return u.role.includes('MANAGER');
        if (typeof u.role === 'object' && 'role' in u.role) {
            return String(u.role.role).includes('MANAGER');
        }
        return String(u.role).includes('MANAGER');
    };

    const loadManagers = async () => {
        try {
            setLoading(true);
            const data = await UserService.getAllUsers();
            
            // Filter only managers utilizing complex type boundaries
            const managerList = (Array.isArray(data) ? data : []).filter(checkIsManager);
            setManagers(managerList);
        } catch (error) {
            toast.error('Failed to load managers');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchName.trim()) {
            loadManagers();
            return;
        }
        try {
            setLoading(true);
            const data = await UserService.getUserByName(searchName);
            // Check if returned user is actually a manager utilizing robust mapping
            const isManager = data && checkIsManager(data);
            setManagers(isManager ? [data] : []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to search managers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadManagers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editingUserId) {
                // Update basic user Details
                await UserService.updateUser(editingUserId, { name: formData.name, email: formData.email });
                if (formData.password) {
                    await UserService.updatePassword(editingUserId, formData.password);
                }
                toast.success('Manager updated successfully');
            } else {
                // Attempt to register account with explicit MANAGER role parameter 
                try {
                    await UserService.createUser({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        role: 'MANAGER' as any
                    });
                } catch (creationError: any) {
                    const errorMsg = creationError?.response?.data?.message || '';
                    if (!errorMsg.toLowerCase().includes('already exists')) {
                        throw creationError; // Re-throw if it's not a duplicate email issue
                    }
                    // If the user already exists, suppress the creation error and promote them!
                    console.warn(`[ManagerManager] Contact already exists natively! Force elevating ${formData.email} directly to MANAGER...`);
                }
                
                // Secondary execution perfectly cascades into role promotion state
                await UserService.updateUserRole(formData.email, 'MANAGER');
                
                toast.success('Manager Node Registered and Synchronized Successfully');
            }
            // Reset form
            setFormData({ name: '', email: '', password: '' });
            setIsEditing(false);
            setEditingUserId(null);
            await loadManagers();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || (isEditing ? 'Failed to update manager' : 'Failed to create manager'));
        }
    };

    const handleEditClick = (manager: UserDTO) => {
        setFormData({
            name: manager.name,
            email: manager.email,
            password: '' // Keep password empty for security, only update if typed
        });
        setEditingUserId(manager.id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-poppins text-black">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{isEditing ? 'Update Manager' : 'Create System Manager'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-widest pl-1">Manager Name</label>
                                <input required minLength={3} maxLength={20} type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors font-semibold" placeholder="e.g. Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-widest pl-1">Email Address</label>
                                <input required type="email" maxLength={50} name="email" value={formData.email} onChange={handleChange} disabled={isEditing} className={`w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors font-semibold ${isEditing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50'}`} placeholder="admin@raffles.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-widest pl-1">
                                    {isEditing ? 'New Password (Optional)' : 'Secure Password'}
                                </label>
                                <input required={!isEditing} minLength={6} maxLength={40} type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] transition-colors" placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="bg-[#4d0101] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#600202] active:scale-95 transition-all text-sm tracking-wide">
                                {isEditing ? 'Update Profile' : 'Register Manager'}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={() => { setIsEditing(false); setEditingUserId(null); setFormData({ name: '', email: '', password: '' }); }} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">System Managers</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Active: {managers.length}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by username..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#dbb212] w-full sm:w-64 text-black font-semibold"
                                />
                            </div>
                            <button onClick={handleSearch} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest w-full sm:w-auto">
                                Search
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10"><img src="/raffles-logo.png" alt="Loading" className="h-10 mx-auto animate-pulse" /></div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-[10px] text-gray-400 bg-gray-50/50 uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-5">Identity details</th>
                                        <th className="hidden sm:table-cell px-6 py-5">Account Email</th>
                                        <th className="hidden md:table-cell px-6 py-5">Role Level</th>
                                        <th className="px-6 py-5 text-center">Status</th>
                                        <th className="px-6 py-5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {managers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                <p className="text-gray-400 font-bold tracking-tight">No managers listed right now.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        managers.map(manager => (
                                            <tr key={manager.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 flex items-center justify-center rounded-xl border border-indigo-100 shadow-sm shrink-0">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setSelectedManager(manager)}>{manager.name}</p>
                                                            <div className="sm:hidden text-[10px] text-gray-400 font-semibold mt-0.5">{manager.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4">
                                                    <span className="text-gray-500 font-medium text-xs">{manager.email}</span>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                                                        <Building2 className="w-3 h-3" /> MANAGER
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {manager.isActive === 'ACTIVE' || !manager.isActive ? (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block md:hidden"></span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block md:hidden"></span>
                                                    )}
                                                    <span className={`hidden md:inline-block px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${manager.isActive === 'ACTIVE' || !manager.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {manager.isActive === 'ACTIVE' || !manager.isActive ? 'ACTIVE' : manager.isActive}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleEditClick(manager)} className="text-indigo-600 font-bold hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 transition-all shadow-sm">
                                                        Configure
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedManager && (
                    <div className="w-full md:w-1/3 bg-slate-50 border border-slate-100 rounded-2xl p-6 h-fit animate-in slide-in-from-right-8 duration-300">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                            <div>
                                <h3 className="font-black text-lg text-gray-900 tracking-tight">Manager Node</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Profile View</p>
                            </div>
                            <button onClick={() => setSelectedManager(null)} className="w-8 h-8 rounded-full bg-gray-200/50 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">✕</button>
                        </div>
                        <div className="space-y-4 text-sm text-gray-700">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</span>
                                <p className="font-black text-gray-900 text-base mt-0.5">{selectedManager.name}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Access</span>
                                <p className="font-semibold text-indigo-600 mt-0.5">{selectedManager.email}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Node Status</span>
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm inline-block ${selectedManager.isActive === 'ACTIVE' || !selectedManager.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {selectedManager.isActive === 'ACTIVE' || !selectedManager.isActive ? 'OPERATIONAL' : 'RESTRICTED'}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => { handleEditClick(selectedManager); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-8 w-full bg-white text-gray-900 font-bold py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all text-xs uppercase tracking-widest">
                            Edit Node Identity
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
