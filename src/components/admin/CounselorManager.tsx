'use client';

import { useState, useEffect } from 'react';
import { CounselorService } from '@/services/counselorService';
import { DepartmentService } from '@/services/departmentService';
import { CounselorDTO, CounselorStatus, CounselorType, DepartmentDTO } from '@/types/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { UserPlus, Mail, Phone, Building2, UserCircle2, ShieldCheck, ShieldAlert, Edit2, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CounselorManager() {
    const { role } = useAuth();
    const [counselors, setCounselors] = useState<CounselorDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCounselor, setEditingCounselor] = useState<CounselorDTO | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        counselorType: 'INTERNAL' as CounselorType
    });

    useEffect(() => {
        loadCounselors();
        loadDepartments();
    }, []);

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
            const data = await CounselorService.getAllCounselors();
            setCounselors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load counselors', error);
            toast.error('Failed to load counselors');
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
                phone: formData.phone.replace(/\D/g, '') // Remove all non-digits
            };

            // If it's a 12 digit number starting with 91, strip the 91
            if (sanitizedData.phone.length === 12 && sanitizedData.phone.startsWith('91')) {
                sanitizedData.phone = sanitizedData.phone.substring(2);
            }

            if (editingCounselor) {
                await CounselorService.updateProfile(editingCounselor.email, sanitizedData);
                toast.success('Counselor profile updated');
            } else {
                await CounselorService.createCounselor(sanitizedData);
                toast.success('Counselor account created successfully');
            }
            setShowModal(false);
            setEditingCounselor(null);
            setFormData({ name: '', email: '', password: '', phone: '', department: '', counselorType: 'INTERNAL' });
            loadCounselors();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            if (err.response?.status === 403) {
                toast.error('Permission Denied: Only Administrators can create counselors. Please ensure you are logged in as an Admin.');
            } else {
                toast.error(err.response?.data?.message || 'Failed to create counselor');
            }
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
            password: '', // Password not editable here for simplicity/security
            phone: counselor.phone,
            department: counselor.department || '',
            counselorType: counselor.counselorType
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Counselor Network</h2>
                    <p className="text-gray-500 mt-1 font-medium">Manage your internal and partner counseling staff.</p>
                </div>
                {role === 'ADMIN' && (
                    <button
                        onClick={() => {
                            setEditingCounselor(null);
                            setFormData({ name: '', email: '', password: '', phone: '', department: '', counselorType: 'INTERNAL' });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-[#4d0101] text-white px-6 py-3 rounded-2xl hover:bg-[#4d0101] hover:scale-[1.02] active:scale-[0.98] transition-all font-bold shadow-lg shadow-indigo-600/20"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add Counselor
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-indigo-500">
                    <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
                                    <th className="px-8 py-5">General Information</th>
                                    <th className="px-6 py-5">Classification</th>
                                    <th className="px-6 py-5">Availability</th>
                                    <th className="px-6 py-5 text-center">Workload</th>
                                    <th className="px-8 py-5 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {Array.isArray(counselors) && counselors.map((c) => (
                                    <tr key={c.counselorId} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.name}</div>
                                                    <div className="flex flex-col text-[11px] text-gray-500 font-medium mt-0.5">
                                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 opacity-40" /> {c.email}</span>
                                                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-indigo-600 transition-all hover:underline decoration-indigo-600/30">
                                                            <Phone className="w-3 h-3 opacity-40" /> 
                                                            {c.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                                    {c.department || 'General'}
                                                </span>
                                                <span className={`w-fit px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-full border ${
                                                    c.counselorType === 'INTERNAL' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    c.counselorType === 'TELECALLER' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-purple-50 text-purple-600 border-purple-100'
                                                }`}>
                                                    {c.counselorType}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-bold">
                                            <div className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${
                                                c.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                c.status === 'SESSION_ASSIGNED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                c.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                c.status === 'BUSY' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                c.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                            }`}>
                                                {c.status === 'AVAILABLE' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                                {c.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-gray-900 leading-none">{c.totalLeads}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-1">Leads</span>
                                            </div>
                                        </td>
                                         <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`tel:${c.phone}`}
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-emerald-600/20"
                                                    title="Call Counselor"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleEdit(c)}
                                                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Edit Profile"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {(role === 'ADMIN' || role === 'MANAGER') && (
                                                    <div className="relative group/status">
                                                        <select
                                                            onChange={(e) => updateStatus(c.email, e.target.value as CounselorStatus)}
                                                            className="p-2 py-2 bg-gray-50 border-none rounded-xl text-[10px] font-black tracking-tight uppercase focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 appearance-none pr-8 pl-3 min-w-[120px]"
                                                            value={c.status}
                                                        >
                                                            <option value="AVAILABLE">AVAILABLE</option>
                                                            <option value="BUSY">BUSY</option>
                                                            <option value="SESSION_ASSIGNED">SESS. ASSIGNED</option>
                                                            <option value="ON_LEAVE">ON LEAVE</option>
                                                            <option value="UNAVAILABLE">UNAVAILABLE</option>
                                                            <option value="SUSPENDED">SUSPENDED</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                            <ChevronDown className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {counselors.length === 0 && (
                            <div className="p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <UserCircle2 className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No counselors onboarded yet</h3>
                                <p className="text-gray-500 mt-2 max-w-sm mx-auto">Start by adding your first team member to beginning assigning leads.</p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-6 text-indigo-600 font-bold hover:underline"
                                >
                                    Add Counselor Now →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/20">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
                            <h3 className="text-2xl font-black italic tracking-tight">
                                {editingCounselor ? 'Modify Counselor' : 'Onboard New Talent'}
                            </h3>
                            <p className="opacity-80 font-medium text-sm mt-1">
                                {editingCounselor ? 'Update the professional profile of the team member.' : 'Fill in the professional details to create a new counselor account.'}
                            </p>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="absolute top-8 right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                    <div className="relative">
                                        <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            required
                                            type="email"
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            placeholder="john@raffles.com"
                                        />
                                    </div>
                                </div>
                                 <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        {editingCounselor ? 'Verification ID' : 'Security Key Entry'}
                                    </label>
                                    <input
                                        required={!editingCounselor}
                                        type="password"
                                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        placeholder={editingCounselor ? "Leave blank to keep current" : "········"}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mobile Line</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            placeholder="+91 00000 00000"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                                    <select
                                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 appearance-none"
                                        value={formData.department}
                                        onChange={e => setFormData({...formData, department: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Dept</option>
                                        {Array.isArray(departments) && departments.map((dept) => (
                                            <option key={dept.id} value={dept.department}>
                                                {dept.department}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Professional Tier</label>
                                    <select
                                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 appearance-none"
                                        value={formData.counselorType}
                                        onChange={e => setFormData({...formData, counselorType: e.target.value as CounselorType})}
                                    >
                                        <option value="INTERNAL">Internal Staff</option>
                                        <option value="TELECALLER">Tele-Sales Expert</option>
                                        <option value="EXTERNAL">External Partner</option>
                                    </select>
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
                                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editingCounselor ? 'Update Account' : 'Confirm Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
