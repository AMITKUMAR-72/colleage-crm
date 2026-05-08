'use client';

import React, { useState } from 'react';
import { X, User, Mail, Phone, BookOpen, Send, Loader2, MapPin, Calendar, Users, GraduationCap, FileText, Camera } from 'lucide-react';
import { StudentRegistrationRequest } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface StudentRegistrationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function StudentRegistrationDrawer({ isOpen, onClose, onSuccess }: StudentRegistrationDrawerProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<StudentRegistrationRequest>>({
        fullName: '',
        email: '',
        mobileNumber: '',
        dateOfBirth: '',
        gender: 'MALE',
        address: '',
        course: '',
        schoolCollegeName: '',
        fatherName: '',
        fatherOccupation: '',
        motherName: '',
        motherOccupation: '',
        tenthPercentage: 0,
        twelfthPercentage: 0
    });

    const [files, setFiles] = useState<{
        passportPhoto: File | null;
        tenthMarksheet: File | null;
        twelfthMarksheet: File | null;
    }>({
        passportPhoto: null,
        tenthMarksheet: null,
        twelfthMarksheet: null
    });

    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!files.passportPhoto || !files.tenthMarksheet || !files.twelfthMarksheet) {
            toast.error('All documents (Passport Photo, 10th & 12th Marksheets) are mandatory.');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Registering student...');
        try {
            const data = new FormData();
            
            // Create the JSON blob for the 'student' part
            const studentJson = {
                ...formData,
                createdByStaffId: String(user?.id || '')
            };
            
            data.append('student', new Blob([JSON.stringify(studentJson)], { type: 'application/json' }));
            data.append('passportPhoto', files.passportPhoto);
            data.append('tenthMarksheet', files.tenthMarksheet);
            data.append('twelfthMarksheet', files.twelfthMarksheet);

            await LeadService.registerStudent(data);
            toast.success('Student registered and assigned successfully!', { id: toastId });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to register student', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex">
                <div className="relative w-screen max-w-2xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Applicant Form</h2>
                            <p className="text-[10px] font-bold text-[#4d0101] uppercase tracking-widest mt-0.5">Student Registration & Assignment</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 no-scrollbar">
                        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                            
                            {/* ── Section 1: Personal Information ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1 bg-[#4d0101] rounded-full" />
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="text"
                                                name="fullName"
                                                required
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                                placeholder="Student's Legal Name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email *</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="tel"
                                                name="mobileNumber"
                                                required
                                                pattern="[0-9]{10}"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                                placeholder="10-digit mobile"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Date of Birth *</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                required
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gender</label>
                                        <div className="relative group">
                                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700 appearance-none"
                                            >
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Permanent Address *</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <textarea
                                                name="address"
                                                required
                                                rows={2}
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700 resize-none"
                                                placeholder="Complete Residential Address"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Section 2: Family Details ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1 bg-[#4d0101] rounded-full" />
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Family Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Father's Name *</label>
                                        <input
                                            type="text"
                                            name="fatherName"
                                            required
                                            value={formData.fatherName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            placeholder="Father's Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Father's Occupation *</label>
                                        <input
                                            type="text"
                                            name="fatherOccupation"
                                            required
                                            value={formData.fatherOccupation}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            placeholder="e.g. Business, Salaried"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mother's Name *</label>
                                        <input
                                            type="text"
                                            name="motherName"
                                            required
                                            value={formData.motherName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            placeholder="Mother's Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mother's Occupation *</label>
                                        <input
                                            type="text"
                                            name="motherOccupation"
                                            required
                                            value={formData.motherOccupation}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            placeholder="e.g. Housewife, Teacher"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ── Section 3: Academic Details ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1 bg-[#4d0101] rounded-full" />
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Academic Background</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Target Course *</label>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="text"
                                                name="course"
                                                required
                                                value={formData.course}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                                placeholder="e.g. B.Tech Computer Science"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">School/College Name *</label>
                                        <div className="relative group">
                                            <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="text"
                                                name="schoolCollegeName"
                                                required
                                                value={formData.schoolCollegeName}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                                placeholder="Last Attended Institution"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">10th Percentage *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="tenthPercentage"
                                            required
                                            min="0"
                                            max="100"
                                            value={formData.tenthPercentage}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            placeholder="e.g. 85.50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">12th Percentage *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="twelfthPercentage"
                                            required
                                            min="0"
                                            max="100"
                                            value={formData.twelfthPercentage}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4d0101]/10 focus:border-[#4d0101] transition font-bold text-sm text-slate-700"
                                            placeholder="e.g. 78.20"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ── Section 4: Document Uploads ── */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-1 bg-[#4d0101] rounded-full" />
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Document Uploads</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-5">
                                    
                                    {/* Passport Photo */}
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 transition hover:border-[#4d0101]/40">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-800">Passport Size Photo *</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">JPEG/PNG Only • Max 2MB</p>
                                            </div>
                                            <label className="relative cursor-pointer">
                                                <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition">
                                                    {files.passportPhoto ? 'Change File' : 'Select File'}
                                                </span>
                                                <input type="file" name="passportPhoto" className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        {files.passportPhoto && (
                                            <div className="mt-4 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-emerald-100">
                                                <FileText className="w-3.5 h-3.5" />
                                                Selected: {files.passportPhoto.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* 10th Marksheet */}
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 transition hover:border-[#4d0101]/40">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-800">10th Marksheet *</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">PDF/JPEG/PNG • Max 5MB</p>
                                            </div>
                                            <label className="relative cursor-pointer">
                                                <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition">
                                                    {files.tenthMarksheet ? 'Change File' : 'Select File'}
                                                </span>
                                                <input type="file" name="tenthMarksheet" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        {files.tenthMarksheet && (
                                            <div className="mt-4 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-emerald-100">
                                                <FileText className="w-3.5 h-3.5" />
                                                Selected: {files.tenthMarksheet.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* 12th Marksheet */}
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 transition hover:border-[#4d0101]/40">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-800">12th Marksheet *</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">PDF/JPEG/PNG • Max 5MB</p>
                                            </div>
                                            <label className="relative cursor-pointer">
                                                <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition">
                                                    {files.twelfthMarksheet ? 'Change File' : 'Select File'}
                                                </span>
                                                <input type="file" name="twelfthMarksheet" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        {files.twelfthMarksheet && (
                                            <div className="mt-4 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-emerald-100">
                                                <FileText className="w-3.5 h-3.5" />
                                                Selected: {files.twelfthMarksheet.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#4d0101] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#600202] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg shadow-[#4d0101]/20"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Registering Student...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Submit Registration</span>
                                    </>
                                )}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
