'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, User, Mail, Phone, BookOpen, Building2, Globe, Send, Loader2, ChevronDown } from 'lucide-react';
import { LeadRequestDTO, LeadResponseDTO, DepartmentDTO, CourseDTO, LeadStatus, LeadScore, CampaignDTO } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { DepartmentService } from '@/services/departmentService';
import { CourseService } from '@/services/courseService';
import { CampaignService } from '@/services/campaignService';
import toast from 'react-hot-toast';

interface ManualLeadEntryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newLead: LeadResponseDTO) => void;
}

const INTAKE_YEARS = ['2025', '2026', '2027'];
const FIXED_SOURCES = ['Walk In', 'Instagram', 'Facebook', 'Google Ads', 'Website', 'WhatsApp', 'LinkedIn', 'Snapchat', 'Referral'];

export default function ManualLeadEntryDrawer({ isOpen, onClose, onSuccess }: ManualLeadEntryDrawerProps) {
    const [formData, setFormData] = useState<LeadRequestDTO>({
        name: '',
        email: '',
        phone: '',
        altPhone: '',
        whatsappNumber: '',
        address: '', 
        city: '',
        course: '',
        intake: '2026',
        status: 'NEW',
        score: 'WARM'
    });

    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [sources, setSources] = useState<CampaignDTO[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingMeta, setLoadingMeta] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingMeta(true);
            try {
                const [deptData, courseData, sourceData] = await Promise.allSettled([
                    DepartmentService.getAllDepartments(),
                    CourseService.getAllCoursesRaw(),
                    CampaignService.getAllSources()
                ]);

                setDepartments(deptData.status === 'fulfilled' && Array.isArray(deptData.value) ? deptData.value : []);
                setCourses(courseData.status === 'fulfilled' && Array.isArray(courseData.value) ? courseData.value : []);

                const rawSources = sourceData.status === 'fulfilled' ? sourceData.value : [];
                const dbSources = Array.isArray(rawSources) ? rawSources : (rawSources as any)?.data || [];
                const sourceMap = new Map<string, CampaignDTO>();

                dbSources.forEach((s: CampaignDTO) => {
                    const normalized = s.name.toLowerCase().replace(/[\s_]/g, '');
                    sourceMap.set(normalized, s);
                });

                FIXED_SOURCES.forEach(name => {
                    const normalized = name.toLowerCase().replace(/[\s_]/g, '');
                    if (!sourceMap.has(normalized)) sourceMap.set(normalized, { id: -1, name });
                });

                setSources(Array.from(sourceMap.values()));
            } catch (error) {
                console.error("[ManualEntry] Metadata Load Failure", error);
            } finally {
                setLoadingMeta(false);
            }
        };
        if (isOpen) loadInitialData();
    }, [isOpen]);

    const filteredCourses = useMemo(() => {
        if (!selectedDepartment) return courses;
        const selectedDeptObj = departments.find(d =>
            (d.department || '').toLowerCase().trim() === selectedDepartment.toLowerCase().trim()
        );
        return selectedDeptObj?.courses && selectedDeptObj.courses.length > 0 
            ? selectedDeptObj.courses 
            : courses.filter(c => (c.department || '').toLowerCase().trim() === selectedDepartment.toLowerCase().trim());
    }, [courses, selectedDepartment, departments]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sourceId = e.target.value;
        setSelectedSourceId(sourceId);
        const source = sources.find(s => s.id.toString() === sourceId);
        if (source) {
            setFormData(prev => ({
                ...prev,
                campaign: source.id > 0 ? { id: source.id, name: source.name } : { id: 0, name: source.name } as any
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.phone || !formData.course || !formData.city) {
            toast.error('All required fields must be completed.');
            return;
        }

        const payload: LeadRequestDTO = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            altPhone: formData.altPhone || undefined,
            whatsappNumber: formData.whatsappNumber || undefined,
            address: formData.address || 'Manual Entry',
            city: formData.city || undefined,
            course: formData.course,
            intake: formData.intake,
            status: formData.status as LeadStatus,
            score: formData.score as LeadScore,
            origin: formData.campaign?.name || 'Manual Registration',
            phones: [formData.phone, formData.altPhone, formData.whatsappNumber].filter(Boolean) as string[]
        };

        if (formData.campaign && formData.campaign.id > 0) {
            payload.campaign = { id: formData.campaign.id, name: formData.campaign.name };
        }

        setSubmitting(true);
        const toastId = toast.loading('Creating lead record...');
        try {
            const normalizedSource = (payload.origin || '').toLowerCase();
            let newLead;
            
            if (normalizedSource === 'facebook') newLead = await LeadService.integrateFacebook(payload);
            else if (normalizedSource === 'instagram') newLead = await LeadService.integrateInstagram(payload);
            else if (normalizedSource === 'google ads' || normalizedSource === 'googleads') newLead = await LeadService.integrateGoogleForm(payload);
            else if (normalizedSource === 'website') newLead = await LeadService.integrateWebsite(payload);
            else if (normalizedSource === 'affiliate partner') newLead = await LeadService.integrateAffiliatePartner(payload);
            else newLead = await LeadService.createLead(payload);

            toast.success('Lead created successfully', { id: toastId });

            setFormData({
                name: '', email: '', phone: '', altPhone: '', whatsappNumber: '',
                address: '', city: '', course: '', intake: '2026', status: 'NEW', score: 'WARM'
            });
            setSelectedDepartment('');
            setSelectedSourceId('');
            if (onSuccess) onSuccess(newLead);
            setTimeout(() => onClose(), 800);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to create lead', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden font-primary">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-xl w-full flex">
                <div className="relative w-screen max-w-xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                    <div className="px-8 py-10 bg-slate-900 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Create Manual Lead</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Induction</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter full name" className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition font-semibold text-slate-800 placeholder:text-slate-300" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition font-semibold text-slate-800 placeholder:text-slate-300" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Primary phone" className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition font-semibold text-slate-800 placeholder:text-slate-300" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
                                            <input type="tel" name="whatsappNumber" value={formData.whatsappNumber || ''} onChange={handleInputChange} placeholder="Optional WhatsApp" className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition font-semibold text-slate-800 placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">City</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
                                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter city name" className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition font-semibold text-slate-800 placeholder:text-slate-300" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selection Source</label>
                                        <div className="relative group">
                                            < बिल्डिंग2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select value={selectedSourceId} onChange={handleSourceChange} className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold text-[11px] uppercase text-slate-700 appearance-none cursor-pointer">
                                                <option value="">SELECT SOURCE</option>
                                                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Intake Year</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select name="intake" value={formData.intake} onChange={handleInputChange} className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold text-[11px] uppercase text-slate-700 appearance-none cursor-pointer">
                                                {INTAKE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select value={selectedDepartment} onChange={(e) => { setSelectedDepartment(e.target.value); setFormData(p => ({ ...p, course: '' })); }} className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold text-[11px] uppercase text-slate-700 appearance-none cursor-pointer">
                                                <option value="">SELECT DEPARTMENT</option>
                                                {departments.map(d => <option key={d.id} value={d.department}>{d.department}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Course Target</label>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select name="course" value={typeof formData.course === 'string' ? formData.course : (formData.course as any)?.course || ''} onChange={handleInputChange} className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold text-[11px] uppercase text-slate-700 appearance-none cursor-pointer">
                                                <option value="">SELECT COURSE</option>
                                                {filteredCourses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3">
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {submitting ? 'Creating...' : 'Create Lead'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
