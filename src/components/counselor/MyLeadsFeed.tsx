'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { useRouter } from 'next/navigation';
import { CourseService } from '@/services/courseService';
import { DepartmentService } from '@/services/departmentService';
import { LeadResponseDTO, LeadStatus, CourseDTO, DepartmentDTO, LeadScore, CampaignDTO } from '@/types/api';
import { LeadService } from '@/services/leadService';
import { CampaignService } from '@/services/campaignService';
import { ReminderService, ReminderResponseDTO } from '@/services/reminderService';
import { EnumService } from '@/services/enumService';
import {
    Search, RotateCcw, Mail, Globe, BookOpen, ChevronDown, GraduationCap, Phone, MapPin,
    Flame, Sun, Snowflake, Bell, Trash2, X, Clock, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LeadNotes from '../LeadNotes';
import LoadingButton from '@/components/ui/LoadingButton';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import CounselorProfileHeader from '../CounselorProfileHeader';
import ReminderModal from './ReminderModal';

const SCORE_COLORS: Record<LeadScore, string> = {
    'HOT': 'bg-rose-50 text-rose-600 border-rose-200',
    'WARM': 'bg-amber-50 text-amber-600 border-amber-200',
    'COLD': 'bg-sky-50 text-sky-600 border-sky-200',
    'INTERESTED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'DISCARDED': 'bg-slate-50 text-slate-500 border-slate-200',
};

const SCORE_ICONS: Record<string, React.ReactNode> = {
    'HOT': <Flame className="w-3.5 h-3.5" />,
    'WARM': <Sun className="w-3.5 h-3.5" />,
    'COLD': <Snowflake className="w-3.5 h-3.5" />,
    'INTERESTED': <RotateCcw className="w-3.5 h-3.5" />, // Reusing an icon for Interested
};

const STATUS_COLORS: Record<string, string> = {
    'TELECALLER_ASSIGNED': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'COUNSELOR_ASSIGNED': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'LOST': 'bg-slate-100 text-slate-700 border-slate-200',
    'UNASSIGNED': 'bg-gray-100 text-gray-600 border-gray-200',
    'CONTACTED': 'bg-blue-100 text-blue-700 border-blue-200',
    'INTERESTED': 'bg-rose-100 text-rose-700 border-rose-200',
    'NEW': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'EXTERNAL_ASSIGNED': 'bg-orange-100 text-orange-700 border-orange-200',
    'ADMISSION_IN_PROCESS': 'bg-amber-100 text-amber-700 border-amber-200',
    'ADMISSION_DONE': 'bg-green-100 text-green-700 border-green-200',
    'TIMED_OUT': 'bg-red-100 text-red-700 border-red-200',
    'REASSIGNED': 'bg-purple-100 text-purple-700 border-purple-200',
    'IN_A_SESSION': 'bg-violet-100 text-violet-700 border-violet-200',
    'QUEUED': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'FAKE': 'bg-rose-100 text-rose-700 border-rose-200',
};

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD', 'INTERESTED', 'DISCARDED'];

interface MyLeadsFeedProps {
    counselorId: number;
    counselorTypes?: string[];
    onLeadsUpdate?: (leads: LeadResponseDTO[]) => void;
    onActionComplete?: () => void;
}

export default function MyLeadsFeed({ counselorId, counselorTypes, onLeadsUpdate, onActionComplete }: MyLeadsFeedProps) {
    const { user, role } = useAuth();
    const router = useRouter();
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [scoreFilter, setScoreFilter] = useState<LeadScore | 'ALL' | 'CONTACTED' | 'DISCARDED_TAB'>('ALL');
    const [filterType, setFilterType] = useState<'ALL' | 'SOURCE' | 'COURSE' | 'DEPARTMENT' | 'NAME' | 'FAKE'>('ALL');
    const [filterInput, setFilterInput] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
    const [todayReminders, setTodayReminders] = useState<ReminderResponseDTO[]>([]);
    const [expandedReminderSection, setExpandedReminderSection] = useState<'TRIGGERED' | 'MISSED' | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [uiPage, setUiPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null);
    const [updateProcessing, setUpdateProcessing] = useState(false);
    const isSubmitting = React.useRef(false);

    // Reminder modal state
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [reminderLeadTarget, setReminderLeadTarget] = useState<{
        id: number; name: string;
    } | null>(null);

    // Discard state
    const [showDiscardReason, setShowDiscardReason] = useState(false);
    const [discardReason, setDiscardReason] = useState('');

    // Fake state
    const [showFakeReason, setShowFakeReason] = useState(false);
    const [fakeReason, setFakeReason] = useState('');



    // Normalize any backend response shape into a flat LeadResponseDTO[]
    const normalizeResults = useCallback((raw: any): LeadResponseDTO[] => {
        if (!raw) return [];
        let data: any[] = [];
        // Extract array from various possible nests
        if (Array.isArray(raw)) data = raw;
        else if (raw.data && Array.isArray(raw.data.lead)) data = raw.data.lead;
        else if (raw.data && Array.isArray(raw.data.content)) data = raw.data.content;
        else if (Array.isArray(raw.data)) data = raw.data;
        else if (Array.isArray(raw.lead)) data = raw.lead;
        else if (Array.isArray(raw.content)) data = raw.content;
        else if (Array.isArray(raw.leads)) data = raw.leads;
        else if (Array.isArray(raw.fakeLeadsList)) data = raw.fakeLeadsList;
        else if (Array.isArray(raw.fakeLeads)) data = raw.fakeLeads;
        else if (Array.isArray(raw.results)) data = raw.results;
        else if (typeof raw === 'object' && (raw.id != null || raw.leadId != null)) data = [raw];

        // Enrich/Normalize items
        return data.map((item: any) => ({
            ...item,
            id: item.id || item.leadId || item.originalLeadId,
            phone: item.phone || (item.phones && item.phones.length > 0 ? item.phones[0] : '')
        }));
    }, []);



    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const PAGE_SIZE = 100;
            let raw: any;

            if (scoreFilter === 'DISCARDED_TAB') {
                const res = await api.get(`/api/leads/my/discarded/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (scoreFilter === 'CONTACTED') {
                const res = await api.get(`/api/leads/my/status/CONTACTED/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (scoreFilter !== 'ALL') {
                const res = await api.get(`/api/leads/my/score/${scoreFilter}/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (filterType === 'SOURCE' && filterValue.trim()) {
                const res = await api.get(`/api/leads/source/${encodeURIComponent(filterValue.trim())}/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (filterType === 'COURSE' && filterValue.trim()) {
                const res = await api.get(`/api/leads/course/${encodeURIComponent(filterValue.trim())}/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (filterType === 'DEPARTMENT' && filterValue.trim()) {
                const res = await api.get(`/api/leads/department/${encodeURIComponent(filterValue.trim())}/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (filterType === 'STATUS' && filterValue.trim()) {
                const res = await api.get(`/api/leads/my/status/${filterValue.trim()}/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else if (filterType === 'NAME' && filterValue.trim()) {
                const res = await api.get(`/api/leads/search?name=${encodeURIComponent(filterValue.trim())}`);
                raw = res.data;
            } else if (filterType === 'FAKE') {
                const res = await api.get(`/api/leads/fake/my/page/${page}/size/${PAGE_SIZE}`);
                raw = res.data;
            } else {
                raw = await CounselorService.getAssignedLeads(page, PAGE_SIZE);
            }

            const results = normalizeResults(raw);
            setLeads(results);

            if (raw && typeof raw === 'object') {
                const totalElements = raw.totalElements ?? raw.count ?? (raw as any).data?.totalElements;
                const tp = raw.totalPages ?? (raw as any).data?.totalPages ?? (totalElements ? Math.ceil(Number(totalElements) / PAGE_SIZE) : (results.length === PAGE_SIZE ? page + 2 : page + 1));
                setTotalPages(tp);
            }

            // Fetch accurate counts
            const countRes = await api.get('/api/leads/my/count');
            setCounts(countRes.data || {});
        } catch (error) {
            console.error('Failed to fetch leads', error);
            toast.error('Could not load leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [page, normalizeResults, scoreFilter, filterType, filterValue]);

    const loadCourses = useCallback(async () => {
        try {
            const raw: any = await CourseService.getAllCourses();
            // Normalize results similarly to leads
            let data: CourseDTO[] = [];
            if (Array.isArray(raw)) data = raw;
            else if (raw?.data && Array.isArray(raw.data)) data = raw.data;
            else if (raw?.content && Array.isArray(raw.content)) data = raw.content;
            else if (raw?.data?.content && Array.isArray(raw.data.content)) data = raw.data.content;

            setCourses(data);
        } catch (err) {
            console.error('Failed to load courses', err);
        }
    }, []);



    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const loadFiltersData = useCallback(async () => {
        try {
            const [deptData, remData] = await Promise.all([
                DepartmentService.getAllDepartments().catch(() => []),
                ReminderService.getMyReminders(0, 100).catch(() => ({ content: [] }))
            ]);
            setDepartments(Array.isArray(deptData) ? deptData : (deptData as any).data || []);

            const remindersList = Array.isArray(remData) ? remData : (remData as any).content || [];
            const filteredReminders = remindersList.filter((r: ReminderResponseDTO) => r.status === 'TRIGGERED' || r.status === 'MISSED');
            setTodayReminders(filteredReminders);
        } catch (err) {
            console.error('Failed to load filter data', err);
        }
    }, []);

    useEffect(() => {
        loadFiltersData();
    }, [loadFiltersData]);

    useEffect(() => {
        if (filterType === 'SOURCE' && campaigns.length === 0) {
            CampaignService.getAllSources().then(data => {
                setCampaigns(Array.isArray(data) ? data : (data as any).data || []);
            }).catch(console.error);
        }
    }, [filterType, campaigns.length]);

    const handleReminderClick = async (leadId: number | string) => {
        try {
            let lead = leads.find(l => String(l.id) === String(leadId));
            if (!lead) {
                lead = await LeadService.getLeadById(Number(leadId));
            }
            if (lead) {
                openDetails(lead);
            }
        } catch (err) {
            toast.error("Could not load lead details");
        }
    };

    const openDetails = (lead: LeadResponseDTO) => {
        setSelectedLead(lead);
        setShowDiscardReason(false);
        setDiscardReason('');
        setShowFakeReason(false);
        setFakeReason('');
    };

    const handleScoreChange = async (leadId: string | number, newScore: LeadScore) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadScore(leadId, newScore);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, score: newScore } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => prev ? { ...prev, score: newScore } : null);
            }
            toast.success('Interest level updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update interest level');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const handleDiscardLead = async () => {
        if (!selectedLead || !discardReason.trim() || isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await LeadService.discardLead(selectedLead.id, discardReason.trim());
            setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
            toast.success('Lead discarded');
            setSelectedLead(null);
            setShowDiscardReason(false);
            setDiscardReason('');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to discard lead');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const handleFakeLead = async () => {
        if (!selectedLead || !fakeReason.trim() || isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await LeadService.markAsFake(selectedLead.id, fakeReason.trim());
            setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
            toast.success('Lead marked as Fake');
            setSelectedLead(null);
            setShowFakeReason(false);
            setFakeReason('');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to mark lead as fake');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const handleStatusChange = async (leadId: number, newStatus: string) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadStatus(leadId, newStatus);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, status: newStatus as LeadStatus } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => prev ? { ...prev, status: newStatus as LeadStatus } : null);
            }
            toast.success('Status updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const handleCourseChange = async (leadId: number | string, courseName: string) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await LeadService.updateLeadCourse(leadId, courseName);
            setLeads(prev => prev.map(l => (l.id === leadId) ? { ...l, course: { id: 0, course: courseName } } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => prev ? { ...prev, course: { id: 0, course: courseName } } : null);
            }
            toast.success('Course updated');
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update course');
        } finally {
            setUpdateProcessing(false);
            isSubmitting.current = false;
        }
    };

    const getCourseName = (course: any) => {
        if (!course) return null;
        return typeof course === 'object' ? course.course : course;
    };

    return (
        <div className="space-y-4">


            {/* Counselor Info Header */}
            <CounselorProfileHeader />

            {/* Premium Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                {[
                    { label: 'Hot Leads', score: 'HOT', color: 'text-rose-600', bg: 'bg-rose-50', icon: <Flame className="w-4 h-4" /> },
                    { label: 'Warm Leads', score: 'WARM', color: 'text-orange-600', bg: 'bg-orange-50', icon: <Sun className="w-4 h-4" /> },
                    { label: 'Cold Leads', score: 'COLD', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Snowflake className="w-4 h-4" /> },
                    { label: 'Interested', score: 'INTERESTED', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Bell className="w-4 h-4" /> },
                    { label: 'Contacted', score: 'CONTACTED', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Phone className="w-4 h-4" /> },
                    { label: 'Discarded', score: 'DISCARDED_TAB', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Trash2 className="w-4 h-4" /> },
                ].map((metric) => {
                    const isActive = scoreFilter === metric.score;
                    const isAnySelected = scoreFilter !== 'ALL';

                    const count = counts[metric.score === 'DISCARDED_TAB' ? 'DISCARDED' : metric.score] || 0;

                    return (
                        <div
                            key={metric.score}
                            onClick={() => {
                                setScoreFilter(isActive ? 'ALL' : metric.score as any);
                                setFilterType('ALL');
                                setFilterInput('');
                                setFilterValue('');
                                setPage(0); // Reset page when switching metrics
                                setUiPage(0); // Reset UI pagination
                            }}
                            className={`
                                cursor-pointer p-4 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden group
                                ${isActive
                                    ? `border-current ${metric.bg} ${metric.color} shadow-xl shadow-slate-200/50 scale-105 z-10`
                                    : 'border-slate-50 bg-white hover:border-slate-200'
                                }
                                ${isAnySelected && !isActive ? 'opacity-30 grayscale blur-[1px] hover:opacity-50 hover:grayscale-0 hover:blur-0' : ''}
                            `}
                        >
                            {isActive && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2.5 rounded-2xl ${metric.bg} ${metric.color} transition-transform group-hover:scale-110`}>
                                    {metric.icon}
                                </div>
                                <span className="text-2xl font-black tracking-tight">{count}</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-tight">{metric.label}</p>
                        </div>
                    );
                })}
            </div>



            {/* ── Today Followup ─────────────────────────────────────────────── */}
            <div className="mt-8">
                <div className="flex items-center gap-4 mb-4 px-4">
                    <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Today Follow-up</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reminders & Follow-ups due today</p>
                    </div>
                </div>

                <div className="px-4">
                    {/* Triggered Div */}
                    <div
                        onClick={() => setExpandedReminderSection(expandedReminderSection === 'TRIGGERED' ? null : 'TRIGGERED')}
                        className={`cursor-pointer bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border transition-all relative overflow-hidden group ${expandedReminderSection === 'TRIGGERED' ? 'border-indigo-400 scale-[1.02]' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                        <div className="px-6 py-5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Triggered</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reminders ready to act</p>
                                </div>
                            </div>
                            <div className="bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md shadow-rose-500/30">
                                {todayReminders.filter(r => r.status === 'TRIGGERED').length}
                            </div>
                        </div>
                        {expandedReminderSection === 'TRIGGERED' && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-4 max-h-64 overflow-y-auto divide-y divide-slate-100/50">
                                {todayReminders.filter(r => r.status === 'TRIGGERED').length === 0 ? (
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-4">No triggered reminders</p>
                                ) : (
                                    todayReminders.filter(r => r.status === 'TRIGGERED').map(r => (
                                        <div key={r.id} onClick={(e) => { e.stopPropagation(); handleReminderClick(r.leadId); }} className="py-3 px-4 hover:bg-white rounded-xl transition-colors cursor-pointer flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">{r.leadName || `Lead #${r.leadId}`}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.reminderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {r.note && <p className="text-[10px] font-medium text-slate-500 truncate">{r.note}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Filter Leads ─────────────────────────────────────────────── */}
            <div className="mt-8">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-5 flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 shrink-0 px-2">
                        <Search className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filter Leads</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value as any);
                                setScoreFilter('ALL');
                                setFilterInput('');
                                setFilterValue('');
                                setPage(0);
                                setUiPage(0);
                            }}
                            className="w-full sm:w-auto px-5 py-3 bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl border border-slate-200 uppercase tracking-widest shadow-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-all cursor-pointer"
                        >
                            <option value="ALL">All Assigned</option>
                            <option value="SOURCE">By Campaign Source</option>
                            <option value="COURSE">By Course</option>
                            <option value="DEPARTMENT">By Department</option>
                            <option value="STATUS">By Status</option>
                            <option value="NAME">Search by Name</option>
                            <option value="FAKE">Fake Leads</option>
                        </select>

                        {filterType !== 'ALL' && filterType !== 'FAKE' && (
                            <div className="flex w-full sm:w-auto flex-1 gap-2">
                                {filterType === 'NAME' ? (
                                    <input
                                        type="text"
                                        placeholder={`Enter ${filterType.toLowerCase()}...`}
                                        value={filterInput}
                                        onChange={(e) => setFilterInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { setFilterValue(filterInput); setPage(0); setUiPage(0); } }}
                                        className="w-full px-5 py-3 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-xl border border-slate-200 uppercase tracking-wider shadow-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-all"
                                    />
                                ) : (
                                    <select
                                        value={filterInput}
                                        onChange={(e) => setFilterInput(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-xl border border-slate-200 uppercase tracking-wider shadow-sm focus:outline-none focus:border-indigo-300 focus:bg-white transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Select {filterType}</option>
                                        {filterType === 'SOURCE' && campaigns.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        {filterType === 'COURSE' && courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                        {filterType === 'DEPARTMENT' && departments.map(d => <option key={d.id} value={d.department}>{d.department}</option>)}
                                        {filterType === 'STATUS' && (
                                            <>
                                                <option value="UNASSIGNED">Unassigned</option>
                                                <option value="ASSIGNED">Assigned</option>
                                                <option value="CONTACTED">Contacted</option>
                                                <option value="APPLICANT">Applicant</option>
                                                <option value="FAKE">Fake</option>
                                            </>
                                        )}
                                    </select>
                                )}
                                <button
                                    onClick={() => { setFilterValue(filterInput); setPage(0); setUiPage(0); }}
                                    disabled={loading || !filterInput}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shrink-0"
                                >
                                    Search
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Unified Lead List ────────────────────────────────────────── */}
            <div className="mt-8 pb-20">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-slate-900 rounded-full"></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lead Portfolio</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Leads • Action History • Score Insights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-5 py-2.5 bg-white text-slate-900 text-[10px] font-black rounded-xl border border-slate-200 uppercase tracking-widest shadow-sm">
                                Total: {scoreFilter === 'DISCARDED_TAB' ? (counts['DISCARDED'] || 0) : scoreFilter !== 'ALL' ? (counts[scoreFilter] || 0) : (counts['TOTAL'] || 0)}
                            </span>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {leads.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 border border-slate-100">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No leads found</h3>
                                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">
                                    {scoreFilter === 'DISCARDED_TAB' ? 'Your discarded list is empty' : 'Adjust your filtering metrics above'}
                                </p>
                            </div>
                        ) : (
                            leads
                                .slice(uiPage * 10, (uiPage + 1) * 10)
                                .map((lead, idx) => (
                                    <div key={lead.id || lead.leadId || idx} className="group transition-all hover:bg-slate-50/10">
                                        <div className="px-8 py-5 flex items-center gap-6 cursor-pointer relative" onClick={() => openDetails(lead)}>
                                            <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-transparent group-hover:bg-slate-900" />
                                            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                                                {(lead.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    {filterType === 'FAKE' ? (
                                                        <div className="flex flex-col">
                                                            <p className="text-sm font-black text-slate-900 truncate uppercase">{lead.name}</p>
                                                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Faked By: {lead.archivedByEmail}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-black text-slate-900 truncate uppercase">{lead.name}</p>
                                                    )}
                                                    {lead.score && filterType !== 'FAKE' && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border ${SCORE_COLORS[lead.score]}`}>
                                                            {lead.score}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 opacity-70">
                                                    <span className="text-[10px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                                                        <Mail className="w-3 h-3 p-[1px]" /> {lead.email}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                                                        <Phone className="w-3 h-3 p-[1px]" /> {lead.phone}
                                                    </span>
                                                    {scoreFilter === 'DISCARDED_TAB' ? (
                                                        <>
                                                            <span className="text-[10px] font-bold text-slate-500 truncate flex items-center gap-1 max-w-[150px]" title={lead.reason}>
                                                                <Trash2 className="w-3 h-3 p-[1px]" /> {lead.reason || 'No reason'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                                <Clock className="w-3 h-3 p-[1px]" /> {lead.discardedAt ? new Date(lead.discardedAt).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </>
                                                    ) : filterType === 'FAKE' ? (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                            <Clock className="w-3 h-3 p-[1px]" /> {lead.archivedAt ? new Date(lead.archivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3 p-[1px]" /> {getCourseName(lead.course) || lead.courseName || 'Unspecified'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                    {lead.status?.replace(/_/g, ' ')}
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-slate-100 transition-all">
                                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                    {leads.length > 0 && (
                        <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {uiPage + 1}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={uiPage === 0}
                                    onClick={() => {
                                        setUiPage(p => Math.max(0, p - 1));
                                    }}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={(uiPage + 1) * 10 >= leads.length}
                                    onClick={() => {
                                        setUiPage(p => p + 1);
                                    }}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Pagination */}
            {!loading && leads.length > 0 && (
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {loading ? 'Updating…' : `Showing Page ${page + 1}`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setPage(p => Math.max(0, p - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={page === 0 || loading}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600 shadow-sm"
                        >
                            ← Prev
                        </button>
                        <span className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center bg-white border border-slate-100 rounded-xl shadow-sm">
                            {page + 1} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => {
                                setPage(p => Math.min(Math.max(0, totalPages - 1), p + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={page >= (totalPages - 1) || loading}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600 shadow-sm"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Lead Details Popup */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedLead(null)} />
                    <div className="bg-white w-full max-w-[95vw] sm:max-w-4xl lg:max-w-6xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row transform-gpu animate-in zoom-in-95 duration-500 border border-white/50">

                        {scoreFilter === 'DISCARDED_TAB' ? (
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-sm border border-rose-100">Discarded Lead</div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{selectedLead?.id}</span>
                                        </div>
                                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight break-words">{selectedLead?.name}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedLead(null)}
                                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 md:hover:rotate-90 group"
                                    >
                                        <X className="w-5 h-5 group-hover:scale-110" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Email</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.email || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Phone</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.phone || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Address</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.address || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Course</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{getCourseName(selectedLead.course) || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Intake</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.intake || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Campaign</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.campaign?.name || selectedLead.campaign || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Previous Score</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.previousStatus || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.status?.replace(/_/g, ' ') || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned At</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.assignedAt && !isNaN(new Date(selectedLead.assignedAt).getTime()) ? new Date(selectedLead.assignedAt).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Discard Reason</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.reason || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Discarded At</p>
                                        <p className="text-sm font-bold text-slate-800 break-all">{selectedLead.discardedAt && !isNaN(new Date(selectedLead.discardedAt).getTime()) ? new Date(selectedLead.discardedAt).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Left Side: Information Canvas */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-10 border-b md:border-b-0 md:border-r border-slate-100/50 bg-white">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
                                        <div className="space-y-3 flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg shadow-slate-900/20">Lead Card</div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{selectedLead?.id}</span>
                                            </div>
                                            <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight break-words">{selectedLead?.name}</h2>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                                                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Intake: {selectedLead?.intake || 'N/A'}</span>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border shadow-sm ${selectedLead?.status ? STATUS_COLORS[selectedLead.status] : 'bg-slate-100'}`}>
                                                    {selectedLead?.status?.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4">
                                            <button
                                                onClick={() => setSelectedLead(null)}
                                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 md:hover:rotate-90 group"
                                            >
                                                <RotateCcw className="w-5 h-5 group-hover:scale-110" />
                                            </button>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Registered</p>
                                                <p className="text-[9px] md:text-[10px] font-extrabold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-block font-mono">
                                                    {selectedLead?.createdAt && !isNaN(new Date(selectedLead.createdAt).getTime()) ? new Date(selectedLead.createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8 md:mb-10">
                                        <div className="group p-4 md:p-5 bg-gradient-to-br from-slate-50/80 to-slate-100/30 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100/50 transition-all">
                                            <div className="flex items-center gap-3 mb-2 md:mb-3">
                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residence</p>
                                            </div>
                                            <p className="text-xs md:text-sm font-extrabold text-slate-700 leading-relaxed pl-1">{selectedLead.address || 'Not provided'}</p>
                                        </div>
                                        <div className="group p-4 md:p-5 bg-gradient-to-br from-slate-50/80 to-slate-100/30 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100/50 transition-all">
                                            <div className="flex items-center gap-3 mb-2 md:mb-3">
                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source</p>
                                            </div>
                                            <p className="text-xs md:text-sm font-extrabold text-slate-700 truncate pl-1">{selectedLead.campaign?.name || 'Not available'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 md:space-y-8">
                                        {/* Status & Program Interaction */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            {/* Program Column */}
                                            <div className="space-y-3">
                                                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Academic Program</label>
                                                <div className="group relative">
                                                    <select
                                                        disabled={updateProcessing}
                                                        value={getCourseName(selectedLead.course) || ""}
                                                        onChange={(e) => selectedLead && handleCourseChange(selectedLead.id, e.target.value)}
                                                        className="w-full text-xs font-black bg-slate-50/50 border-2 border-slate-100 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 focus:ring-0 focus:border-indigo-500/30 hover:border-indigo-100 outline-none transition-all duration-300 cursor-pointer text-slate-900 shadow-sm disabled:opacity-50 appearance-none"
                                                    >
                                                        <option value="" disabled>{getCourseName(selectedLead.course) || 'Not available'}</option>
                                                        {courses.map(c => <option key={c.id} value={c.course}>{c.course}</option>)}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                        <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Column */}
                                            <div className="space-y-3">
                                                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Current Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${selectedLead?.status ? STATUS_COLORS[selectedLead.status] : 'bg-slate-100'}`}>
                                                        {selectedLead?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Premium Interest Level Selector */}
                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Interest Level</label>
                                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">Prioritize Lead</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {(['HOT', 'WARM', 'COLD', 'INTERESTED'] as LeadScore[]).map((score) => {
                                                    const isActive = selectedLead.score === score;
                                                    const hasCourse = !!getCourseName(selectedLead.course);
                                                    const isDisabled = !hasCourse && score !== 'COLD';

                                                    return (
                                                        <button
                                                            key={score}
                                                            disabled={updateProcessing || isDisabled}
                                                            onClick={() => handleScoreChange(selectedLead.id, score)}
                                                            title={isDisabled ? "Select an Academic Program first" : ""}
                                                            className={`
                                                        px-4 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-2 group relative overflow-hidden
                                                        ${isActive
                                                                    ? (SCORE_COLORS[score] + ' shadow-lg border-current')
                                                                    : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100 hover:bg-slate-50/50'
                                                                }
                                                        ${isDisabled ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50' : 'active:scale-95'}
                                                        ${updateProcessing ? 'opacity-50' : ''}
                                                    `}
                                                        >
                                                            <span className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                                {SCORE_ICONS[score]}
                                                            </span>
                                                            {score}
                                                            {isActive && (
                                                                <div className="absolute top-1 right-1 w-1 h-1 bg-current rounded-full" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Actions Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Lead Actions</label>
                                                <button
                                                    onClick={() => {
                                                        setReminderLeadTarget({
                                                            id: selectedLead.id,
                                                            name: selectedLead.name,
                                                        });
                                                        setReminderModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#4d0101] to-[#600202] text-white rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest hover:from-[#600202] hover:to-[#7a0303] transition-all shadow-lg shadow-[#4d0101]/20 active:scale-[0.98] group"
                                                >
                                                    <Bell className="w-4 h-4 group-hover:animate-bounce" />
                                                    Set Follow-up
                                                </button>

                                                {!showDiscardReason && !showFakeReason ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setShowFakeReason(true)}
                                                            disabled={updateProcessing}
                                                            className="flex-1 px-4 py-4 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-2 active:scale-95 group disabled:opacity-50"
                                                            title="Mark as Fake"
                                                        >
                                                            <AlertTriangle className="w-4 h-4 group-hover:scale-110" />
                                                            Fake
                                                        </button>
                                                        <button
                                                            onClick={() => setShowDiscardReason(true)}
                                                            className="flex-1 px-6 py-4 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 flex items-center justify-center gap-3 active:scale-95 group"
                                                        >
                                                            <Trash2 className="w-4 h-4 group-hover:scale-110" />
                                                            Discard
                                                        </button>
                                                    </div>
                                                ) : showDiscardReason ? (
                                                    <div className="w-full space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="relative">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={discardReason}
                                                                onChange={(e) => setDiscardReason(e.target.value)}
                                                                placeholder="Reason for discarding..."
                                                                className="w-full px-5 py-4 bg-rose-50/30 border-2 border-rose-100 rounded-2xl md:rounded-3xl text-xs font-bold text-slate-800 placeholder:text-rose-300 focus:outline-none focus:border-rose-300 transition-all pr-12"
                                                            />
                                                            <button
                                                                onClick={() => setShowDiscardReason(false)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-500"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleDiscardLead}
                                                                disabled={!discardReason.trim() || updateProcessing}
                                                                className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50"
                                                            >
                                                                {updateProcessing ? 'Discarding...' : 'Confirm Discard'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="relative">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={fakeReason}
                                                                onChange={(e) => setFakeReason(e.target.value)}
                                                                placeholder="Reason for marking as fake..."
                                                                className="w-full px-5 py-4 bg-amber-50/30 border-2 border-amber-100 rounded-2xl md:rounded-3xl text-xs font-bold text-slate-800 placeholder:text-amber-300 focus:outline-none focus:border-amber-300 transition-all pr-12"
                                                            />
                                                            <button
                                                                onClick={() => setShowFakeReason(false)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300 hover:text-amber-500"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleFakeLead}
                                                                disabled={!fakeReason.trim() || updateProcessing}
                                                                className="flex-1 px-6 py-4 bg-amber-500 text-white rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                                            >
                                                                {updateProcessing ? 'Processing...' : 'Confirm Fake'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Call to Action Card */}
                                            <div className="group relative overflow-hidden bg-slate-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl transition-all flex flex-col justify-center min-h-[160px]">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                                                <div className="relative z-10 flex items-center justify-between gap-4 text-white">
                                                    <div className="space-y-1 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Direct Contact</p>
                                                        </div>
                                                        <p className="text-xl md:text-2xl font-black tracking-tighter group-hover:text-emerald-400 transition-colors uppercase truncate">
                                                            {String(selectedLead.phone)}
                                                        </p>
                                                        <p className="text-[9px] font-extrabold opacity-60 truncate lowercase">{selectedLead.email}</p>
                                                    </div>
                                                    <a
                                                        href={`tel:${selectedLead.phone}`}
                                                        className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#dbb212] to-[#b89512] text-[#600202] rounded-2xl md:rounded-3xl flex items-center justify-center hover:scale-110 transition-all duration-500 shadow-xl group border-2 border-white/10"
                                                    >
                                                        <Phone className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Registration Actions */}
                                        <div className="space-y-3 pt-2">
                                            <button
                                                disabled
                                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-60 border-2 border-dashed border-slate-200"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Send Registration Form (Disabled)
                                            </button>

                                            <button
                                                onClick={() => router.push(`/admin/registration?email=${selectedLead.email}&name=${encodeURIComponent(selectedLead.name)}&phone=${selectedLead.phone}`)}
                                                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-emerald-500 text-white rounded-2xl md:rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] group"
                                            >
                                                <GraduationCap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                                Start Lead Registration
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Activity & Notes */}
                                <div className="w-full md:w-[320px] lg:w-[380px] bg-slate-50/80 backdrop-blur-xl h-full md:h-auto overflow-y-auto p-6 md:p-8 flex flex-col border-t md:border-t-0 md:border-l border-slate-200">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Lead Logs</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Context & Intelligence</p>
                                    </div>
                                    <div className="flex-1">
                                        <LeadNotes leadId={selectedLead.id} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Reminder Modal */}
            {reminderLeadTarget && (
                <ReminderModal
                    isOpen={reminderModalOpen}
                    onClose={() => { setReminderModalOpen(false); setReminderLeadTarget(null); }}
                    leadId={reminderLeadTarget.id}
                    leadName={reminderLeadTarget.name}
                    onSuccess={() => {
                        setReminderModalOpen(false);
                        setReminderLeadTarget(null);
                    }}
                />
            )}
        </div>
    );
}
