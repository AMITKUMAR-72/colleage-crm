'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, User, Mail, Phone, BookOpen, Building2, Calendar, Globe, Save, Loader2, ChevronDown } from 'lucide-react';
import { LeadRequestDTO, LeadResponseDTO, DepartmentDTO, CourseDTO, LeadStatus, LeadScore, CampaignDTO } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { DepartmentService } from '@/services/departmentService';
import { CourseService } from '@/services/courseService';
import { CampaignService } from '@/services/campaignService';
import toast from 'react-hot-toast';

interface LeadEditDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    lead: LeadResponseDTO | null;
    onSuccess?: (updatedLead: LeadResponseDTO) => void;
}

const INTAKE_YEARS = ['2025', '2026', '2027'];

export default function LeadEditDrawer({ isOpen, onClose, lead, onSuccess }: LeadEditDrawerProps) {
    const [formData, setFormData] = useState<Partial<LeadRequestDTO>>({});
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [sources, setSources] = useState<CampaignDTO[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingMeta, setLoadingMeta] = useState(false);

    useEffect(() => {
        if (lead) {
            setFormData({
                name: lead.name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                address: lead.address || '',
                course: typeof lead.course === 'object' ? (lead.course as any)?.course : lead.course || '',
                intake: lead.intake || '',
                status: lead.status as LeadStatus,
                score: lead.score as LeadScore,
                campaign: lead.campaign as any
            });

            if (typeof lead.course === 'object' && (lead.course as any).department) {
                setSelectedDepartment((lead.course as any).department);
            }
            if (lead.campaign && (lead.campaign as any).id) {
                setSelectedSourceId((lead.campaign as any).id.toString());
            }
        }
    }, [lead]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingMeta(true);
            try {
                const [deptData, courseData, sourceData] = await Promise.allSettled([
                    DepartmentService.getAllDepartments(),
                    CourseService.getAllCourses(),
                    CampaignService.getAllSources()
                ]);

                setDepartments(deptData.status === 'fulfilled' && Array.isArray(deptData.value) ? deptData.value : []);
                setCourses(courseData.status === 'fulfilled' && Array.isArray(courseData.value) ? courseData.value : []);
                
                const rawSources = sourceData.status === 'fulfilled' ? sourceData.value : [];
                setSources(Array.isArray(rawSources) ? rawSources : (rawSources as any)?.data || []);
            } catch (error) {
                console.error("[LeadEdit] Failed to load form metadata", error);
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
        if (selectedDeptObj && Array.isArray(selectedDeptObj.courses) && selectedDeptObj.courses.length > 0) {
            return selectedDeptObj.courses;
        }
        return courses.filter(c => (c.department || '').toLowerCase().trim() === selectedDepartment.toLowerCase().trim());
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
                campaign: { id: source.id, name: source.name } as any
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lead) return;

        setSubmitting(true);
        const toastId = toast.loading('Updating lead...');
        try {
            const updated = await LeadService.updateLead(lead.email, formData);
            toast.success('Lead updated successfully!', { id: toastId });
            if (onSuccess) onSuccess(updated);
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update lead', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-xl w-full flex">
                <div className="relative w-screen max-w-xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="px-8 py-8 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Modify Identity</h2>
                            <p className="text-[10px] font-bold text-[#dbb212] uppercase tracking-[0.3em] mt-2 italic">Update Lead ID #{lead.id}</p>
                        </div>
                        <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/10 hover:bg-rose-500 flex items-center justify-center transition-all active:scale-95 group relative z-10 border border-white/10 shadow-inner">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Full Identity</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-bold text-slate-800"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email & Phone Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Electronic Point</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email || ''}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-bold text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Mobile Tether</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone || ''}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-bold text-slate-800"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Academic Branch</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select
                                                value={selectedDepartment}
                                                onChange={(e) => {
                                                    setSelectedDepartment(e.target.value);
                                                    setFormData(prev => ({ ...prev, course: '' }));
                                                }}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">SELECT BRANCH</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.department}>{dept.department}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Course Program</label>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select
                                                name="course"
                                                value={typeof formData.course === 'string' ? formData.course : (formData.course as any)?.course || ''}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">SELECT COURSE</option>
                                                {filteredCourses.map(course => (
                                                    <option key={course.id} value={course.course}>{course.course}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Lead Source</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select
                                                value={selectedSourceId}
                                                onChange={handleSourceChange}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">SELECT SOURCE</option>
                                                {sources.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Intake Year</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select
                                                name="intake"
                                                value={formData.intake || ''}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">SELECT INTAKE</option>
                                                {INTAKE_YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-slate-800 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-70 disabled:pointer-events-none"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-5 h-5 text-[#dbb212]" />}
                                {submitting ? 'Updating...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
