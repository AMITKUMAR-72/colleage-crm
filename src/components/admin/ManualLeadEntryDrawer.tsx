'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, User, Mail, Phone, BookOpen, Building2, Calendar, Globe, Send, CheckCircle, Clock, Trash2, Loader2, ChevronDown } from 'lucide-react';
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
const FIXED_SOURCES = ['Walk In', 'Instagram', 'Facebook', 'Google Ads'];

export default function ManualLeadEntryDrawer({ isOpen, onClose, onSuccess }: ManualLeadEntryDrawerProps) {
    const [formData, setFormData] = useState<LeadRequestDTO>({
        name: '',
        email: '',
        phone: '',
        address: '', // Mocked or optional
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
    const [recentLeads, setRecentLeads] = useState<LeadResponseDTO[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingMeta(true);
            try {
                const [deptData, courseData, sourceData] = await Promise.allSettled([
                    DepartmentService.getAllDepartments(),
                    CourseService.getAllCourses(),
                    CampaignService.getAllSources()
                ]);

                // Departments
                const depts = deptData.status === 'fulfilled' && Array.isArray(deptData.value) ? deptData.value : [];
                setDepartments(depts);
                if (depts.length === 0) console.warn('[ManualEntry] No departments loaded');

                // Courses
                const crs = courseData.status === 'fulfilled' && Array.isArray(courseData.value) ? courseData.value : [];
                setCourses(crs);
                if (crs.length === 0) console.warn('[ManualEntry] No courses loaded');

                // Sources
                const rawSources = sourceData.status === 'fulfilled' ? sourceData.value : [];
                const dbSources = Array.isArray(rawSources) ? rawSources : (rawSources as any)?.data || [];
                const sourceMap = new Map<string, CampaignDTO>();

                dbSources.forEach((s: CampaignDTO) => {
                    const normalized = s.name.toLowerCase().replace(/[\s_]/g, '');
                    sourceMap.set(normalized, s);
                });

                FIXED_SOURCES.forEach(name => {
                    const normalized = name.toLowerCase().replace(/[\s_]/g, '');
                    if (!sourceMap.has(normalized)) {
                        sourceMap.set(normalized, { id: -1, name });
                    }
                });

                setSources(Array.from(sourceMap.values()));
            } catch (error) {
                console.error("[ManualEntry] Failed to load form metadata", error);
            } finally {
                setLoadingMeta(false);
            }
        };
        if (isOpen) loadInitialData();
    }, [isOpen]);

    const filteredCourses = useMemo(() => {
        if (!selectedDepartment) return courses;

        // 1. First, check if the selected department object itself contains a nested 'courses' array
        const selectedDeptObj = departments.find(d =>
            (d.department || '').toLowerCase().trim() === selectedDepartment.toLowerCase().trim()
        );

        if (selectedDeptObj && Array.isArray(selectedDeptObj.courses) && selectedDeptObj.courses.length > 0) {
            return selectedDeptObj.courses;
        }

        // 2. Otherwise, fallback to the global courses list
        return courses.filter(c => {
            const dept = (c.department || '').toLowerCase().trim();
            // If the backend serialization tripped and we got courses via the /name fallback endpoint, 
            // the department string might be empty. In that case, we show them rather than locking the user out.
            return dept === '' || dept === selectedDepartment.toLowerCase().trim();
        });
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
            // Note: if id is -1, backend might need to handle creation or we just send the name
            setFormData(prev => ({
                ...prev,
                campaign: source.id > 0 ? { id: source.id, name: source.name } : { id: 0, name: source.name } as any
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error('Name, Email, and Contact are required.');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Creating lead...');
        try {
            let newLead;
            const sourceName = formData.campaign?.name || '';

            // Route to specific integration endpoints based on source
            const normalizedSource = sourceName.toLowerCase();
            if (normalizedSource === 'facebook') {
                newLead = await LeadService.integrateFacebook(formData);
            } else if (normalizedSource === 'instagram') {
                newLead = await LeadService.integrateInstagram(formData);
            } else if (normalizedSource === 'google ads') {
                // Use the Google Form integration for Google Ads as requested
                newLead = await LeadService.integrateGoogleForm(formData);
            } else {
                // Standard manual creation for Walk In and others
                newLead = await LeadService.createLead(formData);
            }

            toast.success('Lead created and stored successfully!', { id: toastId });

            // Add to recent leads list at top
            setRecentLeads(prev => [newLead, ...prev].slice(0, 5));

            // Reset form partly but keep some defaults
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                course: '',
                intake: '2026',
                status: 'NEW',
                score: 'WARM'
            });
            setSelectedDepartment('');
            setSelectedSourceId('');

            if (onSuccess) onSuccess(newLead);

            // Close drawer after short delay for UX
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to create lead', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="absolute inset-y-0 right-0 max-w-xl w-full flex">
                <div className="relative w-screen max-w-xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="px-8 py-8 bg-gradient-to-r from-[#4d0101] to-[#600202] flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Induction Node</h2>
                            <p className="text-[10px] font-bold text-[#dbb212] uppercase tracking-[0.3em] mt-2 italic">Manual Identity Registration</p>
                        </div>
                        <button onClick={onClose} className="w-11 h-11 rounded-xl bg-white/10 hover:bg-[#dbb212] flex items-center justify-center transition-all active:scale-95 group relative z-10 border border-white/10 shadow-inner">
                            <X className="w-5 h-5 text-white group-hover:text-[#4d0101]" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30">
                        <form id="manual-lead-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Full Identity</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Alexander Raffles"
                                            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-bold text-slate-800 placeholder:text-slate-300"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email & Phone Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Electronic Point</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="contact@identity.com"
                                                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-bold text-slate-800 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Mobile Tether</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+60 XXX XXX XXXX"
                                                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-bold text-slate-800 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dept & Course Dropdown Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Academic Branch</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                            <select
                                                value={selectedDepartment}
                                                onChange={(e) => {
                                                    setSelectedDepartment(e.target.value);
                                                    setFormData(prev => ({ ...prev, course: '' }));
                                                }}
                                                disabled={loadingMeta}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="">{loadingMeta ? 'LOADING BRANCHES...' : departments.length === 0 ? 'NO BRANCHES AVAILABLE' : 'SELECT BRANCH'}</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.department}>{dept.department}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Curriculum Node</label>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                            {loadingMeta || filteredCourses.length > 0 ? (
                                                <>
                                                    <select
                                                        name="course"
                                                        value={typeof formData.course === 'string' ? formData.course : (formData.course as any)?.course || ''}
                                                        onChange={handleInputChange}
                                                        disabled={loadingMeta}
                                                        className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="">{loadingMeta ? 'LOADING COURSES...' : 'SELECT COURSE'}</option>
                                                        {filteredCourses.map(course => (
                                                            <option key={course.id} value={course.course}>{course.course}{course.department ? ` (${course.department})` : ''}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="course"
                                                    value={typeof formData.course === 'string' ? formData.course : (formData.course as any)?.course || ''}
                                                    onChange={handleInputChange}
                                                    disabled={loadingMeta}
                                                    placeholder="e.g. BTECH COMPUTER SCIENCE"
                                                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-bold text-slate-800 placeholder:text-slate-300"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Source & Intake dropdown row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Origin Source</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                            <select
                                                value={selectedSourceId}
                                                onChange={handleSourceChange}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">SELECT ORIGIN</option>
                                                {sources.map(s => (
                                                    <option key={`${s.id}-${s.name}`} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 italic">Intake Chronology</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#600202] transition" />
                                            <select
                                                name="intake"
                                                value={formData.intake}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:outline-none focus:ring-4 focus:ring-[#4d0101]/5 focus:border-[#4d0101] transition font-black text-[10px] uppercase tracking-widest text-slate-700 appearance-none cursor-pointer"
                                            >
                                                {INTAKE_YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#4d0101] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#4d0101]/30 hover:bg-[#600202] hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-70 disabled:pointer-events-none italic"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="tracking-widest">Processing Node...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 text-[#dbb212]" />
                                        Commit Identity
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Recent Submissions */}
                        {recentLeads.length > 0 && (
                            <div className="pt-8 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-6 px-1">
                                    <h3 className="text-sm font-black text-[#4d0101] uppercase tracking-tight italic">Registry Feed</h3>
                                    <span className="text-[10px] font-bold text-[#dbb212] uppercase tracking-[0.2em] italic">Last {recentLeads.length} Identifiers</span>
                                </div>
                                <div className="space-y-4">
                                    {recentLeads.map((lead, idx) => (
                                        <div key={lead.id || idx} className="bg-white border border-slate-100 p-4 sm:p-5 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center shadow-inner mb-2 group-hover:bg-[#4d0101] group-hover:border-[#4d0101] transition-all">
                                                        <User className="w-6 h-6 text-[#4d0101] group-hover:text-white transition-all" />
                                                    </div>
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 italic">SECURE</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-black text-slate-900 tracking-tight italic truncate">{lead.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none uppercase truncate">{lead.email}</p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 italic shrink-0">{lead.status}</span>
                                                        <span className="text-[8px] font-black text-[#4d0101] uppercase px-2 py-1 bg-[#dbb212]/10 rounded-lg border border-[#dbb212]/20 italic shrink-0 truncate max-w-[100px] sm:max-w-none">{lead.course as string || 'GENERAL'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100/50">
                                                <div className="text-left sm:text-right flex flex-col items-start sm:items-end flex-1 sm:flex-none">
                                                    <p className="text-[10px] font-black text-slate-800 italic">{lead.phone}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{lead.campaign?.name || 'MANUAL'}</p>
                                                </div>
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform shrink-0">
                                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
