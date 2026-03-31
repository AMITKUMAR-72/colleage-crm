'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, User, Mail, Phone, BookOpen, Building2, Calendar, Globe, Send, CheckCircle, Clock, Trash2, Loader2, ChevronDown, MapPin } from 'lucide-react';
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

export default function ManualLeadEntryDrawer({ isOpen, onClose, onSuccess }: ManualLeadEntryDrawerProps) {
    const [formData, setFormData] = useState<LeadRequestDTO>({
        name: '',
        email: '',
        phones: [],
        address: '', // Mocked or optional
        course: '',
        intake: '2026',
        status: 'UNASSIGNED',
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
                const [deptData, sourceData] = await Promise.allSettled([
                    DepartmentService.getAllDepartments(),
                    CampaignService.getAllSources()
                ]);

                // Departments
                const depts = deptData.status === 'fulfilled' && Array.isArray(deptData.value) ? deptData.value : [];
                setDepartments(depts);
                if (depts.length === 0) console.warn('[ManualEntry] No departments loaded');

                // Sources
                const rawSourcesData = sourceData.status === 'fulfilled' ? sourceData.value : [];
                let normalizedDbSources: CampaignDTO[] = [];

                const extractArray = (blob: any): any[] => {
                    if (Array.isArray(blob)) return blob;
                    if (blob && typeof blob === 'object') {
                        return (blob.data && Array.isArray(blob.data)) ? blob.data : 
                               (blob.content && Array.isArray(blob.content)) ? blob.content : [];
                    }
                    return [];
                };

                const dbSources = extractArray(rawSourcesData);
                const sourceMap = new Map<string, CampaignDTO>();

                dbSources.forEach((s: any, idx: number) => {
                    if (!s) return;
                    
                    const name = typeof s === 'string' ? s : 
                                 (s.name || s.campaignName || s.sourceName || s.campaign || s.source || s.campaign_name || 'Unknown');
                    
                    const id = typeof s === 'object' ? 
                               (s.id || s.campaignId || s.sourceId || idx + 100) : (idx + 100);
                    
                    const cleanName = String(name).trim();
                    const key = cleanName.toLowerCase().replace(/[\s_]/g, '');
                    
                    if (cleanName && cleanName !== 'Unknown') {
                        sourceMap.set(key, { id: Number(id), name: cleanName });
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
        if (!selectedDepartment) return [];

        const selectedDeptObj = departments.find(d =>
            (d.department || '').toLowerCase().trim() === selectedDepartment.toLowerCase().trim()
        );

        if (selectedDeptObj && Array.isArray(selectedDeptObj.courses)) {
            return selectedDeptObj.courses;
        }

        return [];
    }, [selectedDepartment, departments]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'phone0') {
            setFormData(prev => {
                const newPhones = [...(prev.phones || [])];
                newPhones[0] = value;
                return { ...prev, phones: newPhones };
            });
        } else if (name === 'phone1') {
            setFormData(prev => {
                const newPhones = [...(prev.phones || [])];
                newPhones[1] = value;
                return { ...prev, phones: newPhones };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
        const primaryPhone = formData.phones?.[0];
        if (!formData.name || !formData.email || !primaryPhone || !formData.address) {
            toast.error('Name, Email, Contact, and Address are required.');
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
                phones: [],
                address: '',
                course: '',
                intake: '2026',
                status: 'UNASSIGNED',
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
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Add New Lead</h2>
                            <p className="text-[10px] font-bold text-[#4d0101] uppercase tracking-widest mt-0.5">Manual Entry</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        <form id="manual-lead-form" onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition font-medium text-sm text-slate-800 placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email & Phone Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="john@example.com"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition font-medium text-sm text-slate-800 placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Primary Phone</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="tel"
                                                name="phone0"
                                                value={formData.phones?.[0] || ''}
                                                onChange={handleInputChange}
                                                placeholder="+91..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition font-medium text-sm text-slate-800 placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Alternate Phone & Address Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Alternate Phone</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="tel"
                                                name="phone1"
                                                value={formData.phones?.[1] || ''}
                                                onChange={handleInputChange}
                                                placeholder="Optional"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition font-medium text-sm text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Address</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="City, Region"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition font-medium text-sm text-slate-800 placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dept & Course Dropdown Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Department</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <select
                                                value={selectedDepartment}
                                                onChange={(e) => {
                                                    setSelectedDepartment(e.target.value);
                                                    setFormData(prev => ({ ...prev, course: '' }));
                                                }}
                                                disabled={loadingMeta}
                                                className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition text-sm font-medium text-slate-800 appearance-none disabled:opacity-50"
                                            >
                                                <option value="">{loadingMeta ? 'Loading...' : 'Select Department'}</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.department}>{dept.department}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Course</label>
                                        <div className="relative group">
                                            <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            {loadingMeta || filteredCourses.length > 0 ? (
                                                <>
                                                    <select
                                                        name="course"
                                                        value={typeof formData.course === 'string' ? formData.course : (formData.course as any)?.course || ''}
                                                        onChange={handleInputChange}
                                                        disabled={loadingMeta}
                                                        className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition text-sm font-medium text-slate-800 appearance-none disabled:opacity-50"
                                                    >
                                                        <option value="">{loadingMeta ? 'Loading...' : 'Select Course'}</option>
                                                        {filteredCourses.map(course => (
                                                            <option key={course.id} value={course.course}>{course.course}{course.department ? ` (${course.department})` : ''}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="course"
                                                    value={typeof formData.course === 'string' ? formData.course : (formData.course as any)?.course || ''}
                                                    onChange={handleInputChange}
                                                    disabled={loadingMeta}
                                                    placeholder="e.g. B.Tech"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition font-medium text-sm text-slate-800 placeholder:text-slate-400"
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Source & Intake dropdown row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Source</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <select
                                                value={selectedSourceId}
                                                onChange={handleSourceChange}
                                                disabled={loadingMeta}
                                                className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition text-sm font-medium text-slate-800 appearance-none disabled:opacity-50"
                                            >
                                                <option value="">{loadingMeta ? 'Loading Sources...' : `Select Source (${sources.length})`}</option>
                                                {sources.map((s, idx) => (
                                                    <option key={`${s.id}-${idx}`} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Intake Year</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4d0101] transition-colors" />
                                            <select
                                                name="intake"
                                                value={formData.intake}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4d0101]/20 focus:border-[#4d0101] transition text-sm font-medium text-slate-800 appearance-none"
                                            >
                                                {INTAKE_YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#4d0101] text-white py-3 rounded-xl font-bold hover:bg-[#600202] transition-colors active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-4 shadow-sm"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Create Lead</span>
                                )}
                            </button>
                        </form>

                        {/* Recent Submissions */}
                        {recentLeads.length > 0 && (
                            <div className="pt-6 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-800">Recent Entries</h3>
                                    <span className="text-[10px] font-bold text-[#4d0101] uppercase tracking-widest bg-[#4d0101]/5 px-2 py-0.5 rounded-full">{recentLeads.length} Added</span>
                                </div>
                                <div className="space-y-3">
                                    {recentLeads.map((lead, idx) => (
                                        <div key={lead.id || idx} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-[#4d0101]/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#4d0101]/5 rounded-lg flex items-center justify-center text-[#4d0101] font-bold border border-[#4d0101]/10">
                                                    {lead.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800">{lead.name}</h4>
                                                    <p className="text-xs text-slate-500">{lead.email}</p>
                                                </div>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
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
