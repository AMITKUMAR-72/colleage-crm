'use client';

import { useState, useEffect } from 'react';
import { CounselorService } from '@/services/counselorService';
import { DepartmentService } from '@/services/departmentService';
import { CounselorDTO, CounselorStatus, CounselorType, DepartmentDTO, Priority } from '@/types/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { UserPlus, Mail, Phone, Building2, UserCircle2, ShieldCheck, ShieldAlert, Edit2, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CounselorManager() {
    const { role } = useAuth();
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [counselorTypesEnum, setCounselorTypesEnum] = useState<string[]>([]);
    const [counselorStatusesEnum, setCounselorStatusesEnum] = useState<string[]>([]);
    const [filterType, setFilterType] = useState('all');
    const [filterValue, setFilterValue] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCounselor, setEditingCounselor] = useState<CounselorDTO | null>(null);
    const [selectedCounselorDetails, setSelectedCounselorDetails] = useState<CounselorDTO | null>(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        departments: [] as string[],
        counselorTypes: ['INTERNAL'] as CounselorType[],
        status: 'AVAILABLE' as CounselorStatus,
        priority: 'MEDIUM' as Priority,
        totalLeads: 0
    });

    const handleViewDetails = async (id: number) => {
        if (!id || isNaN(id)) {
            toast.error('Invalid counselor ID');
            return;
        }
        try {
            const details = await CounselorService.getCounselorById(id);
            setSelectedCounselorDetails(details);
            setShowDetailsPopup(true);
        } catch (error) {
            toast.error('Failed to load counselor details');
        }
    };

    useEffect(() => {
        loadCounselors();
        loadDepartments();
        loadEnums();
    }, []);

    const loadEnums = async () => {
        try {
            const types = await CounselorService.getCounselorTypes();
            if (Array.isArray(types)) setCounselorTypesEnum(types);
            const statuses = await CounselorService.getCounselorStatuses();
            if (Array.isArray(statuses)) setCounselorStatusesEnum(statuses);
        } catch (error) {
            console.error('Failed to load counselor enums', error);
        }
    };

    const loadDepartments = async () => {
        try {
            const data = await DepartmentService.getAllDepartments();
            setDepartments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load departments', error);
            setDepartments([]);
        }
    };

    const loadCounselors = async () => {
        try {
            const raw = await CounselorService.getAllCounselors();
            let list: CounselorDTO[] = [];
            if (Array.isArray(raw)) {
                list = raw;
            } else if (raw && typeof raw === 'object') {
                const obj = raw as any;
                const arr = obj.data ?? obj.counselors ?? obj.content ?? obj.items ?? [];
                list = Array.isArray(arr) ? arr : [];
            }
            setCounselors(list);
        } catch (error) {
            console.error('Failed to load counselors', error);
            toast.error('Failed to load counselors');
            setCounselors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            if (filterType === 'all' || (!filterValue.trim() && !['type', 'status'].includes(filterType))) {
                await loadCounselors();
                return;
            }

            let result: any;
            let list: CounselorDTO[] = [];
            
            switch (filterType) {
                case 'email':
                    result = await CounselorService.getCounselorByEmail(filterValue.trim());
                    list = result?.data ? [result.data] : (result ? [result] : []);
                    break;
                case 'phone':
                    result = await CounselorService.getCounselorByPhone(filterValue.trim());
                    list = result?.data ? [result.data] : (result ? [result] : []);
                    break;
                case 'name':
                    result = await CounselorService.searchByName(filterValue.trim());
                    list = Array.isArray(result) ? result : (result?.data || result?.content || result?.counselors || []);
                    break;
                case 'type':
                    if (filterValue) {
                        result = await CounselorService.searchByType(filterValue);
                        list = Array.isArray(result) ? result : (result?.data || result?.content || result?.counselors || []);
                    }
                    break;
                case 'status':
                    if (filterValue) {
                        result = await CounselorService.searchByStatus(filterValue as CounselorStatus);
                        list = Array.isArray(result) ? result : (result?.data || result?.content || result?.counselors || []);
                    }
                    break;
            }
            setCounselors(list);
        } catch (error) {
            toast.error('Search failed');
            setCounselors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const sanitizedData = {
                ...formData,
                phone: formData.phone.replace(/\D/g, '')
            };

            if (sanitizedData.phone.length === 12 && sanitizedData.phone.startsWith('91')) {
                sanitizedData.phone = sanitizedData.phone.substring(2);
            }

            if (editingCounselor) {
                const { password, ...updateData } = sanitizedData;
                await CounselorService.updateProfile(editingCounselor.email, updateData);
                toast.success('Counselor profile updated');
            } else {
                await CounselorService.createCounselor(sanitizedData);
                toast.success('Counselor account created successfully');
            }
            setShowModal(false);
            setEditingCounselor(null);
            setFormData({ name: '', email: '', password: '', phone: '', departments: [], counselorTypes: ['INTERNAL'], status: 'AVAILABLE', priority: 'MEDIUM', totalLeads: 0 });
            loadCounselors();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Failed to process counselor request');
        }
    };

    const updateStatus = async (email: string, newStatus: CounselorStatus) => {
        try {
            await CounselorService.updateStatus(email, newStatus);
            toast.success(`Counselor is now ${newStatus}`);
            loadCounselors();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleEdit = (counselor: CounselorDTO) => {
        setEditingCounselor(counselor);
        setFormData({
            name: counselor.name,
            email: counselor.email,
            password: '',
            phone: counselor.phone,
            departments: counselor.departments || [],
            counselorTypes: counselor.counselorTypes || [],
            status: counselor.status,
            priority: counselor.priority,
            totalLeads: counselor.totalLeads || 0
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div style={{ display: showModal ? 'none' : 'block' }} className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    {/* Search / Filter Section */}
                    <div className="flex flex-1 flex-col xl:flex-row items-start xl:items-center gap-3">
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setFilterValue('');
                                if (e.target.value === 'all') loadCounselors();
                            }}
                            className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm font-bold w-full sm:w-auto shadow-sm"
                        >
                            <option value="all">All Counselors</option>
                            <option value="name">By Name</option>
                            <option value="email">By Email</option>
                            <option value="phone">By Phone</option>
                            <option value="type">By Type</option>
                            <option value="status">By Status</option>
                        </select>
                        
                        {filterType !== 'all' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                                {filterType === 'type' ? (
                                    <select
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm w-full sm:max-w-xs shadow-sm"
                                    >
                                        <option value="">Select Type...</option>
                                        {counselorTypesEnum.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                ) : filterType === 'status' ? (
                                    <select
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm w-full sm:max-w-xs shadow-sm"
                                    >
                                        <option value="">Select Status...</option>
                                        {counselorStatusesEnum.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={`Enter ${filterType}...`}
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#dbb212] text-sm w-full sm:max-w-xs shadow-sm"
                                    />
                                )}
                                <button
                                    onClick={handleSearch}
                                    className="px-6 py-3 bg-[#4d0101] text-white rounded-xl font-bold text-sm hover:bg-[#600202] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                                >
                                    Search
                                </button>
                            </div>
                        )}
                    </div>

                    {role === 'ADMIN' && (
                        <button
                            onClick={() => {
                                setEditingCounselor(null);
                                setFormData({ name: '', email: '', password: '', phone: '', departments: [], counselorTypes: ['INTERNAL'], status: 'AVAILABLE', priority: 'MEDIUM', totalLeads: 0 });
                                setShowModal(true);
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#4d0101] text-white px-6 py-3 rounded-2xl hover:bg-[#4d0101] hover:scale-[1.02] active:scale-[0.98] transition-all font-bold shadow-lg"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add Counselor
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
                                    <th className="px-4 sm:px-6 py-4 font-bold">Counselor</th>
                                    <th className="hidden sm:table-cell px-6 py-4 font-bold">Departments</th>
                                    <th className="px-4 sm:px-6 py-4 font-bold">Status</th>
                                    <th className="hidden md:table-cell px-6 py-4 font-bold text-center">Metrics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Array.isArray(counselors) && counselors.map((c) => (
                                    <tr
                                        key={c.counselorId}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        onClick={() => c.counselorId && !isNaN(c.counselorId) && handleViewDetails(c.counselorId)}
                                    >
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                            <div className="font-bold text-slate-800 text-sm sm:text-base">{c.name}</div>
                                            <div className="text-slate-500 mt-0.5 text-xs truncate max-w-[120px] sm:max-w-[200px]" title={c.email}>{c.email}</div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4">
                                            <div className="font-medium text-slate-700">{c.departments?.length > 0 ? c.departments.join(', ') : 'General'}</div>
                                            <div className="mt-1.5 w-fit px-2 py-0.5 text-[10px] font-bold rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                                                {c.counselorTypes?.join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className={`w-fit px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold tracking-widest uppercase border ${c.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {c.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-center">
                                            <div className="flex justify-center gap-6">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-slate-800">{c.totalLeads}</span>
                                                    <span className="text-[10px] text-slate-400">LEADS</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-slate-800">{c.priority}</span>
                                                    <span className="text-[10px] text-slate-400">PRIORITY</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form View */}
            <div
                className="flex items-start justify-center transition-all"
                style={{ display: showModal ? 'flex' : 'none' }}
            >
                <div className="bg-white rounded-[1.2rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-white/20 p-8 space-y-6">
                    <div className="text-center relative">
                        <img src="/raffles-logo.png" alt="Raffles" className="h-20 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold">{editingCounselor ? 'Modify Counselor' : 'Create Counselor'}</h3>
                        <button onClick={() => setShowModal(false)} className="absolute top-0 right-0 text-xl font-bold">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Full Name</label>
                                <input required className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase mb-2">Work Email</label>
                                <input required type="email" className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                             <div>
                                <label className="block text-xs font-black uppercase mb-2">Mobile</label>
                                <input required className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>

                            {!editingCounselor && (
                                <div>
                                    <label className="block text-xs font-black uppercase mb-2">Account Password</label>
                                    <input 
                                        required 
                                        type="password" 
                                        className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none font-medium" 
                                        placeholder="Enter secure password"
                                        value={formData.password} 
                                        onChange={e => setFormData({ ...formData, password: e.target.value })} 
                                    />
                                </div>
                            )}

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-black uppercase mb-3">Departments (Select Multiple)</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none font-bold text-gray-700 appearance-none cursor-pointer"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val && !formData.departments.includes(val)) {
                                                    setFormData({ ...formData, departments: [...formData.departments, val] });
                                                }
                                                e.target.value = ""; // Reset select
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Choose Departments...</option>
                                            {departments
                                                .filter(d => !formData.departments.includes(d.department))
                                                .map((dept) => (
                                                    <option key={dept.id} value={dept.department}>
                                                        {dept.department}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.departments.map((dept) => (
                                            <div key={dept} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold animate-in zoom-in duration-200">
                                                <span>{dept}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, departments: formData.departments.filter(d => d !== dept) })}
                                                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-amber-200 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {formData.departments.length === 0 && (
                                            <span className="text-xs text-gray-400 italic ml-1">No departments selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-black uppercase mb-3">Counselor Types (Select Multiple)</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none font-bold text-gray-700 appearance-none cursor-pointer"
                                            onChange={(e) => {
                                                const val = e.target.value as CounselorType;
                                                if (val && !formData.counselorTypes.includes(val)) {
                                                    setFormData({ ...formData, counselorTypes: [...formData.counselorTypes, val] });
                                                }
                                                e.target.value = ""; // Reset select
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Choose Types...</option>
                                            {(['INTERNAL', 'TELECALLER', 'EXTERNAL'] as CounselorType[])
                                                .filter(t => !formData.counselorTypes.includes(t))
                                                .map((type) => (
                                                    <option key={type} value={type}>
                                                        {type === 'INTERNAL' ? 'Internal Staff' : 
                                                         type === 'TELECALLER' ? 'Tele-Sales Expert' : 
                                                         'External Partner'}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.counselorTypes.map((type) => (
                                            <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-[#4d0101]/5 border border-[#4d0101]/20 text-[#4d0101] rounded-xl text-xs font-bold animate-in zoom-in duration-200">
                                                <span>{type}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, counselorTypes: formData.counselorTypes.filter(t => t !== type) })}
                                                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#4d0101]/10 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {formData.counselorTypes.length === 0 && (
                                            <span className="text-xs text-gray-400 italic ml-1">No types selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl border border-gray-100 font-bold">Dismiss</button>
                            <button type="submit" className="flex-1 py-4 rounded-2xl bg-[#4d0101] text-white font-black">Confirm</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Details Popup */}
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all"
                style={{ display: showDetailsPopup ? 'flex' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
                {selectedCounselorDetails && (
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative shadow-2xl space-y-4">
                        <button onClick={() => setShowDetailsPopup(false)} className="absolute top-4 right-4 text-gray-500 font-bold">✕</button>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-[#4d0101] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">{selectedCounselorDetails.name.charAt(0)}</div>
                            <div>
                                <h2 className="text-xl font-bold">{selectedCounselorDetails.name}</h2>
                                <p className="text-sm text-gray-500">{selectedCounselorDetails.departments?.join(', ') || 'General'}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Email: {selectedCounselorDetails.email}</p>
                            <p className="text-sm font-medium">Phone: {selectedCounselorDetails.phone}</p>
                            <p className="text-sm font-medium text-indigo-600 font-black">Status: {selectedCounselorDetails.status}</p>
                            <p className="text-sm font-medium text-rose-600 font-black">Priority: {selectedCounselorDetails.priority}</p>
                        </div>

                        <div className="pt-4 space-y-4">
                            {(role === 'ADMIN' || role === 'MANAGER') && (
                                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border">
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider">Administrative Controls</label>
                                    
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-bold uppercase text-gray-400">Assignment Status</label>
                                        <select
                                            onChange={(e) => updateStatus(selectedCounselorDetails.email, e.target.value as CounselorStatus)}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#dbb212] outline-none"
                                            value={selectedCounselorDetails.status}
                                        >
                                            <option value="AVAILABLE">AVAILABLE</option>
                                            <option value="BUSY">BUSY</option>
                                            <option value="ON_LEAVE">ON LEAVE</option>
                                            <option value="SUSPENDED">SUSPENDED</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-bold uppercase text-gray-400">Update Counselor Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(['INTERNAL', 'TELECALLER', 'EXTERNAL'] as CounselorType[]).map((type) => {
                                                const isSelected = selectedCounselorDetails.counselorTypes?.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={async () => {
                                                            const current = selectedCounselorDetails.counselorTypes || [];
                                                            const next = isSelected ? current.filter(t => t !== type) : [...current, type];
                                                            try {
                                                                await CounselorService.updateTypes(selectedCounselorDetails.email, next);
                                                                setSelectedCounselorDetails({ ...selectedCounselorDetails, counselorTypes: next });
                                                                toast.success('Counselor types updated');
                                                                loadCounselors();
                                                            } catch {
                                                                toast.error('Failed to update types');
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                                                            isSelected ? 'bg-[#4d0101] text-white border-[#4d0101]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#4d0101]'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-bold uppercase text-gray-400">Priority Overrides</label>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    CounselorService.updatePriority(selectedCounselorDetails.email, 'HIGH');
                                                    toast.success('Priority set to HIGH');
                                                    setShowDetailsPopup(false);
                                                    loadCounselors();
                                                }}
                                                className="flex-1 py-2 bg-rose-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-600 shadow-sm"
                                            >
                                                High
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    CounselorService.updatePriority(selectedCounselorDetails.email, 'LOW');
                                                    toast.success('Priority set to LOW');
                                                    setShowDetailsPopup(false);
                                                    loadCounselors();
                                                }}
                                                className="flex-1 py-2 bg-sky-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-sky-600 shadow-sm"
                                            >
                                                Low
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setShowDetailsPopup(false);
                                    handleEdit(selectedCounselorDetails);
                                }}
                                className="w-full py-3 bg-gray-100 font-bold rounded-xl"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
