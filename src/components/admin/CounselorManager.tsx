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
    const [showModal, setShowModal] = useState(false);
    const [editingCounselor, setEditingCounselor] = useState<CounselorDTO | null>(null);
    const [selectedCounselorDetails, setSelectedCounselorDetails] = useState<CounselorDTO | null>(null);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        counselorType: 'INTERNAL' as CounselorType,
        status: 'AVAILABLE' as CounselorStatus,
        priority: 'MEDIUM' as Priority,
        totalLeads: 0
    });

    const handleViewDetails = async (id: number) => {
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
            setFormData({ name: '', email: '', password: '', phone: '', department: '', counselorType: 'INTERNAL', status: 'AVAILABLE', priority: 'MEDIUM', totalLeads: 0 });
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
            counselorType: counselor.counselorType,
            status: counselor.status,
            priority: counselor.priority,
            totalLeads: counselor.totalLeads || 0
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Main List View */}
            <div style={{ display: showModal ? 'none' : 'block' }} className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
                    {role === 'ADMIN' && (
                        <button
                            onClick={() => {
                                setEditingCounselor(null);
                                setFormData({ name: '', email: '', password: '', phone: '', department: '', counselorType: 'INTERNAL', status: 'AVAILABLE', priority: 'MEDIUM', totalLeads: 0 });
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
                        <img src="/raffles-logo.png" alt="Loading" className="h-12 w-20 object-contain animate-spin-y-ease-in" />                </div>
                ) : (
                    <div className="p-0 overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-bold">Counselor</th>
                                    <th className="hidden sm:table-cell px-6 py-4 font-bold">Department</th>
                                    <th className="px-4 sm:px-6 py-4 font-bold">Status</th>
                                    <th className="hidden md:table-cell px-6 py-4 font-bold text-center">Metrics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Array.isArray(counselors) && counselors.map((c) => (
                                    <tr
                                        key={c.counselorId}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors group relative"
                                        onClick={() => handleViewDetails(c.counselorId)}
                                    >
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#dbb212] transition-colors"></div>
                                            <div className="font-bold text-slate-800 text-sm sm:text-base">{c.name}</div>
                                            <div className="text-slate-500 mt-0.5 text-xs truncate max-w-[120px] sm:max-w-[200px]" title={c.email}>{c.email}</div>
                                            <div className="sm:hidden mt-2 flex flex-col gap-1">
                                                <div className="text-[10px] text-slate-400 font-bold">{c.department || 'General'} • {c.counselorType}</div>
                                                <div className="flex gap-4">
                                                    <div className="text-[10px] text-slate-400 font-medium">L: {c.totalLeads}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">P: {c.priority}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4">
                                            <div className="font-medium text-slate-700">{c.department || 'General'}</div>
                                            <div className={`mt-1.5 w-fit px-2 py-0.5 text-[10px] font-bold rounded-full border ${c.counselorType === 'INTERNAL' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                c.counselorType === 'TELECALLER' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-purple-50 text-purple-600 border-purple-100'
                                                }`}>
                                                {c.counselorType}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className={`w-fit px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold tracking-widest uppercase border ${c.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                c.status === 'SESSION_ASSIGNED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    c.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        c.status === 'BUSY' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            c.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
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

                        {counselors.length === 0 && (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <UserCircle2 className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="font-bold text-slate-700">No counselors available</h3>
                                <p className="text-slate-400 text-sm mt-1">Start by adding your first team member.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Form View (previously Modal) */}
            <div
                className="flex items-start justify-center transition-all font-poppins"
                style={{ display: showModal ? 'flex' : 'none', backgroundColor: 'transparent' }}
            >
                <div className="bg-white rounded-[1.2rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/20 text-black">
                    <div className="from-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative text-center">
                        <img src="/raffles-logo.png" alt="Raffles" className="h-16 sm:h-20 w-auto object-contain mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl text-black font-semibold tracking-tight font-poppins">
                            {editingCounselor ? 'Modify Counselor' : 'Create Counselor'}
                        </h3>
                        <p className="opacity-80 text-black font-medium text-xs sm:text-sm mt-1 max-w-md mx-auto">
                            {editingCounselor ? 'Update the professional profile of the team member.' : 'Fill in the professional details to create a new counselor account.'}
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 bg-black/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                            <div className="col-span-1">
                                <label htmlFor="counselorName" className="block text-[10px] sm:text-xs font-black text-black uppercase tracking-widest mb-1 sm:mb-2 ml-1 cursor-pointer">Full Name</label>
                                <div className="relative">
                                    <input
                                        id="counselorName"
                                        required
                                        className="w-full pl-4 pr-4 py-3 sm:py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter Full Name"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="counselorEmail" className="block text-xs font-black font-family-poppins text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="counselorEmail"
                                        required
                                        type="email"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Email@raffles.com"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="counselorPassword" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">
                                    {editingCounselor ? 'Verification ID' : 'PASSWORD FOR COUNSELOR '}
                                </label>
                                <input
                                    id="counselorPassword"
                                    required={!editingCounselor}
                                    type="password"
                                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingCounselor ? "Leave blank to keep current" : "········"}
                                />
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="counselorPhone" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Mobile Line</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="counselorPhone"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="counselorDepartment" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Department</label>
                                <select
                                    id="counselorDepartment"
                                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 appearance-none"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
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
                                <label htmlFor="counselorType" className="block text-xs font-black text-black uppercase tracking-widest mb-2 ml-1 cursor-pointer">Professional Tier</label>
                                <select
                                    id="counselorType"
                                    className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#dbb212] outline-none transition-all font-bold text-gray-900 appearance-none"
                                    value={formData.counselorType}
                                    onChange={e => setFormData({ ...formData, counselorType: e.target.value as CounselorType })}
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
                                className="flex-1 py-4 rounded-2xl bg-[#4d0101] from-indigo-600 to-purple-600 text-white font-black shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {editingCounselor ? 'Update Account' : 'Confirm Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Details Popup */}
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all"
                style={{ display: showDetailsPopup ? 'flex' : 'none', backgroundColor: 'rgba(17, 24, 39, 0.6)' }}
            >
                {selectedCounselorDetails && (
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowDetailsPopup(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-4 mb-6 mt-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                {selectedCounselorDetails.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedCounselorDetails.name}</h2>
                                <p className="text-sm font-medium text-gray-500">{selectedCounselorDetails.department || 'General Department'}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">Contact Information</label>
                                <div className="text-sm font-medium text-gray-700 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        {selectedCounselorDetails.email}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Phone className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        {selectedCounselorDetails.phone}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Status</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedCounselorDetails.status.replace('_', ' ')}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Type</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedCounselorDetails.counselorType}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Priority</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedCounselorDetails.priority || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Total Leads</label>
                                    <div className="text-sm font-bold text-gray-900">{selectedCounselorDetails.totalLeads || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowDetailsPopup(false);
                                    handleEdit(selectedCounselorDetails);
                                }}
                                className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Full Profile
                            </button>

                            {(role === 'ADMIN' || role === 'MANAGER') && (
                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                    <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">Admin Actions</label>
                                    <div className="relative group/status">
                                        <select
                                            onChange={(e) => {
                                                updateStatus(selectedCounselorDetails.email, e.target.value as CounselorStatus);
                                                setSelectedCounselorDetails({
                                                    ...selectedCounselorDetails,
                                                    status: e.target.value as CounselorStatus
                                                });
                                            }}
                                            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#dbb212] outline-none transition-all cursor-pointer appearance-none"
                                            value={selectedCounselorDetails.status}
                                        >
                                            <option value="AVAILABLE">Status: AVAILABLE</option>
                                            <option value="BUSY">Status: BUSY</option>
                                            <option value="SESSION_ASSIGNED">Status: SESSION ASSIGNED</option>
                                            <option value="ON_LEAVE">Status: ON LEAVE</option>
                                            <option value="UNAVAILABLE">Status: UNAVAILABLE</option>
                                            <option value="SUSPENDED">Status: SUSPENDED</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
