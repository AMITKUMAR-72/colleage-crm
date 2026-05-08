'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, BookOpen, Send, Loader2, MapPin, Calendar, Users, GraduationCap, FileText, Camera, ArrowLeft } from 'lucide-react';
import { StudentRegistrationRequest } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function StudentRegistrationPage() {
    const { user } = useAuth();
    const router = useRouter();
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
            
            const studentJson = {
                ...formData,
                createdByStaffId: String(user?.id || '')
            };
            
            data.append('student', new Blob([JSON.stringify(studentJson)], { type: 'application/json' }));
            data.append('passportPhoto', files.passportPhoto);
            data.append('tenthMarksheet', files.tenthMarksheet);
            data.append('twelfthMarksheet', files.twelfthMarksheet);

            await LeadService.registerStudent(data);
            toast.success('Student registered successfully!', { id: toastId });
            router.back();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to register student', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50 pb-20 -mt-12 md:mt-0">
                {/* Header Area */}
                <div className="bg-[#600202] text-white pt-10 pb-20 px-6 rounded-b-[40px] shadow-2xl">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <button 
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4 group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                            </button>
                            <h1 className="text-3xl font-black tracking-tight">Applicant Form</h1>
                            <p className="text-sm font-bold text-[#dbb212] uppercase tracking-[0.2em] mt-1 opacity-90">Raffles Student Registration</p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="max-w-4xl mx-auto -mt-12 px-6">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
                            
                            {/* Section 1: Personal Information */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1.5 bg-[#dbb212] rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <input
                                                type="text"
                                                name="fullName"
                                                required
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                                placeholder="Student's full legal name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address *</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                                placeholder="primary@email.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mobile Number *</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <input
                                                type="tel"
                                                name="mobileNumber"
                                                required
                                                pattern="[0-9]{10}"
                                                value={formData.mobileNumber}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                                placeholder="10-digit mobile"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of Birth *</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                required
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gender</label>
                                        <div className="relative group">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Permanent Address *</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <textarea
                                                name="address"
                                                required
                                                rows={3}
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700 resize-none"
                                                placeholder="Complete street, city, state and zip"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Family Details */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1.5 bg-[#dbb212] rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Family Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Father's Name *</label>
                                        <input
                                            type="text"
                                            name="fatherName"
                                            required
                                            value={formData.fatherName}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Father's Occupation *</label>
                                        <input
                                            type="text"
                                            name="fatherOccupation"
                                            required
                                            value={formData.fatherOccupation}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            placeholder="Business, Service, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mother's Name *</label>
                                        <input
                                            type="text"
                                            name="motherName"
                                            required
                                            value={formData.motherName}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mother's Occupation *</label>
                                        <input
                                            type="text"
                                            name="motherOccupation"
                                            required
                                            value={formData.motherOccupation}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            placeholder="Housewife, Professional, etc."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Academic Background */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1.5 bg-[#dbb212] rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Academic Background</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Applied Course *</label>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <input
                                                type="text"
                                                name="course"
                                                required
                                                value={formData.course}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                                placeholder="e.g. MBA, B.Tech"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last School/College Attended *</label>
                                        <div className="relative group">
                                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#600202] transition-colors" />
                                            <input
                                                type="text"
                                                name="schoolCollegeName"
                                                required
                                                value={formData.schoolCollegeName}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                                placeholder="Institution Name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">10th Score (%) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="tenthPercentage"
                                            required
                                            min="0"
                                            max="100"
                                            value={formData.tenthPercentage}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            placeholder="Percentage/CGPA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">12th Score (%) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="twelfthPercentage"
                                            required
                                            min="0"
                                            max="100"
                                            value={formData.twelfthPercentage}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#600202]/5 focus:border-[#600202] focus:bg-white transition-all font-bold text-sm text-slate-700"
                                            placeholder="Percentage/CGPA"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 4: Document Uploads */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-1.5 bg-[#dbb212] rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Document Uploads</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                    {/* Photo */}
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:border-[#600202]/40 transition-all group">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Passport Photo</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mb-4">JPEG/PNG Only</p>
                                        <label className="cursor-pointer">
                                            <span className="block px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-sm">
                                                {files.passportPhoto ? 'Change' : 'Upload'}
                                            </span>
                                            <input type="file" name="passportPhoto" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        {files.passportPhoto && (
                                            <p className="mt-3 text-[9px] font-bold text-emerald-600 truncate px-2">{files.passportPhoto.name}</p>
                                        )}
                                    </div>

                                    {/* 10th */}
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:border-[#600202]/40 transition-all group">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">10th Marksheet</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mb-4">PDF/JPEG/PNG</p>
                                        <label className="cursor-pointer">
                                            <span className="block px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-sm">
                                                {files.tenthMarksheet ? 'Change' : 'Upload'}
                                            </span>
                                            <input type="file" name="tenthMarksheet" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                        </label>
                                        {files.tenthMarksheet && (
                                            <p className="mt-3 text-[9px] font-bold text-emerald-600 truncate px-2">{files.tenthMarksheet.name}</p>
                                        )}
                                    </div>

                                    {/* 12th */}
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:border-[#600202]/40 transition-all group">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-rose-600" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">12th Marksheet</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mb-4">PDF/JPEG/PNG</p>
                                        <label className="cursor-pointer">
                                            <span className="block px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-sm">
                                                {files.twelfthMarksheet ? 'Change' : 'Upload'}
                                            </span>
                                            <input type="file" name="twelfthMarksheet" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                        </label>
                                        {files.twelfthMarksheet && (
                                            <p className="mt-3 text-[9px] font-bold text-emerald-600 truncate px-2">{files.twelfthMarksheet.name}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#600202] text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-[#4d0101] transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-70 shadow-2xl shadow-[#600202]/30"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Processing Registration...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-6 h-6" />
                                            <span>Submit Applicant Record</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                                    All fields marked with * are mandatory. Data is processed securely.
                                </p>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
