'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CounselorService } from '@/services/counselorService';
import { CourseService } from '@/services/courseService';
import { DepartmentService } from '@/services/departmentService';
import { LeadResponseDTO, LeadStatus, LeadScore, CourseDTO, DepartmentDTO } from '@/types/api';
import {
    Search, RotateCcw, Mail, Globe, BookOpen, ChevronDown, GraduationCap, Phone, MapPin,
    Flame, Sun, Snowflake, Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LeadNotes from '../LeadNotes';
import LoadingButton from '@/components/ui/LoadingButton';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import CounselorProfileHeader from '../CounselorProfileHeader';
import ReminderModal from './ReminderModal';

const SCORE_COLORS: Record<string, string> = {
    'HOT': 'from-rose-500 to-orange-500 text-white shadow-rose-200',
    'WARM': 'from-orange-400 to-amber-400 text-white shadow-amber-100',
    'COLD': 'from-sky-400 to-blue-500 text-white shadow-blue-100',
};

const SCORE_ICONS: Record<string, React.ReactNode> = {
    'HOT': <Flame className="w-4 h-4 md:w-5 md:h-5" />,
    'WARM': <Sun className="w-4 h-4 md:w-5 md:h-5" />,
    'COLD': <Snowflake className="w-4 h-4 md:w-5 md:h-5" />,
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

const ALL_STATUSES: LeadStatus[] = [
    'FAKE',
    'CONTACTED',
    'REASSIGNED',
    'INTERESTED'
];

const ALL_SCORES: LeadScore[] = ['HOT', 'WARM', 'COLD'];

type SearchType = 'ALL' | 'ID' | 'EMAIL' | 'NAME' | 'PHONE' | 'COURSE' | 'SCORE' | 'DATE' | 'SOURCE';

interface MyLeadsFeedProps {
    counselorId: number;
    counselorTypes?: string[];
    onLeadsUpdate?: (leads: LeadResponseDTO[]) => void;
    onActionComplete?: () => void;
}

export default function MyLeadsFeed({ counselorId, counselorTypes, onLeadsUpdate, onActionComplete }: MyLeadsFeedProps) {
    const { user, role } = useAuth();
    const [leads, setLeads] = useState<LeadResponseDTO[]>([]);
    const [courses, setCourses] = useState<CourseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedLead, setSelectedLead] = useState<LeadResponseDTO | null>(null);
    const [updateProcessing, setUpdateProcessing] = useState(false);
    const isSubmitting = React.useRef(false);

    // Reminder modal state
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [reminderLeadTarget, setReminderLeadTarget] = useState<{
        id: number; name: string; score: string;
    } | null>(null);

    // Search state
    const [searching, setSearching] = useState(false);
    const [searchType, setSearchType] = useState<SearchType>('ALL');
    const [searchValue, setSearchValue] = useState('');

    const [validTypes, setValidTypes] = useState<string[]>([]);
    const [validDepartments, setValidDepartments] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [counselorSetup, setCounselorSetup] = useState(false);

    // To store what was actually clicked/searched
    const [searchTrigger, setSearchTrigger] = useState(0);

    const [combinedCounts, setCombinedCounts] = useState<{
        telecallerLeads: number;
        internalLeads: number;
        externalLeads: number;
        totalCombined: number;
    } | null>(null);

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
        else if (Array.isArray(raw.results)) data = raw.results;
        else if (typeof raw === 'object' && (raw.id != null || raw.leadId != null)) data = [raw];

        // Enrich/Normalize items
        return data.map((item: any) => ({
            ...item,
            id: item.id || item.leadId,
            phone: item.phone || (item.phones && item.phones.length > 0 ? item.phones[0] : ''),
            score: item.score || 'COLD'
        }));
    }, []);

    // 1. Fetch Counselor Metadata (Once on mount)
    useEffect(() => {
        const fetchInitialMetadata = async () => {
            try {
                const meRes: any = await CounselorService.getCounselorMe();
                const me = meRes?.data || meRes;

                if (me && (me.counselorId || me.id)) {
                    const types = me.counselorTypes || [];
                    const depts = me.departments || [];
                    setValidTypes(types);
                    
                    // Initial departments from counselor me
                    setValidDepartments(depts);

                    // Default selection logic
                    if (types.length > 0 && !selectedType) setSelectedType(types[0]);
                    if (depts.length > 0 && !selectedDepartment) {
                        const firstDept = depts[0];
                        const dname = typeof firstDept === 'object' ? (firstDept as any).department || (firstDept as any).name : firstDept;
                        setSelectedDepartment(dname);
                    }

                    const activeCid = me.counselorId || me.id || counselorId;
                    const countsRes: any = await CounselorService.getCombinedLeadCounts(activeCid);
                    const cData = countsRes?.data || (countsRes?.totalCombined !== undefined ? countsRes : null);
                    if (cData) setCombinedCounts(cData);
                }
            } catch (err) {
                console.error("Failed to load counselor-me metadata", err);
            } finally {
                setCounselorSetup(true);
            }
        };
        fetchInitialMetadata();
    }, [counselorId]);

    // 2. Refresh Departments when Type changes to EXTERNAL
    useEffect(() => {
        const refreshDepartments = async () => {
            if (selectedType === 'EXTERNAL') {
                try {
                    const res: any = await DepartmentService.getAllDepartmentNames();
                    console.log("[MyLeadsFeed] EXTERNAL depts raw:", res);
                    
                    // Robust extraction of the department array
                    let processed: any[] = [];
                    if (Array.isArray(res)) processed = res;
                    else if (res?.data && Array.isArray(res.data)) processed = res.data;
                    else if (res?.content && Array.isArray(res.content)) processed = res.content;
                    else if (res?.results && Array.isArray(res.results)) processed = res.results;
                    else if (res?.departments && Array.isArray(res.departments)) processed = res.departments;
                    else if (typeof res === 'object' && res !== null) {
                        // If it's a single object, wrap it
                        if (res.department || res.name) processed = [res];
                    }

                    setValidDepartments(processed);
                } catch (err) {
                    console.error("Failed to load all departments", err);
                }
            } else if (counselorSetup) {
                // Return to original counselor departments
                try {
                    const meRes: any = await CounselorService.getCounselorMe();
                    const me = meRes?.data || meRes;
                    if (me && me.departments) setValidDepartments(me.departments);
                } catch (err) {
                    console.error("Backtrack failed", err);
                }
            }
        };
        refreshDepartments();
    }, [selectedType, counselorSetup]);

    const loadLeads = useCallback(async () => {
        if (!counselorSetup) return;
        setLoading(true);
        try {
            const PAGE_SIZE = 100;
            let raw: any;

            // Use the alphanumeric counselorId from the "me" response if available, or fallback to props
            // Note: In typical flows, the user.id from AuthContext might be numeric, but the specialized leads
            // endpoint often needs the alphanumeric USR-... or COUN-... ID.

            // Re-fetch "me" if we don't have it, or just use user.id
            const me = await CounselorService.getCounselorMe();
            const activeCid = me.counselorId || counselorId;

            if (selectedDepartment && selectedType) {
                const deptName = typeof selectedDepartment === 'object' ? (selectedDepartment as any).name || (selectedDepartment as any).department : selectedDepartment;
                console.log(`[loadLeads] Fetching via specialized endpoint for ${activeCid} | ${deptName} | ${selectedType}`);
                const dsRes = await api.get(`/api/counselor/leads/counselor/${activeCid}/department/name/${encodeURIComponent(deptName)}/type/${selectedType}/${page}/${PAGE_SIZE}`);
                raw = dsRes.data;
            } else if (selectedType) {
                const typeRes = await api.get(`/api/counselor/leads/counselor/${activeCid}/type/${selectedType}/${page}/${PAGE_SIZE}`);
                raw = typeRes.data;
            } else {
                raw = await CounselorService.getAssignedLeads(page, PAGE_SIZE);
            }

            const results = normalizeResults(raw);
            setLeads(results);

            if (raw && typeof raw === 'object') {
                const tp = raw.totalPages ?? (raw as any).data?.totalPages ?? (results.length === PAGE_SIZE ? page + 2 : page + 1);
                setTotalPages(tp);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
            toast.error('Could not load your leads');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [page, counselorId, normalizeResults, counselorSetup, searchTrigger, selectedDepartment, selectedType]);

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

    const handleSearch = async () => {
        console.log('[handleSearch] START — type:', searchType, '| value:', searchValue);

        if (searchType === 'ALL' && !searchValue.trim()) {
            setPage(0);
            setSearching(false);
            setSearchTrigger(prev => prev + 1); // This will trigger loadLeads which now handles dept/type
            return;
        }

        // If they just changed Dept/Type but text search is empty, also use loadLeads
        if (!searchValue.trim()) {
            setPage(0);
            setSearchTrigger(prev => prev + 1);
            return;
        }

        setLoading(true);
        setSearching(true);
        try {
            let raw: any;
            const val = searchValue.trim();

            console.log('[handleSearch] calling service for:', searchType, val);

            switch (searchType) {
                case 'ID':
                    raw = await CounselorService.searchLeadById(parseInt(val));
                    break;
                case 'EMAIL':
                    raw = await CounselorService.searchLeadByEmail(val);
                    break;
                case 'NAME':
                    raw = await CounselorService.searchLeadsByName(val);
                    break;
                case 'PHONE':
                    raw = await CounselorService.searchLeadByPhone(val);
                    break;
                case 'COURSE':
                    raw = await CounselorService.searchLeadsByCourse(val);
                    break;
                case 'SCORE':
                    raw = await CounselorService.searchLeadsByScore(val as LeadScore);
                    break;
                case 'DATE':
                    raw = await CounselorService.searchLeadsByDate(val);
                    break;
                case 'SOURCE':
                    raw = await CounselorService.searchLeadsBySource(val);
                    break;
            }

            console.log('[handleSearch] service returned raw:', raw);

            const results = normalizeResults(raw);

            console.log('[handleSearch] normalizeResults =>', results);

            setLeads(results);
            setTotalPages(1);
            if (onLeadsUpdate) onLeadsUpdate(results);
        } catch (err: any) {
            console.error('[handleSearch] ❌ CATCH ERROR:', err);
            toast.error(err.response?.data?.message || 'Search failed');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searching) loadLeads();
    }, [loadLeads, searching]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const openDetails = (lead: LeadResponseDTO) => {
        setSelectedLead(lead);
    };

    const handleScoreChange = async (leadId: string | number, newScore: LeadScore) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadScore(Number(leadId), newScore);
            setLeads(prev => prev.map(l => (l.id == leadId || (l as any).leadId == leadId) ? { ...l, score: newScore } : l));
            if (selectedLead?.id == leadId || (selectedLead as any)?.leadId == leadId) {
                setSelectedLead(prev => prev ? { ...prev, score: newScore } : null);
            }
            toast.success('Score updated');
            setSelectedLead(null); // Make the lead card "disappear" after action
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update score');
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

    const handleCourseChange = async (leadId: number, courseName: string) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setUpdateProcessing(true);
        try {
            await CounselorService.updateLeadCourse(leadId, courseName);
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
            {/* Lead Distribution Stats - Top Right Side UI */}
            {combinedCounts && (
                <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 mb-2 animate-in fade-in slide-in-from-right-4 duration-1000">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm flex-1 sm:flex-initial min-w-[100px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal</span>
                        <span className="text-xs font-black text-slate-900 ml-auto sm:ml-0">{combinedCounts.internalLeads || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm flex-1 sm:flex-initial min-w-[100px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tele</span>
                        <span className="text-xs font-black text-slate-900 ml-auto sm:ml-0">{combinedCounts.telecallerLeads || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm flex-1 sm:flex-initial min-w-[100px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">External</span>
                        <span className="text-xs font-black text-slate-900 ml-auto sm:ml-0">{combinedCounts.externalLeads || 0}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-[#4d0101] px-4 py-2 rounded-xl shadow-lg shadow-[#4d0101]/10 w-full sm:w-auto">
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Combined</span>
                        <span className="text-xs font-black text-white">{combinedCounts.totalCombined || 0}</span>
                    </div>
                </div>
            )}

            {/* Counselor Info Header */}
            <CounselorProfileHeader />

            {/* Top Level Filters (Type / Department) */}
            {counselorSetup && (validTypes.length > 0 || validDepartments.length > 0) && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row items-center gap-4">
                    {validTypes.length > 0 && (
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Your Counselor Type</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                value={selectedType}
                                onChange={e => {
                                    setSelectedType(e.target.value);
                                }}
                            >
                                <option value="">No Type selected</option>
                                {validTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    )}
                    {(selectedType === 'EXTERNAL' || validDepartments.length > 0) && (
                        <div className="flex-1 w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Your Department</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                value={selectedDepartment}
                                onChange={e => {
                                    setSelectedDepartment(e.target.value);
                                }}
                            >
                                <option value="">No Department selected</option>
                                {validDepartments.map((d: any, idx) => {
                                    // Robust extraction of name from string or object
                                    let dname = d;
                                    if (d && typeof d === 'object') {
                                        dname = d.department || d.name || d.departmentName || d.dept || d.department_name || `Unknown-${idx}`;
                                    }
                                    return <option key={idx} value={String(dname)}>{String(dname)}</option>;
                                })}
                            </select>
                        </div>
                    )}
                    <div className="flex-initial mt-4 sm:mt-0 pt-5">
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full sm:w-auto px-10 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#600202] transition-all shadow-md active:scale-95 disabled:opacity-50 min-w-[140px]"
                        >
                            {loading ? '...' : 'Filter Results'}
                        </button>
                    </div>
                </div>
            )}

            {/* Search and Filters Header */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 md:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex flex-col sm:flex-row flex-1 gap-3">
                        <div className="relative flex-1 min-w-0">
                            {searchType === 'DATE' ? (
                                <input
                                    type="date"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                />
                            ) : searchType === 'SCORE' ? (
                                <select
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold uppercase tracking-widest cursor-pointer"
                                >
                                    <option value="">Select Score</option>
                                    {ALL_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={
                                            searchType === 'ID' ? "Search by ID..." :
                                                searchType === 'EMAIL' ? "Search by Email..." :
                                                    searchType === 'NAME' ? "Search by Name..." :
                                                        searchType === 'PHONE' ? "Search by Phone..." :
                                                            searchType === 'COURSE' ? "Search by Course..." :
                                                                searchType === 'SOURCE' ? "Search by Source..." :
                                                                    "Global Search..."
                                        }
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-400"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={searchType}
                                onChange={(e) => {
                                    setSearchType(e.target.value as SearchType);
                                    setSearchValue('');
                                }}
                                className="flex-1 sm:flex-initial px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer"
                            >
                                <option value="ALL">Global Search</option>
                                <option value="NAME">Name</option>
                                <option value="PHONE">Phone</option>
                                <option value="EMAIL">Email</option>
                                <option value="ID">ID</option>
                                <option value="COURSE">Course</option>
                                <option value="SOURCE">Source</option>
                                <option value="SCORE">Score</option>
                                <option value="DATE">Date</option>
                            </select>
                            <LoadingButton
                                loading={loading}
                                loadingText="..."
                                onClick={handleSearch}
                                disabled={searchType !== 'ALL' && !searchValue}
                                className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#600202] transition-all shadow-lg shadow-rose-900/20 disabled:opacity-50 active:scale-95"
                            >
                                Search
                            </LoadingButton>
                            {(searching || searchValue) && (
                                <button
                                    onClick={() => {
                                        setSearchValue('');
                                        setSearchType('ALL');
                                        setSearching(false);
                                        setPage(0);
                                        loadLeads();
                                    }}
                                    className="p-3 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 border border-slate-200 rounded-2xl"
                                    title="Reset Search"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Workflow Based Rows ────────────────────────────────────────── */}
            <div className="flex flex-col gap-10 mt-6 pb-20">

                {/* 1. Assigned Leads Row */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-[#4d0101] rounded-full"></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Assigned Leads</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Directly Assigned • Action Required</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-[#4d0101]/5 text-[#4d0101] text-[10px] font-black rounded-lg border border-[#4d0101]/10 uppercase">
                            {leads.filter(l => ['COUNSELOR_ASSIGNED', 'TELECALLER_ASSIGNED', 'EXTERNAL_ASSIGNED', 'ASSIGNED'].includes(l.status)).length}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {leads.filter(l => ['COUNSELOR_ASSIGNED', 'TELECALLER_ASSIGNED', 'EXTERNAL_ASSIGNED', 'ASSIGNED'].includes(l.status)).length === 0 ? (
                            <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No assigned leads</div>
                        ) : (
                            leads.filter(l => ['COUNSELOR_ASSIGNED', 'TELECALLER_ASSIGNED', 'EXTERNAL_ASSIGNED', 'ASSIGNED'].includes(l.status)).map(lead => (
                                <div key={lead.id || lead.leadId} className="group transition-all hover:bg-slate-50/10">
                                    <div className="px-8 py-5 flex items-center gap-6 cursor-pointer relative" onClick={() => openDetails(lead)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-transparent group-hover:bg-[#4d0101]" />
                                        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                                            {(lead.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase mt-0.5">{lead.name}</p>
                                            <div className="flex items-center gap-4 mt-1 opacity-70">
                                                <span className="text-[10px] font-bold text-slate-500 shrink-0">{lead.email}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{getCourseName(lead.course)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0">
                                            <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                {lead.status?.replace(/_/g, ' ')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 1.5. Reassigned Leads Row */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-600">
                    <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-purple-400 rounded-full"></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reassigned Leads</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Transferred History • Review Needed</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-lg border border-purple-100 uppercase">
                            {leads.filter(l => l.status === 'REASSIGNED').length}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50" id="reassigned">
                        {leads.filter(l => l.status === 'REASSIGNED').length === 0 ? (
                            <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No reassigned leads</div>
                        ) : (
                            leads.filter(l => l.status === 'REASSIGNED').map(lead => (
                                <div key={lead.id || lead.leadId} className="group transition-all hover:bg-slate-50/10">
                                    <div className="px-8 py-5 flex items-center gap-6 cursor-pointer relative" onClick={() => openDetails(lead)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-transparent group-hover:bg-purple-400" />
                                        <div className="w-11 h-11 rounded-2xl bg-purple-50/30 border border-purple-100/50 shadow-sm flex items-center justify-center text-purple-900 font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                                            {(lead.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase mt-0.5">{lead.name}</p>
                                            <div className="flex items-center gap-4 mt-1 opacity-70">
                                                <span className="text-[10px] font-bold text-slate-500 shrink-0">{lead.email}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{getCourseName(lead.course)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0">
                                            <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                {lead.status?.replace(/_/g, ' ')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Contacted Leads Row */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-indigo-500 rounded-full"></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Contacted Leads</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">In Dialogue • Documentation Status</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100 uppercase">
                            {leads.filter(l => l.status === 'CONTACTED').length}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {leads.filter(l => l.status === 'CONTACTED').length === 0 ? (
                            <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No contacted leads</div>
                        ) : (
                            leads.filter(l => l.status === 'CONTACTED').map(lead => (
                                <div key={lead.id || lead.leadId} className="group transition-all hover:bg-slate-50/10">
                                    <div className="px-8 py-5 flex items-center gap-6 cursor-pointer relative" onClick={() => openDetails(lead)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-transparent group-hover:bg-indigo-500" />
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 shadow-sm flex items-center justify-center text-indigo-900 font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                                            {(lead.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase mt-0.5">{lead.name}</p>
                                            <div className="flex items-center gap-4 mt-1 opacity-70">
                                                <span className="text-[10px] font-bold text-slate-500 shrink-0">{lead.email}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{getCourseName(lead.course)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0">
                                            <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                {lead.status?.replace(/_/g, ' ')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Interested Leads Row */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-800">
                    <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-rose-500 rounded-full"></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Interested Leads</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">High Intent • Closing Potential</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-lg border border-rose-100 uppercase">
                            {leads.filter(l => l.status === 'INTERESTED').length}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50" id="interest">
                        {leads.filter(l => l.status === 'INTERESTED').length === 0 ? (
                            <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No interested leads</div>
                        ) : (
                            leads.filter(l => l.status === 'INTERESTED').map(lead => (
                                <div key={lead.id || lead.leadId} className="group transition-all hover:bg-slate-50/10">
                                    <div className="px-8 py-5 flex items-center gap-6 cursor-pointer relative" onClick={() => openDetails(lead)}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 bg-transparent group-hover:bg-rose-500" />
                                        <div className="w-11 h-11 rounded-2xl bg-rose-50/30 border border-rose-100/50 shadow-sm flex items-center justify-center text-rose-900 font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                                            {(lead.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate uppercase mt-0.5">{lead.name}</p>
                                            <div className="flex items-center gap-4 mt-1 opacity-70">
                                                <span className="text-[10px] font-bold text-slate-500 shrink-0">{lead.email}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{getCourseName(lead.course)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0">
                                            <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border ${STATUS_COLORS[lead.status] || 'bg-white text-slate-400 border-slate-100'}`}>
                                                {lead.status?.replace(/_/g, ' ')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 4. Fake Leads Row */}

                {/* Empty State */}
                {leads.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Portfolio Empty</h3>
                        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">No assigned leads found matching your filters</p>
                    </div>
                )}
            </div>

            {/* Footer Pagination */}
            {!searching && !loading && leads.length > 0 && (
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
                                    {/* Status Column */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status Workflow</label>
                                        <div className="group relative">
                                            <select
                                                disabled={updateProcessing}
                                                value={selectedLead.status || ""}
                                                onChange={(e) => selectedLead && handleStatusChange(selectedLead.id, e.target.value)}
                                                className="w-full text-xs font-black bg-slate-50/50 border-2 border-slate-100 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 focus:ring-0 focus:border-indigo-500/30 hover:border-indigo-100 outline-none transition-all duration-300 cursor-pointer text-slate-900 shadow-sm disabled:opacity-50 appearance-none"
                                            >
                                                <option value="" disabled>Select Status</option>
                                                {/* Always show current even if not in the restricted list */}
                                                {selectedLead.status && !ALL_STATUSES.includes(selectedLead.status) && (
                                                    <option value={selectedLead.status}>{selectedLead.status.replace(/_/g, ' ')}</option>
                                                )}
                                                {ALL_STATUSES.map(status => (
                                                    <option key={status} value={status}>
                                                        {status.replace(/_/g, ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                                <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Program Column */}
                                    {['CONTACTED', 'INTERESTED'].includes(selectedLead.status) && (
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
                                    )}
                                </div>

                                {/* Premium Score Selector */}
                                <div className="p-5 md:p-8 bg-slate-50/50 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 md:mb-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Investment Score</label>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lead prioritization level</p>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-extrabold text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm uppercase tracking-widest">
                                            Current: <span className="text-slate-900 ml-1">{selectedLead.score}</span>
                                        </span>
                                    </div>
                                    <div className="flex gap-2 md:gap-4">
                                        {ALL_SCORES.map(s => {
                                            const isCurrent = selectedLead.score === s;
                                            const isStatusDisabled = ['TELECALLER_ASSIGNED', 'COUNSELOR_ASSIGNED', 'EXTERNAL_ASSIGNED', 'ASSIGNED', 'FAKE', 'REASSIGNED'].includes(selectedLead.status);
                                            const isCourseMissing = !getCourseName(selectedLead.course);
                                            const isDisabled = isStatusDisabled || isCourseMissing;

                                            return (
                                                <button
                                                    key={s}
                                                    disabled={updateProcessing || isDisabled}
                                                    onClick={() => selectedLead && handleScoreChange(selectedLead.id, s)}
                                                    className={`flex-1 group relative overflow-hidden transition-all duration-500 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center gap-2 md:gap-3 border-2 ${
                                                        isCurrent 
                                                            ? `bg-gradient-to-br ${SCORE_COLORS[s]} border-transparent shadow-xl scale-105 z-10` 
                                                            : (isDisabled ? 'bg-slate-50 text-slate-200 border-slate-50 cursor-not-allowed opacity-40' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-slate-50')
                                                    }`}
                                                >
                                                    <div className={`transition-transform duration-500 group-hover:scale-110 ${isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`}>
                                                        {SCORE_ICONS[s]}
                                                    </div>
                                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.1em] relative z-10 ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                                                        {s}
                                                    </span>
                                                    {isCurrent && (
                                                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {(['TELECALLER_ASSIGNED', 'COUNSELOR_ASSIGNED', 'EXTERNAL_ASSIGNED', 'ASSIGNED', 'NEW', 'FAKE', 'REASSIGNED'].includes(selectedLead.status) || !getCourseName(selectedLead.course)) && (
                                        <div className="mt-4 px-4 py-3 bg-[#4d0101]/5 rounded-2xl border border-[#4d0101]/10 animate-pulse">
                                            <p className="text-center text-[10px] font-black text-[#4d0101] uppercase tracking-widest leading-relaxed">
                                                {selectedLead.status === 'FAKE' 
                                                    ? 'Fake leads cannot be prioritized'
                                                    : (!getCourseName(selectedLead.course) 
                                                        ? 'Academic program must be assigned before prioritization'
                                                        : 'Contact lead first to enable investment scoring')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Set Reminder Button */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setReminderLeadTarget({
                                                id: selectedLead.id,
                                                name: selectedLead.name,
                                                score: selectedLead.score || 'COLD',
                                            });
                                            setReminderModalOpen(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#4d0101] to-[#600202] text-white rounded-2xl md:rounded-3xl text-[10px] font-black uppercase tracking-widest hover:from-[#600202] hover:to-[#7a0303] transition-all shadow-lg shadow-[#4d0101]/20 active:scale-[0.98] group"
                                    >
                                        <Bell className="w-4 h-4 group-hover:animate-bounce" />
                                        Set Follow-up Reminder
                                    </button>
                                </div>

                                {/* Call to Action Section */}
                                <div className="group relative overflow-hidden bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl transition-all active:scale-[0.98]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white text-center md:text-left">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Direct Contact</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl md:text-4xl font-black tracking-tighter group-hover:text-emerald-400 transition-colors uppercase break-all">
                                                    {String(selectedLead.phone)}
                                                </p>
                                                <p className="text-[10px] md:text-xs font-extrabold opacity-60 truncate lowercase max-w-[250px] mx-auto md:mx-0">{selectedLead.email}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`tel:${selectedLead.phone}`}
                                            className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#dbb212] to-[#b89512] text-[#600202] rounded-3xl md:rounded-[2.5rem] flex items-center justify-center hover:scale-110 transition-all duration-500 shadow-xl group border-4 border-white/10"
                                        >
                                            <Phone className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" />
                                        </a>
                                    </div>
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
                    leadScore={reminderLeadTarget.score}
                    onSuccess={() => {
                        setReminderModalOpen(false);
                        setReminderLeadTarget(null);
                    }}
                />
            )}
        </div>
    );
}
